// opentype.js@2.0.0 ships no types and @types/opentype.js only covers the 1.x API, so this declares only the members this repo actually uses.
declare module "opentype.js" {
  export interface OpenTypePathCommand {
    type: "M" | "L" | "C" | "Q" | "Z";
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  export interface OpenTypePath {
    commands: OpenTypePathCommand[];
  }

  export interface OpenTypeGlyph {
    advanceWidth: number;
    getPath(x?: number, y?: number, fontSize?: number): OpenTypePath;
  }

  export interface OpenTypeFont {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    charToGlyph(char: string): OpenTypeGlyph;
    hasChar(char: string): boolean;
  }

  interface OpenTypeModule {
    parse(buffer: Uint8Array | ArrayBuffer): OpenTypeFont;
  }

  const opentype: OpenTypeModule;
  export default opentype;
}
