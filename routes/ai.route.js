import express from 'express';
import { sendMessage, getConversationSuggestions } from '../controllers/ai.controller.js';
import { requireAuth } from '../controllers/auth.controller.js';

const router = express.Router();

// POST /api/ai/chat - Send message to AI trainer
router.post('/chat', requireAuth, sendMessage);

// GET /api/ai/suggestions - Get conversation suggestions
router.get('/suggestions', requireAuth, getConversationSuggestions);

export default router;
