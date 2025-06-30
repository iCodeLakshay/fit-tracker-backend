import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config();

import workoutRoutes from '../routes/workout.route.js';
import userRoutes from '../routes/user.route.js';
import authRoutes from "../routes/auth.route.js";


mongoose.connect(process.env.MONGODB_URL)
.then(() => { console.log("Connected to mongoDB"); })
.catch((err) => {
    console.error("Error connecting to mongoDB:", err);
});
const app = express();

// CORS origins
const DEV_ORIGIN = process.env.DEV_ORIGIN;
const PROD_ORIGIN = process.env.PROD_ORIGIN;

const ALLOWED_ORIGINS = [DEV_ORIGIN, PROD_ORIGIN];

const corsOption = {
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin))
            callback(null, true);
        else
            callback(new Error(`CORS Error : Origin ${origin} is not allowed`));
    },
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}

// Middlewares
app.use(cors(corsOption));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/user', userRoutes);

const PORT=5000;
app.listen(PORT, ()=>{
    console.log(`Server is listening to port ${PORT}`);
})
