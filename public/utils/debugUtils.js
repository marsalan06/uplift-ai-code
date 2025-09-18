// Debug utilities for LiveKit and development

// Debug function to explore LiveKit structure
function debugLiveKit() {
  console.log('=== LiveKit Debug Info ===');
  console.log('window.LiveKitClient:', window.LiveKitClient);
  console.log('window.LivekitClient:', window.LivekitClient);
  console.log('typeof window.LiveKitClient:', typeof window.LiveKitClient);
  console.log('typeof window.LivekitClient:', typeof window.LivekitClient);
  
  const livekit = window.LiveKitClient || window.LivekitClient;
  if (livekit) {
    console.log('LiveKit keys:', Object.keys(livekit));
    console.log('LiveKit.Room:', livekit.Room);
    console.log('LiveKit.RoomEvent:', livekit.RoomEvent);
    console.log('LiveKit.Track:', livekit.Track);
  }
  
  console.log('window.Room:', window.Room);
  console.log('window.RoomEvent:', window.RoomEvent);
  console.log('=== End Debug Info ===');
}

// Export globally
window.debugLiveKit = debugLiveKit;
