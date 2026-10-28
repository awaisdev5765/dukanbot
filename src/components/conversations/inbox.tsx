"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Hand, MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { WhatsAppThread } from "@/components/orders/whatsapp-thread";
import {
  listConversations,
  markConversationRead,
  sendMerchantMessage,
  setConversationStatus,
} from "@/lib/conversations-storage";
import type { Conversation, ConversationStatus } from "@/types/conversations";
import { CONVERSATION_STATUS_LABELS } from "@/types/conversations";
import { cn } from "@/lib/utils";

function StatusChip({ status }: { status: ConversationStatus }) {
  return (
    <Badge
      className={cn(
        "text-[10px]",
        status === "escalated" &&
          "border-transparent bg-warning/15 text-warning",
        status === "bot_handling" &&
          "border-transparent bg-primary/10 text-primary",
        status === "resolved" &&
          "border-transparent bg-muted text-muted-foreground"
      )}
    >
      {CONVERSATION_STATUS_LABELS[status]}
    </Badge>
  );
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function InboxSkeleton() {
  return (
    <div className="grid h-[calc(100vh-12rem)] min-h-[420px] overflow-hidden rounded-xl border border-border lg:grid-cols-[320px_1fr]">
      <div className="space-y-2 border-b border-border p-3 lg:border-b-0 lg:border-r">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="hidden animate-pulse bg-muted/40 lg:block" />
    </div>
  );
}

export function ConversationsInbox() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ConversationStatus>("all");
  const [draft, setDraft] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  const filtered = useMemo(() => {
    if (filter === "all") return conversations;
    return conversations.filter((c) => c.status === filter);
  }, [conversations, filter]);

  const selected =
    (selectedId && conversations.find((c) => c.id === selectedId)) ||
    filtered[0] ||
    null;

  useEffect(() => {
    if (!selected) return;
    if (selected.unread_count > 0) {
      void markConversationRead(selected.id).then(() =>
        qc.invalidateQueries({ queryKey: ["conversations"] })
      );
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.id, selected?.messages.length]);

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["conversations"] });

  const takeoverMutation = useMutation({
    mutationFn: async (id: string) => setConversationStatus(id, "escalated"),
    onSuccess: invalidate,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => setConversationStatus(id, "resolved"),
    onSuccess: invalidate,
  });

  const resumeBotMutation = useMutation({
    mutationFn: async (id: string) => setConversationStatus(id, "bot_handling"),
    onSuccess: invalidate,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) =>
      sendMerchantMessage(id, text),
    onSuccess: () => {
      setDraft("");
      invalidate();
    },
  });

  function selectThread(c: Conversation) {
    setSelectedId(c.id);
    setDraft("");
    setMobileThreadOpen(true);
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !draft.trim()) return;
    sendMutation.mutate({ id: selected.id, text: draft });
  }

  if (isLoading) return <InboxSkeleton />;

  if (!conversations.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Inbox is quiet"
        description="Active bot chats will appear here. Escalated threads get a badge so you can reply as human."
        actionLabel="Connect WhatsApp"
        actionHref="/onboarding"
      />
    );
  }

  const liveSelected = selected;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <p className="text-muted-foreground">
        Simplified WhatsApp Web — take over escalated chats and reply as human.
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["escalated", "Escalated"],
            ["bot_handling", "Bot"],
            ["resolved", "Resolved"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              filter === value
                ? "border-primary/40 bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {value === "escalated" && (
              <span className="ml-1.5 text-xs text-warning">
                {conversations.filter((c) => c.status === "escalated").length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid h-[calc(100vh-14rem)] min-h-[480px] overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[320px_1fr]">
        {/* Thread list — hide on mobile when a thread is open */}
        <div
          className={cn(
            "flex flex-col border-b border-border lg:border-b-0 lg:border-r",
            mobileThreadOpen ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium">Conversations</p>
            <p className="text-xs text-muted-foreground">
              {filtered.length} thread{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const active = liveSelected?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectThread(c)}
                    className={cn(
                      "flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors",
                      active ? "bg-accent/60" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {(c.customer_name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            c.unread_count > 0
                              ? "font-semibold"
                              : "font-medium"
                          )}
                        >
                          {c.customer_name}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeLabel(c.updated_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {last?.text ?? "No messages"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusChip status={c.status} />
                        {c.unread_count > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Chat pane */}
        {liveSelected ? (
          <div
            className={cn(
              "min-h-0 flex-col",
              mobileThreadOpen ? "flex" : "hidden lg:flex"
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="lg:hidden shrink-0 px-2"
                  onClick={() => setMobileThreadOpen(false)}
                >
                  ←
                </Button>
                <div className="min-w-0">
                  <p className="truncate font-semibold tracking-tight">
                    {liveSelected.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {liveSelected.customer_phone}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <StatusChip status={liveSelected.status} />
                {liveSelected.status !== "escalated" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => takeoverMutation.mutate(liveSelected.id)}
                  >
                    <Hand className="h-3.5 w-3.5" />
                    Reply as human
                  </Button>
                )}
                {liveSelected.status === "escalated" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => resumeBotMutation.mutate(liveSelected.id)}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    Resume bot
                  </Button>
                )}
                {liveSelected.status !== "resolved" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveMutation.mutate(liveSelected.id)}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#e5ddd5] p-3 dark:bg-[#0b141a]">
              <WhatsAppThread
                messages={liveSelected.messages}
                className="rounded-none bg-transparent p-0 dark:bg-transparent"
              />
              <div ref={threadEndRef} />
            </div>

            <form
              onSubmit={onSend}
              className="flex items-center gap-2 border-t border-border bg-card p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  liveSelected.status === "bot_handling"
                    ? "Take over to reply as human…"
                    : "Type a reply…"
                }
                disabled={liveSelected.status === "resolved"}
                className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={
                  !draft.trim() ||
                  liveSelected.status === "resolved" ||
                  sendMutation.isPending
                }
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {liveSelected.status === "bot_handling" && (
              <p className="border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                Sending a message automatically takes over from the bot.
              </p>
            )}
          </div>
        ) : (
          <div className="hidden items-center justify-center lg:flex">
            <p className="text-sm text-muted-foreground">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
