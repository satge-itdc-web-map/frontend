import React, { useEffect, useState } from 'react';
import { Marker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'bootstrap-icons/font/bootstrap-icons.css';

// ===== Icône étoile du terrain proposé (avant simulation) =====
const starIcon = L.divIcon({
  className: '',
  html: `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#f97316);border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.35)"><i class="bi bi-star-fill" style="color:#fff;font-size:16px"></i></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// ============================================================
// GÉNÉRATEUR SVG DE LA MAQUETTE (réutilisable : carte + panneau)
// Version 2.0 :
//  - Ombre au sol (effet "posée")
//  - Grue agrandie et plus visible
//  - Nuances de vert (3 tons)
//  - Détails améliorés
// ============================================================

const MQ_BASE_W = 240;
const MQ_BASE_H = 220;
const MQ_REF_ZOOM = 14;

function getMaquetteScale(zoom) {
  return Math.min(2, Math.max(0.5, Math.pow(1.22, zoom - MQ_REF_ZOOM)));
}

/**
 * Génère le HTML du SVG de la maquette.
 * @param {boolean} isHopital
 * @param {object} opts - { animated: boolean, showProgress: boolean }
 */
function buildMaquetteSvg(isHopital, { animated = true, showProgress = true } = {}) {
  // Classe d'animation : soit animée (apparition séquentielle), soit statique
  const partClass = animated ? 'mq-part' : '';
  const anim = (delay) => animated ? `style="animation-delay:${delay}s"` : '';

  return `
    <style>
      .mq-part {
        opacity: 0;
        animation: mqAppear .4s ease forwards;
      }
      @keyframes mqAppear {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    </style>

    <svg class="mq-svg" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mqRoofA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4b5563"/>
          <stop offset="100%" stop-color="#374151"/>
        </linearGradient>
        <linearGradient id="mqRoofB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6b7280"/>
          <stop offset="100%" stop-color="#4b5563"/>
        </linearGradient>
        <linearGradient id="mqFrontWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <linearGradient id="mqSideWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
        <linearGradient id="mqRoad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
      </defs>

      <!-- ===== 0. OMBRE AU SOL ===== -->
      <ellipse cx="120" cy="120" rx="95" ry="22"
               fill="rgba(0,0,0,0.18)"
               class="${partClass}" ${anim(0)}/>

      <!-- ===== 1. TERRAIN (3 tons de vert) ===== -->
      <g class="${partClass}" ${anim(0.05)}>
        <!-- Base vert clair -->
        <polygon points="120,40 220,90 120,140 20,90"
                 fill="#bbf7d0" stroke="#4ade80" stroke-width="1"/>
        <!-- Zone vert moyen (devant) -->
        <polygon points="60,80 100,60 120,90 80,110"
                 fill="#86efac" stroke="none" opacity="0.8"/>
        <!-- Zone vert foncé (côté droit) -->
        <polygon points="140,80 180,60 200,90 160,110"
                 fill="#6ee7b7" stroke="none" opacity="0.7"/>
        <!-- Petites taches déco -->
        <polygon points="40,85 60,75 70,85 50,95" fill="#a7f3d0" opacity="0.9"/>
        <polygon points="180,100 200,90 215,100 195,110" fill="#a7f3d0" opacity="0.9"/>
        <!-- Bordure terre/gravier -->
        <polygon points="120,35 225,90 120,145 15,90"
                 fill="none" stroke="#a3a3a3" stroke-width="3" opacity="0.4"/>
      </g>

      <!-- ===== 2. ROUTE ===== -->
      <g class="${partClass}" ${anim(0.2)}>
        <polygon points="30,90 120,135 120,142 30,97"
                 fill="url(#mqRoad)" stroke="#94a3b8" stroke-width="0.5"/>
        <polygon points="120,50 190,85 190,92 120,57"
                 fill="url(#mqRoad)" stroke="#94a3b8" stroke-width="0.5"/>
        <!-- Marquage route -->
        <line x1="60" y1="105" x2="100" y2="125" stroke="#fbbf24" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="140" y1="70" x2="170" y2="82" stroke="#fbbf24" stroke-width="1" stroke-dasharray="4 4"/>
      </g>

      <!-- ===== 3. PARKING ===== -->
      <g class="${partClass}" ${anim(0.35)}>
        <polygon points="60,100 100,80 130,95 90,115"
                 fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" opacity="0.9"/>
        <rect x="72" y="96" width="8" height="4" fill="#ef4444" transform="skewY(-26)"/>
        <rect x="88" y="88" width="8" height="4" fill="#3b82f6" transform="skewY(-26)"/>
        <rect x="80" y="104" width="8" height="4" fill="#f59e0b" transform="skewY(-26)"/>
      </g>

      <!-- ===== 4. ESPACES VERTS AMÉNAGÉS ===== -->
      <g class="${partClass}" ${anim(0.5)}>
        <polygon points="40,80 60,70 80,80 60,90" fill="#a7f3d0" stroke="#4ade80" stroke-width="0.5"/>
        <polygon points="160,80 180,70 200,80 180,90" fill="#a7f3d0" stroke="#4ade80" stroke-width="0.5"/>
      </g>

      <!-- ===== 5. ARBRES (variés) ===== -->
      <g class="${partClass}" ${anim(0.6)} transform="translate(50, 78)">
        <ellipse cx="0" cy="2" rx="4" ry="2" fill="#166534" opacity="0.25"/>
        <polygon points="-5,0 0,-12 5,0" fill="#16a34a"/>
        <polygon points="-3,0 0,-8 3,0" fill="#22c55e"/>
        <rect x="-0.5" y="0" width="1" height="2" fill="#78350f"/>
      </g>
      <g class="${partClass}" ${anim(0.65)} transform="translate(190, 78)">
        <ellipse cx="0" cy="2" rx="4" ry="2" fill="#166534" opacity="0.25"/>
        <polygon points="-5,0 0,-12 5,0" fill="#16a34a"/>
        <polygon points="-3,0 0,-8 3,0" fill="#22c55e"/>
        <rect x="-0.5" y="0" width="1" height="2" fill="#78350f"/>
      </g>
      <g class="${partClass}" ${anim(0.7)} transform="translate(35, 95)">
        <ellipse cx="0" cy="2" rx="4" ry="2" fill="#166534" opacity="0.25"/>
        <polygon points="-5,0 0,-12 5,0" fill="#15803d"/>
        <polygon points="-3,0 0,-8 3,0" fill="#22c55e"/>
        <rect x="-0.5" y="0" width="1" height="2" fill="#78350f"/>
      </g>
      <g class="${partClass}" ${anim(0.75)} transform="translate(205, 95)">
        <ellipse cx="0" cy="2" rx="4" ry="2" fill="#166534" opacity="0.25"/>
        <polygon points="-5,0 0,-12 5,0" fill="#15803d"/>
        <polygon points="-3,0 0,-8 3,0" fill="#22c55e"/>
        <rect x="-0.5" y="0" width="1" height="2" fill="#78350f"/>
      </g>

      ${
        isHopital
          ? `
        <!-- ===== 6. TOUR CENTRALE ===== -->
        <g class="${partClass}" ${anim(0.9)}>
          <polygon points="105,60 135,45 135,75 105,90"
                   fill="url(#mqFrontWall)" stroke="#64748b" stroke-width="0.6"/>
          <polygon points="135,45 155,55 155,85 135,75"
                   fill="url(#mqSideWall)" stroke="#64748b" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.05)}>
          <polygon points="105,60 135,45 155,55 125,70"
                   fill="url(#mqRoofA)" stroke="#1e293b" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.2)}>
          <rect x="110" y="68" width="3" height="3" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="118" y="72" width="3" height="3" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="126" y="76" width="3" height="3" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="140" y="60" width="3" height="3" fill="#3b82f6" transform="skewY(26)"/>
          <rect x="146" y="64" width="3" height="3" fill="#3b82f6" transform="skewY(26)"/>
        </g>
        <g class="${partClass}" ${anim(1.35)} transform="translate(130, 42)">
          <rect x="-2" y="-7" width="4" height="14" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.3"/>
          <rect x="-7" y="-2" width="14" height="4" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.3"/>
        </g>

        <!-- ===== 7. AILE GAUCHE ===== -->
        <g class="${partClass}" ${anim(1.45)}>
          <polygon points="60,75 90,60 90,85 60,100"
                   fill="url(#mqFrontWall)" stroke="#64748b" stroke-width="0.6"/>
          <polygon points="90,60 105,68 105,93 90,85"
                   fill="url(#mqSideWall)" stroke="#64748b" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.55)}>
          <polygon points="60,75 90,60 105,68 75,83"
                   fill="url(#mqRoofB)" stroke="#374151" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.65)}>
          <rect x="65" y="82" width="3" height="3" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="73" y="86" width="3" height="3" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="81" y="90" width="3" height="3" fill="#60a5fa" transform="skewY(-26)"/>
        </g>

        <!-- ===== 8. AILE DROITE ===== -->
        <g class="${partClass}" ${anim(1.75)}>
          <polygon points="155,75 185,60 185,85 155,100"
                   fill="url(#mqFrontWall)" stroke="#64748b" stroke-width="0.6"/>
          <polygon points="185,60 205,70 205,95 185,85"
                   fill="url(#mqSideWall)" stroke="#64748b" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.85)}>
          <polygon points="155,75 185,60 205,70 175,85"
                   fill="url(#mqRoofB)" stroke="#374151" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.95)}>
          <rect x="160" y="82" width="3" height="3" fill="#3b82f6" transform="skewY(-26)"/>
          <rect x="168" y="86" width="3" height="3" fill="#3b82f6" transform="skewY(-26)"/>
          <rect x="176" y="90" width="3" height="3" fill="#3b82f6" transform="skewY(-26)"/>
        </g>
        `
          : `
        <!-- ===== 6. CSB — MURS ===== -->
        <g class="${partClass}" ${anim(0.9)}>
          <polygon points="85,70 130,48 130,95 85,117"
                   fill="url(#mqFrontWall)" stroke="#64748b" stroke-width="0.6"/>
          <polygon points="130,48 165,65 165,112 130,95"
                   fill="url(#mqSideWall)" stroke="#64748b" stroke-width="0.6"/>
        </g>
        <g class="${partClass}" ${anim(1.1)}>
          <polygon points="85,70 130,48 165,65 120,87"
                   fill="url(#mqRoofA)" stroke="#1e293b" stroke-width="0.6"/>
          <polygon points="85,70 130,48 165,65 120,87"
                   fill="none" stroke="#1e293b" stroke-width="1.5" opacity="0.4"/>
        </g>
        <g class="${partClass}" ${anim(1.3)}>
          <rect x="92" y="78" width="5" height="5" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="104" y="84" width="5" height="5" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="92" y="92" width="5" height="5" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="104" y="98" width="5" height="5" fill="#60a5fa" transform="skewY(-26)"/>
          <rect x="138" y="72" width="5" height="5" fill="#3b82f6" transform="skewY(26)"/>
          <rect x="150" y="78" width="5" height="5" fill="#3b82f6" transform="skewY(26)"/>
          <rect x="138" y="86" width="5" height="5" fill="#3b82f6" transform="skewY(26)"/>
          <rect x="150" y="92" width="5" height="5" fill="#3b82f6" transform="skewY(26)"/>
        </g>
        <g class="${partClass}" ${anim(1.45)}>
          <polygon points="112,105 120,101 120,110 112,114"
                   fill="#78350f" stroke="#451a03" stroke-width="0.5"/>
        </g>
        <g class="${partClass}" ${anim(1.55)} transform="translate(125, 45)">
          <rect x="-2" y="-7" width="4" height="14" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.3"/>
          <rect x="-7" y="-2" width="14" height="4" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.3"/>
        </g>
        `
      }

      <!-- ===== 11. GRUE AGRANDIE (plus visible) ===== -->
      <g class="${partClass}" ${anim(1.7)}>
        <!-- Ombre de la grue au sol -->
        <ellipse cx="208" cy="98" rx="12" ry="4" fill="rgba(0,0,0,0.15)"/>
        <!-- Mât plus haut -->
        <rect x="205" y="15" width="3" height="83" fill="#f59e0b" stroke="#b45309" stroke-width="0.4"/>
        <!-- Base -->
        <rect x="202" y="93" width="9" height="5" fill="#92400e" stroke="#78350f" stroke-width="0.4"/>
        <!-- Bras horizontal plus long -->
        <rect x="170" y="12" width="55" height="3" fill="#f59e0b" stroke="#b45309" stroke-width="0.4"/>
        <!-- Contrepoids -->
        <rect x="166" y="9" width="6" height="9" fill="#4b5563" stroke="#1f2937" stroke-width="0.4"/>
        <!-- Câble -->
        <line x1="195" y1="15" x2="195" y2="38" stroke="#374151" stroke-width="0.8"/>
        <!-- Crochet -->
        <rect x="192" y="38" width="6" height="6" fill="#1f2937"/>
        <!-- Petite charge suspendue (matériau) -->
        <rect x="191" y="44" width="8" height="4" fill="#b45309" stroke="#78350f" stroke-width="0.3"/>
      </g>

      <!-- ===== 12. MATÉRIAUX AU SOL ===== -->
      <g class="${partClass}" ${anim(1.85)} transform="translate(150, 105)">
        <rect x="0" y="0" width="8" height="3" fill="#b91c1c" stroke="#7f1d1d" stroke-width="0.2"/>
        <rect x="0" y="-3" width="6" height="3" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.2"/>
        <rect x="0" y="-6" width="5" height="3" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.2"/>
      </g>
      <g class="${partClass}" ${anim(1.9)} transform="translate(60, 108)">
        <rect x="0" y="0" width="10" height="2" fill="#a16207" stroke="#713f12" stroke-width="0.2"/>
        <rect x="0" y="-2" width="10" height="2" fill="#ca8a04" stroke="#713f12" stroke-width="0.2"/>
      </g>
      <g class="${partClass}" ${anim(1.95)} transform="translate(170, 115)">
        <polygon points="0,0 6,-2 6,2 0,4" fill="#64748b" stroke="#334155" stroke-width="0.3"/>
        <circle cx="2" cy="5" r="1.5" fill="#1f2937"/>
        <circle cx="7" cy="3" r="1.5" fill="#1f2937"/>
      </g>

      ${
        showProgress
          ? `
        <!-- ===== 13. BARRE DE PROGRESSION ===== -->
        <g class="${partClass}" ${anim(2.1)} transform="translate(70, 200)">
          <rect width="100" height="5" rx="2.5" fill="rgba(0,0,0,0.15)"/>
          <rect width="68" height="5" rx="2.5" fill="#6DBE45"/>
          <text x="50" y="18" text-anchor="middle" font-size="9" font-weight="700" fill="#374151" font-family="Inter, sans-serif">
            Chantier en cours
          </text>
        </g>
        `
          : ''
      }
    </svg>
  `;
}

// ============================================================
// COMPOSANT : Mini-preview SVG à utiliser dans le panneau
// ============================================================

export function MaquettePreview({ typeEtablissementRecommande, width = 200 }) {
  const isHopital = (typeEtablissementRecommande || '').toLowerCase().includes('hôpital');
  const svg = buildMaquetteSvg(isHopital, { animated: true, showProgress: false });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: '4px 0',
      }}
      // Injecte le SVG dans un conteneur adapté
      dangerouslySetInnerHTML={{
        __html: `<div style="width:${width}px;height:${(width * MQ_BASE_H) / MQ_BASE_W}px;">${svg}</div>`,
      }}
    />
  );
}

// ============================================================
// CONSTRUCTION DE L'ICÔNE LEAFLET (pour la carte)
// ============================================================

function buildMaquetteIcon(typeEtablissementRecommande, zoom = MQ_REF_ZOOM) {
  const isHopital = (typeEtablissementRecommande || '').toLowerCase().includes('hôpital');
  const scale = getMaquetteScale(zoom);
  const W = Math.round(MQ_BASE_W * scale);
  const H = Math.round(MQ_BASE_H * scale);

  const svg = buildMaquetteSvg(isHopital, { animated: true, showProgress: true });

  const html = `
    <style>
      .mq-wrap {
        position: relative;
        width: ${W}px;
        height: ${H}px;
        pointer-events: none;
      }
      .mq-svg { width: 100%; height: 100%; overflow: visible; }
      .mq-float {
        animation: mqFloat 4s ease-in-out 2.3s infinite;
      }
      @keyframes mqFloat {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-4px); }
      }
      .mq-part {
        opacity: 0;
        animation: mqAppear .4s ease forwards;
      }
      @keyframes mqAppear {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    </style>
    <div class="mq-wrap">
      <div class="mq-float">
        ${svg}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'maquette-terrain-icon',
    html,
    iconSize: [W, H],
    iconAnchor: [Math.round(W * 0.5), Math.round(H * (200 / 220))],
  });
}

