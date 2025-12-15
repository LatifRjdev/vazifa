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
import { useAuth } from "@/providers/auth-context";
import { universalLoginSchema } from "@/utils/schema";
import { toastMessages } from "@/lib/toast-messages";
import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Sign In" },
    { name: "description", content: "Sign In to TaskHub!" },
  ];
}

export type UniversalLoginValues = z.infer<typeof universalLoginSchema>;

const SignIn = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { login } = useAuth();

  // 2FA state
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [emailFor2FA, setEmailFor2FA] = useState("");

  const form = useForm<UniversalLoginValues>({
    resolver: zodResolver(universalLoginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  const onSubmit = async (values: UniversalLoginValues) => {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api-v1/auth/login-universal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.twoFARequired) {
          setTwoFARequired(true);
          setEmailFor2FA(values.emailOrPhone);
          toast.info("Требуется двухфакторная аутентификация");
        } else {
          // Login successful
          login(data);
          toast.success("Вход выполнен успешно!");
        }
      } else {
        throw new Error(data.message || "Ошибка входа");
      }
    } catch (err: any) {
      const message = err.message || toastMessages.auth.loginFailed;
      setError(message);
      toast.error("Ошибка входа", {
        description: message,
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api-v1/auth/google`;
  };

  const handleAppleLogin = () => {
    // Show message that Apple auth is coming soon
    toast.info(toastMessages.auth.appleComingSoon);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="border-border/50 shadow-xl w-full max-w-md">
        <CardHeader className="mb-6 text-center">
          <CardTitle className="text-3xl">Добро пожаловать</CardTitle>
          <CardDescription>
            Войдите используя email или номер телефона
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
                  name="emailOrPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email или телефон</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@example.com или +992901234567"
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
                  disabled={isPending}
                >
                  {isPending ? (
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

                <Button
                  variant="outline"
                  type="button"
                  disabled={isPending}
                  onClick={handleGoogleLogin}
                  className="w-full"
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
                  Войти через Google
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
