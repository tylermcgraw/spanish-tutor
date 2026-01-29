import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const startConversation = async (studentId: string) => {
  const response = await axios.post(`${API_BASE_URL}/conversation`, {
    student_id: studentId,
  });
  return response.data;
};
