import Phaser from "phaser";
import { ValdoraScene } from "./world";
import "./style.css";
import "./pixel.css";
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 1152,
  height: 720,
  backgroundColor: "#192f2e",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [ValdoraScene],
  input: { keyboard: true },
  audio: { noAudio: true },
});
