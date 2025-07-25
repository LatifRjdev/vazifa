import { useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskHub | Page Not Found" },
    { name: "description", content: "Page Not Found to TaskHub!" },
  ];
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Упс! Страница не найдена.</p>
        <Button onClick={() => navigate(-1)}>Вернуться назад</Button>
      </div>
    </div>
  );
};

export default NotFound;
