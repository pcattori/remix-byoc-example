const { ESBuildMinifyPlugin } = require("esbuild-loader");

const RemixBrowser = require("./lib/compiler-webpack/browser-plugin.cjs");

/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

const mode =
  "development"
  // process.env.NODE_ENV === "development" ? "development" : "production";

/** @type { (remixConfig: RemixConfig) => import('webpack').Configuration} */
module.exports = (remixConfig) => {
  return {
    mode, // user-land
    devtool: mode === "development" ? "inline-cheap-source-map" : undefined, // user-land

    resolve: {
      alias: {
        // TODO grab aliases from tsconfig
        "~": remixConfig.appDirectory, // user-land
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"], // user-land
    },
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
      },
      // usedExports: true,
      minimize: mode === "production",
      minimizer: [new ESBuildMinifyPlugin({ target: "es2019" })],
    },
    entry: RemixBrowser.entry(remixConfig),
    module: {
      rules: [
        RemixBrowser.rule(remixConfig),
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
      ...RemixBrowser.output(remixConfig),
    },
    plugins: [
      RemixBrowser.plugin(remixConfig),
    ],
  };
};
