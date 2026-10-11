// Mastra: chat agent on an open model (Ollama/Gemma) with memory + a tool calling the WildWalk API.
// npm i @mastra/core @mastra/memory @mastra/libsql ollama-ai-provider zod
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { Memory } from "@mastra/memory";
import { createOllama } from "ollama-ai-provider";
import { z } from "zod";

const ollama = createOllama({ baseURL: process.env.OLLAMA_URL ?? "http://localhost:11434/api" });

const walkPack = createTool({
  id: "walk-pack",
  description: "Build a screen-free walk pack for a city",
  inputSchema: z.object({ city: z.string(), temp_c: z.number(), humidity: z.number(), aqi: z.number() }),
  execute: async ({ context }) =>
    (await fetch(`${process.env.WILDWALK_API}/walkpack`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: "demo", ...context }),
    })).json(),
});

export const walkAgent = new Agent({
  name: "walk-agent",
  instructions: "Help people go outside. Use the walk-pack tool. Keep replies short.",
  model: ollama(process.env.GEMMA_MODEL ?? "gemma3:4b"),
  tools: { walkPack },
  memory: new Memory(),
});
