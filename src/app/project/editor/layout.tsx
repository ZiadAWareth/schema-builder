// src/app/project/editor/layout.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [generating, setGenerating] = useState(false);

  // Get project details from URL
  const projectName = searchParams.get("name") || "Untitled Project";
  const dbType = searchParams.get("db") || "postgresql";

  // Your action functions (Generate Schema, Clear All Tables) are defined here…

  return (
    <div className="h-screen flex flex-col">
      {/* Top navigation bar */}
      <header className="border-b h-14 flex items-center px-6 justify-between bg-background">
        <div className="font-semibold">{projectName} - Schema Builder</div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            Back to Home
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllTables}
          >
            Clear All Tables
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleGenerateSchema}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Schema"}
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
