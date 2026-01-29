import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall } from '@daily-co/daily-js';

interface VideoPlayerProps {
  conversationUrl: string;
  onLeave: () => void;
  onAppMessage?: (message: any) => void;
  onCallReady?: (callObject: DailyCall) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ conversationUrl, onLeave, onAppMessage, onCallReady }) => {
  const callWrapperRef = useRef<HTMLDivElement>(null);
  const callInstanceRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    if (!callWrapperRef.current || !conversationUrl) return;
    if (callInstanceRef.current) return; // Prevent duplicate initialization

    const newCallObject = DailyIframe.createFrame(callWrapperRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
    });

    callInstanceRef.current = newCallObject;

    newCallObject.join({ url: conversationUrl });
    
    if (onCallReady) {
      onCallReady(newCallObject);
    }

    newCallObject.on('left-meeting', () => {
      // Handle leave logic
      // Note: destroy() is handled in cleanup or here if needed, 
      // but usually better to let the parent unmount this component.
      // If we destroy here, we should update the ref.
      onLeave();
    });

    if (onAppMessage) {
      newCallObject.on('app-message', (event) => {
          onAppMessage(event);
      });
    }

    return () => {
      // Cleanup
      if (callInstanceRef.current) {
        callInstanceRef.current.destroy();
        callInstanceRef.current = null;
      }
    };
  }, [conversationUrl]); // Dependencies

  return (
    <div className="w-full h-full min-h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl relative" ref={callWrapperRef}>
      {/* Video frame will be injected here */}
    </div>
  );
};

export default VideoPlayer;
