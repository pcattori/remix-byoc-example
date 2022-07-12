const path = require("path");

const webpack = require("webpack");
const VirtualModulesPlugin = require("webpack-virtual-modules");

/** @typedef {import("@remix-run/dev/compiler/assets").AssetsManifest} AssetsManifest */
/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

const mode = "development";
// process.env.NODE_ENV === "development" ? "development" : "production";

/** @type { (remixConfig: RemixConfig, manifest: AssetsManifest) => webpack.Configuration} */
module.exports = (remixConfig, manifest) => {
  let entryPoint = path.resolve(remixConfig.rootDirectory, "server.ts");

  let routeImports = Object.values(remixConfig.routes).map((route, index) => {
    return `import * as route${index} from "${path.resolve(
      remixConfig.appDirectory,
      route.file
    )}";`;
  });
  let routes = Object.entries(remixConfig.routes).map(([routeId, route], index) => {
    return `${JSON.stringify(routeId)}: {
      id: ${JSON.stringify(route.id)},
      parentId: ${JSON.stringify(route.parentId)},
      path: ${JSON.stringify(route.path)},
      index: ${JSON.stringify(route.index)},
      caseSensitive: ${JSON.stringify(route.caseSensitive)},
      module: route${index}
    }`;
  });

  let serverBuild = `
    import * as entryServer from "${path.resolve(
      remixConfig.appDirectory,
      remixConfig.entryServerFile
    )}";

    ${routeImports.join("\n")}

    export const entry = { module: entryServer };
    export const routes = {
      ${routes.join(",\n  ")}
    };
    export const assets = ${JSON.stringify(manifest)};
  `;

  let isModule = remixConfig.type === "module";
  return {
    mode,
    devtool: mode === "development" ? "inline-cheap-source-map" : undefined,

    context: remixConfig.rootDirectory,
    target: "node",
    resolve: {
      alias: {
        "~": remixConfig.appDirectory,
        // TODO grab aliases from tsconfig
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"],
    },
    optimization: {
      moduleIds: "deterministic",
    },
    experiments: isModule ? { outputModule: true } : undefined,
    externalsType: isModule ? "module" : undefined,
    entry: entryPoint,
    module: {
      rules: [
        {
          // https://github.com/aws-amplify/amplify-js/issues/7260#issuecomment-840750788
          test: /\.m?js/,
          resolve: { fullySpecified: false },
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
        // TODO disable CSS output manually
        {
          test: /\.css$/i,
          type: "asset/resource",
        },
      ],
    },
    output: {
      filename: path.basename(remixConfig.serverBuildPath),
      library: { type: isModule ? "module" : "commonjs" },
      chunkFormat: isModule ? "module" : "commonjs",
      chunkLoading: isModule ? "import" : "require",
      module: isModule,
      path: path.dirname(remixConfig.serverBuildPath),
      publicPath: remixConfig.publicPath,
      assetModuleFilename: "_assets/[name]-[contenthash][ext]",
    },
    plugins: [
      new VirtualModulesPlugin({
        [entryPoint]: remixConfig.serverBuildTargetEntryModule,
        "node_modules/@remix-run/dev/server-build": serverBuild,
      }),
      new webpack.EnvironmentPlugin({
        REMIX_DEV_SERVER_WS_PORT: JSON.stringify(remixConfig.devServerPort),
      }),
      new webpack.ProvidePlugin({ React: ["react"] }),
    ],
  };
};
