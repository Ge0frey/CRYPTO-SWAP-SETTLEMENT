
import { Connection, PublicKey } from "@solana/web3.js";

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6";

export const getQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
) => {
  try {
    const response = await fetch(
      `${JUPITER_QUOTE_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw error;
  }
};

export const getSwapTransaction = async (
  quoteResponse: any,
  userPublicKey: string
) => {
  try {
    const response = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error getting swap transaction:", error);
    throw error;
  }
};
