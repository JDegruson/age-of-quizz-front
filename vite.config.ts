import { defineConfig } from "vite";

export default defineConfig(async () => {
  const react = (await import("@vitejs/plugin-react")).default;

  return {
    define: {
      global: "globalThis",
    },
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 3000,
      proxy: {
        "/api": {
          target: "https://age-of-quizz-15ab03f3a06e.herokuapp.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api/, ""),
          configure: (proxy: any) => {
            proxy.on("proxyReq", (proxyReq: any) => {
              proxyReq.setHeader(
                "origin",
                "https://age-of-quizz-15ab03f3a06e.herokuapp.com",
              );
            });
          },
        },
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
