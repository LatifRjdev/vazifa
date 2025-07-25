import { CirclePlus, LayoutGrid } from "lucide-react";
import { Button } from "../ui/button";

interface NoDataProps {
  title: string;
  description: string;
  buttonText: string;
  buttonOnClick: () => void;
}

export const NoDataFound = ({
  title,
  description,
  buttonText,
  buttonOnClick,
}: NoDataProps) => {
  return (
    <div className="col-span-full text-center py-12 2xl:py-24 bg-muted/40 rounded-lg">
      <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground mt-2 mb-4 max-w-sm mx-auto">
        {description}
      </p>
      <Button onClick={buttonOnClick}>
        <CirclePlus className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    </div>
  );
};
