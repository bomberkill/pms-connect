"use client";
import React, { useEffect } from "react";
import { useAppSelector, useAuthObserver } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/App-sidebar";
import { SuggestionsSidebar } from "@/components/Suggestions-sidebar";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {initialized, firebaseUid: uid} = useAuthObserver();
  const { firebaseUid, loading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    // console.log("start protected layout useEffect, authLoading: ", authLoading, "firebaseUid: ", firebaseUid, "initialized: ", initialized, "uid: ", uid);

    if (initialized && !uid && !authLoading) {
      // console.log("no firebaseUid found. redirect to login, authLoading: ", authLoading, "firebaseUid: ", firebaseUid, "initialized: ", initialized, "uid: ", uid);
      router.push("/login");
    }
  }, [initialized, authLoading, uid, router]);

  // Pendant le SSR ou le rendu initial du client, et pendant que l'état d'authentification se charge, on affiche un loader.
  // Cela garantit que le rendu du serveur correspond au rendu initial du client, évitant une erreur d'hydratation.
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Si la vérification de l'authentification est terminée et qu'il n'y a pas d'utilisateur, nous pouvons retourner null
  // pendant que la redirection vers /login se produit. Cela évite de faire clignoter le contenu protégé.
  if (!firebaseUid) {
    return null;
  }

  // Une fois authentifié, on affiche la mise en page protégée.
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative overflow-hidden">
        <Header />
        <main className={cn("bg-sidebar", isMobile && "mt-[101px]")}>{children}</main>
      </SidebarInset>
      <SuggestionsSidebar/>
    </SidebarProvider>
  );
}
