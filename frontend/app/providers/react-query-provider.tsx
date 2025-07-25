import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-context";

//   const [queryClient] = useState(() => new QueryClient());
export const queryClient = new QueryClient();

const ReactQueryProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />

      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
