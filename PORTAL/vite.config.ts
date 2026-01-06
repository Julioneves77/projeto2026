import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('src/pages')) {
            const pageName = path.basename(id, path.extname(id));
            // Group common pages, or keep separate for specific lazy loading
            if (['HowItWorks', 'FAQ', 'Privacy', 'Terms', 'Contact', 'NotFound'].includes(pageName)) {
              return `page-${pageName.toLowerCase()}`;
            }
          }
        },
      },
    },
  },
}));
