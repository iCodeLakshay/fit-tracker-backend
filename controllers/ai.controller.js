import User from '../models/user.js';
import Workout from '../models/workout.js';

const sendMessage = async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in the environment variables.");
        return res.status(500).json({
            error: "AI service is not configured on the server.",
            details: "The GEMINI_API_KEY environment variable is not set on the backend server. Please ensure it is set in the .env file."
        });
    }
    try {
        const { message, conversationHistory = [] } = req.body;
        const userId = req.userId;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // Fetch user profile
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch user's recent workouts (last 5)
        const workouts = await Workout.find({ userId: userId })
            .sort({ date: -1 })
            .limit(5);

        // Summarize user profile and workouts for the prompt
        const userProfileSummary = `User Profile:\n- Username: ${user.username}\n- Weight: ${user.weight} kg\n- Height: ${user.height} cm\n- BMI: ${user.bmi}`;
        let workoutsSummary = "Recent Workouts:";
        if (workouts.length === 0) {
            workoutsSummary += "\n- No workouts logged yet.";
        } else {
            workouts.forEach((w, i) => {
                workoutsSummary += `\n${i + 1}. ${w.workoutName} (${w.bodyPart}) - ${w.sets} sets x ${w.reps} reps @ ${w.weight}kg on ${w.date.toLocaleDateString()}`;
            });
        }

        // Create fitness-focused system prompt with user data
        const systemPrompt = `You are an expert AI fitness trainer and nutritionist. Your role is to provide helpful, accurate, and motivating fitness advice.\n\nHere is the user's profile and recent workout history:\n${userProfileSummary}\n${workoutsSummary}\n\nInstructions:\n1. Give personalized workout recommendations based on user goals and history\n2. Provide nutrition and diet advice\n3. Explain proper exercise form and technique\n4. Offer motivation and support\n5. Help with goal setting and progress tracking\n6. Answer questions about fitness, health, and wellness\n\nIMPORTANT: Keep your responses to the point. Avoid unwanted explanations. Be practical and actionable. If asked about medical concerns, advise consulting a healthcare professional.\n\nUser's message: ${message}`;

        // Include conversation history for context
        let fullPrompt = systemPrompt;
        if (conversationHistory.length > 0) {
            fullPrompt += "\n\nPrevious conversation context:\n";
            conversationHistory.slice(-5).forEach(msg => {
                fullPrompt += `${msg.sender}: ${msg.content}\n`;
            });
            fullPrompt += `\nUser: ${message}`;
        }

        // Generate response using direct API call
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: fullPrompt
                        }
                    ]
                }
            ]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

        return res.status(200).json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        if (error.message && (error.message.includes('API key') || error.message.includes('permission denied'))) {
            return res.status(401).json({ 
                error: "Invalid API key or API key not configured.",
                details: "The API key provided in the backend is either invalid, expired, or does not have the necessary permissions. Please double-check the GEMINI_API_KEY in your .env file and ensure the Google AI Studio project is set up correctly."
            });
        }
        if (error.message && error.message.includes('quota')) {
            return res.status(429).json({ error: "API quota exceeded. Please try again later." });
        }
        return res.status(500).json({
            error: "Failed to generate AI response",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getConversationSuggestions = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        // Fetch user profile for context
        const user = await User.findById(userId);
        if (!user) {
            // Fallback to generic suggestions if user not found
            const genericSuggestions = [
                "Create a beginner workout plan for me",
                "What should I eat for muscle gain?",
                "How do I track my progress effectively?",
                "What exercises are best for weight loss?",
            ];
            return res.status(200).json({ success: true, suggestions: genericSuggestions });
        }

        const prompt = `Based on the following user profile, generate 4 short, engaging, and personalized questions that this user might ask their AI fitness trainer. The user's goal is to get guidance on their fitness journey.

User Profile:
- Weight: ${user.weight || 'N/A'} kg
- Height: ${user.height || 'N/A'} cm
- BMI: ${user.bmi || 'N/A'}
- Recent workouts: (Provide a summary if available, otherwise state 'No recent workouts logged')

Generate exactly 4 questions, each enclosed in double quotes and separated by a newline. Example:
"How can I improve my squat form?"
"What's a good post-workout meal for me?"
"Can you suggest a 3-day workout split?"
"How do I stay motivated on days I feel tired?"`;

        // Generate response using direct API call
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse the generated suggestions
        const suggestions = aiResponse.split('\n').map(s => s.trim().replace(/"/g, '')).filter(s => s);

        if (suggestions.length === 0) {
            // Fallback if generation fails
            throw new Error("Failed to generate suggestions from API.");
        }

        return res.status(200).json({
            success: true,
            suggestions: suggestions.slice(0, 4)
        });

    } catch (error) {
        console.error('Error getting dynamic suggestions:', error);
        // Fallback to static suggestions on error
        const fallbackSuggestions = [
            "Create a workout plan for me",
            "How can I improve my form?",
            "Nutrition advice for muscle gain",
            "I need motivation to exercise"
        ];
        return res.status(200).json({
            success: true,
            suggestions: fallbackSuggestions
        });
    }
};

export { sendMessage, getConversationSuggestions };
