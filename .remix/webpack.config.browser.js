const { builtinModules } = require("module")
const path = require("path");

const { ESBuildMinifyPlugin } = require("esbuild-loader");
const webpack = require("webpack");
const VirtualModulesPlugin = require("webpack-virtual-modules");

/** @type {<K,V1,V2>(obj: Record<K,V1>, f: (entry: [K,V1]) => [K,V2]) => Record<K,V2>} */
const objectMap = (obj, f) => Object.fromEntries(Object.entries(obj).map(f));

const mode = process.env.NODE_ENV === "development" ? "development" : "production";

/** @type { (remixConfig: import("@remix-run/dev/config").RemixConfig) => import('webpack').Configuration} */
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

    target: "web",
    resolve: {
      alias: {
        "~": remixConfig.appDirectory
        // TODO grab aliases from tsconfig
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"],
      fallback: Object.fromEntries(builtinModules.map(m => [m, false])),
    },
    optimization: {
      splitChunks: {
        chunks: "all",
      },
      usedExports: true,
      minimize: mode === "production",
      minimizer: [
        new ESBuildMinifyPlugin({ target: "es2019" }),
      ],
    },
    experiments: { outputModule: true },
    externalsType: "module",
    entry,
    module: {
      rules: [
        {
          // interop between cjs,mjs,etc.. in the same build
          test: /\.m?js$/,
          resolve: { fullySpecified: false },
        },
        {
          test: /\/__remix_browser_route__/,
          loader: require.resolve("./compiler-webpack/browser-routes-loader.cjs"),
          options: { remixConfig },
        },
        {
          test: /\.[j|t]sx?$/,
          loader: "esbuild-loader",
          exclude: /node_modules/,
          options: {
            target: "es2019",
            loader: "tsx"
          }
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
      filename: "[name]-[contenthash].js",
      chunkFormat: "module",
      chunkFilename: "chunk-[contenthash].js",
      assetModuleFilename: "_assets/[name]-[contenthash]",
    },
    plugins: [
      new VirtualModulesPlugin(objectMap(routes, ([,route]) => [route, ""])),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.server(\.[t|j]sx?)?$/,
      }),
      new webpack.ProvidePlugin({
        React: ["react"]
      }),
    ],
  };
};