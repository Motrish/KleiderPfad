"use client";

import Link from "next/link";
import { Check, Plus, Package } from "lucide-react";

interface ProductCardProps {
  item: {
    id: string;
    title: string;
    sizeLabel: string;
    condition: string;
    holderHouseholdId: string;
    ownerHouseholdId: string;
    archived: boolean;
  };
  photoId: string | null;
  currentHouseholdId: string;
  isSelected?: boolean;
  onToggleSelect?: (itemId: string) => void;
  disabled?: boolean;
}

const conditionLabels: Record<string, string> = {
  new: "Neu",
  very_good: "Sehr gut",
  good: "Gut",
  used: "Gebraucht",
  damaged: "Beschädigt",
};

export function ProductCard({
  item,
  photoId,
  currentHouseholdId,
  isSelected = false,
  onToggleSelect,
  disabled = false,
}: ProductCardProps) {
  const isAtHome = item.holderHouseholdId === currentHouseholdId && item.ownerHouseholdId === currentHouseholdId && !item.archived;
  const isAvailableForPackage = isAtHome;

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onToggleSelect && isAvailableForPackage) {
      onToggleSelect(item.id);
    }
  };

  return (
    <article className="product-card">
      <Link href={`/wardrobe/${item.id}`} className="image-wrapper" aria-label={`${item.title} ansehen`}>
        {photoId ? (
          <img src={`/api/photos/${photoId}`} alt={item.title} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", background: "var(--bg)" }}>
            👕
          </div>
        )}
        {/* Status Badge */}
        <span className={`pill ${item.holderHouseholdId === currentHouseholdId ? "pill-success" : "pill-warn"}`} style={{ fontSize: "var(--text-xs)", position: "absolute", top: "var(--space-2)", left: "var(--space-2)", zIndex: 1 }}>
          {item.holderHouseholdId === currentHouseholdId ? "Bei uns" : "Weitergegeben"}
        </span>

        {/* Selection Toggle - NOT inside the Link */}
        {isAvailableForPackage && (
          <button
            type="button"
            onClick={handleSelectClick}
            disabled={disabled}
            className={`icon-btn ${isSelected ? "active" : ""}`}
            aria-label={isSelected ? `${item.title} aus Paket entfernen` : `${item.title} zum Paket hinzufügen`}
            aria-pressed={isSelected}
            style={{ position: "absolute", top: "var(--space-2)", right: "var(--space-2)", zIndex: 2 }}
          >
            {isSelected ? (
              <Check size={18} color="#27AE70" />
            ) : (
              <Plus size={18} />
            )}
          </button>
        )}
      </Link>

      <div className="content">
        <h3 className="name">{item.title}</h3>
        <div className="meta">
          <span className="size">Größe {item.sizeLabel}</span>
          <span className="condition">{conditionLabels[item.condition] || item.condition}</span>
        </div>
      </div>
    </article>
  );
}