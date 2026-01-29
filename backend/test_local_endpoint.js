const axios = require('axios');

async function testConversation() {
  try {
    console.log('Sending request to localhost:3001...');
    const response = await axios.post('http://localhost:3001/api/conversation', {
      student_id: 'tyler_123'
    });
    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testConversation();
