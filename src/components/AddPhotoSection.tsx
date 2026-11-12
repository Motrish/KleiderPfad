"use client";

import { useState, FormEvent } from "react";
import { PhotoCapture } from "@/components/ui";
import { addPhoto } from "@/actions";

interface AddPhotoSectionProps {
  itemId: string;
  onPhotoAdded: () => void;
}

export function AddPhotoSection({ itemId, onPhotoAdded }: AddPhotoSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addPhoto.bind(null, itemId)(formData);
      setIsOpen(false);
      onPhotoAdded();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Hochladen: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <details className="card" open={isOpen} onToggle={() => setIsOpen(!isOpen)}>
      <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-green-light/50 rounded-lg">
        <h2 className="m-0 flex items-center gap-2">
          <span style={{ fontSize: 20 }}>📷</span>
          <span>Foto hinzufügen</span>
        </h2>
        <span className="text-sm text-ink-muted">Klicken zum Öffnen</span>
      </summary>

      <form action={addPhoto.bind(null, itemId)} className="fields" onSubmit={handleSubmit}>
        <PhotoCapture name="photo" disabled={isSubmitting} />
        <button type="submit" className="btn btn-secondary" disabled={isSubmitting}>
          {isSubmitting ? "Hochladen…" : "Foto hochladen"}
        </button>
      </form>
    </details>
  );
}