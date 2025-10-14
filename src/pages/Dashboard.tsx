import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { HeartPulse, Droplets, Wind, FileText, LogOut, Crown } from "lucide-react";
import type { User, Session } from '@supabase/supabase-js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (!currentSession) {
        navigate("/auth");
      } else {
        checkPremiumStatus(currentSession.user.id);
      }

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, [navigate]);

  const checkPremiumStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'premium')
        .maybeSingle();

      if (error) {
        console.error('Error checking premium status:', error);
      } else {
        setIsPremium(!!data);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">HealthPro</h1>
          </div>
          <div className="flex items-center gap-4">
            {isPremium && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-premium rounded-full">
                <Crown className="w-4 h-4 text-premium-foreground" />
                <span className="text-sm font-semibold text-premium-foreground">Premium</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          </h2>
          <p className="text-muted-foreground">
            {isPremium
              ? "Access all premium features to optimize your health"
              : "Upgrade to Premium for personalized health reports"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/water-quality")}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Water Quality</h3>
                <p className="text-sm text-muted-foreground">Check by city</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              View water quality data for your city
            </p>
          </Card>

          <Card
            className="p-6 hover:shadow-medium transition-shadow cursor-pointer"
            onClick={() => navigate("/air-pollution")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary-light rounded-xl flex items-center justify-center">
                <Wind className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Air Quality</h3>
                <p className="text-sm text-muted-foreground">Real-time pollution</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor air pollution levels in your area
            </p>
          </Card>


          <Card
            className={`p-6 hover:shadow-medium transition-shadow cursor-pointer ${!isPremium && 'opacity-60'}`}
            onClick={() => isPremium ? navigate("/health-report") : navigate("/subscription")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-premium-light rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-premium" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Health Report</h3>
                <p className="text-sm text-muted-foreground">
                  {isPremium ? "AI-powered insights" : "Premium only"}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPremium
                ? "Get personalized health recommendations"
                : "Upgrade to access personalized health reports"}
            </p>
            {!isPremium && (
              <div className="mt-4">
                <Button variant="premium" size="sm" className="w-full">
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </Card>
        </div>

        {!isPremium && (
          <Card className="mt-8 p-8 bg-gradient-premium">
            <div className="flex items-center gap-6">
              <Crown className="w-16 h-16 text-premium-foreground" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-premium-foreground mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-premium-foreground/90 mb-4">
                  Get AI-powered personalized health reports for just ₹85!
                </p>
                <Button variant="default" size="lg" onClick={() => navigate("/subscription")}>
                  Get Premium Now
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
