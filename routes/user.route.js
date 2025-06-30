import express from 'express'
import { getUserProfile, createUser, updateBodyMetrics } from '../controllers/user.controller.js';
import { requireAuth } from "../controllers/auth.controller.js";

const router = express.Router();

router.get('/profile', requireAuth, getUserProfile);
router.post('/', createUser);
router.patch('/:id', updateBodyMetrics);
router.get("/:id", requireAuth, getUserProfile);

export default router;