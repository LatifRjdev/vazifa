import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      className="mr-4 p-0"
      onClick={() => navigate(-1)}
    >
      ← Назад
    </Button>
  );
};
