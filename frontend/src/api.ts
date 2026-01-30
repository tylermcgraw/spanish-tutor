import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const startConversation = async (studentId: string) => {
  const response = await axios.post(`${API_BASE_URL}/conversation`, {
    student_id: studentId,
  });
  return response.data;
};

export const getVocabulary = async (studentId: string) => {
  const response = await axios.get(`${API_BASE_URL}/vocabulary/${studentId}`);
  return response.data;
};

export const saveVocabularySession = async (studentId: string, words: any[]) => {
  const response = await axios.post(`${API_BASE_URL}/vocabulary`, {
    student_id: studentId,
    words
  });
  return response.data;
};

export const trackUtterance = async (studentId: string, text: string, conversationId?: string) => {
  const response = await axios.post(`${API_BASE_URL}/track-utterance`, {
    student_id: studentId,
    text,
    conversation_id: conversationId
  });
  return response.data;
};

export const processPerception = async (data: any) => {
  const response = await axios.post(`${API_BASE_URL}/process-perception`, data);
  return response.data;
};