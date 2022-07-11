import path from "path";

import webpack from "webpack";
import { getExports } from "../get-exports.cjs";

import { objectMap } from "../object-map.cjs";

/** @typedef {import("@remix-run/dev/compiler/assets").AssetsManifest} AssetsManifest */
/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */
/** @typedef {(remixConfig: RemixConfig) => Promise<AssetsManifest>} CompileBrowser */
/** @typedef {(remixConfig: RemixConfig, manifestPromise: Promise<AssetsManifest>) => void} CompileServer */

/** @type {(config: webpack.Configuration) => Promise<webpack.Stats>} */
function asyncWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (error, stats) => {
      if (error) return reject(error);
      return resolve(stats);
    });
  });
}

/** @type {(stats: webpack.Stats) => void} */
function check(stats) {
  let statsWarningFilters = [
    "node_modules/@remix-run/react/esm/routeModules.js",
  ];
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

/** @type {(stats: webpack.StatsCompilation, publicPath: string) => string[]} */
function createNamedChunkGroupFactory(stats, publicPath) {
  let chunksById = new Map(stats.chunks.map((chunk) => [chunk.id, chunk]));
  return (group) => {
    /** @type {Set<string>} */
    let files = new Set();
    stats.namedChunkGroups[group].chunks.forEach((chunkId) => {
      let chunk = chunksById.get(chunkId);
      chunk.files?.forEach((file) => files.add(createUrl(publicPath, file)));
    });
    return [...files];
  };
}

/** @type {(publicPath: string, file: string) => string} */
export function createUrl(publicPath, file) {
  return (
    publicPath.split(path.win32.sep).join("/") +
    (file || "").split(path.win32.sep).join("/")
  );
}

/** @type {(remixConfig: RemixConfig, stats: webpack.Stats) => AssetsManifest} */
async function toManifest(remixConfig, stats) {
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
    compilationStats.entrypoints["entry.client"].assets.slice(-1)[0].name
  );
  /** @type {string[]} */
  let rootImports = getByNamedChunkGroup("root");

  // TODO: what are runtime imports? dynamic imports?
  /** @type {string[]} */
  // let runtimeImports = compilationStats.assetsByChunkName["runtime"].map(
  //   (asset) => createUrl(remixConfig.publicPath, asset)
  // );

  let routes = objectMap(remixConfig.routes, ([routeId, route]) => {
    let routeImports = compilationStats.entrypoints[routeId].assets
      .slice(0, -1)
      .map((asset) => createUrl(remixConfig.publicPath, asset.name));
    let routeModule = createUrl(
      remixConfig.publicPath,
      compilationStats.entrypoints[routeId].assets.slice(-1)[0].name
    );
    let routePath = path.resolve(remixConfig.appDirectory, route.file);
    let routeExports = getExports(routePath, remixConfig);
    return [
      routeId,
      {
        id: route.id,
        parentId: route.parentId,
        path: route.path,
        index: route.index,
        caseSensitive: route.caseSensitive,
        module: routeModule,
        imports: routeImports,
        hasAction: routeExports.includes("action"),
        hasLoader: routeExports.includes("loader"),
        hasCatchBoundary: routeExports.includes("CatchBoundary"),
        hasErrorBoundary: routeExports.includes("ErrorBoundary"),
      },
    ];
  });

  let version = compilationStats.hash;
  return {
    version,
    url: createUrl(
      remixConfig.publicPath,
      `manifest-${version.toUpperCase()}.js`
    ),
    entry: {
      imports: [
        ...new Set([/* ...runtimeImports, */ ...entryImports, ...rootImports]),
      ],
      module: entryModule,
    },
    routes,
  };
}

/** @type {(getWebpackConfig: (remixConfig: RemixConfig) => webpack.Configuration) => CompileBrowser} */
export const createCompileBrowser =
  (getWebpackConfig) => async (remixConfig) => {
    const webpackConfig = getWebpackConfig(remixConfig);
    const stats = await asyncWebpack(webpackConfig);
    check(stats);
    return toManifest(remixConfig, stats);
  };

/** @type {(getWebpackConfig: (remixConfig: RemixConfig, manifest: AssetsManifest) => webpack.Configuration) => CompileServer} */
export const createCompileServer =
  (getWebpackConfig) => async (remixConfig, manifestPromise) => {
    const manifest = await manifestPromise;
    const webpackConfig = getWebpackConfig(remixConfig, manifest);
    await asyncWebpack(webpackConfig);
  };