// ===== CSS global pour le marqueur =====
let stylesInjected = false;
function ensureGlobalStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .maquette-terrain-icon {
      background: transparent !important;
      border: none !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
}

// ===== Recentre la carte sur le terrain =====
function FlyToReco({ reco }) {
  const map = useMap();
  useEffect(() => {
    if (reco) map.flyTo([reco.lat, reco.lng], 14, { duration: 1.2 });
  }, [reco, map]);
  return null;
}

// ===== Suit le niveau de zoom de la carte en temps réel =====
function useMapZoom() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => map.off('zoomend', onZoom);
  }, [map]);
  return zoom;
}

/** À placer DANS le <MapContainer> */
export function RecoMarkers({ reco, simOpen, userPosition }) {
  const zoom = useMapZoom();
  if (!reco) return null;
  ensureGlobalStyles();
  const pos = [reco.lat, reco.lng];

  return (
    <>
      <FlyToReco reco={reco} />

      <Circle
        center={pos}
        radius={5000}
        pathOptions={{ color: simOpen ? '#6DBE45' : '#f59e0b', weight: 2, fillOpacity: 0.08 }}
      />
      <Circle
        center={pos}
        radius={3000}
        pathOptions={{ color: simOpen ? '#6DBE45' : '#f59e0b', weight: 1, dashArray: '6 6', fillOpacity: 0.05 }}
      />

      {!simOpen && <Marker position={pos} icon={starIcon} />}
      {simOpen && (
        <Marker
          position={pos}
          icon={buildMaquetteIcon(reco.typeEtablissementRecommande, zoom)}
          zIndexOffset={1000}
        />
      )}

      {userPosition && simOpen && (
        <Polyline
          positions={[userPosition, pos]}
          pathOptions={{ color: '#2980b9', weight: 3, dashArray: '8 8' }}
        />
      )}
    </>
  );
}

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

