import { useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
const ABI = [
  "function answer(bool _yes) external",
  "function isSheMyGirlfriend() external view returns (bool)",
  "function response() view returns (uint8)",
  "event AnswerGiven(address indexed from, uint8 answer)"
];

type Answer = "💖 Yes" | "💔 No" | null;

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [response, setResponse] = useState<Answer>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const connectWallet = async () => {
    const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(addr);
  };

  const getResponse = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const res: number = await contract.response();
    setResponse(res === 1 ? "💖 Yes" : res === 2 ? "💔 No" : null);
  };

  const handleAnswer = async (_yes: boolean) => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.answer(_yes);
      await tx.wait();
      setTxHash(tx.hash);
      await getResponse();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) getResponse();
  }, [account]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 text-center p-8">
      <h1 className="text-4xl font-bold text-pink-700 mb-4">Casper has a question for you, Nanna 💌</h1>
      <p className="text-xl mb-8">Will you be my girlfriend?</p>

      {!account && (
        <button onClick={connectWallet} className="bg-pink-600 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-700">
          Connect Wallet
        </button>
      )}

      {account && response === null && !loading && (
        <div className="flex gap-4">
          <button onClick={() => handleAnswer(true)} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
            Yes 💖
          </button>
          <button onClick={() => handleAnswer(false)} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">
            No 💔
          </button>
        </div>
      )}

      {loading && <p className="mt-6">Sending your answer to the chain... ✨</p>}

      {response && (
        <div className="mt-6 text-2xl">
          <p>You answered: <strong>{response}</strong></p>
          {txHash && (
            <p className="text-sm mt-2">
              <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                View on Etherscan
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
