import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useLanguage } from "@/providers/language-context";

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
  const { t } = useLanguage();
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

  const [isMultiTask, setIsMultiTask] = useState(false);
  const [multipleTasks, setMultipleTasks] = useState<Array<{ description: string; dueDate: string; assignees: string[] }>>([
    { description: "", dueDate: "", assignees: [] },
    { description: "", dueDate: "", assignees: [] }
  ]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [multiTaskAssigneesOpen, setMultiTaskAssigneesOpen] = useState<number | null>(null);

  const { data: usersData } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => fetchData("/users/all"),
    enabled: open,
  }) as {
    data: { users: User[] };
  };

  const { mutate, isPending } = useCreateTaskMutation();

  const allUsers = usersData?.users || [];

  const onSubmit = async (data: TaskFormData) => {
    if (isMultiTask) {
      if (multipleTasks.length < 2) {
        toast.error(t('tasks.min_tasks_required'));
        return;
      }
      
      if (multipleTasks.some(t => !t.description.trim())) {
        toast.error('Все описания задач обязательны');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('/api-v1/tasks/create-multiple', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: data.title,
            tasks: multipleTasks,
            status: data.status,
            priority: data.priority,
            assignees: data.assignees,
            responsibleManager: data.responsibleManager
          })
        });
        
        const result = await response.json();
        
        if (result.tasks && Array.isArray(result.tasks) && result.tasks.length > 0) {
          toast.success(`Успешно создано ${result.tasks.length} задач`);
          onOpenChange(false);
          form.reset();
          setIsMultiTask(false);
          setMultipleTasks([
            { description: '', dueDate: '', assignees: [] },
            { description: '', dueDate: '', assignees: [] }
          ]);
        } else if (!response.ok) {
          throw new Error(result.message || 'Ошибка создания мультизадач');
        }
      } catch (error: any) {
        console.error('Ошибка создания мультизадач:', error);
        toast.error(error.message || 'Ошибка создания мультизадач');
      }
    } else {
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('tasks.create_new_task')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.task_name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('tasks.enter_task_name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="multi-task"
                  checked={isMultiTask}
                  onCheckedChange={(checked) => {
                    setIsMultiTask(!!checked);
                    if (checked && multipleTasks.length < 2) {
                      setMultipleTasks([
                        { description: "", dueDate: "", assignees: [] },
                        { description: "", dueDate: "", assignees: [] }
                      ]);
                    }
                  }}
                />
                <div className="grid gap-1">
                  <label htmlFor="multi-task" className="text-sm font-medium leading-none cursor-pointer">
                    {t('tasks.multi_task')}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {t('tasks.multi_task_desc')}
                  </p>
                </div>
              </div>

              {!isMultiTask ? (
                <>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.task_desc')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t('tasks.enter_task_desc')} />
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
                        <FormLabel>{t('tasks.due_date')}</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={"w-full justify-start text-left font-normal " + (!field.value ? "text-muted-foreground" : "")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP", { locale: ru }) : <span>{t('tasks.select_date')}</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <RussianCalendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date: Date | undefined) => field.onChange(date ? date.toISOString() : undefined)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  {multipleTasks.map((task, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold flex-1">
                          {t('tasks.task_number').replace('{number}', (index + 1).toString())}
                        </h4>
                        {multipleTasks.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" className="shrink-0 -mt-1" onClick={() => setMultipleTasks(multipleTasks.filter((_, i) => i !== index))}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">{t('tasks.task_desc')}</label>
                          <Textarea
                            value={task.description}
                            onChange={(e) => {
                              const newTasks = [...multipleTasks];
                              newTasks[index].description = e.target.value;
                              setMultipleTasks(newTasks);
                            }}
                            placeholder={t('tasks.enter_task_desc')}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('tasks.due_date')}</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" className="w-full justify-start mt-1">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {task.dueDate ? format(new Date(task.dueDate), "PPP", { locale: ru }) : t('tasks.select_date')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <RussianCalendar
                                mode="single"
                                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                onSelect={(date: Date | undefined) => {
                                  const newTasks = [...multipleTasks];
                                  newTasks[index].dueDate = date ? date.toISOString() : '';
                                  setMultipleTasks(newTasks);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="relative">
                          <label className="text-sm font-medium">{t('tasks.assign_participant')}</label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMultiTaskAssigneesOpen(multiTaskAssigneesOpen === index ? null : index)}
                            className="w-full justify-start text-left font-normal mt-1"
                          >
                            {task.assignees.length === 0 ? (
                              <span className="text-muted-foreground">{t('tasks.select_participant')}</span>
                            ) : task.assignees.length <= 2 ? (
                              task.assignees.map((m) => {
                                const user = allUsers.find((u) => u && u._id === m);
                                return user?.name || "Неизвестный";
                              }).join(", ")
                            ) : (
                              t('tasks.selected_participants_count').replace('{count}', task.assignees.length.toString())
                            )}
                          </Button>
                          {multiTaskAssigneesOpen === index && (
                            <div className="absolute z-[100] top-full left-0 mt-1 w-full bg-background border rounded-md shadow-lg p-2">
                              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                                {allUsers
                                  .filter(user => user && user._id)
                                  .map((user) => {
                                    const isSelected = user._id ? task.assignees.includes(user._id) : false;
                                    return (
                                      <div
                                        key={user._id}
                                        className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer select-none"
                                        onClick={() => {
                                          if (user._id) {
                                            const newTasks = [...multipleTasks];
                                            if (isSelected) {
                                              newTasks[index].assignees = task.assignees.filter(m => m !== user._id);
                                            } else {
                                              newTasks[index].assignees = [...task.assignees, user._id];
                                            }
                                            setMultipleTasks(newTasks);
                                          }
                                        }}
                                      >
                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                                          {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                        </div>
                                        <span className="truncate flex-1 text-sm">{user.name}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                              <div className="mt-2 pt-2 border-t">
                                <Button type="button" size="sm" onClick={() => setMultiTaskAssigneesOpen(null)} className="w-full">
                                  Готово ({task.assignees.length})
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={() => setMultipleTasks([...multipleTasks, { description: '', dueDate: '', assignees: [] }])} className="w-full">
                    + {t('tasks.add_task')}
                  </Button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tasks.task_status')}</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tasks.select_status')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="To Do">{t('status.todo')}</SelectItem>
                            <SelectItem value="In Progress">{t('status.in_progress')}</SelectItem>
                            <SelectItem value="Done">{t('status.done')}</SelectItem>
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
                      <FormLabel>{t('tasks.task_priority')}</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tasks.select_priority')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">{t('priority.low')}</SelectItem>
                            <SelectItem value="Medium">{t('priority.medium')}</SelectItem>
                            <SelectItem value="High">{t('priority.high')}</SelectItem>
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
                name="responsibleManager"
                render={({ field }) => {
                  const managers = allUsers.filter(user => user && ["admin", "manager", "super_admin"].includes(user.role));
                  return (
                    <FormItem>
                      <FormLabel>{t('tasks.task_manager')}</FormLabel>
                      <FormControl>
                        <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tasks.select_manager')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="none">{t('tasks.not_assigned')}</SelectItem>
                            {managers.filter(m => m._id).map((manager) => (
                              <SelectItem key={manager._id} value={manager._id || ""}>
                                {manager.name} ({manager.role === "admin" ? t('tasks.admin') : manager.role === "super_admin" ? "Супер админ" : t('tasks.manager')})
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
                      <FormLabel>{t('tasks.assign_to')}</FormLabel>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAssigneesOpen(!assigneesOpen)}
                          className="w-full justify-start text-left font-normal min-h-11"
                        >
                          {selectedMembers.length === 0 ? (
                            <span className="text-muted-foreground">{t('tasks.select_members')}</span>
                          ) : selectedMembers.length <= 2 ? (
                            selectedMembers.map((m) => {
                              const user = allUsers.find((u) => u && u._id === m);
                              return user?.name || "Неизвестный";
                            }).join(", ")
                          ) : (
                            t('tasks.selected_count').replace('{count}', selectedMembers.length.toString())
                          )}
                        </Button>
                        {assigneesOpen && (
                          <div className="absolute z-[100] top-full left-0 mt-1 w-full bg-background border rounded-md shadow-lg p-2">
                            <div className="mb-2">
                              <Input
                                placeholder="Поиск по имени..."
                                value={participantSearch}
                                onChange={(e) => setParticipantSearch(e.target.value)}
                                className="h-8"
                                autoFocus
                              />
                            </div>
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                              {allUsers
                                .filter(user => user && user._id)
                                .filter(user => !participantSearch || user.name?.toLowerCase().includes(participantSearch.toLowerCase()))
                                .map((user) => {
                                  const isSelected = user._id ? selectedMembers.includes(user._id) : false;
                                  return (
                                    <div
                                      key={user._id}
                                      className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer select-none"
                                      onClick={() => {
                                        if (user._id) {
                                          if (isSelected) {
                                            field.onChange(selectedMembers.filter(m => m !== user._id));
                                          } else {
                                            field.onChange([...selectedMembers, user._id]);
                                          }
                                        }
                                      }}
                                    >
                                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                                        {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                      </div>
                                      <span className="truncate flex-1">{user.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {user.role === "admin" ? t('tasks.admin') :
                                         user.role === "chief_manager" ? "Гл. Менеджер" :
                                         user.role === "manager" ? t('tasks.manager') : t('tasks.member')}
                                      </span>
                                    </div>
                                  );
                                })}
                              {allUsers.filter(user => user && user._id && (!participantSearch || user.name?.toLowerCase().includes(participantSearch.toLowerCase()))).length === 0 && (
                                <div className="text-center text-muted-foreground py-4 text-sm">
                                  Исполнители не найдены
                                </div>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <Button type="button" size="sm" onClick={() => setAssigneesOpen(false)} className="w-full">
                                Готово ({selectedMembers.length} выбрано)
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('tasks.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('tasks.creating') : t('tasks.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
