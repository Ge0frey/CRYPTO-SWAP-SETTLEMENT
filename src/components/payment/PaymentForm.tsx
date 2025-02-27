import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { getQuote, getSwapTransaction } from "@/lib/jupiter";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

// Correctly format the Helius RPC URL
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const RPC_ENDPOINT = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

// Fallback RPC in case Helius fails
const FALLBACK_RPC = "https://api.mainnet-beta.solana.com";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const PaymentForm = () => {
  const [amount, setAmount] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const wallet = useWallet();
  
  // Initialize connection with fallback
  const [connection, setConnection] = useState(() => {
    try {
      return new Connection(RPC_ENDPOINT, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      });
    } catch (error) {
      console.warn("Failed to connect to primary RPC, using fallback");
      return new Connection(FALLBACK_RPC, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      });
    }
  });

  // Check RPC connection with fallback
  const checkRPCConnection = async () => {
    try {
      await connection.getLatestBlockhash();
      return true;
    } catch (error) {
      console.warn("Primary RPC failed, trying fallback...");
      try {
        // Switch to fallback RPC
        const fallbackConnection = new Connection(FALLBACK_RPC, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        });
        await fallbackConnection.getLatestBlockhash();
        setConnection(fallbackConnection);
        return true;
      } catch (fallbackError) {
        console.error("All RPC connections failed:", fallbackError);
        toast({
          title: "Connection Error",
          description: "Unable to connect to Solana network. Please try again later.",
          variant: "destructive",
        });
        return false;
      }
    }
  };

  const validateSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    if (numValue <= 0) return false;
    return numValue >= 0.000000001; // Minimum 1 lamport
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === "") {
      setAmount("");
      return;
    }
    
    if (!/^\d*\.?\d*$/.test(value)) return;
    
    const parts = value.split('.');
    if (parts.length > 1 && parts[1].length > 9) return;
    
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check RPC connection first
    const isConnected = await checkRPCConnection();
    if (!isConnected) return;

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
      
      // Convert SOL amount to lamports
      const inputAmount = Math.round(parseFloat(amount) * 1e9);
      
      // Get balance with retry logic
      let balance;
      try {
        balance = await connection.getBalance(wallet.publicKey);
      } catch (error) {
        console.error("Balance check error:", error);
        throw new Error("Unable to check wallet balance. Please try again.");
      }

      const minSolBalance = inputAmount + (0.01 * 1e9); // Amount + 0.01 SOL for fees
      
      if (balance < minSolBalance) {
        throw new Error("Insufficient SOL balance. Please keep at least 0.01 SOL for fees.");
      }

      // Get quote for SOL to USDC swap
      const quoteResponse = await getQuote(
        SOL_MINT,
        USDC_MINT,
        inputAmount,
        50
      );

      // Get swap transaction
      const swapResult = await getSwapTransaction(
        quoteResponse,
        wallet.publicKey,
        merchantAddress,
        wallet
      );

      if (!swapResult || !swapResult.swapTransaction) {
        throw new Error("Failed to get swap transaction");
      }

      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapResult.swapTransaction, 'base64')
      );

      // Add retry logic for transaction
      let signature;
      try {
        signature = await wallet.sendTransaction(
          transaction,
          connection,
          { maxRetries: 3 }
        );

        await connection.confirmTransaction(signature, 'confirmed');
      } catch (error) {
        console.error("Transaction error:", error);
        throw new Error("Transaction failed. Please try again.");
      }

      toast({
        title: "Success",
        description: `Payment processed successfully. The merchant will receive USDC. Signature: ${signature}`,
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
          Amount (SOL)
        </label>
        <Input
          type="text"
          placeholder="Enter amount in SOL"
          value={amount}
          onChange={handleAmountChange}
          className="mt-1"
          required
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">
          Min: 0.000000001 SOL (1 lamport)
        </p>
      </div>

      <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
        <p>Note: Please keep at least 0.01 SOL in your wallet for network fees.</p>
        <p className="mt-1">The merchant will receive the equivalent amount in USDC.</p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={
          isLoading || 
          !amount || 
          !validateAmount(amount) || 
          !merchantAddress
        }
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default PaymentForm;
