"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2Icon, SendIcon, SquareIcon } from "lucide-react";
import type {
  ComponentProps,
  KeyboardEventHandler,
} from "react";

export type PromptInputProps = ComponentProps<"form">;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={cn(
      "w-full overflow-hidden rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/40",
      className
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<"textarea">;

export const PromptInputTextarea = ({
  className,
  onKeyDown,
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
    onKeyDown?.(event);
  };

  return (
    <textarea
      className={cn(
        "field-sizing-content max-h-48 min-h-12 w-full resize-none border-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      name="message"
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};

export type PromptInputToolbarProps = ComponentProps<"div">;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn("flex items-center justify-between gap-2 px-2 pb-2", className)}
    {...props}
  />
);

export type PromptInputTools = ComponentProps<"div">;

export const PromptInputTools = ({ className, ...props }: PromptInputTools) => (
  <div
    className={cn("flex items-center gap-1 text-muted-foreground", className)}
    {...props}
  />
);

export type PromptInputStatus =
  | "submitted"
  | "streaming"
  | "ready"
  | "error";

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: PromptInputStatus;
};

export const PromptInputSubmit = ({
  className,
  status = "ready",
  children,
  ...props
}: PromptInputSubmitProps) => {
  let icon = <SendIcon className="size-4" />;

  if (status === "submitted") {
    icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    icon = <SquareIcon className="size-4" />;
  }

  return (
    <Button
      className={cn("size-9 rounded-xl", className)}
      size="icon"
      type="submit"
      {...props}
    >
      {children ?? icon}
    </Button>
  );
};
