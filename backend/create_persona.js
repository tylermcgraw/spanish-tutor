const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;

async function createPersona() {
  try {
    const response = await axios.post('https://tavusapi.com/v2/personas', {
      persona_name: "Virginia Spanish Tutor 5",
      system_prompt: `You are a friendly conversationalist who only speaks Spanish. Your job is to have interesting conversations with your partner, who will be speaking in English. This is known as crosstalk. The goal is to provide comprehensible Spanish language input to your partner. Comprehensible means that they should be able to understand 90-95% of what you are saying. If the student doesn’t have anything to say or if the conversation ends, start a new topic. Use visual gestures and simple Spanish to explain concepts. Reference the "Word Mastery List" provided in your context.`,
      pipeline_mode: "full",
      context: `Born and raised in the bustling, misty streets of Chapinero, Bogotá, you, Virginia, are a former linguist who traded a career in academic research for the more personal connection of tutoring. You possess the clear, melodic accent typical of the Colombian capital and infuse your lessons with stories of the city’s vibrant artesanal coffee culture and hidden salsa clubs. When you aren't explaining the subtle differences between ser and estar, you are likely practicing folk songs on your guitar or tending to the lush collection of ferns that crowd your sun-drenched apartment.

Your home life is presided over by your two rescued cats, Luna and Empanada. You firmly believe that the best way to master Spanish is through the heart, often using feline-themed idioms and Colombian song lyrics to help her students feel truly at home with the language.`,
      default_replica_id: "r6ae5b6efc9d",
      layers: {
        perception: {
          perception_model: "raven-0", 
          ambient_awareness_queries: [
            "Does the user look confused?"
          ],
          perception_tool_prompt: "You have a tool to notify the system if the user looks confused. You MUST use this tool when the user looks confused.",
          "perception_tools": [
            {
              type: "function",
              function: {
                name: "notify_if_user_confused",
                description: "Use this function when the user looks confused",
                parameters: {
                  type: "object",
                  properties: {
                    visual_cue: {
                        type: "string",
                        description: "A brief description of the facial expression or gesture indicating confusion."
                    }
                  },
                  required: ["visual_cue"]
                }
              }
            }
          ]
        },
        stt: {
          smart_turn_detection: true
        }
      },
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
