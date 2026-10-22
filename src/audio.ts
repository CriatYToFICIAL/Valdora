let context: AudioContext | null = null;
export let muted = false;
export function toggleSound() {
  muted = !muted;
  return muted;
}
export function sound(kind: "tap" | "good" | "bad" | "day" = "tap") {
  if (muted) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const notes =
      kind === "good"
        ? [523, 659, 784]
        : kind === "day"
          ? [392, 523, 659, 784]
          : kind === "bad"
            ? [190, 145]
            : [440];
    notes.forEach((f, i) => {
      const o = context!.createOscillator(),
        g = context!.createGain(),
        t = context!.currentTime + i * 0.09;
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.045, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g);
      g.connect(context!.destination);
      o.start(t);
      o.stop(t + 0.17);
    });
  } catch {
    /* Browsers without Web Audio still support all gameplay. */
  }
}
