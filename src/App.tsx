import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Subscription from "./pages/Subscription";
import HealthReport from "./pages/HealthReport";
import EnvironmentalData from "./pages/EnvironmentalData";
import NotFound from "./pages/NotFound";
import PaymentStatus from "./pages/PaymentStatus";
import AirPollutionPage from "./pages/AirPollutionPage";
import WaterQualityPage from "./pages/WaterQualityPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/health-report" element={<HealthReport />} />
          <Route path="/environmental-data" element={<EnvironmentalData />} />
          <Route path="/air-pollution" element={<AirPollutionPage />} />
          <Route path="/water-quality" element={<WaterQualityPage />} />
          <Route path="/payment-status" element={<PaymentStatus />} />


          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
