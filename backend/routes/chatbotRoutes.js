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
  apiKey: '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'
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

// Get user file statistics
async function getUserFileStats(userId) {
  try {
    const [images, videos, documents] = await Promise.all([
      Image.find({ user: userId }),
      Video.find({ user: userId }),
      Document.find({ user: userId })
    ]);

    const totalFiles = images.length + videos.length + documents.length;
    const totalSize = [...images, ...videos, ...documents].reduce((sum, file) => sum + file.size, 0);
    
    return {
      totalFiles,
      totalSize,
      images: images.length,
      videos: videos.length,
      documents: documents.length,
      recentUploads: [...images, ...videos, ...documents]
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { totalFiles: 0, totalSize: 0, images: 0, videos: 0, documents: 0, recentUploads: [] };
  }
}

// ChatGPT Response Generator
async function generateChatGPTResponse(message, userStats, context) {
  const systemPrompt = `You are an AI assistant for a file storage and management application. You help users with:

1. File uploads (images, videos, documents)
2. Storage management and usage
3. File organization and search
4. Account settings and profile management
5. General file management questions

Current user context:
- Total files: ${userStats.totalFiles}
- Total storage used: ${(userStats.totalSize / (1024 * 1024)).toFixed(2)} MB
- Images: ${userStats.images}
- Videos: ${userStats.videos}
- Documents: ${userStats.documents}
- Recent uploads: ${userStats.recentUploads.map(f => f.originalName).join(', ')}

Be helpful, friendly, and provide specific, actionable advice. Use emojis and formatting to make responses engaging. Keep responses concise but informative.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const aiResponse = completion.choices[0].message.content;

  // Generate contextual suggestions based on the response
  const suggestions = generateContextualSuggestions(message, userStats);

  return {
    message: aiResponse,
    suggestions: suggestions
  };
}

// Fallback Response Generator (existing rule-based system)
async function generateFallbackResponse(message, userStats, context) {
  const lowerMessage = message.toLowerCase();
  
  // File upload help
  if (lowerMessage.includes('upload') || lowerMessage.includes('how to upload')) {
    return {
      message: `I can help you upload files! Here's how:

📁 **Images**: Go to the Upload page and drag & drop or click to select image files (JPG, PNG, GIF, etc.)
🎥 **Videos**: Visit the Videos page for video uploads (MP4, AVI, MOV, etc.)
📄 **Documents**: Use the Documents page for PDFs, Word docs, Excel files, and more

**Supported formats:**
• Images: JPG, PNG, GIF, WEBP, SVG
• Videos: MP4, AVI, MOV, WMV, FLV
• Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP

Just drag your files onto the upload area or click to browse!`,
      suggestions: ['Show me my storage usage', 'What file types are supported?', 'How do I organize my files?']
    };
  }

  // Storage usage
  if (lowerMessage.includes('storage') || lowerMessage.includes('usage') || lowerMessage.includes('space')) {
    const sizeInMB = (userStats.totalSize / (1024 * 1024)).toFixed(2);
    const sizeInGB = (userStats.totalSize / (1024 * 1024 * 1024)).toFixed(2);
    const sizeDisplay = userStats.totalSize > 1024 * 1024 * 1024 ? `${sizeInGB} GB` : `${sizeInMB} MB`;
    
    return {
      message: `📊 **Your Storage Summary:**

📁 **Total Files**: ${userStats.totalFiles}
💾 **Total Size**: ${sizeDisplay}
🖼️ **Images**: ${userStats.images}
🎥 **Videos**: ${userStats.videos}
📄 **Documents**: ${userStats.documents}

${userStats.recentUploads.length > 0 ? `\n**Recent Uploads:**\n${userStats.recentUploads.slice(0, 3).map(file => `• ${file.originalName}`).join('\n')}` : ''}

You're doing great with your file organization! 🎉`,
      suggestions: ['How do I upload files?', 'What file types are supported?', 'How do I delete files?']
    };
  }

  // File types
  if (lowerMessage.includes('file type') || lowerMessage.includes('supported') || lowerMessage.includes('format')) {
    return {
      message: `📋 **Supported File Types:**

🖼️ **Images:**
• JPG, JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF

🎥 **Videos:**
• MP4, AVI, MOV, WMV, FLV, MKV, WebM, 3GP

📄 **Documents:**
• PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
• TXT, RTF, CSV, ZIP, RAR, 7Z

**Maximum file size**: 100MB per file
**Total storage**: Unlimited (within reasonable limits)

If you have a file type not listed, let me know and I can help!`,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'How do I organize files?']
    };
  }

  // File organization
  if (lowerMessage.includes('organize') || lowerMessage.includes('organise') || lowerMessage.includes('sort')) {
    return {
      message: `🗂️ **File Organization Tips:**

📁 **By Type**: Your files are automatically organized by type (Images, Videos, Documents)
📅 **By Date**: Files are sorted by upload date (newest first)
🔍 **Search**: Use the search function to find specific files quickly
🏷️ **Naming**: Use descriptive names for easier file management

**Pro Tips:**
• Create folders on your device before uploading for better organization
• Use consistent naming conventions
• Regularly clean up old or duplicate files

Would you like me to show you how to search for specific files?`,
      suggestions: ['How do I search files?', 'Show me my storage usage', 'How do I delete files?']
    };
  }

  // File deletion
  if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    return {
      message: `🗑️ **How to Delete Files:**

1. **Navigate** to the file type page (Images, Videos, or Documents)
2. **Find** the file you want to delete
3. **Click** the delete button (🗑️) next to the file
4. **Confirm** the deletion when prompted

⚠️ **Important**: Deleted files cannot be recovered, so make sure you want to delete them!

**Bulk Delete**: You can select multiple files and delete them at once for faster cleanup.`,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'How do I organize files?']
    };
  }

  // File search
  if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
    return {
      message: `🔍 **How to Search Files:**

1. **Go** to any file type page (Images, Videos, or Documents)
2. **Look** for the search bar at the top
3. **Type** the filename or part of the name
4. **Results** will appear instantly as you type

**Search Tips:**
• Search is case-insensitive
• You can search by file extension (e.g., ".pdf")
• Partial matches work (e.g., "report" will find "report.pdf", "monthly_report.docx")

The search works across all your files for quick access!`,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'How do I organize files?']
    };
  }

  // Profile/account help
  if (lowerMessage.includes('profile') || lowerMessage.includes('account') || lowerMessage.includes('settings')) {
    return {
      message: `👤 **Profile & Account Settings:**

**Profile Picture:**
• Click your profile picture in the top-right corner
• Upload a new image or crop existing one
• Supported formats: JPG, PNG, GIF

**Account Info:**
• Update your name and email
• Change your password
• View your storage usage

**Security:**
• Your data is encrypted and secure
• Regular backups are performed
• You can export your data anytime

Need help with anything specific in your profile?`,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'What file types are supported?']
    };
  }

  // General help
  if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return {
      message: `🤖 **How can I help you?**

I'm your AI assistant for file management! Here are some things I can help with:

📁 **File Management**: Upload, organize, search, and delete files
💾 **Storage Info**: Check your storage usage and file statistics
📋 **File Types**: Learn about supported formats and size limits
👤 **Account**: Profile settings and account management
🔧 **Troubleshooting**: Common issues and solutions

Just ask me anything about your files or the platform!`,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'What file types are supported?']
    };
  }

  // Greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      message: `Hello! 👋 I'm your AI assistant for file management. 

