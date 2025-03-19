import axios from "axios";
import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivity,
  setCommentsResults,
  setTotalParentCommentsLoaded,
} from "../../redux/selectedBlogSlice";

const CommentField = ({
  action,
  index = undefined,
  replyingTo = undefined,
  setIsReplying,
}) => {
  const access_token = useSelector((store) => store.auth.access_token);
  const userInfo = useSelector((store) => store.auth);
  let currentUser = {};

  if (access_token) {
    const { profile_img, fullname, username } = userInfo.user || {};
    currentUser = { profile_img, fullname, username };
  }
  
  const selectedBlog = useSelector((store) => store.selectedBlog);
  const commentArr = selectedBlog.comments.results || [];
  
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  const {
    _id,
    author: { _id: blog_author } = {},
  } = selectedBlog;

  const handleComment = () => {
    if (!access_token) {
      return toast.error("Login first to leave a comment!");
    }
    if (!comment.trim().length) {
      return toast.error("Write something to leave a comment..");
    }
    
    setIsSubmitting(true);
  
    axios
      .post(
        `${import.meta.env.VITE_BASE_URL}/blog/comment`,
        { _id, blog_author, comment, replying_to: replyingTo },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(({ data }) => {
        setComment("");
        setIsSubmitting(false);
        
        // Prepare the new comment with user info
        const newComment = {
          ...data,
          commented_by: { 
            personal_info: currentUser 
          },
          children: [],
        };
  
        // Get latest comments array
        const currentComments = [...commentArr];
        let updatedComments = [];
  
        if (replyingTo) {
          // This is a reply to an existing comment
          
          // Make sure the index is valid
          if (index >= 0 && index < currentComments.length) {
            // First, update the parent comment's children array
            updatedComments = currentComments.map((comment, i) => {
              if (i === index) {
                return {
                  ...comment,
                  children: [...(comment.children || []), newComment._id]
                };
              }
              return comment;
            });
            
            // Setup childrenLevel for the new reply
            newComment.childrenLevel = (currentComments[index].childrenLevel || 0) + 1;
            newComment.isReplyLoaded = false; // Initialize as not having replies loaded
            
            // Mark parent as having replies loaded
            updatedComments[index].isReplyLoaded = true;

            let insertIndex = index + 1;
            while (
              insertIndex < updatedComments.length && 
              updatedComments[insertIndex].childrenLevel > currentComments[index].childrenLevel
            ) {
              insertIndex++;
            }
            
            // Insert the new reply at the appropriate position
            updatedComments.splice(insertIndex, 0, newComment);
            
            if (typeof setIsReplying === 'function') {
              setIsReplying(false);
            }
          } else {
            console.error("Invalid index for reply:", index);
            toast.error("Something went wrong. Please try again.");
            return;
          }
        } else {
          // This is a new parent comment
          newComment.childrenLevel = 0;
          newComment.isReplyLoaded = false;
          
          // Add new comment at the beginning
          updatedComments = [newComment, ...currentComments];
        }
        
        dispatch(setCommentsResults(updatedComments));
        
        // Update activity counters
        let parentCommentIncrementVal = replyingTo ? 0 : 1;
        dispatch(setActivity(parentCommentIncrementVal));
        dispatch(setTotalParentCommentsLoaded(parentCommentIncrementVal));
        
        toast.success(replyingTo ? "Reply posted!" : "Comment posted!");
      })
      .catch((err) => {
        console.error("Error posting comment:", err);
        setIsSubmitting(false);
        toast.error("Failed to post comment. Please try again.");
      });
  };

  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Leave a ${action === "reply" ? "reply" : "comment"}...`}
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
        disabled={isSubmitting}
      ></textarea>
      <button 
        onClick={handleComment} 
        className="btn-dark mt-5 px-10"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Posting..." : action}
      </button>
    </>
  );
};

export default CommentField;