import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useVerifyEmailMutation } from "@/hooks/use-auth";

import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Verify Email" },
    { name: "description", content: "Verify Email to TaskHub!" },
  ];
}

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();

  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate: verifyEmail, isPending: isVerifying } =
    useVerifyEmailMutation();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      verifyEmail(
        { token },
        {
          onSuccess: () => {
            setIsSuccess(true);
          },
          onError: () => {
            setIsSuccess(false);
          },
        }
      );
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold">Верификация электронной почты</h1>
          <p className="text-muted-foreground">Проверка адреса электронной почты</p>
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
            <div className="flex flex-col items-center space-y-4 py-6">
              {isVerifying ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-xl font-semibold">Проверка...</h3>
                  <p className="text-center text-muted-foreground">
                    Пожалуйста, подождите, пока мы проверим ваш адрес электронной почты.
                  </p>
                </>
              ) : isSuccess ? (
                <>
                  <div className="rounded-full bg-emerald-600/10 p-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Электронная почта проверена</h3>
                  <p className="text-center text-muted-foreground">
                    Ваш адрес электронной почты успешно подтверждён. 
                    Теперь вы можете войти в свою учётную запись.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/sign-in">Перейти к входу</Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-destructive/10 p-3">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold">Проверка не удалась</h3>
                  <p className="text-center text-muted-foreground">
                    Не удалось подтвердить ваш адрес электронной почты. Возможно, ссылка для 
                    подтверждения устарела или недействительна.
                  </p>
                  <Button variant="outline" asChild className="mt-4">
                    <Link to="/sign-in">Вернуться к входу</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-center text-sm w-full">
              Нужна помощь?{" "}
              <a
                href="mailto:support@taskhub.com"
                className="text-primary font-semibold hover:underline"
              >
                Обратиться в службу поддержки
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
