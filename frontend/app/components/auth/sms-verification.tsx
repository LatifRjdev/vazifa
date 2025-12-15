import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SMSVerificationProps {
  phoneNumber: string;
  onSuccess: (token: string) => void;
}

export const SMSVerification = ({ phoneNumber, onSuccess }: SMSVerificationProps) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newCode.every((digit) => digit !== "") && value) {
      handleVerify(newCode.join(""));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify code
  const handleVerify = async (codeStr: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api-v1/auth/verify-phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber,
            code: codeStr,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Телефон успешно подтвержден!");
        onSuccess(data.token);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Неверный код");
      // Reset code inputs
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api-v1/auth/resend-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Код отправлен повторно");
        setTimeLeft(300); // Reset timer
        setCanResend(false);
        setWaitMinutes(0);
        // Clear code inputs
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else if (response.status === 429) {
        // Rate limited
        setWaitMinutes(data.waitMinutes || 1);
        toast.error(data.message || "Слишком много попыток");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка отправки SMS");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Введите код из SMS</h3>
        <p className="text-sm text-muted-foreground">
          Код отправлен на номер {phoneNumber}
        </p>
      </div>

      {/* Code inputs */}
      <div className="flex gap-2 justify-center">
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-lg font-semibold"
            autoFocus={index === 0}
            disabled={isVerifying}
          />
        ))}
      </div>

      {/* Verifying indicator */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Проверка кода...</span>
        </div>
      )}

      {/* Timer */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Код действителен:{" "}
          <span className={`font-semibold ${timeLeft < 60 ? "text-destructive" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        </p>
      </div>

      {/* Resend button */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={!canResend || isResending || waitMinutes > 0}
          className="text-sm"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : waitMinutes > 0 ? (
            `Следующая попытка через ${waitMinutes} мин`
          ) : canResend ? (
            "Отправить код снова"
          ) : (
            "Отправить снова"
          )}
        </Button>
      </div>

      {/* Helper text */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Не получили код? Проверьте правильность номера телефона</p>
      </div>
    </div>
  );
};
