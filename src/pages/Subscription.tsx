import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, Check, ArrowLeft } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const BACKEND_URL = `${API_BASE_URL}/txn`;

const Subscription = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const initiatePayment = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const orderId = `ORD-${Date.now()}`;
      const amount = 85;

      // For demo / non-auth flow — use placeholder buyer details
      const buyerEmail = "testuser@example.com";
      const buyerFirstName = "John";
      const buyerLastName = "Doe";
      const buyerAddress = "123 Demo Street";
      const buyerCity = "Mumbai";
      const buyerState = "Maharashtra";
      const buyerCountry = "India";
      const buyerPhone = "9876543210";
      const buyerPinCode = "400001";

      // Call backend AirPay API route
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEmail,
          buyerFirstName,
          buyerLastName,
          buyerAddress,
          buyerCity,
          buyerState,
          buyerCountry,
          buyerPhone,
          buyerPinCode,
          amount,
          orderid: orderId,
          currency: "INR",
          isocurrency: "INR",
        }),
      });

      const html = await response.text();

      if (!response.ok) {
        console.error("Payment server returned an error:", html);
        throw new Error("Payment server returned an error");
      }

      // ✅ Render the AirPay payment form directly
      document.open();
      document.write(html);
      document.close();

      setProcessing(false);
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      toast.error(error.message || "Payment failed to start");
      setProcessing(false);
    }
  };

  const features = [
    "Personalized AI health reports",
    "Detailed diet recommendations",
    "Custom exercise plans",
    "Lifestyle improvement tips",
    "Preventive care suggestions",
    "Priority support",
    "Monthly health tracking",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Upgrade to Premium</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-premium rounded-3xl mb-6">
              <Crown className="w-10 h-10 text-premium-foreground" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2">
              Premium Membership
            </h2>
            <p className="text-lg text-muted-foreground">
              Unlock personalized health insights powered by AI
            </p>
          </div>

          <div className="bg-primary-light rounded-2xl p-8 mb-8 text-center">
            <div className="text-5xl font-bold text-primary mb-2">₹85</div>
            <div className="text-muted-foreground">One-time payment</div>
            <div className="text-sm text-muted-foreground mt-2">Access for 1 month</div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">
              What you'll get:
            </h3>
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-secondary-light rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            variant="premium"
            size="xl"
            className="w-full"
            onClick={initiatePayment}
            disabled={processing}
          >
            {processing ? "Processing..." : "Subscribe Now"}
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Secure payment powered by AirPay
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Subscription;
