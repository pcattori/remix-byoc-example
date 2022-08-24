import { createRequire } from "module";

import { readConfig } from "@remix-run/dev/dist/config.js";
import { serve } from "@remix-run/dev-server";
import {
  createBrowserCompiler,
  createServerCompiler,
} from "@remix-run/compiler-webpack";

const require = createRequire(import.meta.url);

async function command() {
  let remixConfig = await readConfig();
  serve(remixConfig, "development", {
    browser: createBrowserCompiler(require("./webpack.config.browser.js")),
    server: createServerCompiler(require("./webpack.config.server.js")),
  });
}

command();
