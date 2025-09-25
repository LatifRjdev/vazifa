import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  title?: string;
  buttonText?: string;
}

export const ConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Delete Confirmation",
  message,
  buttonText = "Confirm",
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
