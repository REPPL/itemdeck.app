# The plugin subsystem

**Type:** Explanation — why the plugin subsystem exists in the codebase but is not part of the running application.

## What it is

The codebase contains a plugin subsystem (roughly 7,600 lines under `src/plugins/`) covering manifest schemas, a loader, validation, a worker sandbox, and adapters that bridge plugin contributions into the mechanic registry and the collection-loading system. Built-in plugin definitions for themes, mechanics (Memory, Snap Ranking), and the GitHub source live under `src/plugins/builtin/`.

## Why it is not active

Nothing in the production entry point calls `registerAllBuiltinPlugins()` or the adapter registration functions. The subsystem compiles and is covered by tests, but it is not reachable from `src/main.tsx`: themes, mechanics, and sources are wired through their existing direct registrations instead. The code is scaffolding for a future capability, not a live feature.

Activating it is deliberately deferred. Wiring a plugin system into application start-up affects security, start-up ordering, and the public contract for third-party manifests, so it requires a designed milestone of its own rather than an incidental change.

## How its dynamic imports are guarded

Plugin manifests are data, not trusted code, yet source and mechanic contributions carry an `entrypoint` field that the adapters pass to dynamic `import()`. To keep manifest content from selecting arbitrary modules, both adapters check the entrypoint against a hardcoded allowlist of the module paths the built-in plugins register:

- `src/plugins/integration/sourceAdapter.ts` allows only `@/loaders/githubDiscovery`.
- `src/plugins/integration/mechanicAdapter.ts` allows only `@/mechanics/memory` and `@/mechanics/snap-ranking`.

Any other entrypoint is rejected with an error before it reaches `import()`. Extending the allowlist is a code change, reviewed like any other.

## What this means in practice

- Changes to `src/plugins/` carry no runtime risk to the shipped application, because the code does not execute there.
- The subsystem must not be reported or documented as a working feature.
- Removing it or wiring it are both open options; either is a milestone-level decision, recorded when taken.