I can help you with:
• 📁 Uploading and organizing files
• 💾 Checking storage usage
• 🔍 Finding specific files
• 📋 Understanding supported formats
• 👤 Managing your profile

What would you like to know about?`,
      suggestions: ['How do I upload files?', 'Show me my storage usage', 'What file types are supported?']
    };
  }

  // Default response
  return {
    message: `I'm not sure I understood that. 🤔 

Here are some things I can help you with:
• 📁 File uploads and management
• 💾 Storage usage and statistics
• 🔍 Finding and organizing files
• 📋 Supported file types
• 👤 Account and profile settings

Try asking me about uploading files, checking storage, or file organization!`,
    suggestions: ['How do I upload files?', 'Show me my storage usage', 'What file types are supported?']
  };
}

// Generate contextual suggestions based on user's current state
function generateContextualSuggestions(message, userStats) {
  const suggestions = [];
  
  if (userStats.totalFiles === 0) {
    suggestions.push('How do I upload files?', 'What file types are supported?');
  } else if (userStats.totalFiles > 10) {
    suggestions.push('How do I organize files?', 'Show me my storage usage');
  } else {
    suggestions.push('How do I upload files?', 'Show me my storage usage');
  }
  
  if (userStats.totalSize > 100 * 1024 * 1024) { // More than 100MB
    suggestions.push('How do I delete files?', 'Storage optimization tips');
  }
  
  // Ensure we always have at least 3 suggestions
  while (suggestions.length < 3) {
    suggestions.push('What file types are supported?');
  }
  
  return suggestions.slice(0, 3);
}

module.exports = router; 