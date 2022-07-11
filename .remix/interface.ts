import type { AssetsManifest } from "@remix-run/dev/compiler/assets";
import type { RemixConfig } from "@remix-run/dev/config";

// produce ./public/build/
export type CompileBrowser = (
  remixConfig: RemixConfig
) => Promise<AssetsManifest>;

// produce ./build/index.js
export type CompileServer = (
  remixConfig: RemixConfig,
  manifestPromise: Promise<AssetsManifest>
) => Promise<void>;

type Build = (
  remixConfig: RemixConfig,
  compile: { browser: CompileBrowser; server: CompileServer }
) => [ReturnType<CompileBrowser>, ReturnType<CompileServer>];
