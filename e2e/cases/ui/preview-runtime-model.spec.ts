import { getDefaultModelIdForVendor, getPresetModel } from "@mosoo/runtime-catalog";
import { expect, test } from "@playwright/test";

import {
  CONSOLE_FIXTURE_IDS,
  fulfillJson,
  getOperationName,
  installConsoleFixtures,
  parseGraphQLRequestBody,
} from "../../lib/console-fixtures";
import { configurePreviewRuntimeModel } from "../../lib/setup-agent";

const agentId = CONSOLE_FIXTURE_IDS.agentIds[0];
const now = "2026-10-20T00:00:00Z";
const modelId = getDefaultModelIdForVendor("gemini");
if (modelId === null) throw new Error("Gemini needs a reviewed default model.");

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

for (const initial of [
  "different-model",
  "already-selected",
  "same-model-other-provider",
] as const) {
  for (const persisted of [
    "matches",
    "other-provider",
    "missing-provider",
    "other-model",
    "other-agent",
  ] as const) {
    test(`Preview model helper checks persisted identity (${initial}, ${persisted})`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await installConsoleFixtures(page, { locale: "en" });
      let navigations = 0;
      let reloadReads = 0;
      page.on("request", (request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations += 1;
      });
      let agent = {
        createdAt: now,
        description: "Model selection fixture",
        id: agentId,
        liveVersion: null,
        model: initial === "different-model" ? "deepseek-v4-pro" : modelId,
        name: "Preview model selection",
        owner: { id: CONSOLE_FIXTURE_IDS.accountId, imageUrl: null, name: "Fixture owner" },
        projectId: CONSOLE_FIXTURE_IDS.projectId,
        prompt: "Use the selected model.",
        provider: initial === "already-selected" ? "gemini" : "opencode",
        runtimeId: "acp-fallback",
        skills: [],
        status: "draft",
        tools: [],
        updatedAt: now,
        versions: [],
        viewerRole: "owner",
        visibility: "private",
      };
      const writes: Record<string, unknown>[] = [];
      const entries = [
        { vendorId: "opencode", modelId: agent.model },
        { vendorId: "gemini", modelId },
      ].map((identity) => {
        const preset = getPresetModel(identity);
        if (preset === null) throw new Error("Expected a preset model.");
        return {
          modelId: identity.modelId,
          vendorId: identity.vendorId,
          available: true,
          displayName: preset.displayName,
          modelProtocol: preset.protocol,
          reason: null,
          source: "preset",
          statusDetail: null,
          statusLabel: "Available",
          vendorLabel: preset.vendorLabel,
        };
      });
      await page.route("**/api/graphql", async (route) => {
        const body = parseGraphQLRequestBody(route.request().postData());
        switch (getOperationName(body)) {
          case "Agent": {
            const reloaded = navigations > 1;
            if (reloaded) reloadReads += 1;
            // The mutation succeeds, but a fresh read can return a different
            // identity. Gemini and OpenCode share the same model display name.
            await fulfillJson(route, {
              agent: reloaded
                ? {
                    ...agent,
                    id: persisted === "other-agent" ? CONSOLE_FIXTURE_IDS.agentIds[1] : agent.id,
                    model: persisted === "other-model" ? "deepseek-v4-pro" : agent.model,
                    provider:
                      persisted === "missing-provider"
                        ? null
                        : persisted === "other-provider"
                          ? "opencode"
                          : agent.provider,
                  }
                : agent,
            });
            return;
          }
          case "AgentEditorState":
            await fulfillJson(route, {
              agentEditorState: {
                id: agentId,
                builtInTools: [],
                environment: { environmentId: null },
                mcpBindings: [],
                packageResolution: null,
                providerOptions: {},
                readiness: { checkedAt: now, issues: [], ready: true },
              },
            });
            return;
          case "AgentSessionList":
            await fulfillJson(route, { agentSessionList: { nodes: [] } });
            return;
          case "AvailableAgentModels":
            await fulfillJson(route, { availableAgentModels: entries });
            return;
          case "UpdateAgentConfig": {
            const input = body.variables?.["input"];
            if (!isRecord(input)) throw new Error("Expected an agent configuration input.");
            writes.push(input);
            agent = {
              ...agent,
              model: typeof input["model"] === "string" ? input["model"] : agent.model,
              provider: typeof input["provider"] === "string" ? input["provider"] : agent.provider,
            };
            await fulfillJson(route, { updateAgentConfig: agent });
            return;
          }
          default:
            await route.fallback();
        }
      });

      const selection = configurePreviewRuntimeModel(page, agentId, {
        modelId,
        providerId: "gemini",
      });
      if (persisted === "matches") {
        await selection;
      } else {
        await expect(selection).rejects.toThrow(
          "Reloaded Preview Agent must retain id, provider, and model",
        );
      }
      expect(reloadReads).toBeGreaterThan(0);
      expect(agent).toMatchObject({ model: modelId, provider: "gemini" });
      expect(writes).toHaveLength(initial === "already-selected" ? 0 : 1);
      for (const input of writes)
        expect(input).toMatchObject({ model: modelId, provider: "gemini" });
    });
  }
}
