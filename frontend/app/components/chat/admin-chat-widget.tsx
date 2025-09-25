import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Paperclip, Smile, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-context";
import { useLanguage } from "@/providers/language-context";
import { cn } from "@/lib/utils";

interface AdminMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
    role: string;
  };
  recipient?: {
    _id: string;
    name: string;
    profilePicture?: string;
    role: string;
  };
  message: string;
  messageType: "direct" | "broadcast" | "system";
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  isEdited: boolean;
  reactions: Array<{
    user: string;
    emoji: string;
  }>;
  replyTo?: {
    _id: string;
    message: string;
    sender: {
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface AdminChatWidgetProps {
  className?: string;
}

export const AdminChatWidget = ({ className }: AdminChatWidgetProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineAdmins, setOnlineAdmins] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<AdminMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only show for admins and super admins
  if (!user || !user._id || !user.role || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchOnlineAdmins();
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time message polling when chat is open
  useEffect(() => {
    if (isOpen) {
      const messageInterval = setInterval(() => {
        fetchMessages();
        fetchOnlineAdmins();
      }, 3000); // Check for new messages every 3 seconds when chat is open
      
      return () => clearInterval(messageInterval);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api-v1/admin-messages", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api-v1/admin-messages/unread-count", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchOnlineAdmins = async () => {
    try {
      const response = await fetch("/api-v1/admin-messages/online-admins", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOnlineAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error fetching online admins:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const messageData = {
        message: newMessage,
        messageType: selectedRecipient ? "direct" : "broadcast",
        recipient: selectedRecipient,
        priority: "normal",
        language: "ru",
      };

      if (replyTo) {
        const response = await fetch(`/api-v1/admin-messages/${replyTo._id}/reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            message: newMessage,
            priority: "normal",
            language: "ru",
          }),
        });

        if (response.ok) {
          setNewMessage("");
          setReplyTo(null);
          fetchMessages();
        }
      } else {
        const response = await fetch("/api-v1/admin-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(messageData),
        });

        if (response.ok) {
          setNewMessage("");
          fetchMessages();
          fetchUnreadCount();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api-v1/admin-messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api-v1/admin-messages/${messageId}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ emoji }),
      });
      fetchMessages();
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 text-xs text-white p-0 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {isOpen && (
        <Card className="w-[calc(100vw-2rem)] max-w-96 h-[calc(100vh-2rem)] max-h-[600px] shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Админ чат
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
            {/* Online Admins */}
            <div className="p-3 border-b">
              <div className="text-sm font-medium mb-2">
                Онлайн админы
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={selectedRecipient === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRecipient(null)}
                >
                  Всем
                </Button>
                {onlineAdmins
                  .filter((admin) => admin._id !== user?._id)
                  .map((admin) => (
                    <Button
                      key={admin._id}
                      variant={selectedRecipient === admin._id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRecipient(admin._id)}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          admin.isOnline ? "bg-green-500" : "bg-gray-400"
                        )}
                      />
                      {admin.name}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender._id === user?._id;
                  const shouldMarkAsRead = !isOwnMessage && !message.isRead;

                  if (shouldMarkAsRead) {
                    markAsRead(message._id);
                  }

                  return (
                    <div
                      key={message._id}
                      className={cn(
                        "flex gap-2",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[70%] space-y-1",
                          isOwnMessage ? "items-end" : "items-start"
                        )}
                      >
                        {/* Message header */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {!isOwnMessage && (
                            <span className="font-medium">
                              {message.sender.name}
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-xs px-1 py-0"
                          >
                            {message.sender.role === "super_admin"
                              ? "Супер админ"
                              : "Админ"}
                          </Badge>
                          <span>{formatTime(message.createdAt)}</span>
                        </div>

                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded border-l-2 border-blue-500">
                            <div className="font-medium">
                              {message.replyTo.sender.name}:
                            </div>
                            <div className="truncate">
                              {message.replyTo.message}
                            </div>
                          </div>
                        )}

                        {/* Message content */}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm relative group",
                            isOwnMessage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          {/* Priority indicator */}
                          {message.priority !== "normal" && (
                            <div
                              className={cn(
                                "absolute -top-1 -left-1 w-3 h-3 rounded-full",
                                getPriorityColor(message.priority)
                              )}
                            />
                          )}

                          <div className="break-words">{message.message}</div>

                          {message.isEdited && (
                            <div className="text-xs opacity-70 mt-1">
                              изменено
                            </div>
                          )}

                          {/* Message actions */}
                          <div className="absolute -top-8 right-0 hidden group-hover:flex bg-white border rounded shadow-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setReplyTo(message)}
                            >
                              ↩️
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => addReaction(message._id, "👍")}
                            >
                              👍
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => addReaction(message._id, "❤️")}
                            >
                              ❤️
                            </Button>
                          </div>
                        </div>

                        {/* Reactions */}
                        {message.reactions.length > 0 && (
                          <div className="flex gap-1">
                            {message.reactions.map((reaction, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs px-1 py-0 cursor-pointer"
                                onClick={() =>
                                  addReaction(message._id, reaction.emoji)
                                }
                              >
                                {reaction.emoji}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Message type indicator */}
                        {message.messageType === "broadcast" && (
                          <Badge variant="outline" className="text-xs">
                            Всем
                          </Badge>
                        )}
                      </div>

                      {isOwnMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply indicator */}
            {replyTo && (
              <div className="p-2 bg-blue-50 border-t flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">
                    Отвечаете {replyTo.sender.name}:
                  </div>
                  <div className="text-gray-600 truncate">
                    {replyTo.message}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Message input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    selectedRecipient
                      ? "Напишите личное сообщение..."
                      : "Напишите сообщение всем..."
                  }
                  className="min-h-[40px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="h-10 w-10 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
