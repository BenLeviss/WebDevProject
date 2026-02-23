import { Router } from "express";
import userController from "../controllers/user";
import { authenticate } from "../middleware/auth";

const router = Router();

// Create a new user (public - for registration)
router.post("/", userController.createUser);

// All other user routes require authentication
// Get all users
router.get("/", authenticate, userController.getAllUsers);

// Get all posts by a specific user
router.get("/:userId/posts", authenticate, userController.getUserPosts);

// Get all comments by a specific user
router.get("/:userId/comments", authenticate, userController.getUserComments);

// Get user by ID
router.get("/:userId", authenticate, userController.getUserById);

// Update user by ID
router.put("/:userId", authenticate, userController.updateUserById);

// Delete user by ID
router.delete("/:userId", authenticate, userController.deleteUserById);

export default router;
