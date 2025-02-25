
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOKENS = [
  { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
];

const TokenSelector = () => {
  const [selectedToken, setSelectedToken] = useState(TOKENS[0].mint);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Token
      </label>
      <Select value={selectedToken} onValueChange={setSelectedToken}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a token" />
        </SelectTrigger>
        <SelectContent>
          {TOKENS.map((token) => (
            <SelectItem key={token.mint} value={token.mint}>
              <div className="flex items-center gap-2">
                <span>{token.symbol}</span>
                <span className="text-gray-500 text-sm">({token.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TokenSelector;
