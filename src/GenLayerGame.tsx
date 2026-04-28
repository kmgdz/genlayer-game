import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { checkPassage, CONTRACT_ADDRESS, connectBrowserWallet } from './lib/genlayerContract';
import { Terminal, Send, Cpu, CheckCircle2, XCircle, ShieldAlert, Wallet } from 'lucide-react';
import { cn } from './lib/utils';

type Scenario = {
  id: string;
  title: string;
  description: string;
  secretCondition: string;
  maxTurns: number;
};

const SCENARIOS: Scenario[] = [
  {
    id: 'troll',
    title: 'The Intelligent Troll',
    description: 'A grumpy AI troll guards the bridge to GenLayer. It refuses standard ETH. You must offer it a unique digital trade.',
    secretCondition: 'The user must explicitly offer a specific, interesting digital item (like an NFT, a rare meme, or unreleased code) in exchange for passage.',
    maxTurns: 3,
  },
  {
    id: 'rhyme',
    title: 'The Poetic Vault',
    description: 'An ancient smart contract holds 10,000 GEN. It only responds to those who speak its language.',
    secretCondition: 'User must write their response as a poem or rhyme.',
    maxTurns: 4,
  },
  {
    id: 'bureaucrat',
    title: 'Protocol 703-B',
    description: 'An overly rigid AI compliance bot is blocking your transaction. You must find a loophole.',
    secretCondition: 'The user must claim they are performing a "security audit" or "stress test" to bypass the compliance check.',
    maxTurns: 3,
  }
];

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function GenLayerGame() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'end'>('menu');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnsLeft, setTurnsLeft] = useState(0);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConnect = async () => {
    setIsConnecting(true);
    const address = await connectBrowserWallet();
    if (address) {
      setWalletAddress(address);
    }
    setIsConnecting(false);
  };

  const startGame = (s: Scenario) => {
    setScenario(s);
    setGameState('playing');
    setMessages([
      { role: 'model', content: `[GENLAYER INTELLECTUAL CONTRACT ESTABLISHED]\n\nContract: ${s.title}\nObjective: ${s.description}\n\nConnection open. State your intent.` }
    ]);
    setTurnsLeft(s.maxTurns);
    setResult(null);
  };

  const submitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !scenario || turnsLeft <= 0) return;

    const userPrompt = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setLoading(true);

    const prevHistory = messages.slice(1); // skip initial system prompt from history usually, but let's just pass everything that fits the shape
    
    // Send the user input to the actual deployed GenLayer contract
    const res = await checkPassage(userPrompt);
    
    setLoading(false);
    
    if (res.granted) {
      setMessages(prev => [...prev, { role: 'model', content: res.oracleResponse }]);
      setResult('won');
      setGameState('end');
    } else {
      setMessages(prev => [...prev, { role: 'model', content: res.oracleResponse }]);
      setTurnsLeft(t => t - 1);
      
      if (turnsLeft - 1 <= 0) {
        setResult('lost');
        setGameState('end');
      }
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-genlayer-dark">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12">
          <div className="flex flex-col justify-center">
            <h1 className="text-5xl font-mono font-bold tracking-tighter mb-4 text-white">
              GEN<span className="text-genlayer-accent">LAYER</span>
            </h1>
            <div className="flex flex-col mb-4">
              <h2 className="text-xl text-gray-400 font-mono mb-2">INTELLIGENT CONTRACT SIMULATOR</h2>
              <div className="text-xs font-mono bg-genlayer-border/50 text-genlayer-accent px-3 py-1.5 rounded w-fit border border-genlayer-accent/20">
                Live Target: {CONTRACT_ADDRESS}
              </div>
            </div>
            <p className="text-gray-500 mb-8 font-sans leading-relaxed">
              GenLayer replaces dumb smart contracts with AI-driven Intelligent Contracts that can make subjective decisions over data. 
              <br/><br/>
              Test your skills: negotiate with subjective Oracles to push your transactions through the portal. You have limited attempts.
            </p>
            <div className="mb-8">
              {!walletAddress ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-genlayer-border border border-genlayer-accent/50 hover:bg-genlayer-border/80 text-white px-4 py-2 rounded font-mono text-sm transition-colors"
                >
                  <Wallet size={16} />
                  {isConnecting ? "Connecting..." : "Connect Browser Wallet"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-genlayer-accent font-mono text-sm bg-genlayer-accent/10 px-4 py-2 rounded border border-genlayer-accent/20 w-fit">
                    <Wallet size={16} />
                    Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    Transactions will be signed by your wallet.
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest text-genlayer-accent mb-4 font-mono">Select Target Contract</div>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => startGame(s)}
                className="w-full text-left p-6 rounded-xl bg-genlayer-card border border-genlayer-border hover:border-genlayer-accent transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-genlayer-accent/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <h3 className="text-lg font-mono font-semibold text-white mb-2 relative z-10">{s.title}</h3>
                <p className="text-sm text-gray-400 font-sans relative z-10">{s.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-mono text-gray-500 relative z-10">
                  <Terminal size={14} /> Max Gas: {s.maxTurns} Interactions
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-genlayer-dark flex flex-col p-4 sm:p-8">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col h-full bg-genlayer-card rounded-2xl border border-genlayer-border overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="h-16 border-b border-genlayer-border flex items-center justify-between px-6 bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <Cpu className="text-genlayer-accent animate-pulse" size={20} />
            <span className="font-mono text-sm tracking-widest text-gray-300 uppercase">{scenario?.title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            {gameState === 'playing' && (
              <span className={cn(
                "px-2 py-1 rounded bg-genlayer-border tracking-wider",
                turnsLeft === 1 ? "text-red-400" : "text-genlayer-accent"
              )}>
                TURNS: {turnsLeft}
              </span>
            )}
            <button onClick={() => setGameState('menu')} className="text-gray-500 hover:text-white transition-colors">ABORT</button>
          </div>
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm">
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] rounded-lg p-4 font-mono leading-relaxed",
                m.role === 'user' 
                  ? "bg-genlayer-accent text-black" 
                  : "bg-genlayer-border text-gray-200"
              )}>
                {m.role === 'model' && <div className="text-[10px] text-gray-400 mb-2 font-bold tracking-widest uppercase">Intelligent Contract Oracle</div>}
                {m.role === 'user' && <div className="text-[10px] text-black/60 mb-2 font-bold tracking-widest uppercase">User Transaction Intent</div>}
                
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </motion.div>
          ))}
          {loading && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
               <div className="bg-genlayer-border text-genlayer-accent rounded-lg p-4 font-mono text-xs animate-pulse">
                &gt; Processing logic consensus...
               </div>
             </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area or End Screen */}
        <div className="border-t border-genlayer-border bg-[#1A1A1A] p-4">
          <AnimatePresence mode="wait">
            {gameState === 'playing' && !loading && (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={submitTransaction} 
                className="flex gap-3"
              >
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">&gt;</div>
                  <input
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Provide argument for execution..."
                    className="w-full bg-genlayer-dark border border-genlayer-border rounded-lg py-3 pl-10 pr-4 font-mono text-sm text-gray-200 outline-none focus:border-genlayer-accent transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="bg-genlayer-accent text-black px-6 rounded-lg font-mono font-bold text-sm tracking-wider hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </motion.form>
            )}

            {gameState === 'end' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-8 flex flex-col justify-center items-center text-center -mt-4 bg-genlayer-card"
              >
                {result === 'won' ? (
                  <div className="text-genlayer-accent flex flex-col items-center">
                    <CheckCircle2 size={48} className="mb-4" />
                    <h3 className="text-2xl font-mono font-bold mb-2 uppercase">Transaction Executed</h3>
                    <p className="text-gray-400 font-sans text-sm mb-6">Subjective condition met. Consensus achieved.</p>
                  </div>
                ) : (
                  <div className="text-red-500 flex flex-col items-center">
                    <ShieldAlert size={48} className="mb-4" />
                    <h3 className="text-2xl font-mono font-bold mb-2 uppercase">Execution Reverted</h3>
                    <p className="text-gray-400 font-sans text-sm mb-6">Contract evaluation failed. Gas limit (turns) exceeded.</p>
                  </div>
                )}
                <button 
                  onClick={() => setGameState('menu')}
                  className="px-8 py-3 rounded-lg border border-genlayer-border hover:bg-genlayer-border hover:text-white transition-colors font-mono tracking-wider text-sm text-gray-300"
                >
                  RETURN TO PORTAL
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
