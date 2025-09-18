// LiveKit UI Components

// Audio Track Component
function AudioTrack({ trackRef }) {
  const { useRef, useEffect } = React;
  const audioRef = useRef(null);

  useEffect(() => {
    if (trackRef && trackRef.publication && trackRef.publication.track && audioRef.current) {
      trackRef.publication.track.attach(audioRef.current);
      return () => {
        if (trackRef.publication && trackRef.publication.track) {
          trackRef.publication.track.detach();
        }
      };
    }
  }, [trackRef]);

  return React.createElement('audio', { 
    ref: audioRef, 
    autoPlay: true,
    style: { display: 'none' }
  });
}

// Track Toggle Component
function TrackToggle({ source, children }) {
  const { useCallback, useState } = React;
  const { room } = window.useUpliftAIRoom();
  const [isEnabled, setIsEnabled] = useState(true);

  const toggle = useCallback(async () => {
    if (!room) return;
    
    if (source === 'microphone' || source === (window.LiveKitClient || window.LivekitClient)?.Track?.Source?.Microphone) {
      await room.localParticipant.setMicrophoneEnabled(!isEnabled);
      setIsEnabled(!isEnabled);
    }
  }, [room, isEnabled, source]);

  return React.createElement('button', {
    onClick: toggle,
    className: `track-toggle ${isEnabled ? 'enabled' : 'disabled'}`,
    disabled: !room
  }, children || '🎤 Microphone');
}

// Disconnect Button Component
function DisconnectButton({ children, onDisconnect }) {
  const { disconnect } = window.useUpliftAIRoom();

  const handleDisconnect = () => {
    disconnect();
    if (onDisconnect) onDisconnect();
  };

  return React.createElement('button', {
    onClick: handleDisconnect,
    className: 'disconnect-btn'
  }, children || 'Disconnect');
}

// Export components globally
window.AudioTrack = AudioTrack;
window.TrackToggle = TrackToggle;
window.DisconnectButton = DisconnectButton;
