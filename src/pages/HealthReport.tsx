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
  const [report, setReport] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "male",
    activityLevel: "moderate",
    healthConcerns: "",
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
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'premium')
      .maybeSingle();

    if (!data) {
      toast.error("Premium subscription required");
      navigate("/subscription");
    }
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('generate-health-report', {
        body: { userInfo: formData }
      });

      if (error) throw error;

      setReport(data.report);
      toast.success("Health report generated!");
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

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
                <p className="text-muted-foreground">Powered by AI for personalized insights</p>
              </div>
            </div>

            <form onSubmit={generateReport} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                    min="20"
                    max="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    required
                    min="50"
                    max="250"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <select
                  id="activityLevel"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                >
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="light">Light (exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                  <option value="active">Active (exercise 6-7 days/week)</option>
                  <option value="very-active">Very Active (intense exercise daily)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthConcerns">Health Concerns (optional)</Label>
                <textarea
                  id="healthConcerns"
                  className="w-full min-h-24 px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="Any specific health concerns, goals, or conditions..."
                  value={formData.healthConcerns}
                  onChange={(e) => setFormData({ ...formData, healthConcerns: e.target.value })}
                />
              </div>

              <Button type="submit" variant="premium" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  "Generate Health Report"
                )}
              </Button>
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
                {report}
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default HealthReport;
