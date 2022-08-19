const {config: RemixWebpack} = require("@remix-run/compiler-webpack");

const mode = process.env.NODE_ENV === "development" ? "development" : "production";

module.exports = (remixConfig) => {
  let webpackConfig = {
    mode,
    devtool: mode === "development" ? "inline-cheap-source-map" : undefined,
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
        {
          test: /\.css$/i,
          type: "asset/resource",
        },
      ],
    },
  };
  return RemixWebpack.merge(
    RemixWebpack.browser.recommended(mode),
    webpackConfig,
    RemixWebpack.browser.config(remixConfig),
  );
};
