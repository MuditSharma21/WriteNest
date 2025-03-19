import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  _id: "",
  title: "",
  des: "",
  content: [],
  tags: [],
  comments: {
    results: [],
  },
  author: { personal_info: {} },
  banner: "",
  publishedAt: "",
  blog_id: null,
  activity: {},
  isLikedByUser: "",
  commentWrapper: false,
  totalParentCommentsLoaded: 0,
};
const selectedBlogSlice = createSlice({
  name: "selectedBlog",
  initialState,
  reducers: {
    setSelectedBlog: (state, { payload }) => {
      const {
        _id,
        title,
        des,
        content,
        tags,
        author,
        banner,
        publishedAt,
        blog_id,
        activity,
        comments,
      } = payload;

      state._id = _id;
      state.title = title;
      state.des = des;
      state.content = content;
      state.tags = tags;
      state.author = author;
      state.banner = banner;
      state.publishedAt = publishedAt;
      state.blog_id = blog_id;
      state.activity = activity;
      state.comments = comments;
    },
    resetSelectedBlog: (state) => {
      Object.assign(state, initialState);
    },
    setLike: (state, { payload }) => {
      state.activity.total_likes = payload;
    },
    toggleLikedByUser: (state) => {
      state.isLikedByUser = !state.isLikedByUser;
    },
    setUserLiked: (state, { payload }) => {
      state.isLikedByUser = payload;
    },
    setTotalParentCommentsLoaded: (state, { payload }) => {
      state.totalParentCommentsLoaded =
        state.totalParentCommentsLoaded + payload;
    },
    toggleCommentWrapper: (state) => {
      state.commentWrapper = !state.commentWrapper;
    },
    setComments: (state, { payload }) => {
      // Create a proper structure for comments
      if (Array.isArray(payload)) {
        // If payload is an array, replace the entire results array
        state.comments = { 
          ...state.comments, 
          results: payload 
        };
      } else if (typeof payload === 'object' && payload !== null) {
        // If payload is an object (likely with a results property)
        state.comments = {
          ...state.comments,
          ...(payload.results ? payload : { results: payload })
        };
      }
    },
    updateComments: (state, { payload }) => {
      state.comments = payload;
    },
    setActivity: (state, { payload }) => {
      state.activity = {
        ...state.activity,
        total_comments: state.activity.total_comments + 1,
        total_parent_comments: state.activity.total_parent_comments + payload,
      };
    },
    setIsReplyLoaded: (state, action) => {
      const { index, isLoaded } = action.payload;
      state.comments.results[index].isReplyLoaded = isLoaded;
    },
    makeReplyLoadedFalse: (state, { payload }) => {
      state.comments.results[payload].isReplyLoaded = false;
    },

    setCommentsResults: (state, { payload }) => {
      // Completely replace the results array
      state.comments.results = [...payload];
    },
    decrementCommentCount: (state) => {
      state.activity = {
        ...state.activity,
        total_comments: Math.max(0, state.activity.total_comments - 1),
        // If needed, also decrement parent comments
        total_parent_comments: state.activity.total_parent_comment
      };
    },
  },
});

export const {
  setSelectedBlog,
  resetSelectedBlog,
  toggleLikedByUser,
  setLike,
  setUserLiked,
  setTotalParentCommentsLoaded,
  toggleCommentWrapper,
  setComments,
  updateComments,
  setActivity,
  setIsReplyLoaded,
  setCommentsResults,
  makeReplyLoadedFalse,
  decrementCommentCount
} = selectedBlogSlice.actions;
export default selectedBlogSlice.reducer;
