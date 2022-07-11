import fs from "fs";
import path from "path";

/** @typedef {import("@remix-run/dev/compiler/assets").AssetsManifest} AssetsManifest */
/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */
/** @typedef {(remixConfig: RemixConfig) => Promise<AssetsManifest>} CompileBrowser */
/** @typedef {(remixConfig: RemixConfig, manifestPromise: Promise<AssetsManifest>) => Promise<void>} CompileServer */

/** @type {(remixConfig: RemixConfig, compile: {browser: CompileBrowser, server: CompileServer}) => [ReturnType<CompileBrowser>, ReturnType<CompileServer>]} */
export function build(remixConfig, compile) {
  let manifestPromise = compile.browser(remixConfig);

  // write manifest
  manifestPromise.then((manifest) => {
    fs.mkdirSync(remixConfig.assetsBuildDirectory, { recursive: true });
    fs.writeFileSync(
      path.resolve(
        remixConfig.assetsBuildDirectory,
        path.basename(manifest.url)
      ),
      `window.__remixManifest=${JSON.stringify(manifest)};`
    );
  });

  let serverPromise = compile.server(remixConfig, manifestPromise);
  return [manifestPromise, serverPromise];
}