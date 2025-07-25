import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

import { Heart, MessageSquare, Smile } from "lucide-react";
import type { Comment, CommentReaction, User } from "@/types";
import {
  useCreateCommentMutation,
  useGetTaskCommentsByIdQuery,
  useToggleCommentReactionMutation,
} from "@/hooks/use-task";
import { Loader } from "../loader";
import { toast } from "sonner";
import { getUserAvatar } from "@/lib";
import { useAuth } from "@/providers/auth-context";

interface CommentSectionProps {
  comments: Comment[];
  members: User[];
}

// Common emojis for reactions
const commonEmojis = [
  "👍",
  "👎",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🎉",
  "🚀",
  "🔥",
  "🔔",
];

export const CommentSection = ({
  taskId,
  members,
}: {
  taskId: string;
  members: User[];
}) => {
  const { user } = useAuth();
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newComment, setNewComment] = useState("");

  const { data: comments, isPending: isLoadingComments } =
    useGetTaskCommentsByIdQuery(taskId) as {
      data: Comment[];
      isPending: boolean;
    };
  const { mutate: createComment, isPending: isCreatingComment } =
    useCreateCommentMutation();
  const { mutate: addReaction, isPending: isAddingReaction } =
    useToggleCommentReactionMutation();

  // Filter members based on mention query
  const filteredMembers = members.filter((member) =>
    member?.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle textarea input to detect @ mentions
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Get cursor position
    const curPos = e.target.selectionStart || 0;
    setCursorPosition(curPos);

    // Check if user is typing a mention
    const textBeforeCursor = value.slice(0, curPos);
    const atSignIndex = textBeforeCursor.lastIndexOf("@");

    if (
      atSignIndex !== -1 &&
      (atSignIndex === 0 || value[atSignIndex - 1] === " ")
    ) {
      const query = textBeforeCursor.slice(atSignIndex + 1);
      setMentionQuery(query);
      setMentionMenuOpen(true);

      // Position the mention menu
      if (textareaRef.current) {
        const cursorCoords = getCaretCoordinates(textareaRef.current, curPos);
        setMentionPosition({
          top: cursorCoords.top + 20,
          left: cursorCoords.left,
        });
      }
    } else {
      setMentionMenuOpen(false);
    }
  };

  // Handle mention selection
  const handleSelectMention = (user: User) => {
    if (textareaRef.current) {
      const text = newComment;
      const curPos = cursorPosition;

      // Find the @ sign before the cursor
      const textBeforeCursor = text.slice(0, curPos);
      const atSignIndex = textBeforeCursor.lastIndexOf("@");

      if (atSignIndex !== -1) {
        // Replace the @mention with the selected user name
        const newText =
          text.slice(0, atSignIndex) + `@${user.name} ` + text.slice(curPos);

        setNewComment(newText);

        // Close the mention menu
        setMentionMenuOpen(false);

        // Focus back on textarea and place cursor after the mention
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = atSignIndex + user.name.length + 2; // @ + name + space
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
  };

  // Helper function to get caret position in textarea
  const getCaretCoordinates = (
    element: HTMLTextAreaElement,
    position: number
  ) => {
    const { offsetLeft, offsetTop } = element;
    // This is a simplified version - in a real app, you'd use a library or more complex calculations
    return {
      top: offsetTop + 20, // Approximate line height
      left: offsetLeft + position * 8, // Approximate character width
    };
  };

  const handleAddComment = () => {
    createComment(
      { taskId, text: newComment },
      {
        onSuccess: () => {
          setNewComment("");
          toast.success("Comment added successfully");
        },
        onError: (error) => {
          toast.error("Failed to add comment");
          console.error(error);
        },
      }
    );
  };

  // Close mention menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMentionMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle key navigation in mention menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionMenuOpen) {
      if (e.key === "Escape") {
        setMentionMenuOpen(false);
        e.preventDefault();
      }
      // Could add arrow key navigation here
    }
  };

  // Format comment text to highlight mentions
  const formatCommentText = (text: string) => {
    const parts = text.split(/(@[\w\s]+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const mentionName = part.slice(1).trim();
        const isMember = members.some((m) => m.name === mentionName);

        if (isMember) {
          return (
            <span
              key={index}
              className="bg-blue-600/10 text-blue-600 px-1 rounded"
            >
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  // Handle adding a reaction to a comment
  const handleAddReaction = (commentId: string, emoji: string) => {
    addReaction(
      { commentId, emoji },
      {
        onSuccess: () => {
          toast.success("Reaction added successfully");
        },
        onError: (error) => {
          toast.error("Failed to add reaction");
          console.error(error);
        },
      }
    );
  };

  // Count reactions by type
  const getReactionCounts = (reactions: CommentReaction[] = []) => {
    const counts: Record<string, number> = {};

    reactions.forEach((reaction) => {
      if (!counts[reaction.emoji]) {
        counts[reaction.emoji] = 0;
      }
      counts[reaction.emoji]++;
    });

    return counts;
  };

  // Check if the current user has reacted with a specific emoji
  const hasUserReacted = (reactions: CommentReaction[] = [], emoji: string) => {
    // Using the first user as current user for simplicity
    const currentUserId = user?._id;
    return reactions.some(
      (r) => r.user._id === currentUserId && r.emoji === emoji
    );
  };

  if (isLoadingComments) {
    return <Loader message="Loading comments..." />;
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Комментарии</h3>

      <ScrollArea className="h-[300px] mb-4">
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="flex gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      comment.author.profilePicture ||
                      getUserAvatar(comment.author.name)
                    }
                  />
                  <AvatarFallback>
                    {comment.author.name ? comment.author.name.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{formatCommentText(comment.text)}</p>

                  {/* Comment reactions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {comment.reactions &&
                      // This line converts the reaction counts object into an array of [emoji, count] pairs
                      // and maps over them to render reaction buttons
                      Object.entries(getReactionCounts(comment.reactions)).map(
                        ([emoji, count]) => (
                          <button
                            key={emoji}
                            className={`inline-flex items-center text-xs rounded-full px-2 py-1 border cursor-pointer ${
                              hasUserReacted(comment.reactions, emoji)
                                ? "bg-primary/10 border-primary/20"
                                : "bg-muted hover:bg-muted/80 border-muted/50"
                            }`}
                            onClick={() =>
                              handleAddReaction(comment._id, emoji)
                            }
                          >
                            <span className="mr-1">{emoji}</span>
                            <span>{count}</span>
                          </button>
                        )
                      )}

                    {/* Add reaction button */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center text-xs rounded-full px-2 py-1 border border-dashed border-muted-foreground/30 hover:bg-muted/80 cursor-pointer">
                          <Smile size={12} className="mr-1" />
                          <span>Добавить</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="flex flex-wrap gap-2 max-w-[200px]">
                          {commonEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              className="hover:bg-muted p-1 rounded text-lg cursor-pointer"
                              onClick={() => {
                                handleAddReaction(comment._id, emoji);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Нет комментариев</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="my-4" />

      <div className="mt-4 relative">
        <Textarea
          ref={textareaRef}
          placeholder="Добавить комментарий... (используйте @, чтобы упомянуть людей)"
          value={newComment}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className="mb-2"
        />

        {/* Mention menu */}
        {mentionMenuOpen && filteredMembers.length > 0 && (
          <div
            className="absolute z-50 bg-popover border rounded-md shadow-md p-1 w-64"
            style={{
              top: mentionPosition.top,
              left: mentionPosition.left,
              maxHeight: "200px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {filteredMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer rounded"
                onClick={() => handleSelectMention(member)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.profilePicture} />
                  <AvatarFallback>
                    {member.name ? member.name.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleAddComment}
            disabled={isCreatingComment || !newComment.trim()}
          >
            {isCreatingComment ? "Публикуется..." : "Опубликовать комментарий"}
          </Button>
        </div>
      </div>
    </div>
  );
};
