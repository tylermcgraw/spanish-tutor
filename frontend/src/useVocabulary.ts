import { useState, useEffect, useMemo } from 'react';
import { getVocabulary, trackUtterance } from './api';

export interface VocabWord {
  word: string;
  exposures: number;
  score: number;
  status: 'new' | 'learning' | 'mastered';
}

export const useVocabulary = (studentId: string) => {
  const [vocabulary, setVocabulary] = useState<Record<string, VocabWord>>({});
  
  // Derived state for stats - updates immediately when vocabulary changes
  const totalWordsLearned = useMemo(() => {
    return Object.values(vocabulary).filter(w => w.score > 1).length;
  }, [vocabulary]);

  const totalWordsSeen = useMemo(() => Object.keys(vocabulary).length, [vocabulary]);
  
  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVocabulary(studentId);
        const vocabMap: Record<string, VocabWord> = {};
        if (Array.isArray(data)) {
            data.forEach((item: any) => {
              vocabMap[item.word] = {
                word: item.word,
                exposures: item.exposures,
                score: item.score,
                status: item.status
              };
            });
        }
        setVocabulary(vocabMap);
      } catch (e) {
        console.error("Failed to load vocabulary", e);
      }
    };
    load();
  }, [studentId]);

  const processTranscript = (text: string, conversationId?: string) => {
    if (!text) return;
    // console.log(`Analyzing vocabulary in: "${text}"`);
    
    // 1. Send to Backend for persistence (Real-time)
    trackUtterance(studentId, text, conversationId).catch(err => 
      console.error("Failed to track utterance", err)
    );

    // 2. Optimistic UI Update (Keep local state in sync for stats)
    const words = text.toLowerCase().match(/[a-záéíóúñü]+/g);
    if (!words) return;

    setVocabulary(prev => {
      const next = { ...prev };
      let changed = false;

      words.forEach(word => {
        if (word.length < 3) return; 

        if (!next[word]) {
          next[word] = { word, exposures: 1, score: 0.1, status: 'new' };
          changed = true;
        } else {
          next[word] = {
            ...next[word],
            exposures: next[word].exposures + 1,
            score: next[word].score + 0.1
          };
          
          if (next[word].score > 5 && next[word].status !== 'mastered') {
            next[word].status = 'mastered';
          } else if (next[word].score > 1 && next[word].status === 'new') {
            next[word].status = 'learning';
          }
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  };

  return { vocabulary, totalWordsLearned, totalWordsSeen, processTranscript };
};
