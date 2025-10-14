import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import waterData from "@/data/waterQuality.json";
import { ArrowLeft, Droplets } from "lucide-react";

const WaterQualityPage = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("");
  const [waterQuality, setWaterQuality] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch user session & default city
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");

      const userCity = session.user.user_metadata?.city || "";
      setSelectedCity(userCity);

      if (userCity) {
        const cityData = waterData.cities.find(c => c.name.toLowerCase() === userCity.toLowerCase());
        if (cityData) setWaterQuality(cityData.waterQuality);
      }
    };

    fetchUser();
  }, [navigate]);

  // Handle selecting a city from search dropdown
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setSearchTerm(""); 
    const cityData = waterData.cities.find(c => c.name === cityName);
    if (cityData) setWaterQuality(cityData.waterQuality);
  };

  // Filter cities based on searchTerm
  const filteredCities = waterData.cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Water Quality</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Select Your City</h2>
              <p className="text-sm text-muted-foreground">See water quality metrics</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 relative">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="Search your city"
                value={searchTerm} // only use searchTerm
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {searchTerm && (
                <div className="absolute z-10 w-full border border-input rounded-md max-h-40 overflow-y-auto mt-1 bg-background shadow-md">
                  {filteredCities.length > 0 ? (
                    filteredCities.map(city => (
                      <div
                        key={city.name}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCitySelect(city.name)}
                      >
                        {city.name}, {city.state}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-muted-foreground">No cities found</div>
                  )}
                </div>
              )}
            </div>

            {waterQuality && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-primary-light rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Overall Rating</div>
                  <div className="text-2xl font-bold text-primary">{waterQuality.rating}</div>
                </div>

                <div className="text-sm text-muted-foreground">{waterQuality.description}</div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">pH Level</div>
                    <div className="text-lg font-semibold text-foreground">{waterQuality.ph}</div>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">TDS (ppm)</div>
                    <div className="text-lg font-semibold text-foreground">{waterQuality.tds}</div>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Hardness (mg/L)</div>
                    <div className="text-lg font-semibold text-foreground">{waterQuality.hardness}</div>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Chlorine (mg/L)</div>
                    <div className="text-lg font-semibold text-foreground">{waterQuality.chlorine}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default WaterQualityPage;
