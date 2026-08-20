import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepHeaderProps {
  step: number;
  totalSteps: number;
  badge: string;
  title: string;
  description: string;
  onBack?: () => void;
}

export function StepHeader({ step, totalSteps, badge, title, description, onBack }: StepHeaderProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        {onBack ? (
          <Button type="button" variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="size-5" />
            <span className="sr-only">Retour</span>
          </Button>
        ) : (
          <span />
        )}
        <span className="rounded-full border border-border bg-card px-3 py-1 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          {step} / {totalSteps}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{badge}</span>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm text-balance">{description}</p>
      </div>
    </div>
  );
}
