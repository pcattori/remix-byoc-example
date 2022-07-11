const esbuild = require("esbuild");

const { getExports } = require("../get-exports.cjs")

const BROWSER_EXPORTS = [
  "CatchBoundary",
  "ErrorBoundary",
  "default",
  "handle",
  "links",
  "meta",
  "unstable_shouldReload",
];

async function treeshakeBrowserExports(routePath, remixConfig) {
  let xports = getExports(routePath, remixConfig);
  let browserExports = xports.filter((xport) =>
    BROWSER_EXPORTS.includes(xport)
  );

  let virtualModule = "module.exports = {};";
  if (browserExports.length !== 0) {
    virtualModule = `export { ${browserExports.join(
      ", "
    )} } from "${routePath}";`;
  }

  let { outputFiles } = await esbuild.build({
    stdin: { contents: virtualModule, resolveDir: remixConfig.rootDirectory },
    format: "esm",
    target: "es2018",
    treeShaking: true,
    write: false,
    sourcemap: "inline",
    bundle: true,
    plugins: [
      {
        name: "externals",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path === routePath) return undefined;
            return { external: true, sideEffects: false };
          });
        },
      },
    ],
  });
  return outputFiles[0].text;
}

/**
  @this {{
    cacheable: (cacheable: boolean) => void
    getOptions: () => {
      remixConfig: import("@remix-run/dev/config").RemixConfig
    }
    resource: string
    async: () => (
      err: Error | null,
      content: string | Buffer,
      sourceMap?: SourceMap,
      meta?: any
    ) => void
  }}
 */
module.exports = async function () {
  let callback = this.async()
  this.cacheable(false);
  let { remixConfig } = this.getOptions();
  let routePath = this.resource.replace(/\/__remix_browser_route__/, "/");
  let browserRouteVirtualModule = await treeshakeBrowserExports(routePath, remixConfig);
  callback(undefined, browserRouteVirtualModule);
};
