/** Called only by the microphone button. Late permissions never retain tracks. */
export async function acquireOrbStream(devices: Pick<MediaDevices, 'getUserMedia'> | undefined, isCurrent: () => boolean) {
  if (!isCurrent()) return null;
  if (!devices?.getUserMedia) throw new Error('Microphone access requires HTTPS and browser support.');
  const stream = await devices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  if (!isCurrent()) { stream.getTracks().forEach(track => track.stop()); return null; }
  return stream;
}
