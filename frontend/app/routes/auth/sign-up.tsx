import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
import { useSignUpMutation } from "@/hooks/use-auth";
import { signupSchema } from "@/utils/schema";
import { toastMessages } from "@/lib/toast-messages";
import type { Route } from "../../+types/root";

export type SignupValues = z.infer<typeof signupSchema>;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Sign Up" },
    { name: "description", content: "Sign Up to TaskHub!" },
  ];
}

const SignUp = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: signUp, isPending } = useSignUpMutation();
  const navigate = useNavigate();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupValues) => {
    setError(null);

    try {
      signUp(values, {
        onSuccess: () => {
          setIsSuccess(true);
          toast.success(toastMessages.auth.signUpSuccess, {
            description: toastMessages.auth.signUpSuccessDescription,
          });

          form.reset();
          setError(null);

          setTimeout(() => {
            setIsSuccess(false);
            navigate("/sign-in");
          }, 3000);
        },
        onError: (error: any) => {
          setIsSuccess(false);
          const message = error.response.data.message || error.message;
          setError(message);
          toast.error(toastMessages.auth.signUpFailed, {
            description: message,
          });
        },
      });
    } catch (err) {
      setIsSuccess(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(toastMessages.errors.unknownError);
        toast.error(toastMessages.auth.signUpFailed, {
          description: toastMessages.errors.unknownError,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted">
      <Card className="border-border/50 w-full max-w-md shadow-xl">
        <CardHeader className="mb-6 text-center">
          <CardTitle className="text-3xl">Создать аккаунт</CardTitle>
          <CardDescription>
            Введите ваши данные, чтобы создать учетную запись
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
              {isSuccess && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Пользователь успешно зарегистрирован. Пожалуйста, проверьте свою 
                    электронную почту для подтверждения.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Электронная почта</FormLabel>
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
                    <FormLabel>Пароль</FormLabel>
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
              to="/sign-in"
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
