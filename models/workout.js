import mongoose from "mongoose";

const workoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workoutName: { type: String, required: true },
    bodyPart: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    weight: { type: Number, required: true },
    date: { type: Date, default: Date.now },
})

export default mongoose.model("Workout", workoutSchema);