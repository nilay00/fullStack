import { useState } from "react";
import "../../styles/editprofile.css";
import Icon from "../shared/Icon";

export default function GalleryTab({ gallery = [], galleryVisible = true, galleryCount = 0, isOwnProfile = false }) {
  const [lightbox, setLightbox] = useState(null);

  // Gallery privacy is a single, whole-gallery setting (not per-photo) — when
  // the viewer isn't allowed to see it, we show one blurred placeholder with
  // a lock, not per-image toggles.
  if (!isOwnProfile && !galleryVisible) {
    return (
      <div className="tab-section">
        <h3 className="tab-section-title">Photo gallery</h3>
        <div className="gallery-locked-panel">
          <div className="gallery-locked-icon"><Icon name="lock" /></div>
          <div className="gallery-locked-title">
            {galleryCount > 0 ? `${galleryCount} photo${galleryCount > 1 ? "s" : ""} — private` : "This gallery is private"}
          </div>
          <div className="gallery-locked-text">
            This member has chosen to only share their gallery with connections. Send an interest — once it's accepted, you'll be able to see it.
          </div>
        </div>
      </div>
    );
  }

  if (!gallery.length) {
    return (
      <div className="tab-section">
        <h3 className="tab-section-title">Photo gallery</h3>
        <p className="gallery-view-empty">No photos added yet.</p>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <h3 className="tab-section-title">Photo gallery</h3>
      <div className="gallery-view-grid">
        {gallery.map((photo, idx) => (
          <div key={photo._id || idx} className="gallery-view-item" onClick={() => setLightbox(photo.url)}>
            <img src={photo.url} alt={photo.caption || `Photo ${idx + 1}`} className="gallery-view-img" />
            {photo.caption && <div className="gallery-view-caption">{photo.caption}</div>}
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="gallery-lightbox" onClick={() => setLightbox(null)}>
          <button className="gallery-lightbox-close" onClick={() => setLightbox(null)}><Icon name="xmark" /></button>
          <img src={lightbox} alt="Full size" className="gallery-lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
