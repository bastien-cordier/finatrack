import { Button } from "../ui/button";
import { Menu, Moon, Sun } from "lucide-react";

interface TopbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
}

export function Topbar({
  darkMode,
  onToggleDarkMode,
  onOpenSidebar,
  title,
  subtitle,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Menu button mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}
