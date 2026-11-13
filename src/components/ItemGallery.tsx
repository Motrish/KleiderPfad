"use client";

import { useRef, useState } from "react";
import { ItemPhoto } from "@/components/ItemPhoto";

interface GalleryPhoto {
  id: string;
  isPrimary?: boolean;
}

export function ItemGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const orderedPhotos = [...photos].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function selectPhoto(index: number) {
    setActive(index);
    track.current?.scrollTo({ left: index * track.current.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="item-gallery">
      <div
        className="item-gallery-track"
        data-gallery-track
        aria-label={`${title} – Bilder`}
        onScroll={event => {
          const width = event.currentTarget.clientWidth;
          if (width) setActive(Math.round(event.currentTarget.scrollLeft / width));
        }}
        ref={track}
      >
        {orderedPhotos.length ? orderedPhotos.map((photo, index) => (
          <div className="item-gallery-slide" key={photo.id}>
            <ItemPhoto photoId={photo.id} title={`${title} – Foto ${index + 1}`} />
          </div>
        )) : <div className="item-gallery-slide"><ItemPhoto title={title} /></div>}
      </div>
      {orderedPhotos.length > 1 && (
        <div className="item-gallery-thumbnails" aria-label="Bildvorschau">
          {orderedPhotos.map((photo, index) => (
            <button
              aria-label={`Foto ${index + 1} anzeigen`}
              aria-pressed={active === index}
              className={`item-gallery-thumbnail${active === index ? " active" : ""}`}
              key={photo.id}
              onClick={() => selectPhoto(index)}
              type="button"
            >
              <img src={`/api/photos/${photo.id}`} alt="" aria-hidden="true" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
