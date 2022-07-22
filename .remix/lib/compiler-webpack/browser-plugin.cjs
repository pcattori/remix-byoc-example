const { builtinModules } = require("module");
const path = require("path");

const webpack = require("webpack");
const VirtualModulesPlugin = require("webpack-virtual-modules");

const { objectMap } = require("../object-map.cjs");

/** @typedef {import("ts-toolbelt").F} F */
/** @typedef {import("ts-toolbelt").O} O */
/** @typedef {import("ts-toolbelt").S} S */

/** @type {(remixConfig: RemixConfig) => Record<string, string>} */
const getVirtualModuleRoutes = (remixConfig) =>
  objectMap(remixConfig.routes, ([id, route]) => [
    id,
    path.resolve(
      remixConfig.appDirectory,
      path.dirname(route.file),
      "__remix_browser_route__" + path.basename(route.file)
    ),
  ]);

/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

const entry = (remixConfig) => {
  const virtualModuleRoutes = getVirtualModuleRoutes(remixConfig);
  return {
    "entry.client": path.resolve(
      remixConfig.appDirectory,
      remixConfig.entryClientFile
    ),
    ...virtualModuleRoutes,
  };
};

/** @type {(remixConfig: RemixConfig) => webpack.RuleSetRule} */
const rule = (remixConfig) => {
  return {
    test: /\/__remix_browser_route__/,
    loader: require.resolve("./browser-routes-loader.cjs"),
    options: { remixConfig },
  };
};

/** @type {(remixConfig: RemixConfig) => webpack.WebpackPluginFunction} */
const plugin = (remixConfig) => (compiler) => {
  // TODO warn/error if these are set to something else...?

  compiler.options.target = "web";

  compiler.options.resolve.fallback = {
    ...(compiler.options.resolve.fallback ?? {}),
    ...Object.fromEntries(builtinModules.map((m) => [m, false])),
  };

  compiler.options.optimization.moduleIds = "deterministic";

  // modules
  compiler.options.externalsType = "module";
  compiler.options.experiments.outputModule = true;
  compiler.options.output.module = true;
  compiler.options.output.library = {
    ...(compiler.options.output.library ?? {}),
    type: "module",
  };
  compiler.options.output.chunkFormat = "module";
  compiler.options.output.chunkLoading = "import";

  console.log(JSON.stringify(compiler.options.output, undefined, 4));

  const virtualModuleRoutes = getVirtualModuleRoutes(remixConfig);

  // TODO multiple instances of a plugin?

  new VirtualModulesPlugin(
    objectMap(virtualModuleRoutes, ([, route]) => [route, ""])
  ).apply(compiler);

  new webpack.EnvironmentPlugin({
    REMIX_DEV_SERVER_WS_PORT: JSON.stringify(remixConfig.devServerPort),
  }).apply(compiler);

  // do not bundle `.server` files for browser
  new webpack.IgnorePlugin({ resourceRegExp: /\.server(\.[t|j]sx?)?$/ }).apply(
    compiler
  );

  // shim react so it can be used without importing
  new webpack.ProvidePlugin({ React: ["react"] }).apply(compiler);
};

/** @type {(remixConfig: RemixConfig) => webpack.WebpackPluginFunction} */
const output = (remixConfig) => {
  return {
    path: remixConfig.assetsBuildDirectory,
    publicPath: remixConfig.publicPath,
    filename: "[name]-[contenthash].js",
    chunkFilename: "[name]-[contenthash].js",
    assetModuleFilename: "_assets/[name]-[contenthash][ext]",
  };
};

module.exports = {
  entry,
  rule,
  plugin,
  output,
};
