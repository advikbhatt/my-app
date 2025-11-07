// generate-health-report/index.ts
/**
 * Supabase Edge Function (Deno / TypeScript)
 * - Expects JSON body with `pollutionData` and `userData`.
 * - If required user fields missing, returns an array of follow-up questions.
 * - If data complete, calls Perplexity API to generate a health report.
 *
 * Environment variables required:
 * - PERPLEXITY_API_KEY  (Perplexity API key)
 * - PERPLEXITY_API_BASE (optional override, e.g. "https://api.perplexity.ai" - default used if not provided)
 *
 * Notes:
 * - This is NOT medical advice. Include in UI.
 * - Never expose keys in client side; keep them server-side env vars.
 */

type PollutionData = {
  regionName?: string;
  lat?: number;
  lon?: number;
  timestamp?: string; // ISO
  pollutants?: { [pollutant: string]: number }; // e.g. { pm25: 55, pm10: 70, no2: 30 }
  aqi?: number;
  source?: string;
};

type UserData = {
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
  comorbidities?: string[]; // e.g. ["asthma","hypertension"]
  smokingStatus?: "never" | "former" | "current";
  cigarettesPerDay?: number | null;
  hoursOutsidePerDay?: number; // numeric hours spent outdoors on average
  occupation?: string;
  exerciseMinutesPerWeek?: number;
  maskUsage?: "never" | "sometimes" | "always";
  timeAtHomeHoursPerDay?: number;
  medications?: string[];
  otherNotes?: string;
};

const REQUIRED_USER_FIELDS: (keyof UserData)[] = [
  "age",
  "smokingStatus",
  "hoursOutsidePerDay",
  "occupation",
  "maskUsage",
];

const FOLLOWUP_QUESTIONS: { key: keyof UserData; question: string; type: string }[] = [
  { key: "age", question: "What's your age?", type: "number" },
  { key: "smokingStatus", question: "Do you smoke? (never / former / current)", type: "string" },
  { key: "cigarettesPerDay", question: "If you smoke, how many cigarettes per day? (0 if none)", type: "number" },
  { key: "hoursOutsidePerDay", question: "Average hours spent outdoors per day?", type: "number" },
  { key: "maskUsage", question: "How often do you wear a mask outdoors? (never / sometimes / always)", type: "string" },
  { key: "occupation", question: "What's your occupation (helps estimate exposure)?", type: "string" },
  { key: "comorbidities", question: "Any pre-existing conditions (comma separated)?", type: "string" },
  { key: "exerciseMinutesPerWeek", question: "How many minutes do you exercise per week on average?", type: "number" },
];

function missingFields(user: Partial<UserData>) {
  const miss: (keyof UserData)[] = [];
  for (const field of REQUIRED_USER_FIELDS) {
    if (user[field] === undefined || user[field] === null || user[field] === "") {
      miss.push(field);
    }
  }
  return miss;
}

