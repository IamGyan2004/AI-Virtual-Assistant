const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/query', auth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    let answer;

    if (!apiKey) {
      console.warn('Gemini API key missing; returning demo response.');
      answer = `Demo assistant response for: "${prompt}". Add GEMINI_API_KEY to the server .env for real Gemini answers.`;
    } else {
      // Using Google Generative AI (Gemini) API with gemini-flash-latest
      const systemPrompt = 'You are an intelligent AI assistant that speaks naturally and completes voice-driven tasks.';
      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
      
      const geminiResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
        {
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
        }
      );

      answer = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
    }

    res.json({ answer });
  } catch (error) {
    console.error('Assistant query error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to get assistant response.' });
  }
});

module.exports = router;
