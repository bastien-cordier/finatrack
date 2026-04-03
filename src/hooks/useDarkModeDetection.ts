import { useState, useEffect } from "react";

/**
 * Hook pour détecter le mode sombre actif
 * Réutilisable dans tous les composants qui ont besoin de s'adapter au thème
 */
export function useDarkModeDetection() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Observer pour détecter les changements de thème
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
}
