import { createRequire } from "module";

import { readConfig } from "@remix-run/dev/config.js";

import { build } from "./lib/build.mjs";
import { createCompileBrowser, createCompileServer } from "./lib/compiler-webpack/index.mjs";
// import { createCompileBrowser, createCompileServer } from "./lib/compiler-esbuild/index.mjs";

const require = createRequire(import.meta.url);

async function main() {
  console.time("Remix Compile")
  let remixConfig = await readConfig();
  let compile = {
    browser: createCompileBrowser(require("./webpack.config.browser.js")),
    // browser: createCompileBrowser(require("./esbuild.config.browser.js")),
    server: createCompileServer(require("./webpack.config.server.js")),
    // server: createCompileServer(require("./esbuild.config.server.js")),
  }
  await Promise.all(build(remixConfig, compile));
  console.timeEnd("Remix Compile")
}
main()
