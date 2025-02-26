import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOL_TOKEN = { 
  symbol: "SOL", 
  name: "Solana", 
  mint: "So11111111111111111111111111111111111111112" 
};

const TokenSelector = () => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Payment Token
      </label>
      <div className="flex items-center gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700">
        <span>{SOL_TOKEN.symbol}</span>
        <span className="text-gray-500 text-sm">({SOL_TOKEN.name})</span>
      </div>
    </div>
  );
};

export default TokenSelector;
