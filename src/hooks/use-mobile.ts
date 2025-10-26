import * as React from "react"

// Définition des breakpoints pour une gestion centralisée
const BREAKPOINTS = {
  mobile: 768, // Les écrans mobiles vont jusqu'à 767px
  tablet: 1024, // Les tablettes vont de 768px à 1024px
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Media query pour détecter les écrans mobiles
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)

    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    mql.addEventListener("change", onChange)
    // Définir l'état initial
    setIsMobile(mql.matches)

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`);
    const onChange = (event: MediaQueryListEvent) => setIsTablet(event.matches);
    mql.addEventListener("change", onChange);
    setIsTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}
