export function getMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object") {
          const b = block as { type?: string; text?: unknown };
          // Skip reasoning blocks so they don't leak into the answer text.
          if (b.type === "reasoning" || b.type === "thinking") return "";
          if ("text" in b) return String(b.text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

type ReasoningBlock = {
  type?: string;
  text?: unknown;
  reasoning?: unknown;
  thinking?: unknown;
};

/**
 * Pulls reasoning / chain-of-thought text out of a message. Supports both
 * content-block arrays (Anthropic `thinking`, OpenAI `reasoning`) and the
 * `additional_kwargs.reasoning_content` field used by some providers.
 */
export function getReasoningText(message: unknown): string {
  if (!message || typeof message !== "object") return "";

  const parts: string[] = [];
  const content = (message as { content?: unknown }).content;

  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === "object") {
        const b = block as ReasoningBlock;
        if (b.type === "reasoning" || b.type === "thinking") {
          const value = b.reasoning ?? b.thinking ?? b.text;
          if (value != null) parts.push(String(value));
        }
      }
    }
  }

  const kwargs = (message as { additional_kwargs?: Record<string, unknown> })
    .additional_kwargs;
  if (kwargs) {
    const rc = kwargs.reasoning_content ?? kwargs.reasoning;
    if (typeof rc === "string" && rc.trim().length > 0) parts.push(rc);
  }

  return parts.join("\n\n").trim();
}

export function toolLabel(name?: string): string {
  switch (name) {
    case "retrieve_information":
      return "Knowledge base";
    case "tavily_search":
    case "tavily_search_results_json":
      return "Web search";
    case "arxiv":
      return "Arxiv";
    default:
      return name ?? "tool";
  }
}
