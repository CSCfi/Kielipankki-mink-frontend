import path from "path";
import { ServerOptions } from "https";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import checker from "vite-plugin-checker";
import ViteYaml from "@modyfi/vite-plugin-yaml";
import { visualizer } from "rollup-plugin-visualizer";

type HttpsOptions = Pick<ServerOptions, "key" | "cert">;

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Load .env files. Vite will do it itself, but only later. See https://github.com/vitejs/vite/issues/1930
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  /** Read HTTPS cert and key, if their paths are specified in env. */
  async function getHttpsOptions(): Promise<HttpsOptions | undefined> {
    if (process.env.DEV_HTTPS_KEY && process.env.DEV_HTTPS_CERT) {
      const fs = await import("fs");
      return {
        key: fs.readFileSync(process.env.DEV_HTTPS_KEY),
        cert: fs.readFileSync(process.env.DEV_HTTPS_CERT),
      };
    }
  }

  return {
    plugins: [
      vue(),
      ViteYaml(),
      // Enable typechecking, see https://vite-plugin-checker.netlify.app/introduction/getting-started.html
      checker({ vueTsc: true }),
      visualizer(), // Keep visualizer last.
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: process.env.BASE,
    server: {
      // Remap hostname and enable HTTPS, in order for authentication to work.
      // Map spraakbanken.gu.se to 127.0.0.1 in /etc/hosts if using sb_auth.
      host: "127.0.0.1",
      https: await getHttpsOptions(),
    },
    test: {
      environment: "happy-dom",
    },
    build: {
      rollupOptions: {
        output: {
          experimentalMinChunkSize: 5000,
        },
      },
    },
  };
});
