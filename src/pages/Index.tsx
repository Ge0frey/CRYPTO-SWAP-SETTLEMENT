
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import PaymentForm from "@/components/payment/PaymentForm";
import TokenSelector from "@/components/payment/TokenSelector";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { toast } = useToast();
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 shadow-xl rounded-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Crypto Payment Gateway
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Accept crypto, settle in USDC
            </p>
          </div>
          
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90 transition-colors" />
          </div>

          {connected ? (
            <div className="space-y-6">
              <TokenSelector />
              <PaymentForm />
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Connect your wallet to continue
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Index;
