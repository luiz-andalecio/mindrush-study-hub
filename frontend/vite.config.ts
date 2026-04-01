import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Permite trocar a porta do backend sem editar este arquivo:
  // - se rodar via ./start.sh, ele exporta VITE_BACKEND_PORT automaticamente (baseado no SERVER_PORT do .env)
  // - se rodar manualmente, você pode fazer: VITE_BACKEND_PORT=8081 npm run dev
  const backendPort = process.env.VITE_BACKEND_PORT || process.env.SERVER_PORT || "8080";

  return {
    server: {
    host: "::",
    // Importante: não usar 8080 aqui porque é a porta padrão do backend (Spring Boot)
    port: 5173,
    hmr: {
      overlay: false,
    },
    // Proxy para a API do backend. Assim, no frontend você chama /api/*
    // e o Vite encaminha para o Spring em http://localhost:<backendPort>.
    proxy: {
      "/api": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
