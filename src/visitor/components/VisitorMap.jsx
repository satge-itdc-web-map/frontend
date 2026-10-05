import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import config from '../../config';
import { getCustomIcon } from '../utils/facilityDisplay';
import { bearingDeg, nearestRouteIndex } from '../utils/geo';
import { travelIconSvg } from '../utils/travelIcons';
import { RecoMarkers } from './RecoTerrain';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: #2563eb; border: 3px solid white;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.25);
    "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});


function buildMeasurePointIcon(label, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
        width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white; font-weight: 700; font-size: 12px; font-family: sans-serif;
        ">${label}</span>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}
const pointAIcon = buildMeasurePointIcon('A', '#f59e0b');
const pointBIcon = buildMeasurePointIcon('B', '#8b5cf6');

/** Icône illustrative (piéton / moto / voiture) orientée dans la direction du trajet. */
function buildNavigatingIcon(mode, rotationDeg) {
  const svg = travelIconSvg(mode) || travelIconSvg('driving');
  const size = 40;
  const rotation = mode === 'walking' ? 0 : rotationDeg;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        display: flex; align-items: center; justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
      ">
        <div style="transform: rotate(${rotation}deg); transition: transform 0.3s ease; display: flex;">
          ${svg}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const routeRenderer = L.svg({ padding: 4 });

function FlyTo({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, zoom || map.getZoom(), { duration: 1.2 });
  }, [coords, zoom, map]);
  return null;
}

