import Comment from "../models/comments.js";

const commentReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = comment.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      // Remove the reaction
      comment.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add the reaction
      comment.reactions.push({
        emoji,
        user: req.user._id,
      });
    }

    await comment.save();

    res.json({ success: true, reactions: comment.reactions });
  } catch (error) {
    console.error("Error updating reaction:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { commentReaction };
