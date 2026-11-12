"use client";

import { usePackageBasket } from "./PackageBasketProvider";
import { X, Package, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function BasketActionBar() {
  const { items, count, removeItem, clearBasket, isOpen, setIsOpen } = usePackageBasket();

  if (count === 0) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="basket-action-bar" role="region" aria-label="Paketkorb">
      <div className="basket-action-bar-content">
        <div className="basket-info">
          <span className="basket-count">
            <Package size={18} aria-hidden="true" />
            {count} Teil{count !== 1 ? "e" : ""} ausgewählt
          </span>
        </div>
        <div className="basket-actions">
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={clearBasket}
            aria-label="Alle entfernen"
          >
            <X size={14} aria-hidden="true" />
            Alle entfernen
          </button>
          <Link
            href="/packages/new"
            className="btn"
            style={{ minHeight: "var(--touch-comfortable)" }}
          >
            <ArrowRight size={16} aria-hidden="true" />
            Paket erstellen
          </Link>
        </div>
      </div>
      
      {/* Preview of selected items */}
      <div className="basket-preview" aria-label="Ausgewählte Kleidungsstücke">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="basket-preview-item" style={{ backgroundImage: item.photoId ? `url(/api/photos/${item.photoId})` : "none" }} title={item.title} />
        ))}
        {count > 4 && (
          <div className="basket-preview-more" aria-label={`und ${count - 4} weitere`}>
            +{count - 4}
          </div>
        )}
      </div>
    </div>
  );
}