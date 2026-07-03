import { initApiPassthrough } from "langgraph-nextjs-api-passthrough";

// The service binding injects LANGGRAPH_API_URL at runtime, not at build time,
// so fall back to a placeholder during the build to avoid a hard failure.
const apiUrl =
  process.env.LANGGRAPH_API_URL ?? "http://localhost:2024";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
  initApiPassthrough({
    apiUrl,
    apiKey: process.env.LANGSMITH_API_KEY,
    runtime: "edge",
  });
