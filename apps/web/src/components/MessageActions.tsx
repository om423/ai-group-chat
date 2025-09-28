"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function MessageActions({
  onFork, onLabel, onCopy
}: {
  onFork: () => void;
  onLabel: (label: string, classification: "public"|"internal"|"restricted") => void;
  onCopy: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("action-item");
  const [classification, setClassification] = useState<"public"|"internal"|"restricted">("internal");
  return (
    <div className="relative inline-block"
      onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs opacity-60">
        ⋯
      </Button>
      {open && (
        <div className="absolute z-50 right-0 top-full bg-card border border-border rounded-lg p-3 min-w-[240px] shadow-lg">
          <div className="grid gap-3">
            <Button 
              onClick={onFork}
              className="w-full"
            >
              Fork here
            </Button>
            <div>
              <div className="text-xs font-medium text-foreground mb-2">Label message</div>
              <div className="grid gap-2">
                <Input 
                  value={label} 
                  onChange={e=>setLabel(e.target.value)} 
                  className="h-8 text-xs"
                  placeholder="Enter label..."
                />
                <div className="flex gap-2 items-center">
                  <Select 
                    value={classification} 
                    onValueChange={(value: any) => setClassification(value)}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">public</SelectItem>
                      <SelectItem value="internal">internal</SelectItem>
                      <SelectItem value="restricted">restricted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm"
                    onClick={()=>onLabel(label, classification)}
                    className="h-8 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <small className="text-muted-foreground text-xs">"restricted" will be denied even in permissive mode</small>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={onCopy}
              className="w-full"
            >
              Copy ID
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
