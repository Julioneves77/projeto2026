import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolla para o topo da página sempre que a rota mudar.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
