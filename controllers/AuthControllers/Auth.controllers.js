import User from "../../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name:username,
            email,
            password: hashedPassword,
        });

        await user.save();

        res.status(201).json({ message: 'User registered successfully.', user});
    } catch (err) {
        console.log("error in resgister",err)
        res.status(500).json({ message: 'Server error.'});
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        console.log("Token :: ", token);
        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};