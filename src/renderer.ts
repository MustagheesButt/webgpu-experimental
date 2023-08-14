import { BufferUtil } from "./buffer-util"
import { Camera } from "./camera"
import { Content } from "./content"
import { Rect } from "./rect"
import { SpritePipeline } from "./sprite-pipeline"
import { Texture } from "./texture"

class Renderer {
  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext
  private device!: GPUDevice

  private passEncoder!: GPURenderPassEncoder

  private indexBuffer!: GPUBuffer
  private projectionViewMatrixBuffer!: GPUBuffer

  private camera!: Camera

  private vertexData = new Float32Array(7 * 4)

  public async init() {
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement

    this.camera = new Camera(this.canvas.width, this.canvas.height)

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

    this.projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.device, new Float32Array(16))
    // this.verticesBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array(geometry.vertices))
    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, new Uint16Array([
      0, 1, 2,
      2, 3, 0
    ]))
  }

  public draw() {
    this.camera.update()

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

    // DRAW START

    for (let i = 0; i < 50; i++) {
      this.drawSprite(Content.playerTexture,
        new Rect(
          Math.random() * this.canvas.width, Math.random() * this.canvas.height,
          100, 100
        )
      )
    }

    // DRAW END

    this.passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])

    window.requestAnimationFrame(() => this.draw())
  }

  public drawSprite(texture: Texture, rect: Rect) {
    const pipeline = SpritePipeline.create(this.device, texture, this.projectionViewMatrixBuffer)
    // top left
    this.vertexData[0] = rect.x
    this.vertexData[1] = rect.y
    this.vertexData[2] = 0
    this.vertexData[3] = 0
    this.vertexData[4] = 1.0
    this.vertexData[5] = 1.0
    this.vertexData[6] = 1.0

    // top right
    this.vertexData[7] = rect.x + rect.width
    this.vertexData[8] = rect.y
    this.vertexData[9] = 1
    this.vertexData[10] = 0
    this.vertexData[11] = 1.0
    this.vertexData[12] = 1.0
    this.vertexData[13] = 1.0

    // bottom right
    this.vertexData[14] = rect.x + rect.width
    this.vertexData[15] = rect.y + rect.height
    this.vertexData[16] = 1
    this.vertexData[17] = 1
    this.vertexData[18] = 1.0
    this.vertexData[19] = 1.0
    this.vertexData[20] = 1.0

    // bottom left
    this.vertexData[21] = rect.x
    this.vertexData[22] = rect.y + rect.height
    this.vertexData[23] = 0
    this.vertexData[24] = 1
    this.vertexData[25] = 1.0
    this.vertexData[26] = 1.0
    this.vertexData[27] = 1.0

    const vertexBuffer = BufferUtil.createVertexBuffer(this.device, this.vertexData)

    this.device.queue.writeBuffer(
      this.projectionViewMatrixBuffer,
      0,
      this.camera.projectionViewMatrix as Float32Array);

    this.passEncoder.setPipeline(pipeline.pipeline)

    this.passEncoder.setIndexBuffer(this.indexBuffer, "uint16")
    this.passEncoder.setVertexBuffer(0, vertexBuffer)
    this.passEncoder.setBindGroup(0, pipeline.projectionViewBindGroup)
    this.passEncoder.setBindGroup(1, pipeline.textureBindGroup)

    this.passEncoder.drawIndexed(6)
  }
}

export default Renderer