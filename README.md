# Remix - Bring Your Own Compiler (BYOC)

Goal: Let users customize build (e.g via plugins) to support the features they care about that are outside the scope for Remix.

App is copied from [kentcdodds/fakebooks-remix](https://github.com/kentcdodds/fakebooks-remix).

## Build and run

```sh
npm run byoc2
npm run start
```

## Technical approach

Note: code in `./.remix/lib/` would eventually be imported from a Remix package like `@remix-run/dev` or similar.

Define compiler-agnostic function signatures for compiling the browser bundle and the server bundle:

```ts
import type { AssetsManifest } from "@remix-run/dev/compiler/assets";
import type { RemixConfig } from "@remix-run/dev/config";

/**
 * Compile the browser bundle.
 * Write compiled output to `./public/build/`
 */
export type CompileBrowser = (
  remixConfig: RemixConfig
) => Promise<AssetsManifest>;

/**
 * Compile the server bundle.
 * Write compiled output to `./build/index.js`
 */
export type CompileServer = (
  remixConfig: RemixConfig,
  manifestPromise: Promise<AssetsManifest>
) => Promise<void>;
```

Then provide a `build` function that accepts implementations for compiling browser and server:

```ts
type Build = (
  remixConfig: RemixConfig,
  compile: { browser: CompileBrowser; server: CompileServer }
) => [ReturnType<CompileBrowser>, ReturnType<CompileServer>];
```

## Conventions (TBD)

```
my-remix-app/
- .remix/
  - compiler.mjs
  - config.browser.js
  - config.server.mjs
```

## TODO
- [ ] Fix live reload
- [ ] `dev`/`watch` mode
- [ ] Refactor webpack configs into a Remix webpack plugin