import { Request, Response } from "express";
import User from "../models/user";
import Post from "../models/post";
import Comment from "../models/comment";

// Create a new user
const createUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                error: "Username, email, and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                error: "User with this email or username already exists"
            });
        }

        // Create new user (password will be hashed automatically by the model)
        const user = await User.create({
            username,
            email,
            password
        });

        // Return user without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Get all users
const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Find all users but exclude password field
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Get user by ID
const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Update user by ID
const updateUserById = async (req: Request, res: Response) => {
    try {
        // Check if user is updating their own profile
        if (req.params.userId !== (req as any).user.userId) {
            return res.status(403).json({
                error: "You can only update your own profile"
            });
        }

        const { username, email, firstName, lastName, bio } = req.body;

        // Don't allow password updates through this endpoint
        const updateData: any = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Delete user by ID
const deleteUserById = async (req: Request, res: Response) => {
    try {
        // Check if user is deleting their own account
        if (req.params.userId !== (req as any).user.userId) {
            return res.status(403).json({
                error: "You can only delete your own account"
            });
        }

        const user = await User.findByIdAndDelete(req.params.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "User deleted successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Get all posts by a specific user
const getUserPosts = async (req: Request, res: Response) => {
    try {
        const posts = await Post.find({ userId: req.params.userId }).populate('userId', 'username email');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Get all comments by a specific user
const getUserComments = async (req: Request, res: Response) => {
    try {
        const comments = await Comment.find({ userId: req.params.userId }).populate('userId', 'username email');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export default {
    createUser,
    getAllUsers,
    getUserById,
    getUserPosts,
    getUserComments,
    updateUserById,
    deleteUserById
};
