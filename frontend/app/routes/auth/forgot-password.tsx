import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router";
import { useRequestResetPasswordMutation } from "@/hooks/use-auth";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Forgot Password" },
    { name: "description", content: "Forgot Password to TaskHub!" },
  ];
}

const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().min(1, { message: "Введите email или номер телефона" })
    .refine((val) => {
      // Check if it's a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Check if it's a valid phone number (+992XXXXXXXXX)
      const phoneRegex = /^\+992\d{9}$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    }, {
      message: "Введите корректный email или номер телефона (+992XXXXXXXXX)"
    }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: "",
    },
  });

  const { mutate, isPending } = useRequestResetPasswordMutation();

  const onSubmit = async (values: ForgotPasswordValues) => {
    setError(null);

    // Determine if it's email or phone
    const isPhone = values.emailOrPhone.startsWith('+992');
    setResetMethod(isPhone ? 'phone' : 'email');

    try {
      // Send to backend - it handles both email and phone
      mutate({ emailOrPhone: values.emailOrPhone }, {
        onSuccess: () => {
          setIsSuccess(true);
          form.reset();
        },
        onError: (error: any) => {
          setError(
            error?.response?.data?.message ||
              error.message ||
              "Не удалось отправить ссылку для сброса пароля"
          );
          console.log(error);
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold">Забыли Пароль</h1>
          <p className="text-muted-foreground">
            Введите свой email или номер телефона для сброса пароля
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <Link
              to="/"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к входу
            </Link>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center space-y-4 py-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  {resetMethod === 'email' ? 'Проверьте почту' : 'Проверьте SMS'}
                </h3>
                <p className="text-center text-muted-foreground">
                  {resetMethod === 'email' 
                    ? 'Мы отправили ссылку для сброса пароля на ваш адрес электронной почты. Пожалуйста, проверьте ваш почтовый ящик.'
                    : 'Мы отправили ссылку для сброса пароля на ваш номер телефона. Пожалуйста, проверьте SMS сообщения.'}
                </p>
                <Button variant="outline" asChild className="mt-4">
                  <Link to="/">Вернуться к входу</Link>
                </Button>
              </div>
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
                        <FormLabel>Email или Телефон</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="email@example.com или +992XXXXXXXXX"
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
                        Отправка...
                      </>
                    ) : (
                      "Отправить ссылку для сброса"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-center text-sm w-full">
              Помните свой пароль?{" "}
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
    </div>
  );
}
