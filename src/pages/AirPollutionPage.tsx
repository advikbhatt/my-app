import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Wind, Loader2 } from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface PollutionData {
  aqi: number;
  aqiLabel: string;
  description: string;
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
}

const WHO_LIMITS = {
  pm2_5: 15,
  pm10: 45,
  no2: 25,
  o3: 100,
  so2: 40,
};

const AirPollutionPage = () => {
  const navigate = useNavigate();
  const [pollutionData, setPollutionData] = useState<PollutionData | null>(null);
  const [loadingPollution, setLoadingPollution] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const getPollutionData = async () => {
    setLoadingPollution(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported");
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const { data, error } = await supabase.functions.invoke('get-pollution-data', {
            body: { lat: latitude, lon: longitude }
          });

          if (error) throw error;

          setPollutionData(data);
          setLoadingPollution(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error("Could not get your location. Please enable location access.");
          setLoadingPollution(false);
        }
      );
    } catch (error: any) {
      console.error('Error fetching pollution data:', error);
      toast.error(error.message || "Failed to fetch pollution data");
      setLoadingPollution(false);
    }
  };

  const getAqiColor = (aqi: number) => {
    switch (aqi) {
      case 1: return "text-secondary";
      case 2: return "text-primary";
      case 3: return "text-yellow-600";
      case 4: return "text-orange-600";
      case 5: return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const renderPollutantComparison = () => {
    if (!pollutionData) return null;
    return (
      <div className="space-y-2 mt-4">
        {Object.keys(WHO_LIMITS).map((key) => {
          const value = (pollutionData.components as any)[key];
          const limit = (WHO_LIMITS as any)[key];
          return (
            <div key={key} className="flex justify-between items-center p-2 bg-card border border-border rounded-lg">
              <div className="capitalize">{key.replace("_", ".")}</div>
              <div className={`font-semibold ${value > limit ? "text-red-600" : "text-green-600"}`}>
                {value.toFixed(1)} / {limit} (WHO)
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Air Pollution</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-secondary-light rounded-xl flex items-center justify-center">
              <Wind className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Air Quality</h2>
              <p className="text-sm text-muted-foreground">Real-time pollution data</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full mb-6"
            onClick={getPollutionData}
            disabled={loadingPollution}
          >
            {loadingPollution ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Data...
              </>
            ) : (
              "Get Pollution Data"
            )}
          </Button>

          {pollutionData && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary-light rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Air Quality Index</div>
                <div className={`text-2xl font-bold ${getAqiColor(pollutionData.aqi)}`}>
                  {pollutionData.aqiLabel}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">{pollutionData.description}</div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-foreground mb-2">Pollutant Levels</div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(pollutionData.components).map(([key, value]) => (
                    <div key={key} className="p-3 bg-card border border-border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">{key.toUpperCase()}</div>
                      <div className="text-lg font-semibold text-foreground">{(value as number).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">WHO Guideline Comparison</h3>
                {renderPollutantComparison()}
              </div>

              {historicalData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-2">7-Day Pollution Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#8884d8" />
                      <Line type="monotone" dataKey="pm10" name="PM10" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="no2" name="NO2" stroke="#ff7300" />
                      <Line type="monotone" dataKey="o3" name="O3" stroke="#387908" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AirPollutionPage;
