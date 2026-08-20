"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDictionary } from "@/hooks/use-dictionary";
import { logoutUser } from "@/graphql/authActions";
import { CheckCircle2, Clock3, LogIn, MailCheck, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const dict = useDictionary();
  const router = useRouter();

  const handleBackToLogin = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore logout errors and still return to login.
    }
    router.push("/login");
  };

  const timeline = [
    {
      title: dict.pendingApproval.timelineSubmitted,
      description: dict.pendingApproval.timelineSubmittedDescription,
      icon: MailCheck,
      state: "done",
    },
    {
      title: dict.pendingApproval.timelineReview,
      description: dict.pendingApproval.timelineReviewDescription,
      icon: Clock3,
      state: "current",
    },
    {
      title: dict.pendingApproval.timelineAccess,
      description: dict.pendingApproval.timelineAccessDescription,
      icon: UserRoundCheck,
      state: "upcoming",
    },
  ];

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <Image src="/logo.png" alt="PMSCONNECT" width={32} height={32} className="h-8 w-auto" />
        <Button variant="ghost" size="sm" onClick={handleBackToLogin} className="text-muted-foreground">
          {dict.pendingApproval.backToLogin}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <Badge variant="pending" size="md" className="w-fit gap-1.5">
          <Clock3 className="size-3" />
          {dict.pendingApproval.statusLabel}
        </Badge>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.pendingApproval.title}</h1>
        <p className="text-muted-foreground text-sm leading-6">{dict.pendingApproval.description}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5">
        {timeline.map((item, index) => {
          const Icon = item.icon;
          const isDone = item.state === "done";
          const isCurrent = item.state === "current";

          return (
            <div key={item.title} className="relative flex gap-4">
              {index < timeline.length - 1 && (
                <span className="absolute left-5 top-11 h-[calc(100%-1rem)] w-px bg-border" />
              )}
              <div className={[
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border",
                isDone ? "border-primary bg-primary text-primary-foreground" : "",
                isCurrent ? "border-tertiary/30 bg-tertiary-100 text-tertiary-700" : "",
                !isDone && !isCurrent ? "border-border bg-muted text-muted-foreground" : "",
              ].join(" ")}>
                <Icon className="size-5" />
              </div>
              <div className="pb-1">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-card bg-muted/50 p-4">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">
          {dict.pendingApproval.reviewNotice} {dict.pendingApproval.nextStepDescription}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Button onClick={handleBackToLogin} size="xl" className="gap-2">
          <LogIn className="size-4" />
          {dict.pendingApproval.backToLogin}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          {dict.pendingApproval.supportHint}
        </p>
      </div>
    </main>
  );
}
