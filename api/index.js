import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefra';
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

// Database connection
mongoose.connect('mongodb+srv://adivannakarthikeya:3Mfhj9Hfgue2eAwQ@cluster0.f36iq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

app.get('/test', (req, res) => {
    res.json('test ok');
});

// Register route
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const userDoc = await User.create({
            name,
            email,
            password: hashedPassword, // Store the hashed password
        });
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (userDoc) {
        const isPasswordValid = bcrypt.compareSync(password, userDoc.password);
        if (isPasswordValid) {
            jwt.sign(
                { email: userDoc.email, id: userDoc._id },
                jwtSecret,
                {},
                (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token).json(userDoc);
                }
            );
        } else {
            res.status(422).json('Password incorrect');
        }
    } else {
        res.status(404).json('User not found');
    }
});

// Profile route
app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, id: _id });
        });
    } else {
        res.json(null);
    }
});

app.post('/logout',(req,res) => {
   res.cookie('token','').json(true);
});

app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000');
});
