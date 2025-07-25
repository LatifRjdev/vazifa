import { useConfirmation } from "@/hooks/use-confirmation";
import {
  useDeleteWorkspaceMutation,
  useTransferWorkspaceOwnershipMutation,
  useUpdateWorkspaceMutation,
} from "@/hooks/use-workspace";
import type { Workspace } from "@/types";
import { workspaceSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmationDialog } from "../dialogs/confirmation-dialog";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { colorOptions } from "./create-workspace";
import { TransferWorkspaceOwnership } from "./transfer-workspace-ownership";

type WorkspaceSettingData = z.infer<typeof workspaceSchema>;

export const WorkspaceSettingsForm = ({ data }: { data: Workspace }) => {
  const navigate = useNavigate();
  const { isOpen, confirm, handleConfirm, handleCancel, confirmationOptions } =
    useConfirmation();

  const form = useForm<WorkspaceSettingData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: data.name || "",
      description: data.description || "",
      color: data.color || colorOptions[0],
    },
  });

  const { mutate, isPending } = useUpdateWorkspaceMutation();
  const { mutate: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspaceMutation();
  const { mutate: transferWorkspaceOwnership, isPending: isTransferring } =
    useTransferWorkspaceOwnershipMutation();

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleSubmit = (values: WorkspaceSettingData) => {
    mutate(
      {
        workspaceId: data?._id,
        name: values.name,
        description: values.description || "",
        color: values.color || colorOptions[0],
      },
      {
        onSuccess: () => {
          toast.success("Workspace updated successfully");
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message || "Failed to update workspace";
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleDeleteWorkspace = () => {
    confirm({
      title: "Delete Workspace",
      message:
        "This action cannot be undone. This will permanently delete your workspace and remove all associated data.",
      onConfirm: async () => {
        deleteWorkspace(data._id, {
          onSuccess: () => {
            toast.success("Workspace deleted successfully");
            navigate("/workspaces");
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message || "Failed to delete workspace";
            toast.error(errorMessage);
          },
        });
      },
    });
  };

  const handleTransferOwnership = () => {
    if (!selectedMemberId) {
      toast.error("Please select a member to transfer ownership to");
      return;
    }

    transferWorkspaceOwnership(
      {
        workspaceId: data._id,
        newOwnerId: selectedMemberId,
      },
      {
        onSuccess: () => {
          toast.success("Workspace ownership transferred successfully");
          setTransferDialogOpen(false);
          setSelectedMemberId(null);
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            "Failed to transfer workspace ownership";
          toast.error(errorMessage);
          console.log(error);
        },
      }
    );
  };

  return (
    <div className="p-3 md:p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <span>Настройки рабочей области</span>
          </CardTitle>
          <CardDescription>
            Управляйте настройками и предпочтениями своего рабочего пространства
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя рабочей области</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter workspace name" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter workspace description"
                      ></Textarea>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цвет рабочей области</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map((color) => (
                          <label
                            key={color}
                            className="flex items-center cursor-pointer"
                          >
                            <input
                              type="radio"
                              value={color}
                              checked={field.value === color}
                              onChange={() => field.onChange(color)}
                              className="hidden"
                            />
                            <span
                              className={`w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg ${
                                field.value === color
                                  ? "ring-2 ring-offset-2 ring-blue-500 border-blue-500"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                            >
                              {field.value === color && (
                                <span className="w-3 h-3 bg-white rounded-full block" />
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="w-full flex justify-end">
                <Button disabled={isPending}>Сохранить изменения</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Transfer Workspace Ownership */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-row justify-between">
            Перенос рабочей области
          </CardTitle>
          <CardDescription>
            Передать право собственности на это рабочее пространство другому участнику
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="secondary"
            onClick={() => setTransferDialogOpen(true)}
          >
            Перенос рабочей области
          </Button>
        </CardContent>
      </Card>

      <TransferWorkspaceOwnership
        transferDialogOpen={transferDialogOpen}
        setTransferDialogOpen={setTransferDialogOpen}
        data={data}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        handleTransferOwnership={handleTransferOwnership}
        isTransferring={isTransferring}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Опасная зона</CardTitle>
          <CardDescription>
            Необратимые действия для вашего рабочего пространства
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteWorkspace}
            disabled={isDeleting}
          >
            Удалить рабочую область
          </Button>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={confirmationOptions?.title || ""}
        message={confirmationOptions?.message || ""}
      />
    </div>
  );
};
