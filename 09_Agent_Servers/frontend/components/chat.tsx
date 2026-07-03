"use client";

import { useMemo, useState } from "react";
import { useStream } from "@langchain/react";
import { Cat } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolState,
} from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Card, CardContent } from "@/components/ui/card";
import { getMessageText, getReasoningText, toolLabel } from "@/lib/messages";

// The SDK builds requests with `new URL(...)`, which needs an absolute URL.
// Resolve the passthrough route against the current origin in the browser.
function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured && /^https?:\/\//.test(configured)) return configured;
  const path = configured ?? "/api";
  if (typeof window !== "undefined") {
    return new URL(path, window.location.origin).toString();
  }
  return path;
}

type StreamMessage = ReturnType<typeof useStream>["messages"][number];

type ToolCall = { name?: string; id?: string; args?: unknown };

const SUGGESTIONS = [
  "How often should I deworm my cat?",
  "What vaccinations do kittens need?",
  "What are signs of feline dehydration?",
];

export function Chat({ assistantId }: { assistantId: string }) {
  const apiUrl = useMemo(() => resolveApiUrl(), []);
  const stream = useStream({ apiUrl, assistantId });
  const { messages, isLoading, error } = stream;

  const [input, setInput] = useState("");

  const toolResults = useMemo(() => {
    const map = new Map<string, StreamMessage>();
    for (const message of messages) {
      if (message.type === "tool") {
        const id = (message as unknown as { tool_call_id?: string })
          .tool_call_id;
        if (id) map.set(id, message);
      }
    }
    return map;
  }, [messages]);

  const lastIndex = messages.length - 1;
  const waiting =
    isLoading &&
    (messages.length === 0 ||
      messages[lastIndex]?.type === "human" ||
      messages[lastIndex]?.type === "tool");

  const send = (text: string) => {
    const content = text.trim();
    if (!content || isLoading) return;
    stream.submit({ messages: [{ type: "human", content }] });
    setInput("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      stream.stop?.();
      return;
    }
    send(input);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6">
          {messages.length === 0 ? (
            <ConversationEmptyState className="mt-10">
              <div className="flex size-full flex-col items-center justify-center gap-6 p-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <Cat className="size-7 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">Ask the cat health agent</h3>
                  <p className="text-sm text-muted-foreground">
                    Streams from your LangGraph deployment via a secure proxy.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message, i) => (
              <MessageView
                key={message.id ?? i}
                message={message}
                toolResults={toolResults}
                isStreaming={isLoading && i === lastIndex}
              />
            ))
          )}

          {waiting && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader size={16} />
                  <Shimmer duration={1.5}>Thinking...</Shimmer>
                </div>
              </MessageContent>
            </Message>
          )}

          {error != null && (
            <Card className="border-destructive/40">
              <CardContent className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Something went wrong."}
              </CardContent>
            </Card>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <PromptInput onSubmit={onSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message the agent..."
              autoFocus
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <span className="pl-2 text-xs text-muted-foreground">
                  Enter to send, Shift+Enter for newline
                </span>
              </PromptInputTools>
              <PromptInputSubmit
                status={isLoading ? "streaming" : "ready"}
                disabled={!isLoading && input.trim().length === 0}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

function MessageView({
  message,
  toolResults,
  isStreaming,
}: {
  message: StreamMessage;
  toolResults: Map<string, StreamMessage>;
  isStreaming: boolean;
}) {
  // Tool result messages are rendered inline within their parent AI message.
  if (message.type === "tool") return null;

  if (message.type === "human") {
    const text = getMessageText(message.content);
    return (
      <Message from="user">
        <MessageContent>
          <p className="whitespace-pre-wrap">{text}</p>
        </MessageContent>
      </Message>
    );
  }

  const text = getMessageText(message.content);
  const reasoning = getReasoningText(message);
  const toolCalls =
    (message as unknown as { tool_calls?: ToolCall[] }).tool_calls ?? [];

  return (
    <Message from="assistant">
      <MessageContent>
        {reasoning && (
          <Reasoning isStreaming={isStreaming && !text}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoning}</ReasoningContent>
          </Reasoning>
        )}

        {toolCalls.map((tc, idx) => {
          const result = tc.id ? toolResults.get(tc.id) : undefined;
          const output = result ? getMessageText(result.content) : undefined;
          const state: ToolState = output
            ? "output-available"
            : "input-available";
          return (
            <Tool key={tc.id ?? idx} defaultOpen={false}>
              <ToolHeader
                title={toolLabel(tc.name)}
                type={tc.name ?? "tool"}
                state={state}
              />
              <ToolContent>
                <ToolInput input={tc.args} />
                <ToolOutput output={output} />
              </ToolContent>
            </Tool>
          );
        })}

        {text && <MessageResponse>{text}</MessageResponse>}
      </MessageContent>
    </Message>
  );
}
