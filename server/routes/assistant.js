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
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'You are an intelligent AI assistant that speaks naturally and completes voice-driven tasks.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 600,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      answer = openaiResponse.data.choices?.[0]?.message?.content || 'I could not generate a response.';
    }

    res.json({ answer });
  } catch (error) {
    console.error('Assistant query error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to get assistant response.' });
  }
});

module.exports = router;
