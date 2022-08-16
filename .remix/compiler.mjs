import { createRequire } from "module";

import { readConfig } from "@remix-run/dev/dist/config.js";
import { build, makeRemixCompiler, watch } from "@remix-run/compiler";
import {
  createBrowserCompiler,
  createServerCompiler,
} from "@remix-run/compiler-webpack";

const require = createRequire(import.meta.url);

async function buildCommand() {
  console.time("Remix Compile");
  let remixConfig = await readConfig();
  let compiler = makeRemixCompiler(remixConfig, {
    browser: createBrowserCompiler(require("./webpack.config.browser.js")),
    server: createServerCompiler(require("./webpack.config.server.js")),
  });
  const { browser, server } = build(remixConfig, compiler);
  await Promise.all([browser, server]).then(([a, b]) => {
    console.timeEnd("Remix Compile");
  });
}

async function watchCommand() {
  let remixConfig = await readConfig();
  watch(remixConfig, {
    browser: createBrowserCompiler(require("./webpack.config.browser.js")),
    server: createServerCompiler(require("./webpack.config.server.js")),
  });
}

// buildCommand();
watchCommand();
