'use client';

import { useState } from "react";

interface EvaluationResult {
  gibberish: {
    class: string;
    score: number;
  };
  hallucination: number;
}

interface HistoryItem {
  sentence: string;
  gibberish_model_class: string;
  gibberish_model_score: number;
  hallucination_model_score: number;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleEvaluate = async () => {
    if (!backendUrl) {
      setError("Backend URL is not configured");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${backendUrl}/evaluate_response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response: inputText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGetHistory = async () => {
    if (!backendUrl) {
      setError("Backend URL is not configured");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${backendUrl}/get_all_data`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Response Evaluator</h1>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-32 p-4 border rounded-lg"
            placeholder="Enter your text here..."
          />
          
          <div className="flex gap-4">
            <button
              onClick={handleEvaluate}
              disabled={loading || !inputText || !backendUrl}
              className="flex-1 px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Evaluating..." : "Evaluate"}
            </button>
            
            <button
              onClick={handleGetHistory}
              disabled={loading || !backendUrl}
              className="flex-1 px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "View History"}
            </button>
          </div>
        </div>

        {result && (
          <div className="p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Evaluation Results:</h2>
            <div className="space-y-2">
              <p>Gibberish Class: {result.gibberish.class}</p>
              <p>Gibberish Score: {result.gibberish.score.toFixed(2)}</p>
              <p>Hallucination Score: {result.hallucination.toFixed(2)}</p>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">History:</h2>
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="p-4 bg-white rounded border">
                  <p className="font-medium">Text: {item.sentence}</p>
                  <p>Gibberish Class: {item.gibberish_model_class}</p>
                  <p>Gibberish Score: {item.gibberish_model_score.toFixed(2)}</p>
                  <p>Hallucination Score: {item.hallucination_model_score.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
