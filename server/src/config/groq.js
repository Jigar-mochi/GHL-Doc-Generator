import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables');
}

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groqClient;
