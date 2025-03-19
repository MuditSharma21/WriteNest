import React, { useState } from "react";
import { getDay, getFullDayWithTime } from "../../common/Date";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import CommentField from "./CommentField";
import {
  setCommentsResults,
  setActivity,
  decrementCommentCount,
} from "../../redux/selectedBlogSlice";
import axios from "axios";

const CommentCard = ({ index, leftVal, commentData }) => {
  const access_token = useSelector((store) => store.auth.access_token);
  const username = useSelector((store) => store.auth.user.username)

  const selectedBlog = useSelector((store) => store.selectedBlog)    

  const dispatch = useDispatch();
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the entire comments array from Redux
  const commentArr = useSelector((store) => store.selectedBlog.comments.results);
  
  // Get the isReplyLoaded state from the current comment in the array
  const isReplyLoaded = commentArr[index]?.isReplyLoaded || false;

  const {
    author: { personal_info: { username: blog_author } } = {}
  } = selectedBlog;  

  const {
    _id,
    comment,
    commented_by: {
      personal_info: { profile_img, fullname, username: commented_by_username },
    },
    commentedAt,
    children,
  } = commentData;

  const loadReplies = () => {
    if (!children || children.length === 0) return;
    
    setIsLoading(true);
    
    axios
      .post(`${import.meta.env.VITE_BASE_URL}/blog/reply`, { _id, skip: 0 })
      .then(({ data: { replies } }) => {
        // Make a fresh copy of the current comments array
        const currentComments = [...commentArr];
        
        // First, update the isReplyLoaded flag on the current comment
        currentComments[index] = { 
          ...currentComments[index], 
          isReplyLoaded: true 
        };
        
        // Check if replies already exist by looking at childrenLevel
        const existingReplies = currentComments.some((comment, idx) => {
          return idx > index && 
                 comment.childrenLevel > currentComments[index].childrenLevel;
        });
        
        if (existingReplies) {
          dispatch(setCommentsResults([...currentComments]));
          setIsLoading(false);
          return;
        }
        
        // Prepare the replies with the correct childrenLevel and unique IDs if needed
        const formattedReplies = replies.map((reply, replyIndex) => {
          // If no _id exists, create a synthetic one
          const replyId = reply._id || `${_id}-reply-${replyIndex}`;
          
          return {
            ...reply,
            _id: replyId,
            childrenLevel: commentData.childrenLevel + 1,
            isReplyLoaded: false,
            parentCommentId: _id // Keep track of parent for easier filtering
          };
        });
        
        // Insert the replies right after the current comment
        const updatedComments = [
          ...currentComments.slice(0, index + 1),
          ...formattedReplies,
          ...currentComments.slice(index + 1)
        ];
        
        dispatch(setCommentsResults(updatedComments));
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error loading replies:", error);
        toast.error("Failed to load replies. Please try again.");
        setIsLoading(false);
      });
  };

  const deleteComment = (e) => {
  e.target.setAttribute("disabled", true);
  
  axios.post(`${import.meta.env.VITE_BASE_URL}/blog/delete-comment`, { _id }, {
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
  .then(() => {
    e.target.removeAttribute("disabled");
    
    // Create a copy of the current comments array
    const updatedComments = commentArr.filter((comment) => {
      // Remove the current comment
      if (comment._id === _id) return false;
      
      // Also remove any children of this comment
      if (comment.parentCommentId === _id) return false;
      
      return true;
    });
    
    // Update Redux store with the filtered comments
    dispatch(setCommentsResults(updatedComments));
    dispatch(decrementCommentCount())
    
    toast.success("Comment deleted successfully");
  })
  .catch((error) => {
    console.error("Error deleting comment:", error);
    e.target.removeAttribute("disabled");
    toast.error(error.response?.data?.error || "Failed to delete comment");
  });
};

  const hideReplies = () => {
    
    // Get the current comments array
    const currentComments = [...commentArr];
    
    // Update the isReplyLoaded flag on the current comment first
    let updatedComments = currentComments.map((comment, idx) => {
      if (idx === index) {
        return { ...comment, isReplyLoaded: false };
      }
      return comment;
    });
    
    // Now remove all replies (all subsequent comments with higher childrenLevel)
    updatedComments = updatedComments.filter((comment, idx) => {
      // Keep comments before our target comment
      if (idx <= index) return true;
      
      // Keep comments that aren't replies to our target (same or lower level)
      if (comment.childrenLevel <= commentData.childrenLevel) return true;
      
      // Remove all replies (higher childrenLevel)
      return false;
    });
    
    dispatch(setCommentsResults(updatedComments));
  };

  const handleReply = () => {
    if (!access_token) {
      return toast.error("Login first to leave a reply!");
    }
    setIsReplying(prev => !prev);
  };

  return (
    <div className="w-full" style={{ paddingLeft: `${leftVal * 10}px` }}>
      <Toaster />
      <div className="my-5 p-6 rounded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          {profile_img && (
            <img src={profile_img} className="w-6 h-6 rounded-full" alt="Profile" />
          )}

          <p className="line-clamp-">{fullname} @{commented_by_username}</p>
          <p className="min-w-fit text-dark-grey">
            {getFullDayWithTime(commentedAt)}
          </p>
        </div>

        <p className="font-gelasio text-xl ml-3">{comment}</p>

        <div className="flex gap-5 items-center mt-5">
          {children && children.length > 0 && (
            isReplyLoaded ? (
              <button
                onClick={hideReplies}
                disabled={isLoading}
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              >
                <i className="fi fi-rs-comment-dots"></i>
                Hide Replies
              </button>
            ) : (
              <button
                onClick={loadReplies}
                disabled={isLoading}
                className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              >
                <i className="fi fi-rs-comment-dots"></i>
                {isLoading ? 'Loading...' : `${children.length} ${children.length === 1 ? 'Reply' : 'Replies'}`}
              </button>
            )
          )}
          
          <i
            className={`fi fi-rr-undo -mr-2 ${
              isReplying ? "-rotate-90 transition duration-500" : ""
            }`}
          ></i>
          <button onClick={handleReply} className="underline">
            Reply
          </button>

          {
            username == commented_by_username || username == blog_author ? (
              <button className="p-2 px-3 rounded-md border border-grey hover:bg-rose-800/50 hover:text-rose-800 ml-auto flex items-center" onClick={deleteComment}>
                <i className="fi fi-rr-trash pointer-events-none"></i>
              </button>
            ) : ''
          }
          
        </div>

        {isReplying && (
          <div className="mt-8">
            <CommentField
              action="reply"
              index={index}
              replyingTo={_id}
              setIsReplying={setIsReplying}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentCard;