const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Image = require('../models/Image');
const Video = require('../models/Video');
const Document = require('../models/Document');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// AI Chatbot endpoint
router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;

    // Try ChatGPT first, fallback to simple response
    let response;
    let isAI = false;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI assistant for a file storage application." },
          { role: "user", content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      response = completion.choices[0].message.content;
      isAI = true;
    } catch (error) {
      console.log('ChatGPT failed, using fallback:', error.message);
      response = "Hello! I'm here to help you with file management. How can I assist you today?";
      isAI = false;
    }

    res.json({
      success: true,
      response: response,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'What file types are supported?'],
      isAI: isAI
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

module.exports = router;