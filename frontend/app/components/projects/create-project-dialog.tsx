import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projectSchema } from "@/utils/schema";
import type { MemberProps } from "../workspace/workspace-header";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateProject } from "@/hooks/use-project";
import { DATA_STATUS } from "./project-settings-form";

interface CreateProjectDialogProps {
  workspaceId: string | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceMembers: MemberProps[];
}

export type ProjectData = z.infer<typeof projectSchema>;

type MemberWithRole = {
  userId: string;
  role: "manager" | "contributor" | "viewer";
};

export const CreateProjectDialog = ({
  workspaceId,
  isOpen,
  onOpenChange,
  workspaceMembers,
}: CreateProjectDialogProps) => {
  const form = useForm<ProjectData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Planning",
      startDate: undefined,
      dueDate: undefined,
      tags: undefined,
      members: [],
    },
  });

  const { mutate, isPending } = useCreateProject();

  const onSubmit = async (values: ProjectData) => {
    if (!workspaceId) {
      toast.error("Workspace not selected.");
      return;
    }
    try {
      mutate(
        { projectData: values, workspaceId },
        {
          onSuccess: () => {
            toast.success("Project created successfully!");
            form.reset();
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error("Failed to create project.");
            console.error("Create project error:", error);
          },
        }
      );
    } catch (error) {
      toast.error("Failed to create project.");
      console.error("Create project error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Создать проект</DialogTitle>
          <DialogDescription>
            Создайте новый проект, чтобы начать отслеживать прогресс.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название проекта</FormLabel>
                  <FormControl>
                    <Input placeholder="Название проекта" {...field} />
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
                    <Textarea placeholder="Описание проекта" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата начала</FormLabel>
                    <FormControl>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={
                              "w-full justify-start text-left font-normal " +
                              (!field.value ? "text-muted-foreground" : "")
                            }
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Выберите дату</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? date.toISOString() : undefined
                              )
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок исполнения</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={
                              "w-full justify-start text-left font-normal " +
                              (!field.value ? "text-muted-foreground" : "")
                            }
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Выберите дату</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? date.toISOString() : undefined
                              )
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Теги</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите теги, разделенные запятыми (например, веб, мобильный, бэкэнд)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="members"
              render={({ field }) => {
                const selectedMembers = field.value || [];
                return (
                  <FormItem>
                    <FormLabel>Участники</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal min-h-11"
                          >
                            {selectedMembers.length === 0 ? (
                              <span className="text-muted-foreground">
                                Выберите участников
                              </span>
                            ) : selectedMembers.length <= 2 ? (
                              selectedMembers
                                .map((m) => {
                                  const member = workspaceMembers.find(
                                    (wm) => wm.user._id === m.user
                                  );
                                  return `${member?.user.name} (${m.role})`;
                                })
                                .join(", ")
                            ) : (
                              `${selectedMembers.length} members selected`
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-sm max-h-60 overflow-y-auto p-2"
                          align="start"
                        >
                          <div className="flex flex-col gap-2">
                            {workspaceMembers.map((member) => {
                              const selectedMember = selectedMembers.find(
                                (m) => m.user === member.user._id
                              );
                              return (
                                <div
                                  key={member._id}
                                  className="flex items-center gap-2 p-2 border rounded"
                                >
                                  <Checkbox
                                    checked={!!selectedMember}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([
                                          ...selectedMembers,
                                          {
                                            user: member.user._id,
                                            role: "contributor",
                                          },
                                        ]);
                                      } else {
                                        field.onChange(
                                          selectedMembers.filter(
                                            (m) => m.user !== member.user._id
                                          )
                                        );
                                      }
                                    }}
                                    id={`member-${member.user._id}`}
                                  />
                                  <span className="truncate flex-1">
                                    {member.user.name}
                                  </span>
                                  {selectedMember && (
                                    <Select
                                      value={selectedMember.role}
                                      onValueChange={(role) => {
                                        field.onChange(
                                          selectedMembers.map((m) =>
                                            m.user === member.user._id
                                              ? {
                                                  ...m,
                                                  role: role as
                                                    | "manager"
                                                    | "contributor"
                                                    | "viewer",
                                                }
                                              : m
                                          )
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="manager">
                                          Менеджер
                                        </SelectItem>
                                        <SelectItem value="contributor">
                                          Автор
                                        </SelectItem>
                                        <SelectItem value="viewer">
                                          Оценщик
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
