let activeAudio: HTMLAudioElement | null = null;

export function stopAllAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function playCoachAudio(
  base64Wav?: string | null,
  fallbackText?: string
): Promise<void> {
  stopAllAudio();

  if (base64Wav) {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
      activeAudio = audio;
      await audio.play();
      return;
    } catch (err) {
      console.warn('WAV playback fell back to speechSynthesis:', err);
    }
  }

  if (fallbackText && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(fallbackText);
    utterance.rate = 1.02;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}
