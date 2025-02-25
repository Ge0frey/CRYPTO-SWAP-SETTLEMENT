
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PaymentForm = () => {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      toast({
        title: "Processing payment",
        description: "Please confirm the transaction in your wallet",
      });
      
      // Jupiter integration will go here
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount
        </label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1"
          required
        />
      </div>
      
      <Button type="submit" className="w-full">
        Pay Now
      </Button>
    </form>
  );
};

export default PaymentForm;
