import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useUpdateProjectMutation } from "@/hooks/use-project";
import type { Project } from "@/types";
import { projectSchema } from "@/utils/schema";
import { BackButton } from "../shared/back-button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";

export type ProjectSettingsForm = z.infer<typeof projectSchema>;

interface ProjectSettingsFormProps {
  project: Project;
  projectId: string;
}

export const DATA_STATUS = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

export const ProjectSettingsForm = ({
  project,
  projectId,
}: ProjectSettingsFormProps) => {
  const { mutate: updateProject, isPending: isUpdating } =
    useUpdateProjectMutation();

  const form = useForm<ProjectSettingsForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          title: project.title || "",
          description: project.description || "",
          status: project.status,
          startDate: project.startDate
            ? new Date(project.startDate).toISOString()
            : "",
          dueDate: project.dueDate
            ? new Date(project.dueDate).toISOString()
            : "",
          tags: project.tags?.join(", ") || "",
          members:
            project.members?.map((m) => ({ user: m.user._id, role: m.role })) ||
            [],
        }
      : undefined,
  });

  const onSubmit = (values: ProjectSettingsForm) => {
    updateProject(
      {
        projectId: projectId!,
        projectData: { ...values },
      },
      {
        onSuccess: () => {
          toast.success("Project updated successfully");
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to update project"
          );
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="space-y-2">
          <BackButton />
          <CardTitle>Настройки проекта</CardTitle>
        </div>
        <CardDescription>
          Обновите данные вашего проекта или удалите проект.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название проекта</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Введите названия проекта" />
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
                      placeholder="Введите описание проекта"
                    />
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

            <div className="grid md:grid-cols-2 gap-4">
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
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Теги</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Введите теги, разделенные запятыми."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center gap-4">
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full md:w-auto"
              >
                {isUpdating ? "Сохраняю..." : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
