"use client"

import { useState, useRef } from "react"
import { Paperclip, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e?: React.FormEvent) => void
  onAttach: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  placeholder?: string
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onAttach,
  disabled = false,
  placeholder = 'Type here… (try a question or "@ai summarize the last 5 messages")'
}: ComposerProps) {
  const [isComposing, setIsComposing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  return (
    <TooltipProvider>
      <div className="border-t border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-4 rounded-t-2xl shadow-soft">
        {/* Thread input (optional) */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Reply in thread…"
            className="w-full px-3 py-2 text-sm rounded-xl bg-background text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-transparent focus:ring-2 ring-ring transition"
          />
        </div>

        {/* Main composer */}
        <form onSubmit={onSubmit} className="flex items-end gap-3">
          {/* File attach */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFileAttach}
                disabled={disabled}
                className="flex-shrink-0 border-border bg-secondary hover:bg-accent/50 transition"
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
            // keep your accept list; shortened here is fine too
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
            className="flex-1 min-h-[60px] max-h-40 resize-none text-sm rounded-2xl bg-background border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent placeholder:text-muted-foreground px-3 py-2"
          />

          {/* Send */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={disabled || !value.trim()}
                className="flex-shrink-0 button button--primary rounded-xl h-10 w-10"
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
          <span className="ml-4">
            Tip: use <code className="bg-muted px-1 py-0.5 rounded text-xs">@ai</code> or <code className="bg-muted px-1 py-0.5 rounded text-xs">/ai</code> to force a response
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}