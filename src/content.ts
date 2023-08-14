import { Texture } from "./texture";

export class Content {
  public static playerTexture: Texture

  public static async init(device: GPUDevice): Promise<void> {
    Content.playerTexture = await Texture.createTextureFromURL(device, "assets/uv-test.jpg")
  }
}