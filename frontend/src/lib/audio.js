export function playBase64Audio(base64) {
  if (!base64) {
    console.warn("[Audio] No base64 provided to playBase64Audio");
    return null;
  }

  try {
    // Try MP3 first (most common)
    const audioUrl = `data:audio/mpeg;base64,${base64}`;
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('error', (e) => {
      console.error("[Audio] Playback error:", e.message || e);
    });

    audio.addEventListener('canplay', () => {
      console.log("[Audio] Audio can play, duration:", audio.duration);
    });

    audio.play()
      .then(() => {
        console.log("[Audio] Playback started successfully");
      })
      .catch((err) => {
        console.error("[Audio] Play failed:", err.message);
        // Try with different MIME type as fallback
        console.log("[Audio] Attempting fallback with audio/mp3 MIME type");
        const fallbackUrl = `data:audio/mp3;base64,${base64}`;
        const fallbackAudio = new Audio(fallbackUrl);
        return fallbackAudio.play().catch((fallbackErr) => {
          console.error("[Audio] Fallback play also failed:", fallbackErr.message);
        });
      });

    return audio;
  } catch (e) {
    console.error("[Audio] Failed to create audio element:", e.message);
    return null;
  }
}

export function base64ToBlob(base64, mime = "audio/mp3") {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}
