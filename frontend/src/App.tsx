import { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import StatsOverlay from './StatsOverlay';
import { startConversation } from './api';
import { useVocabulary } from './useVocabulary';
import type { DailyCall } from '@daily-co/daily-js';

function App() {
  const STUDENT_ID = 'tyler_123';
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  
  // Adaptive Engine
  const { totalWordsLearned, totalWordsSeen, processTranscript } = useVocabulary(STUDENT_ID);
  
  // Session State
  const [lastEventDebug, setLastEventDebug] = useState<string>('');

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startConversation(STUDENT_ID);
      if (data.conversation_url) {
        setConversationUrl(data.conversation_url);
        setConversationId(data.conversation_id);
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
    setConversationId(undefined);
    setCallObject(null);
  };

  const handleCallReady = (co: DailyCall) => {
    setCallObject(co);
  };

  const handleAppMessage = (event: any) => {
    let data = event.data;
    
    // Robust parsing: sometimes data is stringified JSON
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.warn("Received non-JSON app-message:", data);
        }
    }
    
    setLastEventDebug(JSON.stringify(data).slice(0, 100)); // Debug view

    if (!data) return;

    console.log(`[Tavus Event] ${data.event_type}`, data);

    // 0. Handle Perception Tool Calls (Raven-0)
    // Perception tools usually arrive as 'perception.tool_call' or similar
    const isToolCall = data.event_type?.includes('tool_call') || data.event_type === 'conversation.tool_call';
    
    if (isToolCall) {
        console.log(">>> TOOL EVENT RECEIVED:", data);
        const toolName = data.properties?.name || data.tool_name;
        
        if (toolName === 'notify_if_user_confused') {
            console.log("!!! Perception Tool Triggered: User looks confused !!!");
            triggerConfusionHandler();
        }
    }

    // 1. Handle Perception (Legacy/Raven-1 style)
    if (data.event_type === 'perception') {
        const state = data.user_state || 'engaged';
        
        if (state === 'confused' || state === 'gaze_averting') {
            triggerConfusionHandler();
        }
    }

    // 2. Handle Transcript (Replica Speech)
    const isTranscriptEvent = data.event_type === 'conversation.utterance';

    const transcriptText = data.properties?.speech;
    const role = data.properties?.role;

    if (isTranscriptEvent && transcriptText && role === 'replica') {
        console.log("Processing transcript:", transcriptText);
        processTranscript(transcriptText, conversationId);
    }
  };

  const triggerConfusionHandler = () => {
      console.log("User confused! Sending signal to Tavus...");
      
      if (callObject) {
          callObject.sendAppMessage({
              type: 'context_update', // Custom type defined by us/Tavus conventions
              // Sending a system instruction to the persona
              content: "[System Instruction: User looks confused. Rephrase the last point simply using basic vocabulary. Speak slowly. Do not switch to English.]",
              role: 'system' 
          });
      }
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
            <div className="text-xs font-mono text-gray-500 max-w-xs truncate" title={lastEventDebug}>
              Last Evt: {lastEventDebug || "None"}
            </div>
            <div className="text-sm text-gray-400">
            Student: {STUDENT_ID}
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
                totalWordsLearned={totalWordsLearned}
                totalWordsSeen={totalWordsSeen}
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
