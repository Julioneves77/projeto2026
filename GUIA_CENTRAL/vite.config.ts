import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteKey = env.VITE_RECAPTCHA_SITE_KEY || "";

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "inject-recaptcha-html",
      transformIndexHtml(html: string) {
        return html.replace("__VITE_RECAPTCHA_SITE_KEY__", siteKey);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Desabilitar code splitting para evitar erros de inicialização circular
    // O bundle será um pouco maior mas carregará sem erros
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
};
});
