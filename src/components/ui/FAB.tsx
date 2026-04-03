import { Button } from "./button";
import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all duration-300 z-40"
    >
      <Plus className="h-7 w-7" />
    </Button>
  );
}
