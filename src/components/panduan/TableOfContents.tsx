"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { slugify } from "./MarkdownRenderer";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const headings = extractHeadings(content);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Mobile: collapsible */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between border rounded-md px-4 py-2 text-sm font-medium"
        >
          <span>Daftar Isi</span>
          <span className={cn("transition-transform", isOpen && "rotate-180")}>▼</span>
        </button>
        {isOpen && (
          <nav className="mt-2 border rounded-md p-3">
            <TocList headings={headings} activeId={activeId} onClick={handleClick} />
          </nav>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <nav className="hidden md:block sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <p className="text-sm font-semibold mb-3 text-muted-foreground">Daftar Isi</p>
        <TocList headings={headings} activeId={activeId} onClick={handleClick} />
      </nav>
    </>
  );
}

function TocList({
  headings,
  activeId,
  onClick,
}: {
  headings: TocItem[];
  activeId: string;
  onClick: (id: string) => void;
}) {
  return (
    <ul className="space-y-1 text-sm">
      {headings.map(({ id, text, level }) => (
        <li key={id} style={{ paddingLeft: level === 3 ? "1rem" : "0" }}>
          <button
            onClick={() => onClick(id)}
            className={cn(
              "text-left w-full px-2 py-1 rounded hover:bg-muted transition-colors",
              activeId === id
                ? "text-primary font-medium bg-muted"
                : "text-muted-foreground"
            )}
          >
            {text}
          </button>
        </li>
      ))}
    </ul>
  );
}

function extractHeadings(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const headings: TocItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}
