const {config: RemixWebpack} = require("@remix-run/compiler-webpack");
const MFP = require("webpack").container.ModuleFederationPlugin;
const { DefinePlugin } = require("webpack");

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
    plugins: [
      new DefinePlugin({
        browser: "true"
      }),
      new MFP({
        // runtime: false,
        name: "app1",
        library: {type: 'module'},
        filename: "remoteEntry.js",
        remoteType: 'module',
        remotes: {
          "app2": "http://localhost:3001/build/remoteEntry.js",
        },
        shared: {
          hostreact: {
            import: 'react',
            shareKey: 'react',
            packageName: 'react',
            singleton: true
          },
          "hostreact-dom": {
            import: 'react-dom',
            shareKey: 'react-dom',
            packageName: 'react-dom',
            singleton: true
          }
        }
      }),
    ],
    // optimization: {
    //   // concatenateModules: false,
    //   // mergeDuplicateChunks: false,
    //   splitChunks: false
    // },
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
