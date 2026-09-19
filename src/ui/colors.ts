/** Palette lifted from `reference/design/*.dc.html`, one role name per hex value actually drawn. */
export const COLORS = {
  bgDeep: 0x060d22,
  skyTop: 0x04081c,
  skyUpper: 0x071130,
  skyMid: 0x0d1c45,
  skyLow: 0x16274f,
  skyBottom: 0x223256,
  frameBlue: 0x4a9fd8,
  frameDeep: 0x0b1c3f,
  frameMid: 0x1a4f82,
  plaqueFill: 0x12213f,
  titleFill: 0x040a1e,
  titleText: 0xcfe7fa,
  titleShadow: 0x14345e,
  promptText: 0x9ed8f5,
  ink: 0x16121c,
  paper: 0xf4f1e6,
  purple: 0x7b2fbe,
  red: 0xe8413a,
  redDeep: 0xc2241d,
  orange: 0xf2a93b,
  amber: 0xffd27a,
  green: 0x4cc94c,
  star: 0xdbe9ff,
  moon: 0xe8f0ff,
  starDim: 0xc9d8f2,
  buildingFar: 0x0e1c44,
  buildingMid: 0x15275a,
  buildingEdge: 0x1d3474,
  towerGoblin: 0x1d3060,
  towerSpidey: 0x1b2c5a,
  roofCap: 0x2c4784,
  textWarm: 0xffd7d5,
  // `reference/design/Scene 2.1 - Spider-Sense.dc.html:133` the balloon's muted trailing paragraph text.
  mutedInk: 0x4a3f2e,
  // `reference/design/Scene 2.1 - Spider-Sense.dc.html:99` the SPIDEY name tag's fill.
  tagSpidey: 0x0f1c3c,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:94` the MJ name tag's fill.
  tagMj: 0x4a0f10,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:124` the GOBLIN name tag's fill.
  tagGoblin: 0x2b0f4d,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:126` the GOBLIN name tag's text colour.
  textGoblin: 0xd9b6ff,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:95` the MJ name tag's dot.
  redSoft: 0xff8d86,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:93` MJ's ground-shadow radial glow.
  groundShadow: 0x060c20,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:123` the Goblin glider's engine glow.
  flameGlow: 0xff9500,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:104` the Goblin's blush, also his flying-kiss heart (112) and first floating heart (130).
  blushPink: 0xff5c7a,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:107` the heart-eyes pixel shape.
  heartEye: 0xff2d55,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:110` the puckered kiss mouth, also the bouquet's second flower centre (119).
  kissMouth: 0xc81e4a,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:115` the bouquet's stem.
  stemGreen: 0x2f7d3a,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:117` the bouquet's first flower centre.
  petalCenter: 0xffe27a,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:118` the bouquet's second flower, also its third centre (121).
  petalGold: 0xffd166,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:131` the second floating heart.
  heartFloat2: 0xff8ba0,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:132` the third floating heart.
  heartFloat3: 0xffb3c2,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:200` the star field's white pick.
  starWhite: 0xffffff,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:200` the star field's blue pick.
  starBlue: 0x9fc4ff,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:200` the star field's deep-blue pick.
  starBlueDeep: 0x7fa8e8,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:40` the moon's blurred box-shadow glow.
  moonGlow: 0x96beff,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:188` the mid skyline's blue window tint.
  windowBlue: 0x7ebef0,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:66,188` the amber window tint shared by the hero facade and the mid skyline.
  windowAmber: 0xf2c85a,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:60` the street haze's 55% gradient stop.
  hazeAmber1: 0xffa84a,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:60` the street haze's bottom-edge gradient stop.
  hazeAmber2: 0xffbe6e,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:66` the hero facade's left inset highlight band.
  skyHighlightBlue: 0x78afe6,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:69` the roof deck's own fill.
  roofDeckBase: 0x33508f,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:69` the roof deck's top inset highlight.
  roofDeckHighlight: 0x5d8fd6,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:70` the roof deck's lower cap strip.
  roofDeckShade: 0x24386e,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:78,83` the rooftop AC units' fill.
  acUnit: 0x22366b,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:78,83` the rooftop AC units' top inset highlight.
  acUnitHighlight: 0x3a5c9e,
  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:86,88` the antenna pole and its cap.
  antennaPole: 0x2a4076,
  // `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:108` the Goblin's sad tear.
  tearBlue: 0x6fd1ff,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:60` the rooftop water tower's tank.
  waterTower: 0x1c2d5c,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:60` the same tank's top inset highlight.
  waterTowerHighlight: 0x2f4c8c,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:61` the lid capping the tank.
  waterTowerLid: 0x263c72,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:62` the two legs the tank stands on.
  waterTowerLeg: 0x1b2a55,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:77` the roof slab's deck surface below its cap.
  roofSlabSurface: 0x16244a,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:77` the dark horizontal seam ruled across that deck.
  roofSlabSeamDark: 0x000000,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:78` the slab's shadowed edge face at the ledge.
  roofSlabEdge: 0x0c1630,
  // `reference/design/Scene 2 - Rooftop Relief.dc.html:97` the arc stream's dot fill.
  streamDrop: 0xf6fbff,
} as const;
