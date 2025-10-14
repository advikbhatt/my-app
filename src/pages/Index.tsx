import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button Variants";
import { HeartPulse, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur rounded-3xl mb-8">
          <HeartPulse className="w-14 h-14 text-white" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Welcome to HealthPro
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          Your comprehensive health platform with AI-powered insights, water quality monitoring, and real-time pollution data
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="default" 
            size="xl" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => navigate("/auth")}
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="xl"
            className="border-white text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">AI Reports</div>
            <div className="text-white/80">Personalized health insights powered by advanced AI</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">Water Data</div>
            <div className="text-white/80">Monitor water quality in major Indian cities</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">Air Quality</div>
            <div className="text-white/80">Real-time pollution tracking for your location</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;