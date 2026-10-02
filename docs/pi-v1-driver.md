# Pi v1.0.0 Driver integration draft

This draft updates the Driver gitlink to the Pi v1.0.0 contribution on the protocol-6 revision already pinned by Mosoo. Pi is pinned to 1.0.0 and pi-acp to 0.0.34 in dependency locks, image manifests, fixtures and image admission checks.

The Driver submodule retains its canonical upstream URL, `https://github.com/langgenius/mosoo-agent-driver.git`. The submodule smoke check enforces that URL. Before merging, reconcile the Driver contribution with upstream and pin the accepted commit. The Driver contribution is [draft PR #130](https://github.com/langgenius/mosoo-agent-driver/pull/130).

## Acceptance and evidence

Given the current exact package pair, initialization, frozen model selection, cancellation and native restoration must pass. Given a native session created by Pi 0.99.2, upgrading to 1.0.0 must preserve conversation history, real shell tools and refreshed instructions without loading hostile resources. Given the packed Driver running in its production image, real requests through Mosoo's proxy must support file write/read, usage and native cold continuation.

The isolated source passed 1,352 Linux tests with 45 skips and zero failures, six real current-package contracts, 20 migration assertions, 24 packed MCP assertions and 49 host proxy/environment tests. Both production image profiles passed actual native tool execution; four real provider requests through the latest Mosoo proxy returned HTTP 200 and cold continuation retained conversation memory. The relocated contribution is byte-identical except for documentation; the PR describes additional checkout verification and any full-workspace gate limitations.

Relocated checkout verification: frozen install passed without lockfile changes, submodule smoke passed, API typecheck passed, and 36 focused host integration tests passed. The three new Pi admission regressions failed before the guards and passed afterward. Sandbox selection, Driver record creation and native-ref persistence reject Driver-only Pi before accessing storage; this retains existing DB enums without introducing migrations or pretending product provisioning exists. Current package contracts on macOS passed three tests with four Linux/migration skips.

Driver artifact SHA-256: `f8eb724f333369b23317674c07f82940a1aca3634e237e810eb2fd985369671c`.

## Scope

This is a Driver-level integration. It retains the existing protocol-6 contract and limits Pi to the managed OpenAI-compatible proxy, full access, text input, no Pi MCP and no additional directories. It does not add product runtime/model catalog entries, UI controls, production image provisioning or deployment. Real proxy E2E uses temporary SQLite/D1 fixtures, not production control-plane storage.

See [Driver integration details](../apps/driver/docs/pi-acp.md) and [Driver validation evidence](../apps/driver/docs/validation-protocol6.md). No GraphQL outputs or DB migrations change. The root lockfile is updated for the changed workspace dependencies.
