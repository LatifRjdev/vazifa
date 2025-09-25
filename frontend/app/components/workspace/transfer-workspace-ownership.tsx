import type { User, Workspace } from "@/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { getUserAvatar } from "@/lib";

interface TransferWorkspaceOwnershipProps {
  transferDialogOpen: boolean;
  setTransferDialogOpen: (open: boolean) => void;
  data: Workspace;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  handleTransferOwnership: () => void;
  isTransferring: boolean;
}

export const TransferWorkspaceOwnership = ({
  transferDialogOpen,
  setTransferDialogOpen,
  data,
  selectedMemberId,
  setSelectedMemberId,
  handleTransferOwnership,
  isTransferring,
}: TransferWorkspaceOwnershipProps) => {
  return (
    <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Передача права собственности на рабочее пространство</DialogTitle>
          <DialogDescription>
            Выберите участника, которому нужно передать право собственности на это рабочее пространство. Это действие
            не может быть отменено.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {data.members.filter((m) => m.role !== "owner").length === 0 ? (
            <div className="text-muted-foreground text-center">
              Нет членов, имеющих право передавать право собственности.
            </div>
          ) : (
            data.members
              .filter((m) => m.role !== "owner")
              .map((member) => (
                <label
                  key={member.user._id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition hover:bg-muted ${
                    selectedMemberId === member.user._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={
                      member.user.profilePicture ||
                      getUserAvatar(member.user.name)
                    }
                    alt={member.user.name}
                    className="h-8 w-8 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{member.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.user.email}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="transfer-member"
                    checked={selectedMemberId === member.user._id}
                    onChange={() => setSelectedMemberId(member.user._id)}
                    className="accent-blue-500"
                  />
                </label>
              ))
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setTransferDialogOpen(false)}
            type="button"
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            disabled={!selectedMemberId || isTransferring}
            onClick={handleTransferOwnership}
            type="button"
          >
            {isTransferring ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
