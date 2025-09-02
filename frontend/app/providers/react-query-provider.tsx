import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-context";

//   const [queryClient] = useState(() => new QueryClient());
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Отключаем HTTP кэширование для более надежного обновления данных
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 минут
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const ReactQueryProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
