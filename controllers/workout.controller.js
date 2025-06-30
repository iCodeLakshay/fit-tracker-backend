import Workout from '../models/workout.js';
import User from '../models/user.js';

const getAllWorkouts = async(req, res) => {
    try {
        // Get userId from the authenticated user
        const userId = req.userId;
        
        // Filter workouts by userId if available
        const query = userId ? { userId } : {};
        
        const workouts = await Workout.find(query);
        return res.status(200).json(workouts);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching workouts", error: error.message });
    }
}

const createWorkout = async(req, res) => {
    try {
        const newWorkout = new Workout(req.body);
        await newWorkout.save();
        console.log('New workout created:', newWorkout);
        
        // Automatically add the workout to the user's workouts array
        await User.findByIdAndUpdate(
            req.body.userId,
            { $push: { workouts: newWorkout._id } },
            { new: true }
        );
        
        return res.status(201).json(newWorkout);
    } catch (error) {
        return res.status(500).json({ message: "Error creating workout", error: error.message });
    }
}

const deleteWorkout = async(req, res) => {
    try {
        const { id } = req.params;
        const workout = await Workout.findByIdAndDelete(id);
        
        if (workout) {
            // Remove the workout from the user's workouts array
            await User.findByIdAndUpdate(
                workout.userId,
                { $pull: { workouts: id } },
                { new: true }
            );
        }
        
        return res.status(200).json({ message: "Workout deleted successfully", workout });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting workout" });
    }
}

const updateWorkout = async(req, res) => {
    try {
        const { id } = req.params;
        const updatedWorkout = await Workout.findByIdAndUpdate(id, req.body, { new: true });
        
        if (!updatedWorkout) {
            return res.status(404).json({ message: "Workout not found" });
        }
        
        return res.status(200).json(updatedWorkout);
    } catch (error) {
        return res.status(500).json({ message: "Error updating workout", error: error.message });
    }
}

export { getAllWorkouts, createWorkout, deleteWorkout, updateWorkout };