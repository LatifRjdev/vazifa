import { AlertCircle, ShieldAlert } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Протокол | Регистрация" },
    { name: "description", content: "Регистрация в Протокол" },
  ];
}

const SignUp = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
      <Card className="border-border/50 w-full max-w-md shadow-xl">
        <CardHeader className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <ShieldAlert className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Регистрация отключена</CardTitle>
          <CardDescription>
            Публичная регистрация недоступна
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Внимание</AlertTitle>
            <AlertDescription>
              Самостоятельная регистрация отключена. Для получения доступа к системе обратитесь к администратору вашей организации.
            </AlertDescription>
          </Alert>

          <div className="text-center text-sm text-muted-foreground">
            <p>Администратор может создать для вас учетную запись через панель управления участниками.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link to="/">
              Войти в аккаунт
            </Link>
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Если у вас уже есть аккаунт,{" "}
            <Link
              to="/"
              className="text-blue-600 font-semibold hover:underline"
            >
              войдите здесь
            </Link>
          </div>
        </CardFooter>
      </Card>

      <footer className="mt-8 text-center text-sm">
        <a
          href="https://itlsolutions.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-blue-600 hover:underline"
        >
          © 2026 Протокол. Все права защищены - by ITls
        </a>
      </footer>
    </div>
  );
};

export default SignUp;
