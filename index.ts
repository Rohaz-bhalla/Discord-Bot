// index.js
import { Client, GatewayIntentBits } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check tokens
const discordToken = process.env.DISCORD_BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!discordToken || !geminiApiKey) {
  console.error('Missing DISCORD_BOT_TOKEN or GEMINI_API_KEY in .env.local');
  process.exit(1);
}

// Initialize Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Function to ask Gemini
async function askGemini(prompt : string) {
  try {
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];

    const response = await ai.models.generateContentStream({
      model: 'gemma-3-27b-it',
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      fullText += chunk.text ?? '';
    }

    return fullText.trim().slice(0, 2000); // Discord max limit
  } catch (err) {
    console.error('Gemini Error:', err);
    return 'Something went wrong while asking Gemini.';
  }
}

// When bot is ready
client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
});

// On message received
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!ask')) {
    const prompt = message.content.slice(4).trim();

    if (!prompt) {
      return message.reply('Please write something after `!ask`');
    }

    await message.channel.sendTyping();
    const reply = await askGemini(prompt);
    message.reply(reply);
  }
});

// Start bot
client.login(discordToken);
