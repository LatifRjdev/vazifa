import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

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
import { phoneSignUpSchema } from "@/utils/schema";
import { toastMessages } from "@/lib/toast-messages";
import type { Route } from "../../+types/root";

export type PhoneSignupValues = z.infer<typeof phoneSignUpSchema>;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Sign Up" },
    { name: "description", content: "Sign Up to TaskHub!" },
  ];
}

const SignUp = () => {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PhoneSignupValues>({
    resolver: zodResolver(phoneSignUpSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PhoneSignupValues) => {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch('/api-v1/auth/register-phone', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful - auto-login
        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          toast.success("Регистрация завершена!", {
            description: "Добро пожаловать в TaskHub",
          });

          // Navigate to dashboard
          setTimeout(() => {
            navigate("/dashboard");
          }, 500);
        } else {
          throw new Error("Токен не получен");
        }
      } else {
        throw new Error(data.message || "Ошибка регистрации");
      }
    } catch (err: any) {
      const message = err.message || toastMessages.errors.unknownError;
      setError(message);
      toast.error("Ошибка регистрации", {
        description: message,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
      <Card className="border-border/50 w-full max-w-md shadow-xl">
        <CardHeader className="mb-6 text-center">
          <CardTitle className="text-3xl">Создать аккаунт</CardTitle>
          <CardDescription>
            Введите ваши данные для создания учетной записи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя *</FormLabel>
                    <FormControl>
                      <Input placeholder="Имя Фамилия" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер телефона *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+992901234567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
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
                    <FormLabel>Пароль *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Минимум 8 символов"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтвердите пароль *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Повторите пароль"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size={"lg"}
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание учетной записи...
                  </>
                ) : (
                  "Создать аккаунт"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full">
            У вас уже есть аккаунт?{" "}
            <Link
              to="/"
              className="text-blue-600 font-semibold hover:underline"
            >
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;
