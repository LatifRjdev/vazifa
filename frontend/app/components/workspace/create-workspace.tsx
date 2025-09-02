import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { ResponsiveDialog } from "@/components/layout/responsive-modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWorkspaceMutation } from "@/hooks/use-workspace";
import { workspaceSchema } from "@/utils/schema";

export type CreateWorkspaceForm = z.infer<typeof workspaceSchema>;

interface CreateWorkspaceProps {
  isCreateWorkspaceOpen: boolean;
  setIsCreateWorkspaceOpen: (isOpen: boolean) => void;
}

// Define 8 predefined colors
export const colorOptions = [
  "#FF5733", // Red-Orange
  "#33C1FF", // Blue
  "#28A745", // Green
  "#FFC300", // Yellow
  "#8E44AD", // Purple
  "#E67E22", // Orange
  "#2ECC71", // Light Green
  "#34495E", // Navy
];

export const CreateWorkspace = ({
  isCreateWorkspaceOpen,
  setIsCreateWorkspaceOpen,
}: CreateWorkspaceProps) => {
  const form = useForm<CreateWorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      color: colorOptions[0], // Default to first color
    },
  });
  const reValidator = useRevalidator();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateWorkspaceMutation();

  const onSubmit = (values: CreateWorkspaceForm) => {
    mutate(values, {
      onSuccess: (data: any) => {
        reValidator.revalidate();
        toast.success("Рабочая область успешно создана");
        form.reset();
        setIsCreateWorkspaceOpen(false);
        navigate("/dashboard");
      },
      onError: () => {
        toast.error("Failed to create workspace");
      },
    });
  };

  return (
    <ResponsiveDialog
      open={isCreateWorkspaceOpen}
      onOpenChange={setIsCreateWorkspaceOpen}
      title="Создать новое рабочее пространство"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 md:px-0">
          <div className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя рабочей области</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Название рабочего пространства" />
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
                  <FormLabel>Описание рабочей области</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Описание рабочего пространства (необязательно)"
                    />
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
          </div>

          <DialogFooter className="mt-6 md:mt-0">
            <Button
              disabled={isPending}
              variant="outline"
              onClick={() => setIsCreateWorkspaceOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </ResponsiveDialog>
  );
};
