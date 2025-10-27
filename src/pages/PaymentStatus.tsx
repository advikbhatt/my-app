import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button Variants";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus(searchParams.get("status"));
    setOrderId(searchParams.get("orderid"));
    setAmount(searchParams.get("amount"));
    setMessage(searchParams.get("message"));
  }, [searchParams]);

  const isSuccess = status === "success";
  const isFailed = status === "failed";
  const isPending = !isSuccess && !isFailed;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center shadow-soft">
        <div className="flex justify-center mb-6">
          {isPending && <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />}
          {isSuccess && <CheckCircle className="w-16 h-16 text-green-500" />}
          {isFailed && <XCircle className="w-16 h-16 text-red-500" />}
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {isPending && "Processing Payment..."}
          {isSuccess && "Payment Successful!"}
          {isFailed && "Payment Failed"}
        </h1>

        <p className="text-muted-foreground mb-6">
          {message || "Please wait while we verify your transaction."}
        </p>

        {orderId && (
          <div className="bg-muted rounded-xl p-4 text-left mb-6">
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Amount:</strong> ₹{amount}</p>
            <p><strong>Status:</strong> {status?.toUpperCase()}</p>
          </div>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default PaymentStatus;
