import { Construction } from "lucide-react";

export default function WorkInProgress() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)] gap-4 text-center p-4">
      <Construction className="w-16 h-16 text-primary" />
      <h1 className="text-3xl font-bold tracking-tight">
        Page en cours de développement
      </h1>
      <p className="text-muted-foreground">
        Nous travaillons dur pour vous apporter cette fonctionnalité. Revenez bientôt !
      </p>
    </div>
  );
}
