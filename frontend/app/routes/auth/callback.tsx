import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";

export function meta() {
  return [
    { title: "Vazifa | OAuth Callback" },
    { name: "description", content: "Processing OAuth authentication..." },
  ];
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Ошибка аутентификации. Попробуйте снова.');
      navigate('/sign-in');
      return;
    }

    if (token) {
      // Decode the token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Fetch user data using the token
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api-v1'}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        .then(response => response.json())
        .then(data => {
          if (data.user) {
            login({ user: data.user, token });
            toast.success('Успешный вход через OAuth!');
            navigate('/dashboard');
          } else {
            throw new Error('Invalid user data');
          }
        })
        .catch(error => {
          console.error('OAuth callback error:', error);
          toast.error('Ошибка при получении данных пользователя');
          navigate('/sign-in');
        });
      } catch (error) {
        console.error('Token parsing error:', error);
        toast.error('Неверный токен аутентификации');
        navigate('/sign-in');
      }
    } else {
      toast.error('Токен аутентификации не найден');
      navigate('/sign-in');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <Loader message="Обработка аутентификации..." />
      <p className="mt-4 text-muted-foreground text-center">
        Пожалуйста, подождите, пока мы завершаем процесс входа...
      </p>
    </div>
  );
};

export default AuthCallback;
