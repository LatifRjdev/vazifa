import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Paperclip, X, Mic, Download } from "lucide-react";
import type { Response, User } from "@/types";
import { Loader } from "../loader";
import { FileViewer } from "../shared/file-viewer";
import { toast } from "sonner";
import { getUserAvatar } from "@/lib";
import { useAuth } from "@/providers/auth-context";
import { useGetTaskResponsesByIdQuery, useCreateResponseMutation } from "@/hooks/use-task";

interface ResponseSectionProps {
  taskId: string;
  task?: any; // Добавляем опциональный параметр task
}

export const ResponseSection = ({
  taskId,
  task,
}: ResponseSectionProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newResponse, setNewResponse] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Используем реальные хуки
  const { data: responses = [], isLoading } = useGetTaskResponsesByIdQuery(taskId);
  const createResponseMutation = useCreateResponseMutation();
  
  // Приводим responses к правильному типу
  const typedResponses = responses as Response[];

  // Проверяем, может ли пользователь создавать ответы (назначенные участники + админы и менеджеры)
  const canCreateResponse = task?.assignees?.some((assignee: any) => {
    // Проверяем как объект с _id, так и просто строку ID
    const assigneeId = typeof assignee === 'string' ? assignee : assignee._id;
    return assigneeId === user?._id;
  }) || user?.role === 'admin' || user?.role === 'manager';

  const handleAddResponse = async () => {
    if (!newResponse.trim() && attachments.length === 0) {
      toast.error("Добавьте текст или прикрепите файл");
      return;
    }

    try {
      await createResponseMutation.mutateAsync({
        taskId,
        text: newResponse.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setNewResponse("");
      setAttachments([]);
      toast.success("Ответ добавлен");
    } catch (error) {
      console.error('Error creating response:', error);
      toast.error("Не удалось добавить ответ");
    }
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

  if (isLoading) {
    return <Loader message="Загрузка ответов..." />;
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Ответы ({typedResponses.length})</h3>

      <ScrollArea className="h-[300px] mb-4">
        <div className="space-y-4">
          {typedResponses.length > 0 ? (
            typedResponses.map((response: Response) => (
              <div key={response._id} className="flex gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      response.author.profilePicture ||
                      getUserAvatar(response.author.name)
                    }
                  />
                  <AvatarFallback>
                    {response.author.name ? response.author.name.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">
                      {response.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(response.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                  {response.text && (
                    <p className="text-sm">{response.text}</p>
                  )}

                  {/* Response attachments */}
                  {response.attachments && response.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {response.attachments.map((attachment: any, index: number) => (
                        <FileViewer
                          key={index}
                          fileName={attachment.fileName}
                          fileUrl={attachment.fileUrl}
                          fileType={attachment.fileType || ''}
                          fileSize={attachment.fileSize || 0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Нет ответов</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {canCreateResponse && (
        <>
          <Separator className="my-4" />

          <div className="mt-4">
            <Textarea
              placeholder="Добавить ответ..."
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              className="mb-2"
            />

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
                onClick={handleAddResponse}
                disabled={createResponseMutation.isPending || (!newResponse.trim() && attachments.length === 0)}
              >
                {createResponseMutation.isPending ? "Отправляется..." : "Отправить ответ"}
              </Button>
            </div>
          </div>
        </>
      )}

      {!canCreateResponse && typedResponses.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            Только назначенные участники могут оставлять ответы на эту задачу
          </p>
        </div>
      )}
    </div>
  );
};
