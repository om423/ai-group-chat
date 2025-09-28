"use client";

import { useState, useRef } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onAttach: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onAttach,
  disabled = false,
  placeholder = 'Type here… (try a question or "@ai summarize the last 5 messages")',
}: ComposerProps) {
  const [, setIsComposing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  return (
    <TooltipProvider>
      <div className="border-t border-border/60 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Thread input (optional) */}
          <Input
            type="text"
            placeholder="Reply in thread…"
            className="h-11 rounded-xl border-border/60 bg-white/85 text-sm shadow-soft focus-visible:border-primary/60 focus-visible:ring-primary/25"
          />

          {/* Main composer */}
          <form onSubmit={onSubmit} className="flex items-end gap-3 md:gap-4">
            {/* File attach */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFileAttach}
                  disabled={disabled}
                  className="flex-shrink-0 rounded-xl border-border/60 bg-white/85 hover:bg-[hsl(var(--hover-user))]"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={onAttach}
              className="hidden"
              accept="*/*"
            />

            {/* Text area */}
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              disabled={disabled}
              rows={2}
              className="flex-1 rounded-2xl border border-border/60 bg-white/90 px-4 py-3 text-[15px] leading-6 shadow-soft focus-visible:border-primary/60 focus-visible:ring-primary/25"
            />

            {/* Send */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="sm"
                  disabled={disabled || !value.trim()}
                  className="flex-shrink-0 h-11 w-11 rounded-xl bg-matcha-400 text-white shadow-soft hover:shadow-lift"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </form>

          {/* Help text */}
          <div className="mt-2 text-xs text-muted-foreground">
            <span>↵ to send, ⇧↵ for new line</span>
            <span className="ml-4 inline-flex items-center gap-1">
              Tip:
              <code className="bg-[hsl(var(--message-agent))] px-1 py-0.5 rounded text-[11px]">@ai</code>
              <code className="bg-[hsl(var(--message-agent))] px-1 py-0.5 rounded text-[11px]">/ai</code>
              to force a response
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
