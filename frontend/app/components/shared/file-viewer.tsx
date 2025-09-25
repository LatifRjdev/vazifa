import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Eye, X } from "lucide-react";

interface FileViewerProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export const FileViewer = ({ fileName, fileUrl, fileType, fileSize }: FileViewerProps) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const canPreview = (fileType: string) => {
    return (
      fileType.startsWith('image/') ||
      fileType.startsWith('video/') ||
      fileType.startsWith('audio/') ||
      fileType.includes('pdf')
    );
  };

  const renderFilePreview = () => {
    if (fileType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    if (fileType.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-[70vh]"
          >
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        </div>
      );
    }

    if (fileType.startsWith('audio/')) {
      return (
        <div className="flex justify-center p-8">
          <audio src={fileUrl} controls className="w-full max-w-md">
            Ваш браузер не поддерживает воспроизведение аудио.
          </audio>
        </div>
      );
    }

    if (fileType.includes('pdf')) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
          >
            <p>
              Ваш браузер не поддерживает просмотр PDF файлов.{' '}
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                Скачать файл
              </a>
            </p>
          </iframe>
        </div>
      );
    }

    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Предварительный просмотр недоступен для этого типа файла
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
        <span className="text-lg">{getFileIcon(fileType)}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        </div>
        <div className="flex gap-1">
          {canPreview(fileType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsViewerOpen(true)}
              title="Просмотр"
            >
              <Eye size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            title="Скачать"
          >
            <Download size={14} />
          </Button>
        </div>
      </div>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">{fileName}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  <Download size={16} className="mr-1" />
                  Скачать
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewerOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-auto">
            {renderFilePreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