async function callPerplexity(prompt: string) {
  const base = Deno.env.get("PERPLEXITY_API_BASE") ?? "https://api.perplexity.ai";
  const key = Deno.env.get("PERPLEXITY_API_KEY");
  if (!key) throw new Error("PERPLEXITY_API_KEY not set in environment");

  const endpoint = `${base}/chat/completions`; // Perplexity docs: /chat/completions
  // Payload structure below is generic; tweak with model params according to your Perplexity plan
  const body = {
    model: "perplexity-sonar-1", // example — use model available on your account or remove to use default
    messages: [
      {
        role: "system",
        content:
          "You are an evidence-aware public-health assistant. Produce a structured health report for an individual using provided pollution data and personal health/exposure details. Be concise, cite data-driven reasoning, and provide actionable, practical precautions. Use plain language suitable for non-experts. Include short summary, 3-year and 7-year regional outlooks, age-based projections, and prioritized precautions/actions (immediate, 3-year, 7-year).",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 1600,
    temperature: 0.2,
    // If Perplexity supports structured outputs / function-like outputs, switch to that — here we request a JSON block at the end.
    // We will instruct the assistant explicitly to output a JSON object with fields we can parse.
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // return raw text if JSON parse fails
    return { rawText: text, status: resp.status, ok: resp.ok };
  }
  return { ok: resp.ok, status: resp.status, json };
}

function buildPrompt(pollutionData: PollutionData, userData: UserData) {
  const region = pollutionData.regionName ?? `${pollutionData.lat ?? "lat?"}, ${pollutionData.lon ?? "lon?"}`;
  const pollutantList = pollutionData.pollutants
    ? Object.entries(pollutionData.pollutants)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "No pollutant breakdown provided.";

  const comorb = (userData.comorbidities && userData.comorbidities.length) ? userData.comorbidities.join(", ") : "None reported";

  const promptLines = [
    `Region: ${region}`,
    `Pollution snapshot (timestamp: ${pollutionData.timestamp ?? "unknown"}): AQI=${pollutionData.aqi ?? "unknown"}; ${pollutantList}`,
    `Pollution data source: ${pollutionData.source ?? "unknown"}`,
    ``,
    `User summary:`,
    `- Age: ${userData.age}`,
    `- Gender: ${userData.gender ?? "not specified"}`,
    `- Smoking status: ${userData.smokingStatus}${userData.smokingStatus === "current" ? ` (${userData.cigarettesPerDay ?? "n/a"} cig/day)` : ""}`,
    `- Hours outside per day: ${userData.hoursOutsidePerDay}`,
    `- Mask usage: ${userData.maskUsage}`,
    `- Occupation: ${userData.occupation ?? "not specified"}`,
    `- Exercise minutes per week: ${userData.exerciseMinutesPerWeek ?? "not specified"}`,
    `- Comorbidities: ${comorb}`,
    `- Medications / other notes: ${userData.medications?.join(", ") ?? "none"}`,
    ``,
    `Task: Using the information above, produce a structured health report that includes these sections:`,
    `1) Short summary (2-4 sentences) of the user's current health risk based on pollution and their profile.`,
    `2) Region health outlook: predict likely population-level respiratory/cardiovascular burden for the next 3 years and 7 years, mentioning main pollutants driving risk and the assumptions used (e.g., if current trends persist).`,
    `3) Age-based projection: explain how risk changes for this user's age (and for nearby brackets: 0-17, 18-40, 41-64, 65+).`,
    `4) Personalized risk factors from the user's profile and prioritized actions: Immediate (within weeks), 3-year plan, 7-year plan. Include metrics that user can monitor (e.g., AQI thresholds, symptoms, tests to speak to a doctor about).`,
    `5) Short list (3-6 items) of practical precautions (daily habits, home improvements, mask types, when to seek care).`,
    `6) Provide a short "confidence" statement (low/medium/high) and list 2-3 suggested credible sources or search terms the user or developer can use to verify claims (e.g., "WHO PM2.5 guideline", "local environmental monitoring agency", "long-term exposure cardiovascular risk study").`,
    ``,
    `Output format: Return valid JSON ONLY with the following top-level keys:`,
    `- summary (string)`,
    `- regional_outlook (object with keys "3_year" and "7_year", each string)`,
    `- age_projections (object with keys "0-17","18-40","41-64","65+")`,
    `- personalized_actions (object with keys "immediate","3_year","7_year" each an array of strings)`,
    `- precautions (array of strings)`,
    `- monitoring_metrics (array of strings)`,
    `- confidence (string: low|medium|high)`,
    `- verification_search_terms (array of strings)`,
    `- notes (string) - short medical disclaimer`,
    ``,
    `Be concise, return JSON only. Use the user's age specifically when filling the age_projections field.`,
  ];

  return promptLines.join("\n");
}

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const pollutionData = (body.pollutionData ?? {}) as PollutionData;
    const userDataPartial = (body.userData ?? {}) as Partial<UserData>;

    // If missing required user fields -> return questions
    const miss = missingFields(userDataPartial);
    if (miss.length > 0) {
      // Build questions list from FOLLOWUP_QUESTIONS for missing fields
      const questions = FOLLOWUP_QUESTIONS.filter((q) => miss.includes(q.key)).map((q) => ({
        key: q.key,
        question: q.question,
        type: q.type,
      }));

      return new Response(
        JSON.stringify({
          status: "needs_more_data",
          missingFields: miss,
          questions,
          disclaimer:
            "We'll generate a tailored health report after these questions are answered. This is not medical advice.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // cast to full UserData
    const userData = userDataPartial as UserData;

    // Build prompt
    const prompt = buildPrompt(pollutionData, userData);

    // Call Perplexity
    const pResp = await callPerplexity(prompt);
    if (!pResp.ok) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to call Perplexity API",
          details: pResp,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Attempt to extract assistant output
    // Perplexity response shapes can vary; we return the raw JSON along with parsed text
    const result = pResp.json ?? pResp.rawText ?? pResp;

    // Try to parse assistant output text to JSON if available in a message
    // Many chat APIs return messages array at result. We'll attempt safe extraction:
    let assistantText: string | null = null;
    try {
      // Common shapes:
      // { choices: [{ message: { content: "..." } }] } or { output: "..." } or other shapes
      if (result.choices && Array.isArray(result.choices) && result.choices[0]?.message?.content) {
        assistantText = result.choices[0].message.content;
      } else if (result.choices && Array.isArray(result.choices) && result.choices[0]?.text) {
        assistantText = result.choices[0].text;
      } else if (result.output) {
        assistantText = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
      } else if (typeof result === "string") {
        assistantText = result;
      } else {
        assistantText = JSON.stringify(result);
      }
    } catch (err) {
      assistantText = JSON.stringify(result);
    }

    // Try to find JSON substring inside assistantText
    let parsedReport: any = null;
    if (assistantText) {
      const jsonMatch = assistantText.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          parsedReport = JSON.parse(jsonMatch[1]);
        } catch {
          parsedReport = null;
        }
      }
    }

    const responsePayload = {
      status: "ok",
      generatedAt: new Date().toISOString(),
      userProvided: { pollutionData, userData },
      assistantRaw: result,
      assistantText,
      parsedReport, // may be null if assistant didn't return JSON parseably
      note:
        "This output is informational only. For any symptoms or high-risk conditions consult a qualified healthcare professional.",
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in generate-health-report:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err?.message ?? String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
