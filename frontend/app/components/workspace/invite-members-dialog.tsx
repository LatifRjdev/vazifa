import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inviteMemberSchema } from "@/utils/schema";
import { getRoleRussian } from "@/lib/translations";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { useInviteMembersToWorkspaceMutation } from "@/hooks/use-workspace";

interface InviteMembersDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

const ROLES = ["admin", "member", "viewer"] as const;

export const InviteMembersDialog = ({
  workspaceId,
  open,
  onOpenChange,
}: InviteMembersDialogProps) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteTab, setInviteTab] = useState("email");

  const form = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { mutate: inviteMembersToWorkspace, isPending: isInvitingUser } =
    useInviteMembersToWorkspaceMutation();

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/workspace-invite/${workspaceId}`;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast.success("Ссылка приглашения скопирована в буфер обмена");

    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };

  const onSubmit = async (values: InviteMemberFormData) => {
    if (!workspaceId) {
      toast.error("Отсутствует ID рабочего пространства.");
      return;
    }

    inviteMembersToWorkspace(
      {
        workspaceId,
        email: values.email,
        role: values.role,
      },
      {
        onSuccess: () => {
          toast.success(
            `Успешно приглашен ${values.email} в рабочее пространство.`
          );
          form.reset();
          onOpenChange(false);
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.message ||
            "Не удалось пригласить участника в рабочее пространство.";
          toast.error(errorMessage);
          console.error("Invite member error:", error);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пригласить в рабочее пространство</DialogTitle>
        </DialogHeader>
        <Tabs
          defaultValue="email"
          value={inviteTab}
          onValueChange={setInviteTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Отправить электронное письмо</TabsTrigger>
            <TabsTrigger value="link">Поделиться ссылкой</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="py-0">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col space-x-2"
                  >
                    <div className="flex flex-col space-y-6 w-full">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Адрес электронной почты</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Выберите роль</FormLabel>
                            <FormControl>
                              <div className="flex gap-3 flex-wrap">
                                {ROLES.map((role) => (
                                  <label
                                    key={role}
                                    className="flex items-center cursor-pointer gap-2"
                                  >
                                    <input
                                      type="radio"
                                      value={role}
                                      checked={field.value === role}
                                      onChange={() => field.onChange(role)}
                                      className="hidden"
                                    />
                                    <span
                                      className={`w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-lg bg-blue-900 ${
                                        field.value === role
                                          ? "ring-2 ring-offset-2 ring-blue-500 border-blue-500"
                                          : ""
                                      }`}
                                    >
                                      {field.value === role && (
                                        <span className="w-3 h-3 bg-white rounded-full block" />
                                      )}
                                    </span>
                                    <span className="capitalize">{getRoleRussian(role)}</span>
                                  </label>
                                ))}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="mt-8"
                      disabled={isInvitingUser}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Отправить
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="link" className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Поделитесь этой ссылкой, чтобы пригласить участников</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/workspace-invite/${workspaceId}`}
                  />
                  <Button onClick={handleCopyInviteLink}>
                    {linkCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Копировать
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Любой, у кого есть ссылка, может присоединиться к этому рабочему пространству.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
