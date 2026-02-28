import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTop } from "@/lib/scrollUtils";

/**
 * Scrolla para o topo da página sempre que a rota ou query params mudarem.
 * Cobre: troca de página, troca de tipo de certidão (?type=), etc.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
