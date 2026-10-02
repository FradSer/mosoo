import { expect, test } from "bun:test";

import { parsePlatformId } from "@mosoo/id";
import type { SandboxSessionId } from "@mosoo/id";
import { PLATFORM_ID_FIXTURES as ids } from "@mosoo/id/testing";

import { createDriverInstanceRecord } from "../src/modules/runtime/infrastructure/driver-instance/driver-instance-record.repository";
import { upsertNativeResumeRef } from "../src/modules/runtime/infrastructure/native-resume-ref.repository";
import { sandboxBindingForRuntime } from "../src/platform/cloudflare/sandbox-binding";
import type { ApiBindings } from "../src/platform/cloudflare/worker-types";
import { SqliteD1Database } from "./helpers/sqlite-d1";

test("Given Driver-only Pi, When selecting a product image, Then reject unprovisioned Pi explicitly", () => {
  expect(() => sandboxBindingForRuntime("pi-acp")).toThrow("No Sandbox image for runtime: pi-acp.");
});

test("Given Driver-only Pi, When claiming a Driver, Then reject before accessing host storage", async () => {
  const db = new SqliteD1Database();
  await expect(
    createDriverInstanceRecord({ DB: db } as ApiBindings, {
      bootTokenHash: new Uint8Array(32),
      driverInstanceId: ids.driverInstance,
      executionSessionId: parsePlatformId<SandboxSessionId>("01J000000000000000000000Y2"),
      runtime: "pi-acp",
      sandboxId: ids.sandbox,
      sandboxSessionId: ids.session,
    }),
  ).rejects.toThrow("Pi runtime is not enabled in the product catalog.");
});

test("Given Driver-only Pi, When persisting a native ref, Then reject before accessing host storage", async () => {
  await expect(
    upsertNativeResumeRef(new SqliteD1Database(), {
      driverInstanceId: ids.driverInstance,
      sessionId: ids.session,
      sessionRunId: ids.sessionRun,
      nativeResumeRef: { runtimeId: "pi-acp", kind: "acp_session_id", value: "pi-session" },
    }),
  ).rejects.toThrow("Pi runtime is not enabled in the product catalog.");
});
