"use client";
import { ApolloProvider } from "@apollo/client";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "@/redux/store";
import { apolloClient } from "@/graphql/apolloClient";
import DictionaryProvider from "@/components/DictionaryProvider";
// import { getDictionary } from "./getDictionary"; // REMOVED: Server-only
import { ThemeProvider } from "next-themes";
import { useFcmToken } from "@/hooks/useData/index";
import WebSocketReconnector from "@/components/WebSocketReconnector";
import { useRef } from "react";

// type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

function FcmTokenManager() {
  useFcmToken();
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
  const storeRef = useRef<AppStore>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <ApolloProvider client={apolloClient}>
      <Provider store={storeRef.current}>
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
      </Provider>
    </ApolloProvider>
  );
}
