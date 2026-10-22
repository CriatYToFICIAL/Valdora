let context: AudioContext | null = null;
export let muted = false;
export function toggleSound() {
  muted = !muted;
  return muted;
}
export function sound(
  kind:
    | "tap"
    | "good"
    | "bad"
    | "day"
    | "step"
    | "door"
    | "clean"
    | "bake"
    | "oven"
    | "coins"
    | "box"
    | "order"
    | "phone" = "tap",
) {
  if (muted) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    if (["step", "door", "clean", "box"].includes(kind)) {
      const size = Math.floor(context.sampleRate * 0.09),
        buffer = context.createBuffer(1, size, context.sampleRate),
        samples = buffer.getChannelData(0);
      for (let i = 0; i < size; i++)
        samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.15));
      const source = context.createBufferSource(),
        gain = context.createGain(),
        filter = context.createBiquadFilter();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value =
        kind === "step" ? 500 : kind === "door" ? 220 : 1300;
      gain.gain.value = kind === "step" ? 0.022 : 0.07;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      source.start();
      return;
    }
    const notes =
      kind === "good" || kind === "coins" || kind === "oven"
        ? [523, 659, 784]
        : kind === "day"
          ? [392, 523, 659, 784]
          : kind === "bad"
            ? [190, 145]
            : kind === "phone"
              ? [740, 540, 740, 540]
              : [440];
    notes.forEach((f, i) => {
      const o = context!.createOscillator(),
        g = context!.createGain(),
        t = context!.currentTime + i * 0.09;
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(kind === "phone" ? 0.025 : 0.045, t);
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
let ambientClock = 0;
export function ambience(dt: number, minute: number, outside: boolean) {
  if (muted || !outside || !context) return;
  ambientClock -= dt;
  if (ambientClock > 0) return;
  ambientClock = 4 + Math.random() * 6;
  const hour = (minute % 1440) / 60,
    night = hour >= 19 || hour < 6,
    now = context.currentTime;
  for (let i = 0; i < (night ? 4 : 2); i++) {
    const o = context.createOscillator(),
      g = context.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(night ? 3100 : 1700 + i * 300, now + i * 0.16);
    o.frequency.exponentialRampToValueAtTime(
      night ? 3400 : 2400,
      now + i * 0.16 + 0.1,
    );
    g.gain.setValueAtTime(0, now + i * 0.16);
    g.gain.linearRampToValueAtTime(
      night ? 0.006 : 0.012,
      now + i * 0.16 + 0.02,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.13);
    o.connect(g);
    g.connect(context.destination);
    o.start(now + i * 0.16);
    o.stop(now + i * 0.16 + 0.15);
  }
}
