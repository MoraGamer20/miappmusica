// Safe audio synthesizer stub - artificial procedural chiptune/Minecraft tones are completely disabled
// Real music files and official full-audio streams are exclusively used throughout the app

export function playSynthesizedPreview(
  _trackTitle: string,
  _artistName: string,
  onEnded?: () => void,
  _onTimeUpdate?: (currentTime: number, duration: number) => void
): () => void {
  // Silent fallback - never synthesize fake chiptune/Minecraft tones
  const timer = setTimeout(() => {
    onEnded?.();
  }, 1000);

  return () => {
    clearTimeout(timer);
  };
}

export function stopSynthesizedPreview(): void {
  // No-op
}
