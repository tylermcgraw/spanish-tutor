import { useState, useEffect, useRef, useMemo } from 'react';
import { getVocabulary, saveVocabularySession } from './api';

export interface VocabWord {
  word: string;
  exposures: number;
  score: number;
  status: 'new' | 'learning' | 'mastered';
}

export const useVocabulary = (studentId: string) => {
  const [vocabulary, setVocabulary] = useState<Record<string, VocabWord>>({});
  
  // Ref to hold latest vocabulary for auto-save interval to avoid closure staleness
  const vocabularyRef = useRef(vocabulary);
  useEffect(() => {
      vocabularyRef.current = vocabulary;
  }, [vocabulary]);

  // Derived state for stats - updates immediately when vocabulary changes
  const totalWordsLearned = useMemo(() => {
    return Object.values(vocabulary).filter(w => w.score > 5).length;
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

  const processTranscript = (text: string) => {
    if (!text) return;
    console.log(`Analyzing vocabulary in: "${text}"`);
    
    // Simple tokenizer: extract words, remove punctuation, lowercase
    // improved to handle Spanish accents
    const words = text.toLowerCase().match(/[a-záéíóúñü]+/g);
    if (!words) return;

    setVocabulary(prev => {
      const next = { ...prev };
      let changed = false;

      words.forEach(word => {
        // Skip short words (a, el, y...) for simplicity in this prototype
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
          
          // Auto-upgrade status
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

  const saveSession = async () => {
    const currentVocab = vocabularyRef.current;
    const wordsList = Object.values(currentVocab);
    
    if (wordsList.length === 0) return;

    // console.log(`Auto-saving ${wordsList.length} words...`);
    try {
        await saveVocabularySession(studentId, wordsList);
        // console.log("Session saved.");
    } catch (e) {
        console.error("Save failed", e);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        saveSession();
    }, 30000);
    return () => clearInterval(interval);
  }, [studentId]);

  return { vocabulary, totalWordsLearned, totalWordsSeen, processTranscript, saveSession };
};