import { Button } from "../ui/button";
import { useNavigate } from "react-router";

export const NoTaskFound = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-2">Задача не найдена</h2>
      <p className="text-muted-foreground mb-6">
        Задача, которую вы ищете, не существует или была удалена.
      </p>
      <Button onClick={goBack}>Go Back</Button>
    </div>
  );
};
