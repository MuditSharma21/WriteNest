import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setDraftedBlogs,
  setPublishedBlogs,
} from "../redux/blogManagementSlice";
import { Toaster } from "react-hot-toast";
import InPageNavigation from "../components/Home Page/InPageNavigation";
import Loader from "../components/ui/Loader";
import NoDataMessage from "../components/ui/NoData";
import AnimationWrapper from "../common/Page-animation";
import {
  ManageDraftBlogPost,
  ManagePublishedBlogCard,
} from "../components/Blogs/ManagePublishedBlogCard";
import LoadMoreDataBtn from "../components/Blogs/LoadMoreDataBtn";

const ManageBlogs = () => {
  const access_token = useSelector((store) => store.auth.access_token);
  const blogs = useSelector((store) => store.blogManagement.publishedBlogs);
  const drafts = useSelector((store) => store.blogManagement.draftedBlogs);


  const dispatch = useDispatch();
  const [query, setQuery] = useState("");

  const filterPaginationData = async ({
    user,
    state,
    data,
    page,
    countRoute,
    data_to_send = {},
  }) => {
    let obj;

    // If we already have data, moving to next page
    if (state != null) {
      obj = { ...state, results: [...state.results, ...data], page: page };
    } else {
      // Creating the first time
      await axios
        .post(
          import.meta.env.VITE_BASE_URL + countRoute,
          data_to_send,
          {
            headers: {
              Authorization: `Bearer ${user}`,
            },
          }
        )
        .then(({ data: { totalDocs } }) => {
          obj = { results: data, page: 1, totalDocs };
        })
        .catch((err) => console.log(err));
    }
    return obj;
  };

  const getBlogs = ({ page = 1, draft = false, deletedDocCount = 0 }) => {
    axios
      .post(
        `${import.meta.env.VITE_BASE_URL}/user/written-blogs`,
        {
          page,
          draft,
          query,
          deletedDocCount,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(async ({ data }) => {
        let formatedData = await filterPaginationData({
          state: draft ? drafts : blogs,
          data: data.blogs,
          page,
          user: access_token,
          countRoute: "/user/written-blogs-count",
          data_to_send: { draft, query },
        });

        if (draft) {
          dispatch(setDraftedBlogs(formatedData));
        } else {
          dispatch(setPublishedBlogs(formatedData));
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (access_token) {
      if (blogs == null) {
        getBlogs({ page: 1, draft: false });
      }
      if (drafts == null) {
        getBlogs({ page: 1, draft: true });
      }
    }
  }, [access_token, blogs, drafts, query]);

  const handleSearch = (e) => {
    const search = e.target.value;

    setQuery(search);

    if (e.keyCode == 13 && search.length) {
      dispatch(setDraftedBlogs(null));
      dispatch(setPublishedBlogs(null));
    }
  };

  const handleChange = (e) => {
    if (!e.target.value.length) {
      setQuery("");
      dispatch(setDraftedBlogs(null));
      dispatch(setPublishedBlogs(null));
    }
  };

  return (
    <>
      <h1 className="max-md:hidden">Manage Blogs</h1>
      <Toaster />
      <div className="relative max-md:mt-5 md:mt-8 mb-10">
        <input
          type="search"
          className="w-full bg-grey p-4 pl-12 pr-6 rounded-full placeholder:text-dark-grey"
          placeholder="Search Blogs"
          onChange={handleChange}
          onKeyDown={handleSearch}
        />
        <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
      </div>

      <InPageNavigation routes={["Published Blogs", "Drafts"]}>
        {blogs == null ? (
          <Loader />
        ) : blogs.results.length ? (
          <>
            {blogs.results.map((blog, i) => {
              return (
                <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                   <ManageDraftBlogPost 
                      blog={{ ...blog, index: i }} 
                      setStateFunc={(updatedState) => dispatch(setPublishedBlogs(updatedState))} 
                    />
                </AnimationWrapper>
              );
            })}

            <LoadMoreDataBtn 
              state={blogs} 
              fetchData={(params) => getBlogs({ ...params, draft: false })}
            />
          </>
        ) : (
          <NoDataMessage message={"No Published Blogs"} />
        )}

        {drafts == null ? (
          <Loader />
        ) : drafts?.results?.length ? (
          <>
            {drafts.results.map((blog, i) => {
              return (
                <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                   <ManageDraftBlogPost 
                      blog={{ ...blog, index: i }} 
                      setStateFunc={(updatedState) => dispatch(setDraftedBlogs(updatedState))} 
                    />
                </AnimationWrapper>
              );
            })}

            <LoadMoreDataBtn 
              state={drafts} 
              fetchData={(params) => getBlogs({ ...params, draft: true })}
            />
          </>
        ) : (
          <NoDataMessage message={"No Draft Blogs"} />
        )}
      </InPageNavigation>
    </>
  );
};

export default ManageBlogs;