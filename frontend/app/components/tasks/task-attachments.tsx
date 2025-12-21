import axios from "axios";
import { Link2, Paperclip, UploadCloud } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddTaskAttachmentMutation } from "@/hooks/use-task";
import type { Attachment } from "@/types";

export const TaskAttachments = ({
  attachments,
  taskId,
}: {
  attachments: Attachment[];
  taskId: string;
}) => {
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { mutate: addTaskAttachment, isPending: isAddingAttachment } =
    useAddTaskAttachmentMutation();
  const resetForm = () => {
    setAttachmentName("");
    setAttachmentUrl("");
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError("");
    setSuccess("");
  };

  const handleAddAttachment = async () => {
    setError("");
    setSuccess("");
    if (activeTab === "upload") {
      if (!file) {
        setError("Please select a file to upload.");
        return;
      }
      if (file.size > 1024 * 1024) {
        setError("File size must be less than 1MB.");
        return;
      }
      setUploading(true);
      setUploadProgress(0);
      try {
        // --- Backend upload logic ---
        const url = '/api-v1/upload';

        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token");
        const response = await axios.post(url, formData, {
          headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadProgress(
                Math.round((progressEvent.loaded * 100) / progressEvent.total)
              );
            }
          },
        });
        
        const uploadedUrl = response.data.data.secure_url;
        const fileType = response.data.data.mimetype || response.data.data.resource_type;
        const fileSize = response.data.data.bytes;
        const fileName = response.data.data.original_filename;

        addTaskAttachment(
          {
            taskId: taskId,
            attachment: {
              fileName,
              fileUrl: uploadedUrl,
              fileType,
              fileSize,
            },
          },
          {
            onSuccess: () => {
              setSuccess("File uploaded successfully!");
              setTimeout(() => {
                resetForm();
                setShowAttachmentForm(false);
              }, 3000);
            },
            onError: (error: any) => {
              setError("Upload failed. Please try again.");
              console.error(error);
            },
          }
        );
      } catch (err: any) {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
      // ------------------------------------------
    } else {
      if (!attachmentName || !attachmentUrl) {
        setError("Please provide both file name and URL.");
        return;
      }

      addTaskAttachment(
        {
          taskId: taskId,
          attachment: {
            fileName: attachmentName,
            fileUrl: attachmentUrl,
            fileType: "URL",
            fileSize: 0,
          },
        },
        {
          onSuccess: () => {
            setSuccess("Attachment added by URL!");
            setTimeout(() => {
              resetForm();
              setShowAttachmentForm(false);
            }, 3000);
          },
          onError: (error: any) => {
            setError("Upload failed. Please try again.");
            console.error(error);
          },
        }
      );
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
          <Paperclip className="h-4 w-4 mr-2" /> Вложения
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAttachmentForm(!showAttachmentForm)}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {showAttachmentForm && (
        <div className="bg-muted/30 p-6 rounded-xl mb-4 shadow-lg border border-muted/50">
          <div className="flex mb-4 border-b border-muted/40">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg transition-colors duration-150 ${
                activeTab === "upload"
                  ? "bg-background text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
              onClick={() => setActiveTab("upload")}
              type="button"
            >
              <UploadCloud className="inline h-4 w-4 mr-1" /> Загрузить
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-t-lg transition-colors duration-150 ${
                activeTab === "url"
                  ? "bg-background text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
              onClick={() => setActiveTab("url")}
              type="button"
            >
              <Link2 className="inline h-4 w-4 mr-1" /> По URL-адресу
            </button>
          </div>
          <div className="grid gap-4">
            {activeTab === "upload" ? (
              <>
                <Input
                  type="file"
                  accept="*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading || isAddingAttachment}
                />
                {file && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Выбрано: <span className="font-medium">{file.name}</span> (
                    {Math.round(file.size / 1024)} KB)
                  </div>
                )}
                {uploading && (
                  <div className="w-full bg-muted rounded h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <Input
                  placeholder="File name"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  disabled={uploading || isAddingAttachment}
                />
                <Input
                  placeholder="File URL"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  disabled={uploading || isAddingAttachment}
                />
              </>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <div className="flex justify-end space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAttachmentForm(false);
                  resetForm();
                }}
                disabled={uploading || isAddingAttachment}
              >
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={handleAddAttachment}
                disabled={
                  uploading ||
                  isAddingAttachment ||
                  (activeTab === "upload"
                    ? !file
                    : !attachmentName || !attachmentUrl)
                }
              >
                {uploading || isAddingAttachment
                  ? "Uploading..."
                  : "Добавить вложение"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {attachments && attachments.length > 0 ? (
          attachments.map((attachment, index) => (
            <div
              key={attachment._id || index}
              className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors duration-150"
            >
              <div className="flex items-center flex-1">
                <div className="bg-blue-600/10 p-2 rounded mr-2">
                  <Paperclip className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.fileType} •{" "}
                    {attachment.fileSize > 0
                      ? Math.round(attachment.fileSize / 1024) + " KB"
                      : "Unknown file size"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  Открыть
                </a>
                <a
                  href={attachment.fileUrl}
                  download={attachment.fileName}
                  className="text-green-600 hover:text-green-800 text-xs font-medium"
                >
                  Скачать
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground px-2">
            Без вложений
          </div>
        )}
      </div>
    </div>
  );
};
