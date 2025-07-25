import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { useVerify2FALoginMutation } from "@/hooks/use-auth";
import { useAuth } from "@/providers/auth-context";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

interface Verify2FAProps {
  emailFor2FA: string;
  setEmailFor2FA: (value: string) => void;
  setTwoFARequired: (value: boolean) => void;
}

const verify2FASchema = z.object({
  code: z.string().min(6).max(6),
});

export const VerifyLogin2FAForm = ({
  emailFor2FA,
  setTwoFARequired,
  setEmailFor2FA,
}: Verify2FAProps) => {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const form = useForm<z.infer<typeof verify2FASchema>>({
    resolver: zodResolver(verify2FASchema),
    defaultValues: {
      code: "",
    },
  });

  const { mutate: verify2FALogin, isPending: isVerifying2FA } =
    useVerify2FALoginMutation();

  const handleVerify2FA = async (values: z.infer<typeof verify2FASchema>) => {
    setError(null);

    verify2FALogin(
      { email: emailFor2FA, code: values.code },
      {
        onSuccess: (data: any) => {
          login(data);
          toast.success("Login successful");
        },
        onError: (error: any) => {
          setError(error.response?.data?.message || "Invalid code");
          toast.error("Login failed");
          console.log(error);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleVerify2FA)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Введите код отправленный на почту</FormLabel>
              <FormControl>
                <Input type="number" placeholder="6-digit code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isVerifying2FA}
        >
          {isVerifying2FA ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Sign In"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setTwoFARequired(false);
            setEmailFor2FA("");
          }}
          disabled={isVerifying2FA}
        >
          Отмена
        </Button>
      </form>
    </Form>
  );
};
