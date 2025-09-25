import { useState } from "react";
import { useSearchParams, Link } from "react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { postData } from "@/lib/fetch-utils";
import { resetPasswordSchema } from "@/utils/schema";
import { useResetPasswordMutation } from "@/hooks/use-auth";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Reset Password" },
    { name: "description", content: "Reset Password to TaskHub!" },
  ];
}

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("tk");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate, isPending: isResetting } = useResetPasswordMutation();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setError(null);
    setIsSuccess(false);
    try {
      if (!token) {
        setError("Invalid or missing token.");
        return;
      }

      mutate(
        {
          token,
          newPassword: values.password,
          confirmPassword: values.confirmPassword,
        },
        {
          onSuccess: () => {
            setIsSuccess(true);
            form.reset();
          },
          onError: (error: any) => {
            setError(
              error?.response?.data?.message ||
                error.message ||
                "Failed to reset password"
            );
            console.log(error);
          },
        }
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to reset password"
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold">Сбросить пароль</h1>
          <p className="text-muted-foreground">
            Введите новый пароль ниже.
          </p>
        </div>
        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <Link
              to="/sign-in"
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
                  Сброс пароля успешен
                </h3>
                <p className="text-center text-muted-foreground">
                  Ваш пароль сброшен. Теперь вы можете войти, используя 
                  новый пароль.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/sign-in">Перейти к входу</Link>
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
                    name="password"
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
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Подтвердите новый пароль</FormLabel>
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
                        Переустановка...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-center text-sm w-full">
              Забыли пароль?{" "}
              <Link
                to="/sign-in"
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
};

export default ResetPasswordPage;
