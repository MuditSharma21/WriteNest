import Blog from "../Schema/Blog.js";
import Notification from "../Schema/Notification.js";
import Comment from "../Schema/Comment.js";
import User from "../Schema/User.js";

export const likeBlog = (req, res) => {
  let user_id = req.user;

  let { _id, isLikedByUser } = req.body;

  let incrementVal = !isLikedByUser ? 1 : -1;

  // If the user is liking, like value increase by 1 otherwise descreaing by 1
  Blog.findOneAndUpdate(
    { _id },
    { $inc: { "activity.total_likes": incrementVal } }
  )
    .then((blog) => {
      if (!isLikedByUser) {
        // If user has not liked previously, adding new like and notification
        let like = new Notification({
          type: "like",
          blog: _id,
          notification_for: blog.author,
          user: user_id,
        });

        like.save().then((notification) => {
          return res.status(200).json({ liked_by_user: true });
        });
      } else {
        // If user has liked previously, removing like and notification
        Notification.findOneAndDelete({
          user: user_id,
          type: "like",
          blog: _id,
        })
          .then((result) => {
            return res.status(200).json({ liked_by_user: false });
          })
          .catch((err) => {
            return res.status(500).json({ error: err.message });
          });
      }
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
};

export const isLikedByUser = (req, res) => {
  let user_id = req.user;

  let { _id } = req.body;

  Notification.exists({ user: user_id, type: "like", blog: _id })
    .then((result) => {
      return res.status(200).json({ result });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
};

export const addComment = (req, res) => {
  let user_id = req.user;

  // replying_to is the comment id, of the comment, on which we got reply
  let { _id, comment, replying_to, blog_author } = req.body;

  if (!comment.length) {
    return res
      .status(403)
      .json({ error: "Write something to leave a comment..." });
  }

  let commentObj = {
    blog_id: _id,
    blog_author,
    comment,
    commented_by: user_id,
  };

  if (replying_to) {
    commentObj.parent = replying_to;
    commentObj.isReply = true
  }

  new Comment(commentObj).save().then(async (commentFile) => {
    let { comment, commentedAt, children } = commentFile;

    // If the comment is a reply to some comment, then we won't increase the total_parent_comment count, otherwise we increase by 1
    Blog.findOneAndUpdate(
      { _id },
      {
        $push: { comments: commentFile._id },
        $inc: {
          "activity.total_comments": 1,
        },
        "activity.total_parent_comments": replying_to ? 0 : 1,
      }
    ).then((blog) => {
      console.log(blog);
    });

    let notificationObj = {
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: commentFile._id,
    };

    // If the comment is reply, the we also add this key, which refers to comment id, on which the we got the reply
    if (replying_to) {
      notificationObj.replied_on_comment = replying_to;

      // There is a children key in comment docs, so in that key, we will push the comment id
      await Comment.findOneAndUpdate(
        { _id: replying_to },
        { $push: { children: commentFile._id } }
      ).then((replyingToCommentDoc) => {
        notificationObj.notification_for = replyingToCommentDoc.commented_by;
      });
    }

    new Notification(notificationObj).save().then((notification) => {
      console.log("New comment added");
    });
    return res.status(200).json({
      comment,
      commentedAt,
      _id: commentFile._id,
      user_id,
      children,
    });
  });
};

export const getComments = (req, res) => {
  let { blog_id, skip } = req.body;

  let maxLimit = 5;

  Comment.find({ blog_id, isReply: false })
    .populate(
      "commented_by",
      "personal_info.username personal_info.fullname personal_info.profile_img"
    )
    .skip(skip)
    .limit(maxLimit)
    .sort({
      commentedAt: -1,
    })
    .then((comments) => {
      return res.status(200).json( comments );
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
};

export const getReplies = (req, res) => {
  let { _id, skip } = req.body;

  let maxLimit = 5;

  Comment.findOne({ _id })
    .populate({
      path: "children",
      option: {
        limit: maxLimit,
        skip: skip,
        sort: { commentedAt: -1 },
      },
      populate: {
        path: "commented_by",
        select:
          "personal_info.profile_img personal_info.fullname personal_info.username",
      },
      select: "-blog_id -updatedAt",
    })
    .select("children")
    .then((doc) => {
      return res.status(200).json({ replies: doc.children });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
};

const deleteComments = (_id) => {
  Comment.findOneAndDelete({ _id })
  .then((comment) => {
    if (comment.parent) {
      Comment.findOneAndUpdate({ _id: comment.parent }, { $pull: {children: _id} })
      .then((data) =>{
        'Comment deleted from parent'
      })
      .catch((err) => console.log(err))
    }

    Notification.findOneAndDelete({ comment: _id })
    .then((notification) => {
      console.log('Comment notification deleted')
    })

    Notification.findOneAndDelete({ reply: _id })
    .then((notification) => {
      console.log('Reply notification deleted')
      
    })

    Blog.findOneAndUpdate({ _id: comment.blog_id }, { $pull: { comments:_id },  $inc: {
      "activity.total_comments": -1,
      "activity.total_parent_comments": comment.parent ? 0 : -1
    },
    })
    .then((blog) => {
      if (comment.children.length) {
        comment.children.map((replies) => {
          deleteComments(replies)
        })
      }
    })
    .catch((err) => {
      console.log(err.message)
      
    })
  })
}

export const deleteComment = (req, res) => {
  let user_id = req.user;

  let { _id } = req.body

  Comment.findOne({ _id })
  .then((comment) => {
    if (user_id == comment.commented_by || user_id == comment.blog_author) {

      deleteComments(_id)

      return res.status(200).json({ status: 'Done' })
    } else {
      return res.status(403).json({ error: "You can not delete this comment" })
    }
  })
}

export const deleteBlog = (req, res) => {
  const user_id = req.user;

  const { blog_id } = req.body;

  Blog.findOneAndDelete({ blog_id })
    .then((blog) => {

      if (blog.author.toString() !== user_id) {
        return res.status(403).json({ error: "You cannot delete blogs you don't own" });
      }
      
      Notification.deleteMany({ blog: blog._id }).then((data) =>
        console.log("Notification deleted")
      );

      Comment.deleteMany({ blog_id: blog._id }).then((data) =>
        console.log("Comments deleted")
      );

      User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { blogs: blog._id }, $inc: { "account_info.total_posts": -1 } }
      ).then((user) => console.log("Blog Deleted"));

      return res.status(200).json({ msg: "Blog deleted!" });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
};
