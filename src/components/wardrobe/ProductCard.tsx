"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { usePackageBasket } from "@/components/packages";
import { ItemPhoto } from "@/components/ItemPhoto";

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
  disabled = false,
}: ProductCardProps) {
  const { toggleItem, isSelected } = usePackageBasket();
  
  const isAtHome = item.holderHouseholdId === currentHouseholdId && item.ownerHouseholdId === currentHouseholdId && !item.archived;
  const isAvailableForPackage = isAtHome;
  const selected = isSelected(item.id);

  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && isAvailableForPackage) {
      toggleItem({
        id: item.id,
        title: item.title,
        sizeLabel: item.sizeLabel,
        condition: item.condition,
        photoId: photoId,
      });
    }
  };

  return (
    <article className="product-card">
      <div className="image-wrapper">
        <Link href={`/wardrobe/${item.id}`} aria-label={`${item.title} ansehen`}>
          <ItemPhoto photoId={photoId} title={item.title} compact />
        </Link>
        <span className={`pill status-badge ${item.holderHouseholdId === currentHouseholdId ? "pill-success" : "pill-warn"}`}>
          {item.holderHouseholdId === currentHouseholdId ? "Bei uns" : "Weitergegeben"}
        </span>
        {isAvailableForPackage && (
          <button
            type="button"
            onClick={handleSelectClick}
            disabled={disabled}
            className={`favorite-btn ${selected ? "active" : ""}`}
            aria-label={selected ? `${item.title} aus Paket entfernen` : `${item.title} zum Paket hinzufügen`}
            aria-pressed={selected}
          >
            {selected ? <Check size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>
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
