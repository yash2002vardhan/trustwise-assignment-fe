'use client';

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#fff' : '#000',
          font: {
            size: 12,
            family: 'system-ui'
          }
        }
      },
      title: {
        display: true,
        text: 'Model Scores Over Time',
        color: darkMode ? '#fff' : '#000',
        font: {
          size: 16,
          family: 'system-ui',
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (tooltipItems) => {
            const title = tooltipItems[0].label || '';
            return `Text: ${title}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Evaluated Text',
          color: darkMode ? '#fff' : '#000',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#000',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10,
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Scores',
          color: darkMode ? '#fff' : '#000',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#000',
        }
      },
    },
  };

  const getChartData = () => {
    return {
      labels: history.map((_, index) => `Eval ${index + 1}`),
      datasets: [
        {
          label: 'Gibberish Model Score',
          data: history.map(item => item.gibberish_model_score),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.4,
        },
        {
          label: 'Hallucination Model Score',
          data: history.map(item => item.hallucination_model_score),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.5)',
          tension: 0.4,
        },
      ],
    };
  };

  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    setDarkMode(savedTheme === 'dark');
    
    // Apply the theme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleEvaluate = async () => {
    if (!backendUrl) {
      setError("Backend URL is not configured");
      return;
    }

    try {
      setIsEvaluating(true);
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
      setIsEvaluating(false);
    }
  };

  const handleGetHistory = async () => {
    if (!backendUrl) {
      setError("Backend URL is not configured");
      return;
    }

    try {
      setIsLoadingHistory(true);
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
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] pointer-events-none"></div>
      <main className="relative max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-500 rounded-lg animate-pulse"></div>
            <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">TrustWise AI</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <svg className="w-6 h-6 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-indigo-600 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4">
            Response Evaluator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Evaluate text using our advanced Gibberish and Hallucination detection models
          </p>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 shadow-lg backdrop-blur-sm transition-all duration-300 animate-slideIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-12 transform transition-all duration-300 hover:shadow-3xl">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
            placeholder="Enter your text here for evaluation..."
          />
          
          <div className="flex gap-6 mt-8">
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !inputText || !backendUrl}
              className="flex-1 px-8 py-4 text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
            >
              {isEvaluating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Evaluating...
                </span>
              ) : "Evaluate Response"}
            </button>
            
            <button
              onClick={handleGetHistory}
              disabled={isLoadingHistory || !backendUrl}
              className="flex-1 px-8 py-4 text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
            >
              {isLoadingHistory ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading History...
                </span>
              ) : "View Evaluation History"}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-12 transform transition-all duration-300 hover:shadow-3xl animate-slideUp">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Latest Evaluation Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Gibberish Model Class</h3>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{result.gibberish.class}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">Gibberish Model Score</h3>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">{result.gibberish.score.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Hallucination Model Score</h3>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">{result.hallucination.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-12 animate-slideUp">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Score Trends</h2>
              <div className="h-[400px] w-full">
                <Line options={chartOptions} data={getChartData()} />
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Evaluation History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Evaluation #</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Evaluated Text</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Gibberish Model Class</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Gibberish Model Score</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Hallucination Model Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {history.map((item, index) => (
                      <tr 
                        key={index}
                        className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-300 shadow-sm">
                            Eval {index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-md">
                            <p className="text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                              {item.sentence}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-800 dark:text-blue-300 shadow-sm">
                            {item.gibberish_model_class}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 dark:text-white text-sm font-medium">
                            {item.gibberish_model_score.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 dark:text-white text-sm font-medium">
                            {item.hallucination_model_score.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
