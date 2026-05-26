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
