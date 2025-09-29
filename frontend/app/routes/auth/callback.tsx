import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Loader } from "@/components/loader";
import { useAuth } from "@/providers/auth-context";
import { toastMessages } from "@/lib/toast-messages";

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
      toast.error(toastMessages.auth.oauthError);
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
            toast.success(toastMessages.auth.oauthSuccess);
            navigate('/dashboard');
          } else {
            throw new Error('Invalid user data');
          }
        })
        .catch(error => {
          console.error('OAuth callback error:', error);
          toast.error(toastMessages.errors.serverError);
          navigate('/sign-in');
        });
      } catch (error) {
        console.error('Token parsing error:', error);
        toast.error(toastMessages.auth.invalidToken);
        navigate('/sign-in');
      }
    } else {
      toast.error(toastMessages.auth.tokenNotFound);
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
