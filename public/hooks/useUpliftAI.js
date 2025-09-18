// Custom hooks for UpliftAI functionality

// UpliftAI Context
const UpliftAIContext = React.createContext({});

// Custom UpliftAI Room implementation
function UpliftAIRoom({ token, serverUrl, connect, audio, video, children, onSessionEnd }) {
  const { useState, useEffect } = React;
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [agentParticipant, setAgentParticipant] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let currentRoom = null;

    const connectRoom = async () => {
      if (!connect || !token || !serverUrl) return;

      try {
        // Wait for LiveKit to be available with better diagnostics
        const liveKitClient = window.LiveKitClient || window.LivekitClient;
        if (!liveKitClient) {
          console.log('LiveKit not immediately available, waiting...');
          console.log('window.livekitLoadSuccess:', window.livekitLoadSuccess);
          console.log('window.livekitLoadFailed:', window.livekitLoadFailed);
          console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('livekit')));
          
          await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 150; // 15 seconds
            
            const checkInterval = setInterval(() => {
              attempts++;
              
              // Check for explicit failure
              if (window.livekitLoadFailed) {
                clearInterval(checkInterval);
                reject(new Error('LiveKit CDN loading failed - check network connection'));
                return;
              }
              
              // Check for success - verify Room class is available
              const currentClient = window.LiveKitClient || window.LivekitClient;
              if ((currentClient && currentClient.Room) || 
                  window.Room || 
                  window.livekitLoadSuccess) {
                console.log('LiveKit with Room class detected after', attempts * 100, 'ms');
                console.log('LiveKit structure check:', {
                  hasLiveKitClient: !!window.LiveKitClient,
                  hasLivekitClient: !!window.LivekitClient,
                  hasRoom: !!(currentClient && currentClient.Room),
                  hasGlobalRoom: !!window.Room,
                  loadSuccess: window.livekitLoadSuccess
                });
                clearInterval(checkInterval);
                resolve();
                return;
              }
              
              // Timeout
              if (attempts >= maxAttempts) {
                console.error('LiveKit loading timeout after', attempts * 100, 'ms');
                console.log('Final state - window.LiveKitClient:', typeof window.LiveKitClient);
                console.log('Final state - window.livekitLoadSuccess:', window.livekitLoadSuccess);
                console.log('Final state - window.livekitLoadFailed:', window.livekitLoadFailed);
                clearInterval(checkInterval);
                reject(new Error('LiveKit loading timeout - please refresh the page'));
              }
              
              if (attempts % 20 === 0) {
                console.log(`Still waiting for LiveKit... (${attempts}/150)`);
              }
            }, 100);
          });
        } else {
          console.log('LiveKit immediately available');
        }

        // Debug LiveKit structure
        window.debugLiveKit();
        
        let Room, RoomEvent;
        const liveKit = window.LiveKitClient || window.LivekitClient;
        
        // Handle different ways LiveKit might expose classes
        if (liveKit && liveKit.Room) {
          Room = liveKit.Room;
          RoomEvent = liveKit.RoomEvent;
          console.log('Using nested LiveKit classes');
        } else if (window.Room) {
          // Sometimes classes are exposed globally
          Room = window.Room;
          RoomEvent = window.RoomEvent;
          console.log('Using global Room classes');
        } else {
          const availableKeys = liveKit ? Object.keys(liveKit).join(', ') : 'No LiveKit object found';
          throw new Error('LiveKit Room class not found. Available: ' + availableKeys);
        }
        
        console.log('Using Room class:', Room);
        console.log('Using RoomEvent:', RoomEvent);
        
        currentRoom = new Room();

        currentRoom
          .on(RoomEvent.Connected, () => {
            console.log('Room connected');
            setIsConnected(true);
            setError(null);
            
            // Initialize participants collection if not present
            if (!currentRoom.participants) {
              console.warn('Room.participants not initialized, creating empty Map');
              currentRoom.participants = new Map();
            }
          })
          .on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
            if (participant.identity !== 'Web User') {
              setAgentParticipant(participant);
            }
          })
          .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', publication.kind, participant.identity);
            
            // Auto-attach audio tracks for playback
            if (publication.kind === 'audio' && track) {
              console.log('Attempting to attach audio track for:', participant.identity);
              
              // Create audio element if needed
              let audioElement = document.querySelector('#agent-audio');
              if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = 'agent-audio';
                audioElement.autoplay = true;
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
                console.log('Created new audio element');
              }
              
              // Attach track to audio element
              try {
                track.attach(audioElement);
                console.log('✅ Audio track attached successfully to element');
                
                // Ensure autoplay works
                audioElement.play().then(() => {
                  console.log('✅ Audio playback started');
                }).catch(err => {
                  console.error('❌ Audio playback failed:', err);
                  console.log('User may need to interact with page first for autoplay');
                });
                
              } catch (error) {
                console.error('❌ Failed to attach audio track:', error);
              }
            }
          })
          .on(RoomEvent.Disconnected, () => {
            console.log('Room disconnected');
            setIsConnected(false);
            setAgentParticipant(null);
            if (onSessionEnd) onSessionEnd();
          })
          .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
            console.log('Connection quality:', quality, participant?.identity);
          });

        await currentRoom.connect(serverUrl, token);
        setRoom(currentRoom);

      } catch (error) {
        console.error('Failed to connect room:', error);
        setError(error);
      }
    };

    connectRoom();

    return () => {
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [token, serverUrl, connect]);

  // Provide context to children
  const contextValue = {
    isConnected,
    room,
    agentParticipant,
    error,
    disconnect: () => room?.disconnect()
  };

  return React.createElement(UpliftAIContext.Provider, { value: contextValue }, children);
}

