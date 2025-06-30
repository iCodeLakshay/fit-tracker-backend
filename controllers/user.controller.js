import User from "../models/user.js";

const getUserProfile = async (req, res) => {
    try {
        // If this is the /profile endpoint (no id parameter), use the userId from the token
        const userId = req.params.id || req.userId;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        
        const user = await User.findById(userId).populate('workouts');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const createUser = async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        return res.status(201).json(newUser);
    } catch (error) {
        return res.status(500).json({ message: "Error creating user", error: error.message });
    }
}

const updateBodyMetrics = async (req, res) => {
    try {
        const { id } = req.params;
        const { weight, height, bmi } = req.body;

        const user = await User.findByIdAndUpdate(id, { weight, height, bmi }, { new: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export { getUserProfile, createUser, updateBodyMetrics }