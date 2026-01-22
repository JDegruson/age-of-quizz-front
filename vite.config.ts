import { defineConfig } from "vite";

export default defineConfig(async () => {
  const react = (await import("@vitejs/plugin-react")).default;

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1", // bind to IPv4 loopback so http://127.0.0.1:3000 works
      port: 3000,
    },
    build: {
      outDir: "dist",
    },
  };
});
