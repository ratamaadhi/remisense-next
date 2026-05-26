# Halaman Panduan Bermain Remi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan halaman `/panduan` yang menampilkan panduan bermain Remi dari file markdown dengan layout single-column + sticky TOC.

**Architecture:** Server Component membaca markdown file saat build time, lalu meneruskan konten ke Client Component yang merender dengan `react-markdown` dan menyediakan TOC interaktif dengan scroll-spy.

**Tech Stack:** Next.js 16 (App Router, static export), react-markdown, remark-gfm, Tailwind CSS 4, Lucide React

---

## File Structure

```
src/app/panduan/page.tsx              — Server Component, baca markdown via fs
src/components/panduan/PanduanClient.tsx  — Client Component, render markdown + TOC
src/components/panduan/TableOfContents.tsx — TOC sidebar dengan scroll-spy
src/components/panduan/MarkdownRenderer.tsx — Custom react-markdown components
src/app/page.tsx                      — Modify: tambah link "Panduan" di header
src/components/setup/GameSetup.tsx    — Modify: tambah tombol "Cara Bermain"
```

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install react-markdown dan remark-gfm**

```bash
npm install react-markdown remark-gfm
```

- [ ] **Step 2: Verify installation**

```bash
npm ls react-markdown remark-gfm
```

Expected: Both packages listed without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-markdown and remark-gfm dependencies"
```

---

## Task 2: Create Panduan Server Component (page.tsx)

**Files:**
- Create: `src/app/panduan/page.tsx`

- [ ] **Step 1: Create the panduan page as Server Component**

```tsx
import fs from "fs";
import path from "path";
import { PanduanClient } from "@/components/panduan/PanduanClient";

export const metadata = {
  title: "Panduan Bermain Remi — RemiSense",
  description: "Panduan lengkap cara bermain kartu Remi",
};

export default function PanduanPage() {
  const filePath = path.join(process.cwd(), "docs", "panduan-bermain-remi.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return <PanduanClient content={content} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/panduan/page.tsx
git commit -m "feat: add panduan page server component"
```

---

## Task 3: Create MarkdownRenderer Component

**Files:**
- Create: `src/components/panduan/MarkdownRenderer.tsx`

- [ ] **Step 1: Create custom markdown renderer with styled components**

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mb-6">{children}</h1>
  ),
  h2: ({ children }) => {
    const id = slugify(String(children));
    return (
      <h2 id={id} className="text-2xl font-semibold mt-10 mb-4 scroll-mt-20">
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const id = slugify(String(children));
    return (
      <h3 id={id} className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        {children}
      </h3>
    );
  },
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/50 bg-muted/30 pl-4 py-2 mb-4 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block bg-muted rounded-md p-4 mb-4 text-sm overflow-x-auto">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-8 border-border" />,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}

export { slugify };
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panduan/MarkdownRenderer.tsx
git commit -m "feat: add custom markdown renderer with styled components"
```

---

## Task 4: Create TableOfContents Component

**Files:**
- Create: `src/components/panduan/TableOfContents.tsx`

- [ ] **Step 1: Create TOC component with scroll-spy**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panduan/TableOfContents.tsx
git commit -m "feat: add table of contents with scroll-spy"
```

---

## Task 5: Create PanduanClient Component

**Files:**
- Create: `src/components/panduan/PanduanClient.tsx`

- [ ] **Step 1: Create the client wrapper that combines TOC + Markdown**

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TableOfContents } from "./TableOfContents";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface PanduanClientProps {
  content: string;
}

export function PanduanClient({ content }: PanduanClientProps) {
  return (
    <div className="max-w-6xl mx-auto p-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Permainan
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Panduan Bermain Remi</h1>
      </div>

      {/* Layout: TOC + Content */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
        <aside>
          <TableOfContents content={content} />
        </aside>
        <article className="max-w-prose">
          <MarkdownRenderer content={content} />
        </article>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panduan/PanduanClient.tsx
git commit -m "feat: add panduan client layout with TOC and markdown"
```

---

## Task 6: Add Navigation Links

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/setup/GameSetup.tsx`

- [ ] **Step 1: Add "Panduan" link in main page header (playing phase)**

In `src/app/page.tsx`, add import at top:

```tsx
import Link from "next/link";
import { BookOpen } from "lucide-react";
```

Then in the playing phase header (the `<div className="flex items-center gap-2">` section), add before ThemeToggle:

```tsx
<Link href="/panduan">
  <Button variant="ghost" size="sm">
    <BookOpen className="h-4 w-4 mr-1" />
    <span className="hidden sm:inline">Panduan</span>
  </Button>
</Link>
```

- [ ] **Step 2: Add "Panduan" link in setup phase header**

In `src/app/page.tsx`, in the setup phase block (the `<div className="flex justify-end mb-4">` section), add before ThemeToggle:

```tsx
<Link href="/panduan">
  <Button variant="ghost" size="sm">
    <BookOpen className="h-4 w-4 mr-1" />
    Panduan
  </Button>
</Link>
```

Update the container to accommodate both buttons:

```tsx
<div className="flex justify-end gap-2 mb-4">
```

- [ ] **Step 3: Add "Cara Bermain" button in GameSetup component**

In `src/components/setup/GameSetup.tsx`, add imports:

```tsx
import Link from "next/link";
import { BookOpen } from "lucide-react";
```

Add a "Cara Bermain" link at the bottom of the setup component, after the main setup content but before the closing wrapper:

```tsx
<div className="mt-6 text-center">
  <Link href="/panduan">
    <Button variant="outline" size="sm">
      <BookOpen className="h-4 w-4 mr-2" />
      Cara Bermain Remi
    </Button>
  </Link>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/setup/GameSetup.tsx
git commit -m "feat: add panduan navigation links in header and setup"
```

---

## Task 7: Build Verification & Final Test

**Files:** None (verification only)

- [ ] **Step 1: Run the build to verify static export works**

```bash
npm run build
```

Expected: Build succeeds, `/panduan` page is generated in `out/panduan/index.html`.

- [ ] **Step 2: Verify the panduan page exists in output**

```bash
ls out/panduan/index.html
```

Expected: File exists.

- [ ] **Step 3: Run existing tests to ensure nothing is broken**

```bash
npm test -- --run
```

Expected: All existing tests pass.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve any build issues for panduan page"
```

(Only if Step 1-3 revealed issues that needed fixing.)

---

## Execution Notes

- Task 2 will fail to build until Tasks 3-5 are complete (missing imports). This is expected — build verification happens in Task 7.
- The `fs` module usage in `src/app/panduan/page.tsx` works because it's a Server Component and Next.js static export runs server components at build time.
- The markdown file path is relative to `process.cwd()` which is the project root during build.
- All Shadcn classes (`text-muted-foreground`, `bg-muted`, `border-border`, etc.) are already available via the existing theme setup.
