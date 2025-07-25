import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { VerifyLogin2FAForm } from "@/components/auth/verify-2fa";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/hooks/use-auth";
import { useAuth } from "@/providers/auth-context";
import { loginSchema } from "@/utils/schema";
import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Sign In" },
    { name: "description", content: "Sign In to TaskHub!" },
  ];
}

export type LoginValues = z.infer<typeof loginSchema>;

const SignIn = () => {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { mutate: loginUser, isPending: isLoginPending } = useLoginMutation();

  // 2FA state
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [emailFor2FA, setEmailFor2FA] = useState("");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);

    loginUser(values, {
      onSuccess: (data: any) => {
        if (data.twoFARequired) {
          setTwoFARequired(true);
          setEmailFor2FA(values.email);
          toast.info("A verification code has been sent to your email.");
        } else {
          login(data);
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Login failed");
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="border-border/50 shadow-xl w-full max-w-md">
        <CardHeader className="mb-6 text-center">
          <CardTitle className="text-3xl">Добро пожаловать</CardTitle>
          <CardDescription>
            Введите свои учетные данные для входа в свою учетную запись.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {twoFARequired ? (
            <VerifyLogin2FAForm
              emailFor2FA={emailFor2FA}
              setEmailFor2FA={setEmailFor2FA}
              setTwoFARequired={setTwoFARequired}
            />
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес электронной почты</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Пароль</FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Забыли пароль?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoginPending}
                >
                  {isLoginPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Вход в систему...
                    </>
                  ) : (
                    "Войти"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full">
            У вас нет учетной записи?{" "}
            <Link
              to="/sign-up"
              className="text-blue-600 font-semibold hover:underline"
            >
              Зарегистрироваться
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
