import { createRequire } from "module";

import { readConfig } from "@remix-run/dev/dist/config.js";
import { build, makeRemixCompiler } from "@remix-run/compiler";
import {
  createBrowserCompiler,
  createServerCompiler,
} from "@remix-run/compiler-webpack";

const require = createRequire(import.meta.url);

async function command() {
  console.time("Remix Compile");
  let remixConfig = await readConfig();
  let compiler = makeRemixCompiler(remixConfig, {
    browser: createBrowserCompiler(require("./webpack.config.browser.js")),
    server: createServerCompiler(require("./webpack.config.server.js")),
  });
  await build(remixConfig, compiler);
  console.timeEnd("Remix Compile");

  // await Promise.all([browser, server]).then(([a, b]) => {
  // });
}

command()