// Custom hooks (mimicking UpliftAI SDK)
function useUpliftAIRoom() {
  return React.useContext(UpliftAIContext);
}

function useVoiceAssistant() {
  const { isConnected, agentParticipant } = useUpliftAIRoom();
  const [state, setState] = React.useState('idle');

  React.useEffect(() => {
    if (!isConnected) {
      setState('idle');
    } else if (agentParticipant) {
      setState('listening');
    }
  }, [isConnected, agentParticipant]);

  return { state, setState };
}

// Custom hook to get tracks
function useTracks(sources, options = {}) {
  const { room } = useUpliftAIRoom();
  const [tracks, setTracks] = React.useState([]);

  React.useEffect(() => {
    if (!room || !window.LiveKitClient && !window.LivekitClient) return;

    const updateTracks = () => {
      const allTracks = [];
      
      // Safety check for room.participants
      if (room && room.participants) {
        try {
          // Handle both Map and array-like structures
          if (typeof room.participants.forEach === 'function') {
            room.participants.forEach(participant => {
              // Safety check for participant.tracks
              if (participant && participant.tracks && typeof participant.tracks.forEach === 'function') {
                participant.tracks.forEach(publication => {
                  if (publication.track && (!sources || sources.includes(publication.source))) {
                    if (!options.onlySubscribed || publication.isSubscribed) {
                      allTracks.push({
                        participant,
                        publication,
                        source: publication.source
                      });
                    }
                  }
                });
              }
            });
          } else {
            console.warn('room.participants does not have forEach method:', typeof room.participants);
          }
        } catch (error) {
          console.error('Error in updateTracks:', error);
          // Don't throw, just log and continue with empty tracks
        }
      }
      
      setTracks(allTracks);
    };

    const liveKit = window.LiveKitClient || window.LivekitClient;
    if (!liveKit || !liveKit.RoomEvent) return;

    const { RoomEvent } = liveKit;
    room.on(RoomEvent.TrackSubscribed, updateTracks);
    room.on(RoomEvent.TrackUnsubscribed, updateTracks);
    room.on(RoomEvent.ParticipantConnected, updateTracks);
    room.on(RoomEvent.ParticipantDisconnected, updateTracks);

    updateTracks(); // Initial update

    return () => {
      room.off(RoomEvent.TrackSubscribed, updateTracks);
      room.off(RoomEvent.TrackUnsubscribed, updateTracks);
      room.off(RoomEvent.ParticipantConnected, updateTracks);
      room.off(RoomEvent.ParticipantDisconnected, updateTracks);
    };
  }, [room, sources, options.onlySubscribed]);

  return tracks;
}

// Export hooks globally
window.UpliftAIRoom = UpliftAIRoom;
window.useUpliftAIRoom = useUpliftAIRoom;
window.useVoiceAssistant = useVoiceAssistant;
window.useTracks = useTracks;
