
import React, { useState } from 'react';
import './NavigationOverlay.css';
import { formatDistance } from '../utils/geo';

function NavigationOverlay({
  instruction,
  subInstruction,
  isVoiceActive,
  onToggleVoice,
  onRepeat,
  onClose,
  progressPercent,
  distanceRemaining,
  timeRemaining,
  destinationName,
  isFallback,
  isPaused,
  onTogglePause,
  onSharePosition,
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Animation de fermeture
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const displayInstruction = isPaused
    ? 'Navigation en pause'
    : instruction || 'Commencez à marcher pour recevoir les instructions';
  const displaySubInstruction = isPaused ? 'Reprenez quand vous êtes prêt' : (instruction ? subInstruction : '');

  return (
    <div className={`nav-overlay ${isPaused ? 'nav-overlay--paused' : ''}`}>
      <div className="nav-overlay__content">
        {/* Avertissement mode dégradé (ligne droite, pas de virage-par-virage) */}
        {isFallback && !isPaused && (
          <div className="nav-overlay__fallback-warning">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>Itinéraire approximatif (ligne droite) — signal indisponible</span>
          </div>
        )}

        {isPaused && (
          <div className="nav-overlay__pause-banner">
            <i className="bi bi-pause-circle-fill"></i>
            <span>Navigation en pause — votre trajet reste enregistré</span>
          </div>
        )}

        {/* Barre de progression en haut */}
        <div className="nav-overlay__progress">
          <div className="nav-overlay__progress-bar">
            <div
              className="nav-overlay__progress-fill"
              style={{ width: `${Math.min(100, progressPercent || 0)}%` }}
            />
          </div>
          <div className="nav-overlay__progress-info">
            <span>
              <i className="bi bi-geo-alt-fill"></i> {formatDistance(distanceRemaining || 0)}
            </span>
            <span>
              <i className="bi bi-clock-fill"></i> {Math.round(timeRemaining || 0)} min
            </span>
            <span>
              <i className="bi bi-arrow-right-circle-fill"></i> {Math.round(progressPercent || 0)}%
            </span>
          </div>
        </div>

        {/* Instruction principale */}
        <div className="nav-overlay__instruction">
          <div className="nav-overlay__instruction-icon">
            <i className={`bi ${isPaused ? 'bi-pause-fill' : 'bi-compass-fill'}`}></i>
          </div>
          <div className="nav-overlay__instruction-text">
            <div className="nav-overlay__instruction-main">{displayInstruction}</div>
            {displaySubInstruction && (
              <div className="nav-overlay__instruction-sub">{displaySubInstruction}</div>
            )}
          </div>
        </div>

        {/* Destination */}
        {destinationName && (
          <div className="nav-overlay__destination">
            <i className="bi bi-flag-fill"></i>
            <span>{destinationName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="nav-overlay__actions">
          {onTogglePause && (
            <button
              className={`nav-overlay__pause-btn ${isPaused ? 'is-active' : ''}`}
              onClick={onTogglePause}
              title={isPaused ? 'Reprendre la navigation' : 'Mettre en pause'}
            >
              <i className={`bi ${isPaused ? 'bi-play-fill' : 'bi-pause-fill'}`}></i>
              <span>{isPaused ? 'Reprendre' : 'Pause'}</span>
            </button>
          )}

          <button
            className={`nav-overlay__voice-btn ${isVoiceActive ? 'is-active' : ''}`}
            onClick={onToggleVoice}
            title={isVoiceActive ? 'Désactiver le guidage vocal' : 'Activer le guidage vocal'}
          >
            <i className={`bi ${isVoiceActive ? 'bi-volume-up-fill' : 'bi-volume-up'}`}></i>
            <span>{isVoiceActive ? 'Voix ON' : 'Voix OFF'}</span>
          </button>

          {onRepeat && !isPaused && (
            <button
              className="nav-overlay__repeat-btn"
              onClick={onRepeat}
              title="Répéter l'instruction"
            >
              <i className="bi bi-arrow-repeat"></i>
              <span>Répéter</span>
            </button>
          )}

          {onSharePosition && (
            <button
              className="nav-overlay__share-btn"
              onClick={onSharePosition}
              title="Partager ma position"
            >
              <i className="bi bi-share-fill"></i>
              <span>Partager</span>
            </button>
          )}

          <button
            className="nav-overlay__close-btn"
            onClick={handleClose}
            title="Fermer la navigation"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavigationOverlay;