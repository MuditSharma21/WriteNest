import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setComments,
  setTotalParentCommentsLoaded,
  toggleCommentWrapper,
} from "../../redux/selectedBlogSlice";
import CommentField from "./CommentField";
import NoDataMessage from "../../components/ui/NoData";
import axios from "axios";
import AnimationWrapper from "../../common/Page-animation";
import CommentCard from "./CommentCard";

export const fetchComments = async ({
  skip = 0,
  blog_id,
  setParentCommentCountFun,
}) => {
  try {
    const { data } = await axios.post(`${import.meta.env.VITE_BASE_URL}/blog/comment/get`, {
      blog_id,
      skip,
    });
    
    // Make sure data is an array
    if (Array.isArray(data)) {
      // Add childrenLevel property to each comment
      data.forEach(comment => {
        comment.childrenLevel = 0;
        comment.isReplyLoaded = false;
      });

      if (setParentCommentCountFun) {
        setParentCommentCountFun(data.length);
      }
      
      return data;
    } else {
      console.error("Expected array of comments but got:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

const CommentsContainer = () => {
  const selectedBlog = useSelector((store) => store.selectedBlog);
  const commentWrapper = useSelector((store) => store.selectedBlog.commentWrapper);
  const dispatch = useDispatch();
  
  const {
    _id,
    title,
    comments: { results: commentArr = [] },
    activity: { total_parent_comments = 0 } = {},
    totalParentCommentsLoaded = 0,
  } = selectedBlog;

  // Load initial comments when component mounts or _id changes
  useEffect(() => {
    if (_id) {
      const loadInitialComments = async () => {
        const newComments = await fetchComments({
          skip: 0,
          blog_id: _id,
          setParentCommentCountFun: (count) => {
            dispatch(setTotalParentCommentsLoaded(count));
          },
        });
        
        dispatch(setComments(newComments));
      };
      
      loadInitialComments();
    }
  }, [_id, dispatch]);

  const loadMoreComments = async () => {
    const newComments = await fetchComments({
      skip: totalParentCommentsLoaded,
      blog_id: _id,
      setParentCommentCountFun: (count) => {
        dispatch(setTotalParentCommentsLoaded(totalParentCommentsLoaded));
      },
    });
    
    dispatch(setComments([...commentArr, ...newComments]));
  };

  return (
    <div
      className={
        "max-sm:w-full fixed " +
        (commentWrapper ? "top-0 sm:right-0" : "top-[100%] sm:right-[-100%]") +
        " duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[500px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto overflow-x-hidden"
      }
    >
      <div className="relative">
        <h1 className="text-xl font-medium">Comments</h1>
        <p className="text-lg mt-2 w[70%] text-dark-grey line-clamp-1">
          {title}
        </p>

        <button
          onClick={() => dispatch(toggleCommentWrapper())}
          className="flex absolute top-0 right-0 justify-center items-center w-10 h-10 rounded-full bg-grey"
        >
          <i className="fi fi-br-cross text-2xl mt-1"></i>
        </button>

        <hr className="border-grey my-8 w-[120%] -ml-10" />

        <CommentField action={"comment"} />

        {commentArr && commentArr.length > 0 ? (
          commentArr.map((comment, i) => {
            // Create a unique key that combines comment ID and its position
            const uniqueKey = `${comment._id}-index-${i}`;
            
            return (
              <AnimationWrapper key={uniqueKey}>
                <CommentCard
                  index={i}
                  leftVal={comment.childrenLevel * 4}
                  commentData={comment}
                />
              </AnimationWrapper>
            );
          })
        ) : (
          <NoDataMessage message={"No Comments"} />
        )}
  
        {total_parent_comments > totalParentCommentsLoaded ? (
          
          <button
            onClick={loadMoreComments}
            className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
          >
            Load More
          </button>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default CommentsContainer;