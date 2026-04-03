import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Calendar,
  TrendingUp,
  Download,
  Upload,
  Settings,
  X,
} from "lucide-react";
import type { Person } from "../../types";

interface SidebarProps {
  persons: Person[];
  activePerson: string | null;
  onSelectPerson: (personId: string | null) => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  transactionCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  persons,
  activePerson,
  onSelectPerson,
  onOpenExport,
  onOpenImport,
  onOpenSettings,
  transactionCount,
  isOpen,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const isMonthly = location.pathname === "/";
  const isAnnual = location.pathname === "/annual";

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-card border-r transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
                <span className="text-xl font-bold text-primary-foreground">
                  💸
                </span>
              </div>
              <div>
                <h2 className="font-bold">Finatrack</h2>
                <p className="text-xs text-muted-foreground">
                  Gestion financière
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </p>

            <Link to="/" onClick={onClose}>
              <Button
                variant={isMonthly ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <Calendar className="h-4 w-4" />
                Vue Mensuelle
                {isMonthly && transactionCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {transactionCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/annual" onClick={onClose}>
              <Button
                variant={isAnnual ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <TrendingUp className="h-4 w-4" />
                Vue Annuelle
              </Button>
            </Link>

            <Separator className="my-4" />

            <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </p>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                onOpenExport();
                onClose();
              }}
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                onOpenImport();
                onClose();
              }}
            >
              <Upload className="h-4 w-4" />
              Importer
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>

            {/* Person selection */}
            {persons.length === 2 && isMonthly && (
              <>
                <Separator className="my-4" />

                <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Personnes
                </p>

                <Button
                  variant={activePerson === null ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    onSelectPerson(null);
                    onClose();
                  }}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary/10">
                      👥
                    </AvatarFallback>
                  </Avatar>
                  Dépenses communes
                </Button>

                {persons.map((person) => (
                  <Button
                    key={person.id}
                    variant={activePerson === person.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      onSelectPerson(person.id);
                      onClose();
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {person.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {person.name}
                  </Button>
                ))}
              </>
            )}

            {persons.length === 2 && isAnnual && (
              <>
                <Separator className="my-4" />

                <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Personnes
                </p>

                {persons.map((person) => (
                  <Button
                    key={person.id}
                    variant={activePerson === person.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      onSelectPerson(person.id);
                      onClose();
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {person.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {person.name}
                  </Button>
                ))}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-xs text-center text-muted-foreground">
              Made by{" "}
              <a href="https://github.com/bastien-cordier/">Bastien CORDIER</a>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
