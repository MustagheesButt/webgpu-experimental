import { Color } from "./color"
import { Content } from "./content"
import { Rect } from "./rect"
import { SpriteRenderer } from "./sprite-renderer"

class Renderer {
  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext
  private device!: GPUDevice

  private passEncoder!: GPURenderPassEncoder
  private spriteRenderer!: SpriteRenderer


  public async init() {
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement

    this.context = this.canvas.getContext('webgpu')!

    if (!this.context) {
      alert("WebGPU is not supported!")
      return
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'low-power'
    })

    if (!adapter) {
      alert("No adapter found!")
      return
    }

    this.device = await adapter.requestDevice()

    await Content.init(this.device)

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })

    this.spriteRenderer = new SpriteRenderer(this.device, this.canvas.width, this.canvas.height)
    this.spriteRenderer.init()
  }

  public draw() {
    const commandEncoder = this.device.createCommandEncoder()

    const textureView = this.context.getCurrentTexture().createView()
    const bgColor: GPUColor = { r: 0.5, g: 0.5, b: 0.5, a: 1.0 }

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: bgColor,
          view: textureView,
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    }

    this.passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    this.spriteRenderer.framePass(this.passEncoder)

    // DRAW START


    this.spriteRenderer.drawSpriteSource(Content.uvTexture,
      new Rect(
        0, 0,
        200, 200
      ),
      new Rect(
        0, 0,
        Content.uvTexture.width / 2, Content.uvTexture.height / 2
      )
    )

    const playerSprite = Content.sprites["playerShip1_blue.png"]
    playerSprite.drawRect.x += 1
    playerSprite.drawRect.y += 1
    const tint = new Color(1.0, 0.0, 0.0)
    this.spriteRenderer.drawSpriteSource(playerSprite.texture, playerSprite.drawRect, playerSprite.sourceRect, tint)

    this.spriteRenderer.frameEnd()

    // DRAW END

    this.passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])

    window.requestAnimationFrame(() => this.draw())
  }
}

export default Renderer