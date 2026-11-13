export function ItemPhoto({ photoId, title, compact = false }: {
  photoId?: string | null;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className={`item-photo${compact ? " item-photo-compact" : ""}`}>
      {photoId ? (
        <>
          <img className="item-photo-foreground" src={`/api/photos/${photoId}`} alt={title} loading={compact ? "lazy" : "eager"} />
          <img className="item-photo-backdrop" src={`/api/photos/${photoId}`} alt="" aria-hidden="true" loading={compact ? "lazy" : "eager"} />
        </>
      ) : (
        <span className="item-photo-placeholder" role="img" aria-label={`${title} – noch kein Foto`}>👕</span>
      )}
    </div>
  );
}
