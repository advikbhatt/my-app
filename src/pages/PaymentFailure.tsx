import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full mb-6">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Payment Failed</h2>
        <p className="text-lg text-muted-foreground mb-8">
          We couldn't process your payment. Please try again or contact support if the problem persists.
        </p>
        <div className="space-y-3">
          <Button
            variant="premium"
            size="lg"
            className="w-full"
            onClick={() => navigate("/subscription")}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailure;
