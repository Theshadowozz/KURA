export function playBase64Audio(base64) {
  if (!base64) return null;
  try {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play().catch(() => {});
    return audio;
  } catch (e) {
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
