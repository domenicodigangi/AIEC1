"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
} from "react";

import { cn } from "@/lib/utils";

type CollapsibleContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsible() {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible parts must be used within <Collapsible>");
  }
  return context;
}

export type CollapsibleProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const value = isControlled ? open : uncontrolled;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <CollapsibleContext.Provider value={{ open: value, setOpen }}>
      <div
        data-slot="collapsible"
        data-state={value ? "open" : "closed"}
        className={className}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export type CollapsibleTriggerProps = ComponentProps<"button">;

function CollapsibleTrigger({
  className,
  onClick,
  children,
  ...props
}: CollapsibleTriggerProps) {
  const { open, setOpen } = useCollapsible();

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
      className={cn("group cursor-pointer", className)}
      onClick={(event) => {
        setOpen(!open);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export type CollapsibleContentProps = ComponentProps<"div">;

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsible();

  if (!open) {
    return null;
  }

  return (
    <div
      data-slot="collapsible-content"
      data-state={open ? "open" : "closed"}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
