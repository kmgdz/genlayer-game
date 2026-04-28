import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const CONTRACT_ADDRESS = '0x51bdD3D496F50fefdF240301038F80BF4c77c6F8';

export let client = createClient({
  chain: studionet,
});

// Since AI Studio is often embedded, we use a randomly generated generic 'burner' wallet.
// GenLayer testnets generally allow transactions without explicit gas token funding for testing.
let accountMode: 'burner' | 'browser' = 'burner';
let _burnerAccount = createAccount(); 
let _browserAccount: string | null = null;

export async function connectBrowserWallet(): Promise<string | null> {
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    const ethereum = (window as any).ethereum;
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        _browserAccount = accounts[0];
        accountMode = 'browser';
        // Recreate the client using the browser provider
        client = createClient({
          chain: studionet,
          provider: ethereum as any
        });
        return _browserAccount;
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  } else {
    alert("Please install MetaMask or another Web3 extension.");
  }
  return null;
}

export async function checkPassage(proposal: string): Promise<{ granted: boolean, oracleResponse: string, hash?: string }> {
  try {
    const currentAccount = accountMode === 'browser' && _browserAccount ? _browserAccount : _burnerAccount;
    
    const hash = await client.writeContract({
      account: currentAccount as any,
      address: CONTRACT_ADDRESS as any,
      functionName: 'request_passage',
      args: [proposal],
    });

    console.log("Transaction sent with hash:", hash);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const bridgePassed = await client.readContract({
      address: CONTRACT_ADDRESS as any,
      functionName: 'get_status',
      args: [],
    }) as boolean;

    const trollResponse = await client.readContract({
      address: CONTRACT_ADDRESS as any,
      functionName: 'get_last_response',
      args: [],
    }) as string;

    return {
      granted: bridgePassed,
      oracleResponse: trollResponse || "No response received yet.",
      hash
    };
  } catch (error) {
    console.error("GenLayer Contract Error:", error);
    return {
      granted: false,
      oracleResponse: `Execution reverted or failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
