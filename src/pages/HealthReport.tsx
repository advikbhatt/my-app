import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";

const HealthReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    smokingStatus: "never",
    cigarettesPerDay: "",
    hoursOutsidePerDay: "",
    maskUsage: "sometimes",
    occupation: "",
    exerciseMinutesPerWeek: "",
    comorbidities: "",
  });

  // You can auto-load location or pollution data later if you want.
  const [pollutionData, setPollutionData] = useState({
    regionName: "Kolkata, India",
    aqi: 165,
    pollutants: { pm25: 95, pm10: 120, no2: 48 },
    timestamp: new Date().toISOString(),
    source: "local-monitoring",
  });

  useEffect(() => {
    checkPremium();
  }, []);

  const checkPremium = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "premium")
      .maybeSingle();

    if (!data) {
      toast.error("Premium subscription required");
      navigate("/subscription");
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("generate-health-report", {
        body: {
          pollutionData,
          userData: {
            ...formData,
            age: parseInt(formData.age),
            hoursOutsidePerDay: parseFloat(formData.hoursOutsidePerDay),
            cigarettesPerDay: parseInt(formData.cigarettesPerDay || "0"),
            comorbidities: formData.comorbidities
              ? formData.comorbidities.split(",").map((s) => s.trim())
              : [],
          },
        },
      });

      if (error) throw error;

      if (data.status === "needs_more_data") {
        setFollowUpQuestions(data.questions);
        toast("We need a few more details.");
      } else if (data.status === "ok") {
        setReport(data.parsedReport || data.assistantText);
        toast.success("Health report generated!");
      } else {
        toast.error("Unexpected response from the server");
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionInputs = () => (
    <div className="space-y-4">
      {followUpQuestions.map((q) => (
        <div key={q.key} className="space-y-2">
          <Label>{q.question}</Label>
          {q.type === "number" ? (
            <Input
              type="number"
              value={(formData as any)[q.key] || ""}
              onChange={(e) => handleChange(q.key, e.target.value)}
            />
          ) : (
            <Input
              type="text"
              value={(formData as any)[q.key] || ""}
              onChange={(e) => handleChange(q.key, e.target.value)}
            />
          )}
        </div>
      ))}
      <Button
        onClick={() => {
          setFollowUpQuestions([]);
          generateReport(new Event("submit") as any);
        }}
        variant="premium"
        className="w-full mt-4"
      >
        Continue
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">AI Health Report</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!report ? (
          <Card className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-premium-light rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-premium" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Generate Your Health Report</h2>
                <p className="text-muted-foreground">
                  Personalized environmental health assessment
                </p>
              </div>
            </div>

            <form onSubmit={generateReport} className="space-y-6">
              {followUpQuestions.length > 0 ? (
                renderQuestionInputs()
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={(e) => handleChange("age", e.target.value)}
                        required
                        min="1"
                        max="120"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.gender}
                        onChange={(e) => handleChange("gender", e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smokingStatus">Smoking Status</Label>
                      <select
                        id="smokingStatus"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.smokingStatus}
                        onChange={(e) => handleChange("smokingStatus", e.target.value)}
                      >
                        <option value="never">Never</option>
                        <option value="former">Former</option>
                        <option value="current">Current</option>
                      </select>
                    </div>

                    {formData.smokingStatus === "current" && (
                      <div className="space-y-2">
                        <Label htmlFor="cigarettesPerDay">Cigarettes per day</Label>
                        <Input
                          id="cigarettesPerDay"
                          type="number"
                          placeholder="5"
                          value={formData.cigarettesPerDay}
                          onChange={(e) => handleChange("cigarettesPerDay", e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="hoursOutsidePerDay">Hours Outside per Day</Label>
                      <Input
                        id="hoursOutsidePerDay"
                        type="number"
                        placeholder="2"
                        value={formData.hoursOutsidePerDay}
                        onChange={(e) => handleChange("hoursOutsidePerDay", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maskUsage">Mask Usage</Label>
                      <select
                        id="maskUsage"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.maskUsage}
                        onChange={(e) => handleChange("maskUsage", e.target.value)}
                      >
                        <option value="never">Never</option>
                        <option value="sometimes">Sometimes</option>
                        <option value="always">Always</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        type="text"
                        placeholder="Software Engineer"
                        value={formData.occupation}
                        onChange={(e) => handleChange("occupation", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exerciseMinutesPerWeek">Exercise Minutes per Week</Label>
                      <Input
                        id="exerciseMinutesPerWeek"
                        type="number"
                        placeholder="120"
                        value={formData.exerciseMinutesPerWeek}
                        onChange={(e) => handleChange("exerciseMinutesPerWeek", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comorbidities">Comorbidities (comma separated)</Label>
                    <Input
                      id="comorbidities"
                      type="text"
                      placeholder="Asthma, Hypertension"
                      value={formData.comorbidities}
                      onChange={(e) => handleChange("comorbidities", e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="premium"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      "Generate Health Report"
                    )}
                  </Button>
                </>
              )}
            </form>
          </Card>
        ) : (
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-premium-light rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-premium" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your Health Report</h2>
                  <p className="text-sm text-muted-foreground">Generated with AI</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setReport(null)}>
                Generate New Report
              </Button>
            </div>

            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {typeof report === "object"
                  ? JSON.stringify(report, null, 2)
                  : report}
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default HealthReport;
