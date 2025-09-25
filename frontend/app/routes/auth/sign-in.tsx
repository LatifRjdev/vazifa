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

  const handleGoogleLogin = () => {
    // Перенаправляем на Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/auth/google`;
  };

  const handleAppleLogin = () => {
    // Показываем сообщение о том, что Apple аутентификация скоро будет доступна
    toast.info("Apple аутентификация будет добавлена в следующем обновлении");
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Или продолжить с
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isLoginPending}
                    onClick={handleGoogleLogin}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    disabled={isLoginPending}
                    onClick={handleAppleLogin}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                    Apple
                  </Button>
                </div>
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
