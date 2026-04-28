import { createClient, createAccount, studionet } from 'genlayer-js';

export const CONTRACT_ADDRESS = '0x51bdD3D496F50fefdF240301038F80BF4c77c6F8';

// Read client — talks directly to GenLayer RPC, no wallet needed
export const readClient = createClient({
  chain: studionet,
});

// Write client — signs transactions. Starts with a burner wallet by default.
let _burnerAccount = createAccount(); 
export let writeClient = createClient({
  chain: studionet,
  account: _burnerAccount,
});

let _browserAccount: string | null = null;
let _isWalletConnected = false;

export async function connectBrowserWallet(): Promise<string | null> {
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    const ethereum = (window as any).ethereum;
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        _browserAccount = accounts[0];
        _isWalletConnected = true;
        
        // Recreate the write client using the browser provider
        writeClient = createClient({
          chain: studionet,
          account: _browserAccount as any,
          provider: ethereum as any
        });
        
        // Switch MetaMask to the correct chain (adds the network if not present)
        await writeClient.connect('studionet');
        
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
    const hash = await writeClient.writeContract({
      address: CONTRACT_ADDRESS as any,
      functionName: 'request_passage',
      args: [proposal],
      value: BigInt(0), // Required to ensure the transaction executes successfully
    });

    console.log("Transaction sent with hash:", hash);

    await new Promise(resolve => setTimeout(resolve, 3000));

    const bridgePassed = await readClient.readContract({
      address: CONTRACT_ADDRESS as any,
      functionName: 'get_status',
      args: [],
    }) as boolean;

    const trollResponse = await readClient.readContract({
      address: CONTRACT_ADDRESS as any,
      functionName: 'get_last_response',
      args: [],
    }) as string;

    return { granted: bridgePassed, oracleResponse: trollResponse, hash };
  } catch (error) {
    console.error("GenLayer interaction failed:", error);
    return { granted: false, oracleResponse: "⚠️ System offline. The portal flickers and dies." };
  }
}
