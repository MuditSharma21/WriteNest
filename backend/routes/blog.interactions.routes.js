import express from "express";
import {
  addComment,
  deleteBlog,
  deleteComment,
  getComments,
  getReplies,
  isLikedByUser,
  likeBlog,
} from "../controllers/blog.inteactions.controllers.js";
import { Auth } from "../middleware/auth.middleware.js";

const blogInteractionRouter = express.Router();

blogInteractionRouter.post("/like", Auth, likeBlog);
blogInteractionRouter.post("/isLiked", Auth, isLikedByUser);

blogInteractionRouter.post("/comment", Auth, addComment);
blogInteractionRouter.post("/comment/get", getComments);

blogInteractionRouter.post("/reply", getReplies);

blogInteractionRouter.post("/delete-comment", Auth, deleteComment)

blogInteractionRouter.post("/delete-blog", Auth, deleteBlog);

export default blogInteractionRouter;

