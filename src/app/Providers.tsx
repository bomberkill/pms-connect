"use client";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/graphql/apolloClient";
import DictionaryProvider from "@/components/DictionaryProvider";
// import { getDictionary } from "./getDictionary"; // REMOVED: Server-only
import { ThemeProvider } from "next-themes";
import { useFcmToken } from "@/hooks/useData/index";
import WebSocketReconnector from "@/components/WebSocketReconnector";

// type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

function FcmTokenManager() {
  console.log("FcmTokenManager");
  useFcmToken();
  console.log("FcmTokenManager end");
  return null;
}

export default function Providers({
  children,
  dictionary, // NEW PROP
}: {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any; // Using any or the Dictionary type if exported
}) {
  return (
    <ApolloProvider client={apolloClient}>
      <DictionaryProvider dictionary={dictionary}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FcmTokenManager />
          <WebSocketReconnector />
          {children}
        </ThemeProvider>
      </DictionaryProvider>
    </ApolloProvider>
  );
}
