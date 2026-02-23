import express from "express";
const postRouter = express.Router();
import postsController from "../controllers/posts";
import commentController from "../controllers/comment";
import { authenticate } from "../middleware/auth";

// All post routes require authentication
// Add a New Post
postRouter.post("/", authenticate, postsController.createPost);

// Get All Posts
postRouter.get("/", authenticate, postsController.getPosts);

// Get a Post by ID
postRouter.get("/:postId", authenticate, postsController.getPostById);

// Update a Post
postRouter.put("/:postId", authenticate, postsController.updatePostById);

// Delete a Post by ID
postRouter.delete("/:postId", authenticate, postsController.deletePostById);

// Add new Comment 
postRouter.post("/:postId/comment", authenticate, commentController.createComment);

// Get all comment for a post 
postRouter.get("/:postId/comment", authenticate, commentController.getCommentsByPost);

export default postRouter;
