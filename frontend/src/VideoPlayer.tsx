import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall } from '@daily-co/daily-js';
import { DailyProvider, useDailyEvent } from '@daily-co/daily-react';

interface VideoPlayerProps {
  conversationUrl: string;
  onLeave: () => void;
  onAppMessage?: (message: any) => void;
  onCallReady?: (callObject: DailyCall) => void;
}

// Inner component to handle events using Daily hooks
const TavusEvents: React.FC<{ onAppMessage?: (msg: any) => void }> = ({ onAppMessage }) => {
  useDailyEvent(
    'app-message',
    React.useCallback((event) => {
      if (onAppMessage) {
        onAppMessage(event);
      }
    }, [onAppMessage])
  );
  return null;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ conversationUrl, onLeave, onAppMessage, onCallReady }) => {
  const callWrapperRef = useRef<HTMLDivElement>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);

  useEffect(() => {
    if (!callWrapperRef.current || !conversationUrl) return;

    // ROBUST FIX: Check if an iframe already exists in the container
    const existingFrame = callWrapperRef.current.querySelector('iframe');
    if (existingFrame) {
        // If frame exists, we assume the callObject is already attached/managed by Daily
        // or we are in a double-mount race. We skip creation.
        return;
    }

    const newCallObject = DailyIframe.createFrame(callWrapperRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
    });

    // Notify parent
    if (onCallReady) {
      onCallReady(newCallObject);
    }

    newCallObject.join({ url: conversationUrl });

    // Handle Leave
    newCallObject.on('left-meeting', () => {
       // We don't destroy immediately here to allow DailyProvider to cleanup?
       // Actually, we should let the parent unmount us.
       onLeave();
    });

    setCallObject(newCallObject);

    return () => {
      // Cleanup
      try {
          newCallObject.destroy();
      } catch (e) {
          console.warn("Error destroying Daily object:", e);
      }
    };
  }, [conversationUrl]);

  return (
    <div className="w-full h-full min-h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl relative" ref={callWrapperRef}>
        {callObject && (
            <DailyProvider callObject={callObject}>
                <TavusEvents onAppMessage={onAppMessage} />
            </DailyProvider>
        )}
    </div>
  );
};

export default VideoPlayer;