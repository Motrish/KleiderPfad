"use client";

import { useState } from "react";

interface CopyableCodeProps {
  text: string;
  label?: string;
  fontSize?: string;
}

export function CopyableCode({ text, label, fontSize = "var(--text-sm)" }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      style={{
        wordBreak: "break-all",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 0,
        font: "inherit",
        fontSize,
        color: "inherit",
        textAlign: "left",
        textDecoration: "none",
        margin: 0,
      }}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
      }}
      aria-label={label ? `Copy ${label}` : "Copy to clipboard"}
    >
      {text}
      {copied && <span style={{ marginLeft: "var(--space-2)", color: "var(--success)" }}>✓</span>}
    </button>
  );
}