const { builtinModules } = require("module");
const path = require("path");

const { ESBuildMinifyPlugin } = require("esbuild-loader");
const webpack = require("webpack");
const VirtualModulesPlugin = require("webpack-virtual-modules");

const { objectMap } = require("./lib/object-map.cjs");

/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

const mode =
  "development"
  // process.env.NODE_ENV === "development" ? "development" : "production";

/** @type { (remixConfig: RemixConfig) => import('webpack').Configuration} */
module.exports = (remixConfig) => {
  const routes = objectMap(remixConfig.routes, ([id, route]) => [
    id,
    path.resolve(
      remixConfig.appDirectory,
      path.dirname(route.file),
      "__remix_browser_route__" + path.basename(route.file)
    ),
  ]);

  /** @type {Record<string,string>} */
  const entry = {
    "entry.client": path.resolve(
      remixConfig.appDirectory,
      remixConfig.entryClientFile
    ),
    ...routes,
  };

  return {
    mode,
    devtool: mode === "development" ? "inline-cheap-source-map" : undefined,

    context: remixConfig.rootDirectory,
    target: "web",
    resolve: {
      alias: {
        "~": remixConfig.appDirectory,
        // TODO grab aliases from tsconfig
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"],
      fallback: Object.fromEntries(builtinModules.map((m) => [m, false])),
    },
    optimization: {
      moduleIds: "deterministic",
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
      },
      usedExports: true,
      minimize: mode === "production",
      minimizer: [new ESBuildMinifyPlugin({ target: "es2019" })],
    },
    // TODO move `module` stuff to plugin. warn/fail if user sets this to something other than module
    experiments: { outputModule: true },
    externalsType: "module",
    entry,
    module: {
      rules: [
        {
          // TODO: summary of when you need this
          // https://github.com/aws-amplify/amplify-js/issues/7260#issuecomment-840750788
          test: /\.m?js$/,
          resolve: { fullySpecified: false },
        },
        {
          test: /\/__remix_browser_route__/,
          loader: require.resolve(
            "./lib/compiler-webpack/browser-routes-loader.cjs"
          ),
          options: { remixConfig },
        },
        {
          test: /\.[j|t]sx?$/,
          loader: "esbuild-loader",
          exclude: /node_modules/,
          options: {
            target: "es2019",
            loader: "tsx",
          },
        },
        {
          test: /\.css$/i,
          type: "asset/resource",
        },
      ],
    },
    output: {
      path: remixConfig.assetsBuildDirectory,
      module: true,
      library: { type: "module" },
      publicPath: remixConfig.publicPath,
      filename: "[name]-[contenthash].js",
      chunkFormat: "module",
      chunkLoading: "import",
      chunkFilename: "[name]-[contenthash].js",
      assetModuleFilename: "_assets/[name]-[contenthash][ext]",
    },
    plugins: [
      // TODO define plugin vs environment plugin?
      new webpack.EnvironmentPlugin({
        REMIX_DEV_SERVER_WS_PORT: JSON.stringify(remixConfig.devServerPort),
      }),
      new VirtualModulesPlugin(objectMap(routes, ([, route]) => [route, ""])),
      new webpack.IgnorePlugin({ resourceRegExp: /\.server(\.[t|j]sx?)?$/ }),
      new webpack.ProvidePlugin({ React: ["react"] }),
    ],
  };
};
