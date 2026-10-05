import React, { useState, useRef, useEffect } from 'react';
import { TileLayer } from 'react-leaflet';
import 'bootstrap-icons/font/bootstrap-icons.css';

export function MapBaseLayer({ activeLayer }) {
  switch (activeLayer) {
    case 'satellite':
      return (
        <TileLayer
          key="satellite"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      );

    case 'hybride':
      return (
        <>
          <TileLayer
            key="hybride-sat"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <TileLayer
            key="hybride-labels"
            attribution="Labels &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        </>
      );

    case 'relief':
      return (
        <TileLayer
          key="relief"
          attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
        />
      );

    case 'plan':
    default:
      return (
        <TileLayer
          key="plan"
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
      );
  }
}

const BASE_LAYERS = [
  { key: 'plan', label: 'Plan', icon: 'bi-map' },
  { key: 'satellite', label: 'Satellite', icon: 'bi-globe-americas' },
  { key: 'hybride', label: 'Hybride', icon: 'bi-layers-half' },
  { key: 'relief', label: 'Relief', icon: 'bi-mountain' },
];

const MENU_WIDTH = 186;
const MENU_HEIGHT = 4 * 42 + 12; // 4 lignes ~42px + padding
const SAFE_TOP = 64; // hauteur approx. du header, pour ne jamais passer dessous
const MARGIN = 10;

// ============================================================
// BOUTON + MENU — position calculée en pixels réels (fixed),
// indépendante du CSS parent -> ne peut plus être coupée par
// le header ni dépendre d'un contexte "position:relative" ambigu.
// ============================================================
export function LayerSwitcherButton({ activeLayer, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const current = BASE_LAYERS.find((l) => l.key === activeLayer) || BASE_LAYERS[0];

  function computePosition() {
    const rect = btnRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // Essaie d'abord au-dessus du bouton ; si pas assez de place
    // (le haut du menu passerait sous le header), ouvre en-dessous.
    let top = rect.top - MENU_HEIGHT - MARGIN;
    if (top < SAFE_TOP) {
      top = rect.bottom + MARGIN;
      // Si ça déborde aussi en bas de l'écran, on recolle en bas de l'écran
      if (top + MENU_HEIGHT > viewportH - MARGIN) {
        top = viewportH - MENU_HEIGHT - MARGIN;
      }
    }

    let left = rect.right - MENU_WIDTH;
    if (left < MARGIN) left = MARGIN;

    setMenuPos({ top, left });
  }

  const toggleOpen = () => {
    if (!open) computePosition();
    setOpen((o) => !o);
  };

  // Recalcule si la fenêtre bouge/scroll pendant que le menu est ouvert
  useEffect(() => {
    if (!open) return;
    const onChangeViewport = () => computePosition();
    window.addEventListener('resize', onChangeViewport);
    window.addEventListener('scroll', onChangeViewport, true);
    return () => {
      window.removeEventListener('resize', onChangeViewport);
      window.removeEventListener('scroll', onChangeViewport, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Ferme si on clique ailleurs
  useEffect(() => {
    function onClickOutside(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        className="visitor-map-locate-btn"
        onClick={toggleOpen}
        title="Choisir le fond de carte"
        type="button"
      >
        <i className={`bi ${current.icon}`}></i>
      </button>

      {open && menuPos && (
        <div
          ref={menuRef}
          className="layer-switcher-menu"
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: MENU_WIDTH,
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 10px 28px rgba(0,0,0,.22)',
            overflow: 'hidden',
            padding: 6,
            zIndex: 3000,
          }}
        >
          {BASE_LAYERS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => { onChange(l.key); setOpen(false); }}
              className={`layer-switcher-item ${l.key === activeLayer ? 'is-active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 600, textAlign: 'left',
                color: l.key === activeLayer ? '#166534' : '#0f172a',
                background: l.key === activeLayer ? '#ecfdf5' : 'transparent',
              }}
            >
              <i className={`bi ${l.icon}`} style={{ width: 20, textAlign: 'center' }} />
              <span>{l.label}</span>
              {l.key === activeLayer && (
                <i className="bi bi-check-lg" style={{ marginLeft: 'auto', color: '#16a34a' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}