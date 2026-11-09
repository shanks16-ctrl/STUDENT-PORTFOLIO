
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = 3000;
const JWT_SECRET = "student_portfolio_secret_key";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/studentPortfolioDB")
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log("MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("User", userSchema);

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    skills: String,
    link: String
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        req.user = user;
        next();
    });
}

// Register
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "Registration successful. Please login."
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed."
        });
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { id: user._id },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful.",
            token,
            name: user.name
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed."
        });
    }
});

// Add Portfolio Item
app.post("/portfolio", authenticateToken, async (req, res) => {
    try {
        const { title, description, skills, link } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Portfolio title is required."
            });
        }

        const portfolio = new Portfolio({
            userId: req.user.id,
            title,
            description,
            skills,
            link
        });

        await portfolio.save();

        res.status(201).json({
            message: "Portfolio item added successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Could not add portfolio item."
        });
    }
});

// View Portfolio Items
app.get("/portfolio", authenticateToken, async (req, res) => {
    try {
        const items = await Portfolio.find({
            userId: req.user.id
        });

        res.json(items);

    } catch (error) {
        res.status(500).json({
            message: "Could not fetch portfolio items."
        });
    }
});

// Update Portfolio Item
app.put("/portfolio/:id", authenticateToken, async (req, res) => {
    try {
        const { title, description, skills, link } = req.body;

        const updatedItem = await Portfolio.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.user.id
            },
            { title, description, skills, link },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: "Portfolio item not found."
            });
        }

        res.json({
            message: "Portfolio item updated successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Could not update portfolio item."
        });
    }
});

// Delete Portfolio Item
app.delete("/portfolio/:id", authenticateToken, async (req, res) => {
    try {
        const deletedItem = await Portfolio.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!deletedItem) {
            return res.status(404).json({
                message: "Portfolio item not found."
            });
        }

        res.json({
            message: "Portfolio item deleted successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Could not delete portfolio item."
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
