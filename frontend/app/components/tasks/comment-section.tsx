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

import { Heart, MessageSquare, Smile, Paperclip, Video, Mic, X, Download, Play, Pause } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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
    if (!newComment.trim() && attachments.length === 0) {
      toast.error("Добавьте текст или прикрепите файл");
      return;
    }

    createComment(
      { taskId, text: newComment, attachments },
      {
        onSuccess: () => {
          setNewComment("");
          setAttachments([]);
          toast.success("Ответ добавлен успешно");
        },
        onError: (error) => {
          toast.error("Не удалось добавить ответ");
          console.error(error);
        },
      }
    );
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }> = [];

    for (const file of Array.from(files)) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Файл ${file.name} превышает лимит в 50MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        
        uploadedFiles.push({
          fileName: file.name,
          fileUrl: result.data.secure_url,
          fileType: file.type,
          fileSize: file.size,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Не удалось загрузить файл ${file.name}`);
      }
    }

    setAttachments(prev => [...prev, ...uploadedFiles]);
    setIsUploading(false);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Ваш браузер не поддерживает запись аудио");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Upload voice message
        const formData = new FormData();
        formData.append('file', file);

        try {
          setIsUploading(true);
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          
          setAttachments(prev => [...prev, {
            fileName: `Голосовое сообщение`,
            fileUrl: result.data.secure_url,
            fileType: 'audio/webm',
            fileSize: file.size,
          }]);
          
          toast.success("Голосовое сообщение добавлено");
        } catch (error) {
          console.error('Voice upload error:', error);
          toast.error("Не удалось загрузить голосовое сообщение");
        } finally {
          setIsUploading(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Запись началась...");
    } catch (error) {
      console.error('Recording error:', error);
      
      // Provide specific error messages based on the error type
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error("Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера.");
        } else if (error.name === 'NotFoundError') {
          toast.error("Микрофон не найден. Подключите микрофон и попробуйте снова.");
        } else if (error.name === 'NotReadableError') {
          toast.error("Микрофон занят другим приложением. Закройте другие приложения и попробуйте снова.");
        } else if (error.name === 'OverconstrainedError') {
          toast.error("Микрофон не поддерживает требуемые настройки.");
        } else if (error.name === 'SecurityError') {
          toast.error("Запись аудио заблокирована по соображениям безопасности. Используйте HTTPS соединение.");
        } else {
          toast.error("Не удалось начать запись. Проверьте подключение микрофона.");
        }
      } else {
        toast.error("Не удалось начать запись. Проверьте подключение микрофона.");
      }
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      toast.success("Запись остановлена");
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
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
                  {comment.text && (
                    <p className="text-sm">{formatCommentText(comment.text)}</p>
                  )}

                  {/* Comment attachments */}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comment.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <span className="text-lg">{getFileIcon(attachment.fileType)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{attachment.fileName}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(attachment.fileUrl, '_blank')}
                          >
                            <Download size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

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

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getFileIcon(attachment.fileType)}</span>
                  <div>
                    <p className="text-sm font-medium">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* File upload button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip size={16} className="mr-1" />
              Файл
            </Button>

            {/* Voice recording button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              className={isRecording ? "text-red-500" : ""}
            >
              <Mic size={16} className="mr-1" />
              {isRecording ? "Стоп" : "Голос"}
            </Button>

            {isUploading && (
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            )}
          </div>

          <Button
            onClick={handleAddComment}
            disabled={isCreatingComment || (!newComment.trim() && attachments.length === 0)}
          >
            {isCreatingComment ? "Публикуется..." : "Опубликовать комментарий"}
          </Button>
        </div>
      </div>

    </div>
  );
};
