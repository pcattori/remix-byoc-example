const RemixWebpack = require("@remix-run/webpack");

/** @typedef {import("@remix-run/dev/compiler/assets").AssetsManifest} AssetsManifest */
/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */
/** @typedef {import("webpack").Configuration} WebpackConfiguration  */

const mode = process.env.NODE_ENV === "development" ? "development" : "production";

/** @type { (remixConfig: RemixConfig, manifest: AssetsManifest) => WebpackConfiguration} */
module.exports = (remixConfig, manifest) => {
  let webpackConfig = {
    mode,
    devtool: mode === "development" ? "inline-cheap-source-map" : undefined,
    context: remixConfig.rootDirectory,
    resolve: {
      alias: {
        "~": remixConfig.appDirectory,
      },
      extensions: [".tsx", ".ts", ".jsx", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.[j|t]sx?$/,
          loader: "esbuild-loader",
          exclude: /node_modules/,
          options: {
            target: "es2019",
            loader: "tsx",
          },
        },
        // TODO disable CSS output manually
        {
          test: /\.css$/i,
          type: "asset/resource",
        },
      ],
    },
  };
  return RemixWebpack.merge(webpackConfig, RemixWebpack.server.config(remixConfig, manifest))
};
