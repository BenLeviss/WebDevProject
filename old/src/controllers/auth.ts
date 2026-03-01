import { Request, Response } from "express";
import User from "../models/user";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from "../utils/jwt";

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req: Request, res: Response) => {
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

        // Create new user (password will be hashed automatically)
        const user = await User.create({
            username,
            email,
            password,
            refreshTokens: []
        });

        // Generate tokens
        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Initialize tokens array if needed, then add refresh token
        if (!user.refreshTokens) {
            user.refreshTokens = [];
        }
        (user.refreshTokens as string[]).push(refreshToken);
        await user.save();

        // Return tokens and user info (exclude password and refresh tokens)
        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Verify password using the model's comparePassword method
        const isPasswordValid = await (user as any).comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Generate tokens
        const tokenPayload = {
            userId: String(user._id),
            username: user.username as string,
            email: user.email as string
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Add refresh token to user's array
        if (!user.refreshTokens) {
            user.refreshTokens = [];
        }
        (user.refreshTokens as string[]).push(refreshToken);
        await user.save();

        // Return tokens and user info
        res.json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Logout user (remove refresh token from user's array)
 * POST /auth/logout
 * Requires refresh token in Authorization header
 */
const logout = async (req: Request, res: Response) => {
    try {
        // Get token from Authorization header
        const authHeaders = req.headers['authorization'];
        const token = authHeaders && authHeaders.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: "Refresh token is required in Authorization header"
            });
        }

        // Verify the token first to get the userId
        const decoded = verifyRefreshToken(token);

        if (!decoded) {
            return res.status(403).json({
                error: "Invalid refresh token"
            });
        }

        // Find user and remove the refresh token from array
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(403).json({
                error: "User not found"
            });
        }

        // Security: Check if token exists in user's array
        // If not, it might be a stolen token - invalidate all tokens
        if (!user.refreshTokens || !(user.refreshTokens as string[]).includes(token)) {
            // Token reuse detected! Invalidate all user tokens
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({
                error: "Invalid request - all tokens invalidated for security"
            });
        }

        // Remove the specific token using splice
        const tokenIndex = (user.refreshTokens as string[]).indexOf(token);
        (user.refreshTokens as string[]).splice(tokenIndex, 1);
        await user.save();

        res.json({ message: "Logout successful" });
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 * Requires refresh token in Authorization header
 */
const refresh = async (req: Request, res: Response) => {
    try {
        // Get token from Authorization header
        const authHeaders = req.headers['authorization'];
        const token = authHeaders && authHeaders.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: "Refresh token is required in Authorization header"
            });
        }

        // Verify the refresh token
        const decoded = verifyRefreshToken(token);

        if (!decoded) {
            return res.status(403).json({
                error: "Invalid or expired refresh token"
            });
        }

        // Find user and check if refresh token exists in their array
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(403).json({
                error: "User not found"
            });
        }

        // Security: Check if token exists in user's array
        // If not, it might be token reuse attack - invalidate all tokens
        if (!user.refreshTokens || !(user.refreshTokens as string[]).includes(token)) {
            // Token reuse detected! Invalidate all user tokens
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({
                error: "Token reuse detected - all tokens invalidated for security"
            });
        }

        // Generate NEW tokens (token rotation)
        const tokenPayload = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };

        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // Replace old refresh token with new one (rotation)
        const tokenIndex = (user.refreshTokens as string[]).indexOf(token);
        (user.refreshTokens as string[])[tokenIndex] = newRefreshToken;
        await user.save();

        // Return BOTH new tokens
        res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(403).json({ error: (error as Error).message });
    }
};

export default {
    register,
    login,
    logout,
    refresh
};
