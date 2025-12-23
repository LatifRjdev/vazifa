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
import { Link, useNavigate } from "react-router";
import { useRequestResetPasswordMutation } from "@/hooks/use-auth";
import { postData } from "@/lib/fetch-utils";

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

const resetPasswordWithCodeSchema = z.object({
  code: z.string().length(6, { message: "Код должен содержать 6 цифр" }),
  newPassword: z.string().min(8, { message: "Пароль должен содержать минимум 8 символов" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordWithCodeValues = z.infer<typeof resetPasswordWithCodeSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'code' | 'success'>('request');
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: "",
    },
  });

  const codeForm = useForm<ResetPasswordWithCodeValues>({
    resolver: zodResolver(resetPasswordWithCodeSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useRequestResetPasswordMutation();

  const onSubmit = async (values: ForgotPasswordValues) => {
    setError(null);

    // Determine if it's email or phone
    const isPhone = values.emailOrPhone.startsWith('+992');
    setResetMethod(isPhone ? 'phone' : 'email');
    if (isPhone) {
      setPhoneNumber(values.emailOrPhone);
    }

    try {
      // Send to backend - it handles both email and phone
      mutate({ emailOrPhone: values.emailOrPhone }, {
        onSuccess: () => {
          if (isPhone) {
            // For phone - show code input form
            setStep('code');
          } else {
            // For email - show success message (link sent to email)
            setStep('success');
          }
          form.reset();
        },
        onError: (error: any) => {
          setError(
            error?.response?.data?.message ||
              error.message ||
              "Не удалось отправить код для сброса пароля"
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

  const onCodeSubmit = async (values: ResetPasswordWithCodeValues) => {
    setError(null);
    setIsResetting(true);

    try {
      await postData('/auth/verify-reset-code', {
        phoneNumber: phoneNumber,
        code: values.code,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      setStep('success');
      codeForm.reset();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Не удалось сбросить пароль. Проверьте код."
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold">Забыли Пароль</h1>
          <p className="text-muted-foreground">
            {step === 'request' && "Введите свой email или номер телефона для сброса пароля"}
            {step === 'code' && "Введите код из SMS и новый пароль"}
            {step === 'success' && "Пароль успешно сброшен"}
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            {step === 'code' ? (
              <button
                onClick={() => setStep('request')}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </button>
            ) : (
              <Link
                to="/"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к входу
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {step === 'success' ? (
              <div className="flex flex-col items-center space-y-4 py-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  {resetMethod === 'email' ? 'Проверьте почту' : 'Пароль сброшен'}
                </h3>
                <p className="text-center text-muted-foreground">
                  {resetMethod === 'email' 
                    ? 'Мы отправили ссылку для сброса пароля на ваш адрес электронной почты. Пожалуйста, проверьте ваш почтовый ящик.'
                    : 'Ваш пароль успешно сброшен. Теперь вы можете войти с новым паролем.'}
                </p>
                <Button variant="outline" asChild className="mt-4">
                  <Link to="/">Перейти к входу</Link>
                </Button>
              </div>
            ) : step === 'code' ? (
              <Form {...codeForm}>
                <form
                  onSubmit={codeForm.handleSubmit(onCodeSubmit)}
                  className="space-y-4"
                >
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-muted-foreground text-center mb-4">
                    Код отправлен на номер <strong>{phoneNumber}</strong>
                  </div>

                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-значный код из SMS</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            className="text-center text-2xl tracking-widest"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={codeForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Новый пароль</FormLabel>
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

                  <FormField
                    control={codeForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Подтвердите пароль</FormLabel>
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
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сброс пароля...
                      </>
                    ) : (
                      "Сбросить пароль"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onSubmit({ emailOrPhone: phoneNumber })}
                    disabled={isPending}
                  >
                    {isPending ? "Отправка..." : "Отправить код повторно"}
                  </Button>
                </form>
              </Form>
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
                      "Отправить код для сброса"
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
