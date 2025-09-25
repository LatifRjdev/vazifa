import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { RussianCalendar } from "@/components/ui/russian-calendar";
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
import { fetchData } from "@/lib/fetch-utils";
import type { User } from "@/types";

// Схема для создания задач без обязательной организации
const createTaskSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  status: z.enum(["To Do", "In Progress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()),
  responsibleManager: z.string().optional(),
});

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations?: any[];
}

export type TaskFormData = z.infer<typeof createTaskSchema>;

export const CreateTaskDialog = ({
  open,
  onOpenChange,
  organizations,
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

  // Получить всех пользователей системы
  const { data: usersData } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => fetchData("/users/all"),
    enabled: open,
  }) as {
    data: { users: User[] };
  };

  const { mutate, isPending } = useCreateTaskMutation();

  const allUsers = usersData?.users || [];

  const onSubmit = (data: TaskFormData) => {
    mutate(
      { taskData: data },
      {
        onSuccess: () => {
          toast.success("Задача успешно создана");
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message || "Ошибка создания задачи");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Создать новую задачу</DialogTitle>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To Do">К выполнению</SelectItem>
                            <SelectItem value="In Progress">В процессе</SelectItem>
                            <SelectItem value="Done">Выполнено</SelectItem>
                          </SelectContent>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите приоритет" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Низкий</SelectItem>
                            <SelectItem value="Medium">Средний</SelectItem>
                            <SelectItem value="High">Высокий</SelectItem>
                          </SelectContent>
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
                    <FormLabel>Срок выполнения</FormLabel>
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
                              format(new Date(field.value), "PPP", { locale: ru })
                            ) : (
                              <span>Выберите дату</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <RussianCalendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date: Date | undefined) =>
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
                name="responsibleManager"
                render={({ field }) => {
                  const managers = allUsers.filter(user => user && ["admin", "manager"].includes(user.role));
                  return (
                    <FormItem>
                      <FormLabel>Ответственный менеджер</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) => {
                            field.onChange(value === "none" ? undefined : value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите ответственного менеджера" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Не назначен</SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager._id} value={manager._id}>
                                {manager.name} ({manager.role === "admin" ? "Админ" : "Менеджер"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="assignees"
                render={({ field }) => {
                  const selectedMembers = field.value || [];
                  return (
                    <FormItem>
                      <FormLabel>Назначить участникам</FormLabel>
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
                                    const user = allUsers.find(
                                      (u) => u && u._id === m
                                    );
                                    return user?.name || "Неизвестный";
                                  })
                                  .join(", ")
                              ) : (
                                `Выбрано участников: ${selectedMembers.length}`
                              )}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent
                            className="w-sm max-h-60 overflow-y-auto p-2"
                            align="start"
                          >
                            <div className="flex flex-col gap-2">
                              {allUsers.filter(user => user && user._id).map((user) => {
                                const isSelected = selectedMembers.includes(user._id);
                                return (
                                  <div
                                    key={user._id}
                                    className="flex items-center gap-2 p-2 border rounded"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([
                                            ...selectedMembers,
                                            user._id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            selectedMembers.filter(
                                              (m) => m !== user._id
                                            )
                                          );
                                        }
                                      }}
                                      id={`user-${user._id}`}
                                    />
                                    <span className="truncate flex-1">
                                      {user.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {user.role === "admin" ? "Админ" :
                                       user.role === "manager" ? "Менеджер" : "Участник"}
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
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Создание..." : "Создать задачу"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
