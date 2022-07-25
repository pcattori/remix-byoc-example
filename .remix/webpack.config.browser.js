const { ESBuildMinifyPlugin } = require("esbuild-loader");

const RemixWebpack = require("@remix-run/webpack");

/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

const mode = "development";
// process.env.NODE_ENV === "development" ? "development" : "production";

/** @type { (remixConfig: RemixConfig) => import('webpack').Configuration} */
module.exports = (remixConfig) => {
  return {
    mode, // user-land
    devtool: mode === "development" ? "inline-cheap-source-map" : undefined, // user-land

    resolve: {
      alias: {
        "~": remixConfig.appDirectory, // user-land
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"], // user-land
    },
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
      },
      minimize: mode === "production",
      minimizer: [new ESBuildMinifyPlugin({ target: "es2019" })],
    },
    entry: RemixWebpack.browser.entry(remixConfig),
    module: {
      rules: [
        RemixWebpack.browser.rule(remixConfig),
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
      ...RemixWebpack.browser.output(remixConfig),
    },
    plugins: [RemixWebpack.browser.plugin(remixConfig)],
  };
};
