"use client";

import { useState, FormEvent, useRef } from "react";
import { createItem } from "@/actions";
import { Camera, Image, X, RotateCcw, Check } from "lucide-react";

const categories = [
  "Body", "Strampler", "Hose", "Shirt", "Pullover", "Jacke",
  "Schlafanzug", "Kleid", "Mütze", "Socken", "Schuhe", "Sonstiges"
] as const;

const conditions = [
  { value: "new", label: "Neu" },
  { value: "very_good", label: "Sehr gut" },
  { value: "good", label: "Gut" },
  { value: "used", label: "Gebraucht" },
  { value: "damaged", label: "Beschädigt" },
] as const;

const sourceTypes = [
  { value: "unknown", label: "Unbekannt" },
  { value: "gift", label: "Geschenk" },
  { value: "bought", label: "Gekauft" },
  { value: "received", label: "Weitergegeben bekommen" },
] as const;

interface NewItemFormProps {
  householdName: string;
}

export function NewItemForm({ householdName }: NewItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Art des Kleidungsstücks ist erforderlich";
        break;
      case "size":
        if (!value.trim()) return "Größe ist erforderlich";
        break;
      case "condition":
        if (!conditions.find(c => c.value === value)) return "Ungültiger Zustand";
        break;
      case "sourceType":
        if (!sourceTypes.find(s => s.value === value)) return "Ungültige Herkunft";
        break;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handlePhotoCapture = (file: File) => {
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setErrors(prev => ({ ...prev, photo: "" }));
  };

  const handlePhotoRemove = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    // Clear the hidden file input
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Datei zu groß. Maximum 10 MB.");
      e.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
      alert("Nicht unterstütztes Dateiformat. Erlaubt: JPEG, PNG, WebP, HEIC.");
      e.target.value = "";
      return;
    }

    handlePhotoCapture(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};
    
    const requiredFields = ["title", "size", "condition", "sourceType"];
    requiredFields.forEach(field => {
      const value = formData.get(field) as string;
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (photoFile) {
      formData.set("photo", photoFile);
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await createItem(formData);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Fehler beim Speichern" });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="fields" noValidate>
      {/* Photo Section */}
      <section className="card-soft" style={{ padding: "var(--space-5)" }}>
        <label className="field" style={{ gap: "var(--space-3)" }}>
          <span>Foto</span>
          {photoPreview ? (
            <div className="photo-capture-preview" style={{ width: "100%", maxWidth: "300px" }}>
              <img src={photoPreview} alt="Vorschau" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: "var(--radius-card-lg)" }} />
              <div className="actions" style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="icon-btn-sm"
                  aria-label="Entfernen"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-capture-placeholder" style={{ cursor: "pointer" }} onClick={() => document.getElementById("photo-input")?.click()}>
              <div className="icon">
                <Camera size={32} color="#27AE70" />
              </div>
              <div className="text">Foto aufnehmen</div>
              <div className="hint">oder antippen für Galerie</div>
              <input
                id="photo-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                onChange={handleFileSelect}
                className="photo-capture-input"
                aria-label="Foto auswählen"
                disabled={isSubmitting}
                style={{ display: "none" }}
              />
            </div>
          )}
        </label>
        <p className="hint" style={{ marginTop: "var(--space-2)", textAlign: "center" }}>
          Foto aufnehmen oder aus Galerie wählen
        </p>
      </section>

      {/* Required Fields */}
      <section className="card">
        <h2 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-lg)", fontWeight: 600 }}>Angaben</h2>
        
        <div className="field">
          <label htmlFor="title">Art des Kleidungsstücks *</label>
          <select 
            id="title" 
            name="title" 
            required 
            defaultValue="Body"
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "title-error" : undefined}
          >
            {categories.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          {errors.title && <p id="title-error" className="pill pill-danger" style={{ marginTop: "var(--space-1)" }}>{errors.title}</p>}
        </div>

        <div className="field">
          <label htmlFor="size">Größe *</label>
          <input 
            name="size" 
            id="size" 
            required 
            placeholder="z. B. 62, 62/68, 18–21" 
            maxLength={25}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={errors.size ? "true" : "false"}
            aria-describedby={errors.size ? "size-error" : undefined}
            inputMode="text"
          />
          {errors.size && <p id="size-error" className="pill pill-danger" style={{ marginTop: "var(--space-1)" }}>{errors.size}</p>}
        </div>

        <div className="field">
          <label htmlFor="condition">Zustand *</label>
          <select 
            id="condition" 
            name="condition" 
            defaultValue="good"
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={errors.condition ? "true" : "false"}
            aria-describedby={errors.condition ? "condition-error" : undefined}
          >
            {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.condition && <p id="condition-error" className="pill pill-danger" style={{ marginTop: "var(--space-1)" }}>{errors.condition}</p>}
        </div>

        <div className="field">
          <label htmlFor="sourceType">Herkunft *</label>
          <select 
            id="sourceType" 
            name="sourceType" 
            defaultValue="unknown"
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            aria-invalid={errors.sourceType ? "true" : "false"}
            aria-describedby={errors.sourceType ? "sourceType-error" : undefined}
          >
            {sourceTypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {errors.sourceType && <p id="sourceType-error" className="pill pill-danger" style={{ marginTop: "var(--space-1)" }}>{errors.sourceType}</p>}
        </div>

        <div className="field">
          <label htmlFor="sourceName">Von wem / woher? (optional)</label>
          <input 
            id="sourceName" 
            name="sourceName" 
            maxLength={150} 
            placeholder="z. B. Oma oder Flohmarkt"
            disabled={isSubmitting}
          />
        </div>
      </section>

      {/* Optional Fields - Collapsible */}
      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-2) 0", listStyle: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span>Weitere Angaben (optional)</span>
          </div>
        </summary>
        <div className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
          <div className="field">
            <label htmlFor="brand">Marke</label>
            <input id="brand" name="brand" maxLength={100} disabled={isSubmitting} />
          </div>
          <div className="field">
            <label htmlFor="color">Farbe</label>
            <input id="color" name="color" maxLength={70} disabled={isSubmitting} />
          </div>
          <div className="field">
            <label htmlFor="notes">Notiz</label>
            <textarea id="notes" name="notes" maxLength={1000} rows={3} disabled={isSubmitting} />
          </div>
        </div>
      </details>

      {/* Form Errors */}
      {errors.form && (
        <div className="notice" style={{ background: "var(--error-bg)", color: "var(--error)", borderColor: "var(--error)" }}>
          {errors.form}
        </div>
      )}

      {/* Actions */}
      <div className="actions" style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <button 
          type="submit" 
          className="btn wide" 
          disabled={isSubmitting}
          style={{ minHeight: "var(--touch-xl)", fontSize: "var(--text-lg)" }}
        >
          {isSubmitting ? (
            <>
              <span style={{ 
                width: "20px", 
                height: "20px", 
                border: "2px solid transparent", 
                borderTopColor: "white", 
                borderRadius: "50%", 
                display: "inline-block", 
                animation: "spin 1s linear infinite",
                marginRight: "var(--space-2)"
              }} />
              Speichern…
            </>
          ) : (
            "✓ Kleidungsstück speichern"
          )}
        </button>
        <button 
          type="button"
          className="btn btn-outline wide" 
          style={{ 
            pointerEvents: isSubmitting ? "none" : "auto", 
            opacity: isSubmitting ? 0.5 : 1,
            minHeight: "var(--touch-comfortable)",
            fontSize: "var(--text-base)"
          }}
          onClick={() => window.history.back()}
        >
          Abbrechen
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}