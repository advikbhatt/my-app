import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transaction_id');
      
      if (!transactionId) {
        toast.error("No transaction ID found");
        navigate("/subscription");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: { transactionId }
        });

        if (error) throw error;

        if (data?.verified) {
          setVerified(true);
          toast.success("Payment verified! You are now a Premium member!");
        } else {
          throw new Error("Payment verification failed");
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        toast.error(error.message || "Payment verification failed");
        navigate("/subscription");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Verifying Payment</h2>
          <p className="text-muted-foreground">Please wait while we confirm your transaction...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-light rounded-full mb-6">
          <CheckCircle className="w-12 h-12 text-secondary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Welcome to Premium! You now have access to personalized AI health reports.
        </p>
        <Button
          variant="premium"
          size="lg"
          className="w-full"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
