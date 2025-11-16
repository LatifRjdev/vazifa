import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerified: (code: string) => void;
  onResend: () => Promise<void>;
  verificationType?: "registration" | "login" | "password_reset" | "phone_update";
}

export function PhoneVerification({
  phoneNumber,
  onVerified,
  onResend,
  verificationType = "registration",
}: PhoneVerificationProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");
    setCode(digitsOnly.slice(0, 6));
    setError(null);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Код должен содержать 6 цифр");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await onVerified(code);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка проверки кода");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    setError(null);
    setCode("");

    try {
      await onResend();
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка отправки кода");
      setCanResend(true);
      setCountdown(0);
    }
  };

  const getTitle = () => {
    switch (verificationType) {
      case "registration":
        return "Подтверждение регистрации";
      case "login":
        return "Подтверждение входа";
      case "password_reset":
        return "Сброс пароля";
      case "phone_update":
        return "Подтверждение нового номера";
      default:
        return "Подтверждение";
    }
  };

  const getMessage = () => {
    switch (verificationType) {
      case "registration":
        return `Мы отправили код подтверждения на номер ${phoneNumber}`;
      case "login":
        return `Введите код, отправленный на ${phoneNumber}`;
      case "password_reset":
        return `Код для сброса пароля отправлен на ${phoneNumber}`;
      case "phone_update":
        return `Подтвердите свой новый номер ${phoneNumber}`;
      default:
        return `Код отправлен на ${phoneNumber}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{getTitle()}</h3>
        <p className="text-sm text-muted-foreground">{getMessage()}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Код подтверждения</label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && code.length === 6) {
              handleVerify();
            }
          }}
          className="text-center text-2xl tracking-[0.5em] font-mono"
          maxLength={6}
          autoFocus
        />
        <p className="text-xs text-muted-foreground text-center">
          Код действителен 10 минут
        </p>
      </div>

      <Button
        onClick={handleVerify}
        disabled={code.length !== 6 || isVerifying}
        className="w-full"
        size="lg"
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Проверка...
          </>
        ) : (
          "Подтвердить"
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Не получили код?</p>
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={!canResend}
          size="sm"
        >
          {canResend ? (
            "Отправить повторно"
          ) : (
            `Отправить повторно через ${countdown}с`
          )}
        </Button>
      </div>
    </div>
  );
}
