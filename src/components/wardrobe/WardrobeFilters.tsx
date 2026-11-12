"use client";

import Link from "next/link";
import { Plus, Search, Filter, X, Tag, Shirt, Droplet, Package, RotateCcw } from "lucide-react";

interface FilterChipProps {
  label: string;
  value: string;
  param: string;
  currentValue: string;
  otherParams: Record<string, string>;
}

function FilterChip({ label, value, param, currentValue, otherParams }: FilterChipProps) {
  const isActive = currentValue === value;
  const searchParams = new URLSearchParams(otherParams);
  if (value) {
    searchParams.set(param, value);
  } else {
    searchParams.delete(param);
  }
  const href = `/wardrobe?${searchParams.toString()}`;

  return (
    <Link
      href={href}
      className={`filter-chip ${isActive ? "active" : "inactive"}`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

interface CategoryFilterProps {
  currentCategory: string;
  otherParams: Record<string, string>;
}

function CategoryFilter({ currentCategory, otherParams }: CategoryFilterProps) {
  const categories = [
    { value: "", label: "Alle" },
    { value: "bodys-strampler", label: "Bodys" },
    { value: "oberteile", label: "Oberteile" },
    { value: "hosen-leggings", label: "Hosen" },
    { value: "kleider-roecke", label: "Kleider" },
    { value: "jacken-maentel", label: "Jacken" },
    { value: "schlafanzuege", label: "Schlafanzüge" },
    { value: "unterwaesche-socken", label: "Wäsche" },
    { value: "schuhe", label: "Schuhe" },
    { value: "muetzen-accessoires", label: "Accessoires" },
    { value: "sonstiges", label: "Sonstiges" },
  ];

  return (
    <div className="filter-chips" role="group" aria-label="Kategorie filtern">
      {categories.map(({ value, label }) => (
        <FilterChip
          key={value}
          label={label}
          value={value}
          param="category"
          currentValue={currentCategory}
          otherParams={otherParams}
        />
      ))}
    </div>
  );
}

interface ConditionFilterProps {
  currentCondition: string;
  otherParams: Record<string, string>;
}

function ConditionFilter({ currentCondition, otherParams }: ConditionFilterProps) {
  const conditions = [
    { value: "", label: "Alle" },
    { value: "new", label: "Neu" },
    { value: "very_good", label: "Sehr gut" },
    { value: "good", label: "Gut" },
    { value: "used", label: "Gebraucht" },
    { value: "damaged", label: "Beschädigt" },
  ];

  return (
    <div className="filter-chips" role="group" aria-label="Zustand filtern">
      {conditions.map(({ value, label }) => (
        <FilterChip
          key={value}
          label={label}
          value={value}
          param="condition"
          currentValue={currentCondition}
          otherParams={otherParams}
        />
      ))}
    </div>
  );
}

interface StatusFilterProps {
  currentStatus: string;
  otherParams: Record<string, string>;
}

function StatusFilter({ currentStatus, otherParams }: StatusFilterProps) {
  const statuses = [
    { value: "", label: "Alle" },
    { value: "at_home", label: "Bei uns" },
    { value: "lent", label: "Verliehen" },
    { value: "borrowed", label: "Ausgeliehen" },
  ];

  return (
    <div className="filter-chips" role="group" aria-label="Status filtern">
      {statuses.map(({ value, label }) => (
        <FilterChip
          key={value}
          label={label}
          value={value}
          param="status"
          currentValue={currentStatus}
          otherParams={otherParams}
        />
      ))}
    </div>
  );
}

export async function WardrobeFilters({
  searchParams,
  onClearFilters,
}: {
  searchParams: Promise<{ q?: string; category?: string; condition?: string; status?: string; size?: string }>;
  onClearFilters?: () => void;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const category = (params.category || "").trim().slice(0, 50);
  const condition = (params.condition || "").trim().slice(0, 25);
  const status = (params.status || "").trim().slice(0, 24);
  const size = (params.size || "").trim().slice(0, 25);

  const otherParams = {
    q: query,
    category,
    condition,
    status,
    size,
  };

  const hasActiveFilters = category || condition || status || size || query;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {/* Search Bar */}
      <form action="/wardrobe" method="get" className="fields" style={{ gap: "var(--space-3)" }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={20} color="#A5B0A9" />
          <input
            name="q"
            type="search"
            placeholder="Kleidung durchsuchen …"
            defaultValue={query}
            style={{ border: "none", background: "transparent", fontSize: "var(--text-lg)", color: "var(--text-primary)", outline: "none", flex: 1, minWidth: 0 }}
            aria-label="Kleidung durchsuchen"
          />
          {query && (
            <a href="/wardrobe" className="icon-btn" aria-label="Suche zurücksetzen">
              <X size={20} color="#A5B0A9" />
            </a>
          )}
        </div>
        <Link href="/wardrobe" className="icon-btn" aria-label="Filter zurücksetzen">
          <RotateCcw size={20} />
        </Link>
      </form>

      {/* Category Filter */}
      <CategoryFilter currentCategory={category} otherParams={otherParams} />

      {/* Condition Filter */}
      <ConditionFilter currentCondition={condition} otherParams={otherParams} />

      {/* Status Filter */}
      <StatusFilter currentStatus={status} otherParams={otherParams} />

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
          <span className="text-muted text-sm">Aktive Filter:</span>
          {category && (
            <span className="pill pill-info" style={{ fontSize: "var(--text-xs)" }}>
              Kategorie: {category}
              <a href={`/wardrobe?${new URLSearchParams({ ...otherParams, category: "" }).toString()}`} style={{ marginLeft: "var(--space-1)" }} aria-label="Kategorie-Filter entfernen">×</a>
            </span>
          )}
          {condition && (
            <span className="pill pill-info" style={{ fontSize: "var(--text-xs)" }}>
              Zustand: {condition}
              <a href={`/wardrobe?${new URLSearchParams({ ...otherParams, condition: "" }).toString()}`} style={{ marginLeft: "var(--space-1)" }} aria-label="Zustand-Filter entfernen">×</a>
            </span>
          )}
          {status && (
            <span className="pill pill-info" style={{ fontSize: "var(--text-xs)" }}>
              Status: {status}
              <a href={`/wardrobe?${new URLSearchParams({ ...otherParams, status: "" }).toString()}`} style={{ marginLeft: "var(--space-1)" }} aria-label="Status-Filter entfernen">×</a>
            </span>
          )}
          {size && (
            <span className="pill pill-info" style={{ fontSize: "var(--text-xs)" }}>
              Größe: {size}
              <a href={`/wardrobe?${new URLSearchParams({ ...otherParams, size: "" }).toString()}`} style={{ marginLeft: "var(--space-1)" }} aria-label="Größen-Filter entfernen">×</a>
            </span>
          )}
          {query && (
            <span className="pill pill-info" style={{ fontSize: "var(--text-xs)" }}>
              Suche: "{query}"
              <a href={`/wardrobe?${new URLSearchParams({ ...otherParams, q: "" }).toString()}`} style={{ marginLeft: "var(--space-1)" }} aria-label="Suche zurücksetzen">×</a>
            </span>
          )}
          {hasActiveFilters && (
            <a href="/wardrobe" className="btn btn-ghost text-sm" style={{ marginLeft: "auto" }} onClick={onClearFilters}>
              Alle löschen
            </a>
          )}
        </div>
      )}
    </div>
  );
}