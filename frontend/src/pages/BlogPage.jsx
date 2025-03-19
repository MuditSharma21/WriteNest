import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/Page-animation";
import Loader from "../components/ui/Loader";
import BlogInteraction from "../components/Blogs/BlogInteraction";
import { useDispatch, useSelector } from "react-redux";
import {
  resetSelectedBlog,
  setSelectedBlog,
  setTotalParentCommentsLoaded,
  toggleCommentWrapper,
} from "../redux/selectedBlogSlice";
import { resetSimilarBlog, setSimilarBlog } from "../redux/similarBlogSlice";
import BlogPostCard from "../components/Blogs/BlogPostCard";
import BlogContent from "../components/Blogs/BlogContent";
import CommentsContainer, {
  fetchComments,
} from "../components/Comments/CommentsContainer";
import { getFullDay } from "../common/Date";

const BlogPage = () => {
  const { id: blog_id } = useParams();
  const selectedBlog = useSelector((store) => store.selectedBlog);
  const similarBlog = useSelector((store) => store.similarBlog.blogs);

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);

  const {
    title,
    content,
    banner,
    author: {
      personal_info: { fullname, username: author_username, profile_img },
    },
    publishedAt,
  } = selectedBlog;

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${import.meta.env.VITE_BASE_URL}/blog`, { blog_id });
      const blog = data.blog;
      
      if (!blog) {
        throw new Error("Blog not found");
      }
      
      const fetchedTags = blog.tags || [];
      
      // Fetch comments with error handling
      try {
        blog.comments = await fetchComments({ 
          blog_id: blog._id, 
          setParentCommentCountFun: setTotalParentCommentsLoaded 
        });
      } catch (commentError) {
        console.error("Error fetching comments:", commentError);
        blog.comments = [];
      }
      
      // Fetch similar blogs
      try {
        if (fetchedTags.length > 0) {
          const similarResponse = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/blog/search-blogs`, 
            {
              tag: fetchedTags[0],
              limit: 6,
              eliminate_blog: blog_id,
            }
          );
          dispatch(setSimilarBlog(similarResponse.data.blogs || []));
        }
      } catch (similarError) {
        console.error("Error fetching similar blogs:", similarError);
        dispatch(setSimilarBlog([]));
      }
      
      dispatch(setSelectedBlog(blog));
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
    window.scrollTo(0, 0);
  }, [blog_id]);

  const resetStates = () => {
    dispatch(resetSelectedBlog());
    dispatch(resetSimilarBlog());
    setLoading(false);
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <>
          <CommentsContainer />

          <div className="max-w-[900px] center py-10 max-lg:px-[5vw] ">
            <img src={banner} alt="" className="aspect-video rounded-md" />

            <div className="mt-12">
              <h2>{title}</h2>

              <div className="flex max-sm:flex-col justify-between my-8 ">
                <div className="flex gap-5 items-start">
                  <img
                    src={profile_img}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />

                  <p className="capitalize">
                    {fullname}
                    <br />
                    @
                    <Link
                      className="underline font-semibold"
                      to={`/user/${author_username}`}
                    >
                      {author_username}
                    </Link>
                  </p>
                </div>

                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                  Published on {getFullDay(publishedAt)}
                </p>
              </div>
            </div>

            <BlogInteraction />
            {/* Blog content here */}
            <div className="my-12 font-gelasio blog-page-content">
              {content && content[0]?.blocks ? (
                content[0].blocks.map((block, i) => (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                ))
              ) : (
                <p>Loading content...</p>
              )}
            </div>

            <BlogInteraction />

            {similarBlog != null && similarBlog.length ? (
              <>
                <h1 className="text-2xl mt-14 mb-10 font-medium">
                  Similar Blogs
                </h1>

                {similarBlog.map((blog, i) => {
                  let {
                    author: { personal_info },
                  } = blog;
                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.8 }}
                    >
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              ""
            )}
          </div>
        </>
      )}
    </AnimationWrapper>
  );
};

export default BlogPage;