/** Panneau moderne latéral avec mini-preview */
export function RecoTerrainPanel({ recos, index, simOpen, onSim, onNavigate, userPosition, onClose }) {
  const reco = recos?.[index];
  if (!reco) return null;

  return (
    <>
      <style>{`
        .rp-panel{
          position:absolute; top:64px; right:14px; z-index:1200; width:392px; max-height:86vh; overflow-y:auto;
          background:rgba(255,255,255,.96); backdrop-filter:blur(10px);
          border-radius:22px; box-shadow:0 12px 40px rgba(2,6,23,.25);
          font-family:'Segoe UI',system-ui,sans-serif; overflow-x:hidden;
        }
        .rp-header{
          display:flex; align-items:center; gap:12px; padding:16px 18px;
          background:linear-gradient(135deg,#6DBE45 0%,#15803d 100%);
          color:#fff; border-radius:22px 22px 0 0;
        }
        .rp-header-icon{
          width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.2);
          display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;
        }
        .rp-title{font-size:15px;font-weight:800;letter-spacing:.2px}
        .rp-sub{font-size:11px;opacity:.85;margin-top:2px}
        .rp-close{margin-left:auto;border:none;background:rgba(255,255,255,.2);color:#fff;width:30px;height:30px;border-radius:10px;cursor:pointer;font-size:13px}
        .rp-body{padding:16px 18px 18px}
        .rp-preview{
          background:linear-gradient(180deg,#f0fdf4 0%,#ffffff 100%);
          border:1px solid #bbf7d0;
          border-radius:14px;
          padding:10px;
          margin-bottom:14px;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
          overflow:hidden;
        }
        .rp-preview::before{
          content:'Aperçu du chantier';
          position:absolute;
          top:6px;
          left:10px;
          font-size:10px;
          font-weight:700;
          color:#15803d;
          text-transform:uppercase;
          letter-spacing:.5px;
        }
        .rp-loc{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px}
        .rp-loc i{color:#f59e0b;font-size:18px;margin-top:2px}
        .rp-loc b{font-size:14px;color:#0f172a;display:block}
        .rp-loc span{font-size:12px;color:#64748b}
        .rp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
        .rp-chip{
          background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px 12px;
          display:flex;align-items:center;gap:10px;
        }
        .rp-chip i{font-size:17px;width:22px;text-align:center}
        .rp-chip .v{font-size:13px;font-weight:800;color:#0f172a}
        .rp-chip .l{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.4px}
        .rp-note{font-size:12px;color:#475569;background:#f1f5f9;border-radius:12px;padding:10px 12px;margin-bottom:14px;line-height:1.5}
        .rp-sim-box{border-radius:14px;padding:12px 14px;margin-bottom:14px;font-size:12.5px;line-height:1.5}
        .rp-sim-box.off{background:#fffbeb;border:1px solid #fcd34d;color:#92400e}
        .rp-sim-box.on{background:#ecfdf5;border:1px solid #6DBE45;color:#166534}
        .rp-sim-btn{
          width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
          border:none;border-radius:14px;padding:13px;cursor:pointer;
          font-size:14px;font-weight:800;color:#fff;
          background:linear-gradient(135deg,#0f172a,#334155);
          box-shadow:0 6px 18px rgba(15,23,42,.3); transition:transform .15s;
        }
        .rp-sim-btn:active{transform:scale(.98)}
        .rp-sim-btn.on{background:linear-gradient(135deg,#6DBE45,#15803d)}
        .rp-nav-btn{
          width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
          border:none;border-radius:14px;padding:13px;cursor:pointer;margin-top:10px;
          font-size:13.5px;font-weight:800;color:#fff;
          background:linear-gradient(135deg,#2980b9,#1d4ed8);
          box-shadow:0 6px 18px rgba(29,78,216,.3); transition:transform .15s;
        }
        .rp-nav-btn:active{transform:scale(.98)}
        .rp-sat{display:block;text-align:center;font-size:11px;color:#94a3b8;margin-top:10px;text-decoration:none}
        .rp-sat:hover{color:#64748b}
      `}</style>

      <div className="rp-panel">
        <div className="rp-header">
          <div className="rp-header-icon"><i className="bi bi-hospital-fill" /></div>
          <div>
            <div className="rp-title">Terrain proposé</div>
            <div className="rp-sub">SantéGéo MG · Recommandation d'implantation</div>
          </div>
          <button className="rp-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className="rp-body">
          {/* ===== MINI-PREVIEW DE LA MAQUETTE ===== */}
          <div className="rp-preview">
            <MaquettePreview
              typeEtablissementRecommande={reco.typeEtablissementRecommande}
              width={200}
            />
          </div>

          <div className="rp-loc">
            <i className="bi bi-geo-alt-fill" />
            <div>
              <b>{reco.quartier || 'Localité à couvrir'}</b>
              <span>{reco.district} · {reco.region}</span>
            </div>
          </div>

          <div className="rp-grid">
            <div className="rp-chip">
              <i className="bi bi-people-fill" style={{ color: '#0ea5e9' }} />
              <div>
                <div className="v">{fmt(reco.populationRayon3km)} hab.</div>
                <div className="l">à couvrir (3 km)</div>
              </div>
            </div>
            <div className="rp-chip">
              <i className="bi bi-car-front-fill" style={{ color: '#f59e0b' }} />
              <div>
                <div className="v">{reco.distancePlusProcheKm ?? '—'} km · {reco.avgCarMin} min</div>
                <div className="l">centre actuel</div>
              </div>
            </div>
            <div className="rp-chip">
              <i className="bi bi-building-fill-check" style={{ color: '#8b5cf6' }} />
              <div>
                <div className="v">{reco.typeEtablissementRecommande}</div>
                <div className="l">type recommandé</div>
              </div>
            </div>
            <div className="rp-chip">
              <i className="bi bi-signpost-2-fill" style={{ color: '#ef4444' }} />
              <div>
                <div className="v">{reco.statut}</div>
                <div className="l">statut de la zone</div>
              </div>
            </div>
          </div>

          <div className="rp-note">
            <i className="bi bi-bullseye" style={{ color: '#6DBE45', marginRight: 6 }} />
            Cercles sur la carte : <b>vert plein</b> = zone d'impact 5 km · <b>pointillé</b> = cœur de zone 3 km.
          </div>

          <div className="rp-note">
            <i className="bi bi-houses-fill" style={{ color: '#64748b', marginRight: 6 }} />
            Communes concernées : {(reco.communesCouvertes || []).slice(0, 4).join(', ')}
            {(reco.communesCouvertes || []).length > 4 ? '…' : ''}
          </div>

          <div className={`rp-sim-box ${simOpen ? 'on' : 'off'}`}>
            {simOpen ? (
              <>
                <b><i className="bi bi-check-circle-fill" style={{ marginRight: 6 }} />Simulation active</b>
                <div style={{ marginTop: 4 }}>
                  +{fmt(reco.populationCouverte)} personnes couvertes · {reco.pourcentageCouverture}% de la
                  population non couverte de la région.
                </div>
              </>
            ) : (
              <>
                <i className="bi bi-info-circle-fill" style={{ marginRight: 6 }} />
                Cette zone est actuellement hors couverture. Lancez la simulation pour voir la maquette du
                chantier de construction et mesurer l'impact.
              </>
            )}
          </div>

          <button className={`rp-sim-btn ${simOpen ? 'on' : ''}`} onClick={onSim}>
            <i className={`bi ${simOpen ? 'bi-stop-fill' : 'bi-hammer'}`} />
            {simOpen ? 'Arrêter la simulation' : "Simuler l'ouverture du centre"}
          </button>

          <button className="rp-nav-btn" onClick={() => onNavigate && onNavigate(reco)}>
            <i className="bi bi-sign-turn-right-fill" />
            Itinéraire vers ce site
          </button>

          <a
            className="rp-sat"
            href={`https://www.google.com/maps/@${reco.lat},${reco.lng},18z/data=!3m1!1e3`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-globe-americas" /> vue satellite
          </a>
        </div>
      </div>
    </>
  );
}

export default RecoMarkers;