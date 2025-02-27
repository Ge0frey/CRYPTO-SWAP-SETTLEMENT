import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import * as jupiterApi from '@jup-ag/api';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fetch from 'cross-fetch';

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6";

export const getQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
) => {
  try {
    // Ensure amount is an integer
    const amountStr = Math.round(amount).toString();
    
    // Construct URL with URLSearchParams to properly encode parameters
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountStr,
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: "true",
      asLegacyTransaction: "true",
      // Request setup instructions
      computeAllPossibleRoutes: "true",
      includeSetupInstructions: "true"
    });

    const url = `${JUPITER_QUOTE_API}/quote?${params.toString()}`;
    console.log("Requesting quote URL:", url);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Quote API error response:", errorText);
      throw new Error(`Quote API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Quote data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw error;
  }
};

export const getSwapTransaction = async (
  quoteResponse: any,
  userPublicKey: string,
  merchantAddress: string
) => {
  try {
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC mint address

    // Get the associated token account for the merchant wallet
    const merchantUSDCTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      new PublicKey(merchantAddress),
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Fetch the swap transaction
    const response = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        destinationTokenAccount: merchantUSDCTokenAccount.toBase58(), // Set destination to merchant's token account
        wrapUnwrapSOL: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Swap API error response:", errorText);
      throw new Error(`Swap API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Swap data:", data);
    return data;
  } catch (error) {
    console.error("Error getting swap transaction:", error);
    throw error;
  }
};
