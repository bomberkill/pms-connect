"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/hooks/use-notification";
import { useDictionary } from "@/hooks/use-dictionary";

interface WorkInProgressProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** localStorage key so the "notify me" state survives a refresh — this is
   *  a local acknowledgment, not a real subscription (no backend exists to
   *  send that notification yet), so the copy and behavior stay honest
   *  about that instead of promising an email that won't come. */
  notifyKey: string;
  footer?: ReactNode;
}

export default function WorkInProgress({ icon: Icon, title, description, notifyKey, footer }: WorkInProgressProps) {
  const dict = useDictionary();
  const { open } = useNotification();
  const [notified, setNotified] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(notifyKey) === "1"
  );

  const handleNotify = () => {
    localStorage.setItem(notifyKey, "1");
    setNotified(true);
    open("success", dict.comingSoon.notifyConfirmedTitle, { message: dict.comingSoon.notifyConfirmedMessage });
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="relative flex size-24 items-center justify-center rounded-[2rem] border border-border bg-card text-primary shadow-[0_18px_45px_-34px_rgba(15,23,42,0.8)]">
        <div className="absolute inset-3 rounded-[1.4rem] bg-primary/8" />
        <Icon className="relative size-9" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[1.45rem] font-black tracking-[-0.04em]">{title}</h1>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground text-balance">{description}</p>
      </div>
      <Button variant="outline" onClick={handleNotify} disabled={notified} className="h-10 rounded-full gap-2">
        {notified ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        {notified ? dict.comingSoon.notified : dict.comingSoon.notifyMe}
      </Button>
      {footer}
    </div>
  );
}
