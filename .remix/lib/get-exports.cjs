const os = require("os");

const esbuild = require("esbuild");

/** @typedef {import("@remix-run/dev/config").RemixConfig} RemixConfig */

/** @type {(routePath: string, remixConfig: RemixConfig) => string[]} */
function getExports(routePath, remixConfig) {
  let { metafile, errors } = esbuild.buildSync({
    sourceRoot: remixConfig.appDirectory,
    entryPoints: [routePath],
    target: "esnext",
    bundle: false,
    metafile: true,
    write: false,
    outdir: os.tmpdir(),
  });

  if (errors?.length > 0) {
    throw new Error(
      esbuild.formatMessagesSync(errors, { kind: "error" }).join("\n")
    );
  }

  let outputs = Object.values(metafile.outputs);
  if (outputs.length !== 1) {
    throw Error();
  }
  let output = outputs[0];
  return output.exports;
}

module.exports = {
  getExports,
};
