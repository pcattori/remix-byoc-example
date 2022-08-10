import { createRequire } from "module";

import { readConfig } from "@remix-run/dev/dist/config.js";
import { build } from "@remix-run/compiler";
import { createCompileBrowser, createCompileServer } from "@remix-run/compiler-webpack";

const require = createRequire(import.meta.url);

async function main() {
  console.time("Remix Compile")
  let remixConfig = await readConfig();
  let compile = {
    browser: createCompileBrowser(require("./webpack.config.browser.js")),
    server: createCompileServer(require("./webpack.config.server.js")),
  }
  await Promise.all(build(remixConfig, compile));
  console.timeEnd("Remix Compile")
}
main()
