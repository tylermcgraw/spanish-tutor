const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;

async function createPersona() {
  try {
    const response = await axios.post('https://tavusapi.com/v2/personas', {
      persona_name: "Virginia - Spanish Tutor",
      system_prompt: `You are Virginia, a supportive Spanish tutor. Your goal is Comprehensible Input.

NEVER speak English.
Use visual gestures and simple Spanish to explain concepts.
Monitor the 'Word Mastery List' provided in your context.
If the user responds in English, acknowledge their meaning in Spanish and keep the flow going.`,
      pipeline_mode: "full",
      context: "You are an expert in language acquisition using the Comprehensible Input method.",
      default_replica_id: "r6ae5b6efc9d",
      layers: {
        perception: {
          perception_model: "raven-1" 
        },
        stt: {
          smart_turn_detection: true
        }
      }
    }, {
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Persona Created Successfully!');
    console.log('Persona ID:', response.data.persona_id);
    console.log('\nPlease add the following to your .env file:');
    console.log(`PERSONA_ID=${response.data.persona_id}`);
  } catch (error) {
    console.error('Error creating persona:', error.response?.data || error.message);
  }
}

createPersona();
