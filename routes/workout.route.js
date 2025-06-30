import express from 'express'
import { getAllWorkouts, createWorkout, deleteWorkout } from '../controllers/workout.controller.js';
import { requireAuth } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/all-workouts', requireAuth, getAllWorkouts);
router.post('/', requireAuth, createWorkout);
router.delete('/:id', requireAuth, deleteWorkout);

export default router;