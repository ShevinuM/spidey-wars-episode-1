import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.ts";
import { CutsceneScene } from "./scenes/CutsceneScene.ts";
import { TitleScene } from "./scenes/TitleScene.ts";
import { installTestHooks } from "./test-hooks.ts";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  pixelArt: true,
  backgroundColor: "#060d22",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Only the array's first entry auto-starts (phaser@4.2.1 `src/scene/SceneManager.js:165-171`,
  // `Settings.js:45` defaults `active` to `false`), so `CutsceneScene` here is added, not started.
  scene: [BootScene, TitleScene, CutsceneScene],
});

if (__TEST__) {
  // Dynamic import so the test-only scene never reaches a static import Rollup would keep in dist/.
  const { PrimitivesGalleryScene } = await import("./scenes/PrimitivesGalleryScene.ts");
  // Registered before installTestHooks so window.__TEST__ never exists in a window where goto() could reject with "no scene registered".
  game.scene.add("PrimitivesGalleryScene", PrimitivesGalleryScene, false);
  installTestHooks(game);
}
