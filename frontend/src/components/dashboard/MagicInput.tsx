"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, X, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CommandSuggestion {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface MagicInputProps {
  onCommand?: (command: string) => void;
  suggestions?: CommandSuggestion[];
  placeholder?: string;
  className?: string;
}

export function MagicInput({
  onCommand,
  suggestions = [],
  placeholder = "Ask AI: 'Show me top selling items' or 'Scan invoice'...",
  className,
}: MagicInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on query
  const filteredSuggestions = query.trim()
    ? suggestions.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.description?.toLowerCase().includes(query.toLowerCase())
      )
    : suggestions.slice(0, 5); // Show first 5 when no query

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }

      // Arrow keys for navigation
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        } else if (e.key === "Enter" && filteredSuggestions[selectedIndex]) {
          e.preventDefault();
          filteredSuggestions[selectedIndex].action();
          setIsOpen(false);
          setQuery("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSuggestions[selectedIndex]) {
      filteredSuggestions[selectedIndex].action();
    } else if (query.trim() && onCommand) {
      onCommand(query.trim());
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Main Input */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="h-14 pl-12 pr-24 text-lg bg-card/50 backdrop-blur-sm border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <kbd className="hidden sm:inline-flex h-6 px-2 items-center gap-1 rounded border border-border bg-muted text-xs font-mono text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-2xl border-2">
              <CardContent className="p-2">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.id}
                      onClick={() => {
                        suggestion.action();
                        setIsOpen(false);
                        setQuery("");
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                        selectedIndex === index
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      {suggestion.icon && (
                        <div className="flex-shrink-0 text-muted-foreground">
                          {suggestion.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{suggestion.label}</div>
                        {suggestion.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}




