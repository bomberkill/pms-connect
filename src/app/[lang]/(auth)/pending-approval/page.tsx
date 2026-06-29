"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import { useAppDispatch } from "@/hooks/use-redux";
import { logoutUser } from "@/redux/services/userService";
import { Clock3, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const dict = useDictionary();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleBackToLogin = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // Ignore logout errors and still return to login.
    }
    router.push("/login");
  };

  return (
    <div className="min-h-svh bg-background px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock3 className="size-7" />
          </div>
          <CardTitle className="text-2xl">{dict.pendingApproval.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center leading-6">
            {dict.pendingApproval.description}
          </p>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-primary mt-0.5" />
              <p className="text-muted-foreground leading-6">
                {dict.pendingApproval.reviewNotice}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleBackToLogin}>
              {dict.pendingApproval.backToLogin}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