function FollowUser({ position, active }) {
  const map = useMap();
  useEffect(() => {
    if (active && position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, active]);
  return null;
}

function MeasureClickCapture({ active, onMapClick }) {
  useMapEvents({
    click(e) {
      if (active) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}


function MapInstanceSetter({ onReady }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

// ============================================================
// FOND DE CARTE — Plan / Satellite / Hybride / Relief
// (équivalent du sélecteur de calques de Google Maps)
// ============================================================
function MapBaseLayer({ activeLayer }) {
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
        <TileLayer key="plan" url={config.MAP_TILE_URL} attribution="&copy; OpenStreetMap contributors" />
      );
  }
}

const BASE_LAYERS = [
  { key: 'plan', label: 'Plan', icon: 'bi-map' },
  { key: 'satellite', label: 'Satellite', icon: 'bi-globe-americas' },
  { key: 'hybride', label: 'Hybride', icon: 'bi-layers-half' },
  { key: 'relief', label: 'Relief', icon: 'bi-mountain' },
];

const MENU_WIDTH = 190;
const MARGIN = 10;

// Mesure la vraie limite basse d'un header fixe/sticky en haut de page,
// au lieu de deviner une valeur en dur.
function getSafeTop() {
  const header =
    document.querySelector('.visitor-header') ||
    document.querySelector('header') ||
    document.querySelector('[class*="header"]');
  if (header) {
    const r = header.getBoundingClientRect();
    if (r.top <= 2) return r.bottom + 6;
  }
  return 64;
}

// ============================================================
// BOUTON "calques" — menu en position:fixed (coordonnées calculées
// en pixels réels via getBoundingClientRect). IMPORTANT : ça évite
// le bug précédent où le menu était "position:absolute" à l'intérieur
// de .visitor-map-viewport, qui a overflow:hidden -> le menu se
// faisait couper net dès qu'il dépassait vers le haut. En "fixed",
// il n'est plus confiné par ce conteneur et peut s'afficher n'importe
// où à l'écran, correctement positionné au-dessus ou en-dessous du
// bouton selon la place disponible.
// ============================================================
function LayerSwitcherButton({ activeLayer, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const current = BASE_LAYERS.find((l) => l.key === activeLayer) || BASE_LAYERS[0];

  function computePosition() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const safeTop = getSafeTop();
    const menuHeight = menuRef.current?.getBoundingClientRect().height || 220;

    let top = rect.top - menuHeight - MARGIN;
    if (top < safeTop) {
      top = rect.bottom + MARGIN;
      if (top + menuHeight > viewportH - MARGIN) {
        top = Math.max(safeTop, viewportH - menuHeight - MARGIN);
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

  // Raffine la position une fois la vraie hauteur du menu connue (après montage)
  useEffect(() => {
    if (open) computePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
            boxShadow: '0 10px 28px rgba(0,0,0,.25)',
            padding: 6,
            zIndex: 999999,
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
                fontSize: 14, fontWeight: 600, textAlign: 'left', background: 'transparent',
                color: l.key === activeLayer ? '#166534' : '#0f172a',
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

function VisitorMap({
  facilities,
  userPosition,
  selectedFacility,
  onSelectFacility,
  flyTo,
  route,
  highlightedIds,
  measureActive,
  onMeasureClick,
  measurePointA,
  measurePointB,
  userHeading,
  followHeading = true,
  onRequestLocation,
  reco = null,
  recoSim = false,
  onEmergencyClick,
  nearbyMinimized = false,
  onNearbyRestore,
}) {
  let userMarkerIcon = userIcon;
  if (route?.active && userPosition && route.geometry?.length > 1) {
    const idx = nearestRouteIndex(userPosition[0], userPosition[1], route.geometry);
    const nextIdx = Math.min(idx + 1, route.geometry.length - 1);
    const [nLat, nLon] = route.geometry[nextIdx];
    const rotation = bearingDeg(userPosition[0], userPosition[1], nLat, nLon);
    userMarkerIcon = buildNavigatingIcon(route.mode, rotation);
  }

  const isRotating = !!(route?.active && followHeading && typeof userHeading === 'number');
  const mapRotationDeg = isRotating ? -userHeading : 0;

  const [mapInstance, setMapInstance] = useState(null);
  const [baseLayer, setBaseLayer] = useState('plan');

  const handleLocateClick = () => {
    if (!mapInstance) return;
    if (userPosition) {
      mapInstance.flyTo(userPosition, Math.max(mapInstance.getZoom(), 15), { duration: 1 });
    } else {
      onRequestLocation?.();
    }
  };

  return (
    <div
      className="visitor-map-viewport"
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <div
        className="visitor-map-rotate-wrap"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '160%',
          height: '160%',
          transformOrigin: 'center center',
          transition: 'transform 0.35s ease-out',
          transform: `translate(-50%, -50%) rotate(${mapRotationDeg}deg)`,
        }}
      >
        <MapContainer
          center={[-18.9249, 47.5185]}
          zoom={6}
          style={{ height: '100%', width: '100%', cursor: measureActive ? 'crosshair' : '' }}
          renderer={routeRenderer}
          zoomControl={false}
        >
          <MapInstanceSetter onReady={setMapInstance} />

          <MapBaseLayer key={baseLayer} activeLayer={baseLayer} />

          {flyTo && <FlyTo coords={flyTo.coords} zoom={flyTo.zoom} />}

          <FollowUser position={userPosition} active={!!route?.active} />

          <MeasureClickCapture active={measureActive} onMapClick={onMeasureClick} />

          {userPosition && <Marker position={userPosition} icon={userMarkerIcon} />}

          {route && route.geometry && (
            <>
              <Polyline
                positions={route.geometry}
                pathOptions={{
                  color: '#ffffff',
                  weight: (route.active ? 5 : 4) + 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={route.geometry}
                pathOptions={{
                  color: route.active ? '#6DBE45' : '#2563eb',
                  weight: route.active ? 5 : 4,
                  dashArray: route.active ? null : '8 8',
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {measurePointA && measurePointB && (
            <Polyline
              positions={[measurePointA, measurePointB]}
              pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '4 8', opacity: 0.9 }}
            />
          )}
          {measurePointA && <Marker position={measurePointA} icon={pointAIcon} />}
          {measurePointB && <Marker position={measurePointB} icon={pointBIcon} />}

          <MarkerClusterGroup chunkedLoading maxClusterRadius={55}>
            {facilities.map((feature) => {
              const [lon, lat] = feature.geometry.coordinates;
              const p = feature.properties;
              const isSelected = selectedFacility?.properties?.id === p.id;
              const isHighlighted = !isSelected && highlightedIds?.has(p.id);
              const variant = isSelected ? 'selected' : isHighlighted ? 'highlighted' : 'normal';
              return (
                <Marker
                  key={p.id}
                  position={[lat, lon]}
                  icon={getCustomIcon(p.healthcare, p.amenity, p.name, variant)}
                  eventHandlers={{ click: () => onSelectFacility(feature) }}
                />
              );
            })}
          </MarkerClusterGroup>

          {/* Terrain recommandé partagé depuis le dashboard admin */}
          <RecoMarkers reco={reco} simOpen={recoSim} userPosition={userPosition} />
        </MapContainer>
      </div>

      {/* Contrôles hors du wrapper tournant, pour rester toujours visibles
         même quand la carte pivote (voir followHeading) */}
      <div className="visitor-map-controls">
        <div className="visitor-map-zoom-group">
          <button
            className="visitor-map-zoom-btn"
            onClick={() => mapInstance?.zoomIn()}
            title="Zoomer"
          >
            +
          </button>
          <button
            className="visitor-map-zoom-btn"
            onClick={() => mapInstance?.zoomOut()}
            title="Dézoomer"
          >
            −
          </button>
        </div>
        <button className="visitor-map-locate-btn" onClick={handleLocateClick} title="Centrer sur ma position">
          <i className="bi bi-crosshair"></i>
        </button>
        {userPosition && (
          <button className="visitor-map-locate-btn" onClick={onEmergencyClick} title="Urgences proches" style={{ color: '#e74c3c' }}>
            <i className="bi bi-exclamation-triangle-fill"></i> 
          </button>
        )}
        {/* Sélecteur de fond de carte, juste sous le bouton d'urgence */}
        <LayerSwitcherButton activeLayer={baseLayer} onChange={setBaseLayer} />
        {nearbyMinimized && (
          <button className="visitor-map-locate-btn" onClick={onNearbyRestore} title="Rouvrir les suggestions" style={{ fontSize: 18 }}>
            👋
          </button>
        )}
      </div>
    </div>
  );
}

export default VisitorMap;