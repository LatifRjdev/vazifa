import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyPhoneToken() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Токен верификации отсутствует");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api-v1/auth/verify-phone-link/${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Телефон успешно подтвержден!");
          setPhoneNumber(data.phoneNumber || "");
          
          // Redirect to sign-in after 3 seconds
          setTimeout(() => {
            navigate("/sign-in", {
              state: { 
                message: "Телефон подтвержден! Теперь вы можете войти в систему.",
                phoneNumber: data.phoneNumber
              }
            });
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Ошибка верификации");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Ошибка подключения к серверу");
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Protocol
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Подтверждение телефона
              </p>
            </div>

            {/* Status Icon */}
            <div className="mb-6">
              {status === "loading" && (
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                </div>
              )}
              {status === "success" && (
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              )}
              {status === "error" && (
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              {status === "loading" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Проверка...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Подтверждаем ваш номер телефона
                  </p>
                </div>
              )}
              {status === "success" && (
                <div>
                  <h2 className="text-xl font-semibold text-green-600 mb-2">
                    Успешно!
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {message}
                  </p>
                  {phoneNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Телефон: {phoneNumber}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Перенаправление на страницу входа...
                  </p>
                </div>
              )}
              {status === "error" && (
                <div>
                  <h2 className="text-xl font-semibold text-red-600 mb-2">
                    Ошибка
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {message}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Возможно, ссылка устарела или уже использована
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {status === "error" && (
                <>
                  <Link
                    to="/sign-up"
                    className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Повторить регистрацию
                  </Link>
                  <Link
                    to="/sign-in"
                    className="block w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                  >
                    Войти в систему
                  </Link>
                </>
              )}
              {status === "success" && (
                <Link
                  to="/sign-in"
                  className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Перейти к входу
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          © 2024 Protocol. Все права защищены.
        </p>
      </div>
    </div>
  );
}
