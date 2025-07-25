import * as React from "react";
// import { useMedia } from "react-use";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export const ResponsiveDialog = ({
  open,
  onOpenChange,
  title,
  children,
}: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
        <DialogContent className="max-h-[80vh] overflow-y-auto hide-scrollbar">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
      <DrawerContent className="px-2 py-6 max-h-[90vh]">
        <DrawerHeader className="px-4">
          <DrawerTitle className="text-left">{title}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-full overflow-y-auto hide-scrollbar">
          {children}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
