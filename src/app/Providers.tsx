import StoreProvider from "@/components/StoreProvider";
import ApolloWrapper from "@/components/ApolloWrapper";
import DictionaryProvider from "@/components/DictionaryProvider";
// import LayoutProvider from "@/components/LayoutProvider";
import { getDictionary } from "./getDictionary";

export default async function Providers({ children, lang }: { children: React.ReactNode, lang: string }) {

  const dictionary = await getDictionary(lang as 'en' | 'fr');
  
  return (
    <StoreProvider>
      <ApolloWrapper>
        <DictionaryProvider dictionary={dictionary}>
            {children}
        </DictionaryProvider>
      </ApolloWrapper>
    </StoreProvider>
  );
}
