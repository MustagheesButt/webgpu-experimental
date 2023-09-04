import { Rect } from "./rect";
import { Sprite } from "./sprite";
import { Texture } from "./texture";

export class Content {
  public static uvTexture: Texture
  public static spriteSheet: Texture
  public static sprites: {[id: string]: Sprite} = {}

  public static async init(device: GPUDevice): Promise<void> {
    Content.uvTexture = await Texture.createTextureFromURL(device, "assets/uv-test.jpg")
    this.spriteSheet = await Texture.createTextureFromURL(device, "assets/sprites/sheet.png")
    await this.loadSpriteSheet()
  }

  public static async loadSpriteSheet() {
    const req = await fetch("/assets/sprites/sheet.json")
    const atlas = await req.json()

    atlas.SubTexture.forEach((subTexture: any) => {
      const name = subTexture.name
      const width = +subTexture.width
      const height = +subTexture.height
      const drawRect = new Rect(0, 0, width, height)
      const sourceRect = new Rect(+subTexture.x, +subTexture.y, width, height)

      this.sprites[name] = new Sprite(this.spriteSheet, drawRect, sourceRect)
    })
  }
}