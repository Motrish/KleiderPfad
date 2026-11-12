"use client";

import { useState } from "react";
import { usePackageBasket } from "./PackageBasketProvider";
import { X, Trash2, ArrowRight, Package, Check } from "lucide-react";
import Link from "next/link";
import { createPackageFromSelection } from "@/actions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const conditionLabels: Record<string, string> = {
  new: "Neu",
  very_good: "Sehr gut",
  good: "Gut",
  used: "Gebraucht",
  damaged: "Beschädigt",
};

function BasketReviewModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { items, removeItem, clearBasket } = usePackageBasket();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Bitte gib dem Paket einen Namen");
      return;
    }
    if (items.length === 0) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      await createPackageFromSelection({
        title: title.trim(),
        notes: notes.trim() || undefined,
        itemIds: items.map((i) => i.id),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Pakets");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paket packen"
      description={`${items.length} Teil${items.length !== 1 ? "e" : ""} ausgewählt`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="fields">
        <Input
          label="Paketname *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Frühjahr Größe 62/68"
          required
          maxLength={120}
          disabled={isSubmitting}
          error={error}
        />
        <Input
          label="Notiz (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="z. B. für Oma"
          maxLength={1000}
          disabled={isSubmitting}
        />

        <h3 style={{ marginTop: "var(--space-6)", marginBottom: "var(--space-3)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>
          Ausgewählte Teile ({items.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: "300px", overflowY: "auto" }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ padding: "var(--space-2) var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <div className="thumb" style={{ backgroundImage: item.photoId ? `url(/api/photos/${item.photoId})` : "none", backgroundColor: "var(--primary-light)", width: 48, height: 48, borderRadius: "var(--radius-card)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="item-info" style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: "var(--text-sm)" }}>{item.title}</strong>
                <span className="text-muted text-xs">Größe {item.sizeLabel} · {conditionLabels[item.condition] || item.condition}</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="icon-btn"
                aria-label={`${item.title} entfernen`}
                disabled={isSubmitting}
              >
                <Trash2 size={16} color="#E76F6F" />
              </button>
            </div>
          ))}
        </div>

        <div className="actions" style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <button
            type="button"
            className="btn btn-outline wide"
            onClick={() => {
              clearBasket();
              onClose();
            }}
            disabled={isSubmitting}
          >
            <X size={18} aria-hidden="true" />
            Alle entfernen & schließen
          </button>
          <Button
            type="submit"
            className="wide"
            disabled={isSubmitting}
            style={{ minHeight: "var(--touch-large)", fontSize: "var(--text-lg)" }}
          >
            {isSubmitting ? (
              <>
                <span style={{ width: "20px", height: "20px", border: "2px solid transparent", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginRight: "var(--space-2)" }} />
                Paket erstellen…
              </>
            ) : (
              <>
                <ArrowRight size={18} aria-hidden="true" />
                Paket erstellen
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function BasketActionBar() {
  const { items, count, removeItem, clearBasket, isOpen, setIsOpen } = usePackageBasket();
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleReviewSuccess = () => {
    setIsReviewOpen(false);
  };

  if (count === 0) return null;

  return (
    <>
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
            <button
              type="button"
              className="btn"
              onClick={() => setIsReviewOpen(true)}
              style={{ minHeight: "var(--touch-comfortable)" }}
            >
              <ArrowRight size={16} aria-hidden="true" />
              Paket erstellen
            </button>
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

      <BasketReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={handleReviewSuccess}
      />
    </>
  );
}