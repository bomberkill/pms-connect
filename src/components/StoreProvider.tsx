'use client'
import { Provider } from "react-redux"
import { AppStore, makeStore } from "@/redux/store"
import { useRef } from "react"
// import { useAuthObserver } from "@/lib/hooks";
// import { persistencePromise } from "@/lib/firebase";
// await persistencePromise
// function AuthObserverInitializer() {
//   useAuthObserver();
//   return null; // This component doesn't render anything itself
// }

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  // useAuthObserver();
  const storeRef = useRef<AppStore | null>(null)
  if (storeRef.current === null) {
      storeRef.current = makeStore()
  }
  return (
    <Provider store={storeRef.current}>
      {/* <AuthObserverInitializer /> */}
      {children}
    </Provider>
  )
}