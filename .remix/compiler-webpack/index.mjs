import path from "path"
import { createRequire } from "module";

import webpack from "webpack";

const require = createRequire(import.meta.url);

/** @typedef {import("@remix-run/dev/compiler/assets").AssetsManifest} AssetsManifest */
/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

/** @type {(config: webpack.Configuration) => Promise<webpack.Stats>} */
function asyncWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) return reject(error);
      return resolve(stats);
    });
  });
}

function check(stats) {
  let statsWarningFilters = ["node_modules/@remix-run/react/esm/routeModules.js"];
  if (stats.hasErrors()) {
    console.error(
      stats.toString({
        colors: true,
        errors: true,
        logging: "warn",
        warningsFilter: statsWarningFilters,
      })
    );
    throw new Error("Client build failed");
  }
}

/**
 * @param {Record<string, Set<string>>} routeExports
 */

// TODO: createNamedChunkGroupFactory
// TODO: getByNamedChunkGroup
/**
 *
 * @param {webpack.StatsCompilation} stats
 * @param {string} publicPath
 */
 function createNamedChunkGroupFactory(stats, publicPath) {
  let chunksById = new Map(stats.chunks.map((chunk) => [chunk.id, chunk]));
  return (group) => {
    let files = new Set();
    stats.namedChunkGroups[group].chunks.forEach((chunkId) => {
      let chunk = chunksById.get(chunkId);
      if (chunk?.files) {
        chunk.files.forEach((file) => files.add(createUrl(publicPath, file)));
      }
    });
    return [...files];
  };
}

// TODO: createUrl
export function createUrl(publicPath, file) {
  return (
    publicPath.split(path.win32.sep).join("/") +
    (file || "").split(path.win32.sep).join("/")
  );
}

/** @type {(remixConfig: RemixConfig, stats: webpack.Stats) => AssetsManifest} */
function toManifest(remixConfig, stats) {
  let compilationStats = stats.toJson({
    modules: true,
    entrypoints: true,
    assets: true,
    groupAssetsByChunk: true,
    hash: true,
  });
  let getByNamedChunkGroup = createNamedChunkGroupFactory(
    compilationStats,
    remixConfig.publicPath
  );

  /** @type {string[]} */
  let entryImports = getByNamedChunkGroup("entry.client");
  let entryModule = createUrl(
    remixConfig.publicPath,
    compilationStats.entrypoints["entry.client"].assets[
      compilationStats.entrypoints["entry.client"].assets.length - 1
    ].name
  );
  /** @type {string[]} */
  let rootImports = getByNamedChunkGroup("root");

  /** @type {string[]} */
  // let runtimeImports = compilationStats.assetsByChunkName["runtime"].map(
  //   (asset) => createUrl(remixConfig.publicPath, asset)
  // );

  let routes = Object.entries(remixConfig.routes).reduce(
    (acc, [routeId, route]) => {
      let routeImports = compilationStats.entrypoints[routeId].assets
        .slice(0, -1)
        .map((asset) => createUrl(remixConfig.publicPath, asset.name));
      let routeModule = createUrl(
        remixConfig.publicPath,
        compilationStats.entrypoints[routeId].assets[
          compilationStats.entrypoints[routeId].assets.length - 1
        ].name
      );

      acc[routeId] = {
        id: route.id,
        parentId: route.parentId,
        path: route.path,
        index: route.index,
        caseSensitive: route.caseSensitive,
        module: routeModule,
        imports: routeImports,
        // hasAction: routeExports[routeId].has("action"),
        // hasLoader: routeExports[routeId].has("loader"),
        // hasCatchBoundary: routeExports[routeId].has("CatchBoundary"),
        // hasErrorBoundary: routeExports[routeId].has("ErrorBoundary"),
      };
      return acc;
    },
    {}
  );

  let version = compilationStats.hash;
  return {
    version,
    url: createUrl(remixConfig.publicPath,`manifest-${version.toUpperCase()}.js`),
    entry: {
      imports: [
        ...new Set([/* ...runtimeImports, */...entryImports, ...rootImports]),
      ],
      module: entryModule,
    },
    routes,
  };
}

/** @type {(remixConfig: RemixConfig) => Promise<AssetsManifest>} */
export const compileBrowser = async (remixConfig) => {
  // TODO accept webpackConfig as param?
  let webpackConfig = require("../webpack.config.browser.js")(remixConfig)
  return asyncWebpack(webpackConfig).then(stats => {
    check(stats)
    return toManifest(remixConfig, stats)
  });
}
