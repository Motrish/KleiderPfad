"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ClipboardButton({ value, disabled = false }: { value: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" className="btn btn-outline" onClick={copy} disabled={disabled}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}
