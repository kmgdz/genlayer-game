import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const CONTRACT_ADDRESS = '0x51bdD3D496F50fefdF240301038F80BF4c77c6F8';

const client = createClient({
  chain: studionet,
});

// Since AI Studio is often embedded, we use a randomly generated generic 'burner' wallet.
// GenLayer testnets generally allow transactions without explicit gas token funding for testing.
const account = createAccount(); 

export async function checkPassage(proposal: string): Promise<{ granted: boolean, oracleResponse: string, hash?: string }> {
  try {
    const hash = await client.writeContract({
      account,
      address: CONTRACT_ADDRESS,
      functionName: 'request_passage',
      args: [proposal],
    });

    console.log("Transaction sent with hash:", hash);

    // Read the contract state immediately or wait for it? 
    // genlayer-js says we can wait for transaction receipt:
    // Actually we don't have waitForTransactionReceipt if it's omitted in GenLayerClient type?
    // Let's assume we can query `client.waitForTransactionReceipt` but we'll try/catch it.
    
    // We will just wait a little bit and retry reading if it fails, or if it doesn't give us the updated state.
    // For safety, let's wait 3 seconds.
    await new Promise(resolve => setTimeout(resolve, 3000));

    const bridgePassed = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_status',
      args: [],
    }) as boolean;

    const trollResponse = await client.readContract({
      address: CONTRACT_ADDRESS,
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
