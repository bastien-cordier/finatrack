import { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
import { Card, CardContent, CardHeader } from "./card";
import { MAX_PERSON_NAME_LENGTH } from "../../lib/helpers";

interface WelcomeModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export function WelcomeModal({ isOpen, onSubmit }: WelcomeModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().slice(0, MAX_PERSON_NAME_LENGTH);
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm mx-4 border shadow-2xl">
        <CardHeader className="pt-8 pb-2 text-center space-y-3">
          <div className="text-5xl">👋🏼</div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Bienvenue !</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Comment souhaitez-vous être appelé ?
            </p>
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="welcome-name">Votre prénom</Label>
              <Input
                id="welcome-name"
                placeholder="ex : Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_PERSON_NAME_LENGTH}
                autoFocus
                className="h-10 text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!name.trim()}
            >
              Commencer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
