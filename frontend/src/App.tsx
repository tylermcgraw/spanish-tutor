import { useState, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import StatsOverlay from './StatsOverlay';
import { startConversation } from './api';
import type { DailyCall } from '@daily-co/daily-js';

function App() {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  
  // Session State
  const [difficulty, setDifficulty] = useState('Normal');
  const [wordsLearned, setWordsLearned] = useState(12); // Mock initial value
  const [userState, setUserState] = useState('engaged');

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startConversation('tyler_123');
      if (data.conversation_url) {
        setConversationUrl(data.conversation_url);
      } else {
        setError('Failed to retrieve conversation URL.');
      }
    } catch (err) {
      console.error(err);
      setError('Error starting session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    setConversationUrl(null);
    setCallObject(null);
  };

  const handleCallReady = (co: DailyCall) => {
    setCallObject(co);
  };

  const handleAppMessage = (event: any) => {
    console.log('App Message:', event);
    // Mocking Raven logic: assuming event.data contains perception
    if (event.data && event.data.type === 'perception') {
        const state = event.data.user_state;
        setUserState(state);
        
        if (state === 'confused' || state === 'gaze_averting') {
            triggerConfusionHandler();
        }
    }
  };

  const triggerConfusionHandler = () => {
      // Logic to simplify language
      setDifficulty('Easy');
      console.log("User confused! Sending signal to Tavus...");
      
      // In a real app, send message to Tavus
      if (callObject) {
          callObject.sendAppMessage({
              type: 'context_update',
              instruction: "User looks lost. Simplify vocabulary for the next 3 turns.",
          });
      }

      // Debounce/Reset after a few seconds
      setTimeout(() => {
          setDifficulty('Normal'); // Reset or keep it easy depending on logic
      }, 5000);
  };

  // Debug function to simulate Tavus sending a perception event
  const simulateConfusion = () => {
      handleAppMessage({
          data: { type: 'perception', user_state: 'confused' }
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <header className="p-6 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Spanish Tutor AI
        </h1>
        <div className="flex items-center gap-4">
            <button 
                onClick={simulateConfusion}
                className="text-xs px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
            >
                Debug: Trigger Confusion
            </button>
            <div className="text-sm text-gray-400">
            Student: Tyler
            </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {conversationUrl ? (
          <div className="w-full max-w-5xl h-[80vh] relative">
            <VideoPlayer 
              conversationUrl={conversationUrl} 
              onLeave={handleLeave}
              onAppMessage={handleAppMessage}
              onCallReady={handleCallReady}
            />
            <StatsOverlay 
                difficulty={difficulty} 
                wordsLearned={wordsLearned}
                userState={userState}
            />
          </div>
        ) : (
          <div className="text-center space-y-6 max-w-lg">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Ready to practice?
            </h2>
            <p className="text-xl text-gray-400">
              Start a real-time video session with Virginia, your AI Spanish tutor.
            </p>
            
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartSession}
              disabled={loading}
              className={`
                px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all
                ${loading 
                  ? 'bg-gray-700 cursor-not-allowed opacity-75' 
                  : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                "Start Lesson"
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;