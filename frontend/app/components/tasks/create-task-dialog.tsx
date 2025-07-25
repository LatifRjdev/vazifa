import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { useCreateTaskMutation } from "@/hooks/use-task";
import type { ProjectMemberRole, User } from "@/types";
import { createTaskSchema } from "@/utils/schema";

interface CreateTaskDialogProps {
  isCreateTaskOpen: boolean;
  setIsCreateTaskOpen: (isOpen: boolean) => void;
  projectId: string;
  projectMembers: { user: User; role: ProjectMemberRole }[];
}

export type TaskFormData = z.infer<typeof createTaskSchema>;

export const CreateTaskDialog = ({
  isCreateTaskOpen,
  setIsCreateTaskOpen,
  projectId,
  projectMembers,
}: CreateTaskDialogProps) => {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "To Do",
      priority: "Medium",
      dueDate: "",
      assignees: [],
    },
  });

  const { mutate, isPending } = useCreateTaskMutation();

  const onSubmit = (data: TaskFormData) => {
    mutate(
      { taskData: data, projectId },
      {
        onSuccess: () => {
          toast.success("Task created successfully");
          setIsCreateTaskOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Создать Новую Задачу</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Введите название задачи" />
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
                        placeholder="Введите описание задачи"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormItem>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="To Do">Сделать</SelectItem>
                              <SelectItem value="In Progress">
                                В процессе
                              </SelectItem>
                              <SelectItem value="Done">Сделано</SelectItem>
                            </SelectContent>
                          </FormItem>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Приоритет</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormItem>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Низкий</SelectItem>
                              <SelectItem value="Medium">Средний</SelectItem>
                              <SelectItem value="High">Высокий</SelectItem>
                            </SelectContent>
                          </FormItem>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок Исполнения</FormLabel>
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

              <FormField
                control={form.control}
                name="assignees"
                render={({ field }) => {
                  const selectedMembers = field.value || [];
                  return (
                    <FormItem>
                      <FormLabel>Назначенные участники</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal min-h-11"
                            >
                              {selectedMembers.length === 0 ? (
                                <span className="text-muted-foreground">
                                  Выбрать участников
                                </span>
                              ) : selectedMembers.length <= 2 ? (
                                selectedMembers
                                  .map((m) => {
                                    const member = projectMembers.find(
                                      (wm) => wm.user._id === m
                                    );
                                    return `${member?.user.name}`;
                                  })
                                  .join(", ")
                              ) : (
                                `${selectedMembers.length} assignees selected`
                              )}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent
                            className="w-sm max-h-60 overflow-y-auto p-2"
                            align="start"
                          >
                            <div className="flex flex-col gap-2">
                              {projectMembers.map((member) => {
                                const selectedMember = selectedMembers.find(
                                  (m) => m === member.user?._id
                                );
                                return (
                                  <div
                                    key={member.user._id}
                                    className="flex items-center gap-2 p-2 border rounded"
                                  >
                                    <Checkbox
                                      checked={!!selectedMember}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([
                                            ...selectedMembers,

                                            member.user._id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            selectedMembers.filter(
                                              (m) => m !== member.user._id
                                            )
                                          );
                                        }
                                      }}
                                      id={`member-${member.user._id}`}
                                    />
                                    <span className="truncate flex-1">
                                      {member.user.name}
                                    </span>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTaskOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
