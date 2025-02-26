import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { getQuote, getSwapTransaction } from "@/lib/jupiter";
import { 
  Connection, 
  PublicKey, 
  VersionedTransaction 
} from "@solana/web3.js";

// Mainnet token addresses
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // Mainnet USDC

const PaymentForm = ({ selectedToken }) => {
  const [amount, setAmount] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const wallet = useWallet();
  
  const connection = new Connection("https://api.mainnet-beta.solana.com");

  const validateSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected || !wallet.publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!validateSolanaAddress(merchantAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid merchant Solana address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert amount to proper units (lamports for SOL, or micro-units for USDC)
      const multiplier = selectedToken === SOL_MINT ? 1e9 : 1e6;
      const inputAmount = Math.round(parseFloat(amount) * multiplier);
      
      console.log("Submitting quote request with:", {
        inputMint: selectedToken,
        outputMint: USDC_MINT,
        amount: inputAmount,
        slippageBps: 50
      });

      // Get quote using Jupiter API
      const quoteResponse = await getQuote(
        selectedToken,
        USDC_MINT,
        inputAmount,
        50
      );

      console.log("Quote response:", quoteResponse);

      // Get swap transaction with merchant as recipient
      const swapResult = await getSwapTransaction(
        quoteResponse,
        wallet.publicKey.toString(),
        merchantAddress // Pass merchant address to swap function
      );

      if (!swapResult || !swapResult.swapTransaction) {
        throw new Error("Failed to get swap transaction");
      }

      // Deserialize the transaction
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapResult.swapTransaction, 'base64')
      );

      // Sign and send the transaction
      const signature = await wallet.sendTransaction(
        transaction,
        connection,
        { maxRetries: 3 }
      );

      console.log("Transaction sent:", signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      toast({
        title: "Success",
        description: `Payment processed successfully. Signature: ${signature}`,
      });

    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Merchant Address
        </label>
        <Input
          type="text"
          placeholder="Enter merchant's Solana address"
          value={merchantAddress}
          onChange={(e) => setMerchantAddress(e.target.value)}
          className="mt-1"
          required
          disabled={isLoading}
        />
      </div>

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
          disabled={isLoading}
          min="0.000001"
          step="0.000001"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !amount || parseFloat(amount) <= 0 || !merchantAddress}
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default PaymentForm;
