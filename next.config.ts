import type { NextConfig } from "next";

console.log("[build-trace] next.config.ts loaded");

class BuildTracePlugin {
  apply(compiler: {
    hooks: {
      beforeRun: { tap: (name: string, callback: () => void) => void };
      compile: { tap: (name: string, callback: () => void) => void };
      afterCompile: { tap: (name: string, callback: () => void) => void };
      done: { tap: (name: string, callback: () => void) => void };
      failed: { tap: (name: string, callback: (error: Error) => void) => void };
    };
    options?: { name?: string };
  }) {
    const compilerName = compiler.options?.name ?? "unknown";

    compiler.hooks.beforeRun.tap("BuildTracePlugin", () => {
      console.log(`[build-trace] webpack beforeRun ${compilerName}`);
    });
    compiler.hooks.compile.tap("BuildTracePlugin", () => {
      console.log(`[build-trace] webpack compile ${compilerName}`);
    });
    compiler.hooks.afterCompile.tap("BuildTracePlugin", () => {
      console.log(`[build-trace] webpack afterCompile ${compilerName}`);
    });
    compiler.hooks.done.tap("BuildTracePlugin", () => {
      console.log(`[build-trace] webpack done ${compilerName}`);
    });
    compiler.hooks.failed.tap("BuildTracePlugin", (error) => {
      console.log(`[build-trace] webpack failed ${compilerName}`, error.message);
    });
  }
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  webpack(config, { isServer, nextRuntime }) {
    console.log("[build-trace] webpack config", {
      isServer,
      nextRuntime,
      name: config.name,
    });
    config.plugins = [...(config.plugins ?? []), new BuildTracePlugin()];
    return config;
  },
};

export default nextConfig;
