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
  const progress = `${Math.min(100, Math.max(0, (step / totalSteps) * 100))}%`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-[52px] items-center gap-3">
        {onBack ? (
          <Button type="button" variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="size-5" />
            <span className="sr-only">Retour</span>
          </Button>
        ) : (
          <span className="w-9" />
        )}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{badge}</span>
            <span className="font-mono text-2xs text-muted-foreground">{step} / {totalSteps}</span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: progress }} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm text-balance">{description}</p>
      </div>
    </div>
  );
}
