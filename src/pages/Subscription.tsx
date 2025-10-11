import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, Check, ArrowLeft } from "lucide-react";
import type { User } from '@supabase/supabase-js';

const EDGE_FUNCTION_URL = "https://gdkpsgoisbvqecjbfuef.functions.supabase.co/airpay-payment";

const Subscription = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
  }, [navigate]);
const initiatePayment = async () => {
  if (!user || processing) return;
  setProcessing(true);

  try {
    const orderId = `ORD-${Date.now()}`;
    const amount = 85;

    // Call Supabase Edge Function
    const res = await fetch("https://gdkpsgoisbvqecjbfuef.functions.supabase.co/airpay-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerEmail: user.email,
        buyerFirstName: user.user_metadata.full_name?.split(" ")[0] || "John",
        buyerLastName: user.user_metadata.full_name?.split(" ")[1] || "Doe",
        amount,
        orderid: orderId,
        currency: "INR",
        isocurrency: "INR",
      }),
    });

    const data = await res.json();
    if (!data.paymentUrl) throw new Error("Failed to get payment URL");

    // Create a form and POST to AirPay
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.paymentUrl;

    const inputs = [
      { name: "merchant_id", value: data.merchantId },
      { name: "encdata", value: data.encryptedData },
      { name: "checksum", value: data.checksum },
    ];

    inputs.forEach(({ name, value }) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  } catch (err: any) {
    console.error("Payment initiation error:", err);
    toast.error(err.message || "Failed to initiate payment");
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
    "Monthly health tracking"
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Upgrade to Premium</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-premium rounded-3xl mb-6">
              <Crown className="w-10 h-10 text-premium-foreground" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-2">Premium Membership</h2>
            <p className="text-lg text-muted-foreground">Unlock personalized health insights powered by AI</p>
          </div>

          <div className="bg-primary-light rounded-2xl p-8 mb-8 text-center">
            <div className="text-5xl font-bold text-primary mb-2">₹85</div>
            <div className="text-muted-foreground">One-time payment</div>
            <div className="text-sm text-muted-foreground mt-2">Access for 1 month</div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg text-foreground mb-4">What you'll get:</h3>
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

          <p className="text-sm text-muted-foreground text-center mt-6">Secure payment powered by AirPay</p>
        </Card>
      </main>
    </div>
  );
};

export default Subscription;
