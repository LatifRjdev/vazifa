import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGet2FAStatus,
  useEnable2FA,
  useVerify2FA,
  useDisable2FA,
} from "@/hooks/use-user";
import { useConfirmation } from "@/hooks/use-confirmation";
import { ConfirmationDialog } from "../dialogs/confirmation-dialog";

const TwoFASection = () => {
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const { confirm, confirmationOptions, handleCancel, handleConfirm, isOpen } =
    useConfirmation();

  const { data, isLoading: is2FALoading } = useGet2FAStatus() as {
    data: { enabled: boolean };
    isLoading: boolean;
  };

  const { mutate: enable2FA, isPending: isEnabling2FA } = useEnable2FA();
  const { mutate: verify2FA, isPending: isVerifying2FA } = useVerify2FA();
  const { mutate: disable2FA, isPending: isDisabling2FA } = useDisable2FA();

  const handleEnable2FA = async () => {
    enable2FA(
      {},
      {
        onSuccess: () => {
          setOtpSent(true);
          toast.info("A verification code has been sent to your email.");
        },
        onError: (error: any) => {
          toast.error(error.response.data.message);
          console.log(error);
        },
      }
    );
  };

  const handleVerify2FA = async () => {
    verify2FA(
      { code: otpCode },
      {
        onSuccess: () => {
          setOtpSent(false);
          setOtpCode("");
          toast.success("2FA enabled successfully!");
        },
        onError: (error: any) => {
          toast.error(error.response.data.message);
          console.log(error);
        },
      }
    );
  };

  const handleDisable2FA = async () => {
    confirm({
      title: "Disable 2FA",
      message: "Are you sure you want to disable 2FA?",
      onConfirm: async () => {
        disable2FA(
          {},
          {
            onSuccess: () => {
              toast.success("2FA disabled successfully");
            },
            onError: (error: any) => {
              const errorMessage =
                error?.response?.data?.message || "Failed to disable 2FA";
              toast.error(errorMessage);
            },
          }
        );
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Двухфакторная аутентификация (2FA)</CardTitle>
          <CardDescription>
            Добавьте дополнительный уровень безопасности к своей учетной записи.
            Если эта функция включена, вам потребуется ввести код,отправленный на вашу 
            электронную почту после входа в систему.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {is2FALoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Загрузка статуса 2FA...</span>
            </div>
          ) : data?.enabled ? (
            <div className="space-y-2">
              <p className="text-emerald-600">
                2FA включена на вашем аккаунте
              </p>
              <Button
                onClick={handleDisable2FA}
                disabled={is2FALoading || isDisabling2FA}
                variant="destructive"
              >
                Отключить 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-yellow-600">2FA не включена.</p>
              {!otpSent ? (
                <Button
                  onClick={handleEnable2FA}
                  disabled={is2FALoading || isEnabling2FA}
                  className="bg-black text-white"
                >
                  Включить 2FA
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="otp">Введите код, отправленный на вашу электронную почту</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    disabled={is2FALoading || isVerifying2FA}
                  />
                  <Button
                    onClick={handleVerify2FA}
                    disabled={
                      is2FALoading || otpCode.length !== 6 || isVerifying2FA
                    }
                  >
                    Проверьте и включите
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOtpSent(false)}
                    disabled={is2FALoading || isVerifying2FA}
                  >
                    Отмена
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={confirmationOptions?.title || ""}
        message={confirmationOptions?.message || ""}
        buttonText={"Disable 2FA"}
      />
    </>
  );
};

export default TwoFASection;
