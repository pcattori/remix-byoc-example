import fs from "fs";
import path from "path";

import { readConfig } from "@remix-run/dev/config.js";

import { compileBrowser } from "./compiler-webpack/index.mjs";

/** @typedef {import("@remix-run/dev/compiler/assets").AssetsManifest} AssetsManifest */
/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */
/** @typedef {(remixConfig: RemixConfig) => Promise<AssetsManifest>} CompileBrowser */

// type CompileServer = (
//   remixConfig: RemixConfig,
//   manifestPromise: Promise<Manifest>
// ) => void;

/** @type {(remixConfig: RemixConfig, compileBrowser: CompileBrowser) => Promise<[AssetsManifest]>} */
export async function build(remixConfig, compileBrowser) {
  let manifestPromise = compileBrowser(remixConfig);

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

  return Promise.all([manifestPromise]);
  // let serverPromise = compile.server(remixConfig, manifestPromise);
  // return Promise.all([manifestPromise, serverPromise]);
}

// export async function watch({ watchBrowser, watchServer }: Compiler) {}

async function main() {
  let remixConfig = await readConfig();
  await build(remixConfig, compileBrowser);
}
main().then((_) => console.log("done"));
