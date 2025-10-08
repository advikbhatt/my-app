import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');

    if (!openWeatherApiKey) {
      throw new Error('OPENWEATHER_API_KEY not configured');
    }

    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      throw new Error('Latitude and longitude required');
    }

    console.log('Fetching pollution data for:', lat, lon);

    // Get air pollution data from OpenWeather API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenWeather API error:', response.status, errorText);
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();

    // Process pollution data
    const aqi = data.list[0].main.aqi;
    const components = data.list[0].components;

    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqiDescriptions = [
      'Air quality is excellent, perfect for outdoor activities',
      'Air quality is acceptable, outdoor activities are generally fine',
      'Air quality is moderate, sensitive individuals should limit outdoor exposure',
      'Air quality is poor, everyone should reduce outdoor activities',
      'Air quality is very poor, avoid outdoor activities'
    ];

    const pollutionData = {
      aqi: aqi,
      aqiLabel: aqiLabels[aqi - 1],
      description: aqiDescriptions[aqi - 1],
      components: {
        co: components.co,
        no: components.no,
        no2: components.no2,
        o3: components.o3,
        so2: components.so2,
        pm2_5: components.pm2_5,
        pm10: components.pm10,
        nh3: components.nh3
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(pollutionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-pollution-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
