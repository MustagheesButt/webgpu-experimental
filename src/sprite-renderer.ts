import { BufferUtil } from "./buffer-util"
import { Camera } from "./camera"
import { Color } from "./color"
import { Rect } from "./rect"
import { SpritePipeline } from "./sprite-pipeline"
import { Texture } from "./texture"

const MAX_SPRITES = 1000
const FLOATS_PER_VERTEX = 7
const FLOATS_PER_SPRITE = 4 * FLOATS_PER_VERTEX
const INDICES_PER_SPRITE = 6

export class BatchDrawCall {
  public vertexData = new Float32Array(MAX_SPRITES * FLOATS_PER_SPRITE)
  public instanceCount = 0

  constructor(public pipeline: SpritePipeline) { }
}

export class SpriteRenderer {
  private indexBuffer!: GPUBuffer
  private projectionViewMatrixBuffer!: GPUBuffer

  private currentTexture!: Texture

  private camera!: Camera
  private passEncoder!: GPURenderPassEncoder

  private defaultColor = new Color()

  /**
   * Pipelines created for each texture
   */
  private pipelinesPerTexture: { [id: string]: SpritePipeline } = {}

  /**
   * Draw calls per texture
   */
  private batchDrawCallPerTexture: { [id: string]: Array<BatchDrawCall> } = {}

  /**
   * Buffers which are currently allocated
   */
  private allocatedVertexBuffers: Array<GPUBuffer> = []

  constructor(private device: GPUDevice, private width: number, private height: number) {
    this.camera = new Camera(this.width, this.height)
  }

  private setupIndexBuffer() {
    const data = new Uint16Array(MAX_SPRITES * INDICES_PER_SPRITE)

    for (let i = 0; i < MAX_SPRITES; i++) {
      // t1
      data[i * INDICES_PER_SPRITE + 0] = i * 4 + 0
      data[i * INDICES_PER_SPRITE + 1] = i * 4 + 1
      data[i * INDICES_PER_SPRITE + 2] = i * 4 + 2

      // t2
      data[i * INDICES_PER_SPRITE + 3] = i * 4 + 2
      data[i * INDICES_PER_SPRITE + 4] = i * 4 + 3
      data[i * INDICES_PER_SPRITE + 5] = i * 4 + 0
    }

    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, data)
  }

  public init() {
    this.projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.device, new Float32Array(16))
    this.setupIndexBuffer()
  }

  public framePass(passEncoder: GPURenderPassEncoder) {
    this.passEncoder = passEncoder

    this.batchDrawCallPerTexture = {}

    // this.currentTexture = null

    this.camera.update()

    this.device.queue.writeBuffer(
      this.projectionViewMatrixBuffer,
      0,
      this.camera.projectionViewMatrix as Float32Array
    )
  }

  public drawSprite(texture: Texture, rect: Rect) {
    let pipeline = this.pipelinesPerTexture[texture.id]

    if (this.currentTexture != texture) {
      this.currentTexture = texture

      if (!pipeline) {
        pipeline = SpritePipeline.create(this.device, texture, this.projectionViewMatrixBuffer)
        this.pipelinesPerTexture[texture.id] = pipeline
      }
    }

    const batchDrawCalls = this.batchDrawCallPerTexture[texture.id]
    if (!batchDrawCalls) {
      this.batchDrawCallPerTexture[texture.id] = []
    }

    const arrayOfBatchCalls = this.batchDrawCallPerTexture[texture.id]
    let batchDrawCall = arrayOfBatchCalls[arrayOfBatchCalls.length - 1]
    if (!batchDrawCall) {
      batchDrawCall = new BatchDrawCall(pipeline)
      this.batchDrawCallPerTexture[texture.id].push(batchDrawCall)
    }

    let i = batchDrawCall.instanceCount * FLOATS_PER_SPRITE

    // top left
    batchDrawCall.vertexData[0 + i] = rect.x
    batchDrawCall.vertexData[1 + i] = rect.y
    batchDrawCall.vertexData[2 + i] = 0
    batchDrawCall.vertexData[3 + i] = 0
    batchDrawCall.vertexData[4 + i] = 1.0
    batchDrawCall.vertexData[5 + i] = 1.0
    batchDrawCall.vertexData[6 + i] = 1.0

    // top right
    batchDrawCall.vertexData[7 + i] = rect.x + rect.width
    batchDrawCall.vertexData[8 + i] = rect.y
    batchDrawCall.vertexData[9 + i] = 1
    batchDrawCall.vertexData[10 + i] = 0
    batchDrawCall.vertexData[11 + i] = 1.0
    batchDrawCall.vertexData[12 + i] = 1.0
    batchDrawCall.vertexData[13 + i] = 1.0

    // bottom right
    batchDrawCall.vertexData[14 + i] = rect.x + rect.width
    batchDrawCall.vertexData[15 + i] = rect.y + rect.height
    batchDrawCall.vertexData[16 + i] = 1
    batchDrawCall.vertexData[17 + i] = 1
    batchDrawCall.vertexData[18 + i] = 1.0
    batchDrawCall.vertexData[19 + i] = 1.0
    batchDrawCall.vertexData[20 + i] = 1.0

    // bottom left
    batchDrawCall.vertexData[21 + i] = rect.x
    batchDrawCall.vertexData[22 + i] = rect.y + rect.height
    batchDrawCall.vertexData[23 + i] = 0
    batchDrawCall.vertexData[24 + i] = 1
    batchDrawCall.vertexData[25 + i] = 1.0
    batchDrawCall.vertexData[26 + i] = 1.0
    batchDrawCall.vertexData[27 + i] = 1.0

    batchDrawCall.instanceCount++

    if (batchDrawCall.instanceCount >= MAX_SPRITES) {
      const newBatchDrawCall = new BatchDrawCall(pipeline);
      this.batchDrawCallPerTexture[texture.id].push(newBatchDrawCall);
    }
  }

  public drawSpriteSource(texture: Texture, rect: Rect, sourceRect: Rect, color = this.defaultColor) {
    let pipeline = this.pipelinesPerTexture[texture.id]

    if (this.currentTexture != texture) {
      this.currentTexture = texture

      if (!pipeline) {
        pipeline = SpritePipeline.create(this.device, texture, this.projectionViewMatrixBuffer)
        this.pipelinesPerTexture[texture.id] = pipeline
      }
    }

    const batchDrawCalls = this.batchDrawCallPerTexture[texture.id]
    if (!batchDrawCalls) {
      this.batchDrawCallPerTexture[texture.id] = []
    }

    const arrayOfBatchCalls = this.batchDrawCallPerTexture[texture.id]
    let batchDrawCall = arrayOfBatchCalls[arrayOfBatchCalls.length - 1]
    if (!batchDrawCall) {
      batchDrawCall = new BatchDrawCall(pipeline)
      this.batchDrawCallPerTexture[texture.id].push(batchDrawCall)
    }

    let i = batchDrawCall.instanceCount * FLOATS_PER_SPRITE

    let u0 = sourceRect.x / texture.width
    let v0 = sourceRect.y / texture.height
    let u1 = (sourceRect.x + sourceRect.width) / texture.width
    let v1 = (sourceRect.y + sourceRect.height) / texture.height

    // top left
    batchDrawCall.vertexData[0 + i] = rect.x
    batchDrawCall.vertexData[1 + i] = rect.y
    batchDrawCall.vertexData[2 + i] = u0
    batchDrawCall.vertexData[3 + i] = v0
    batchDrawCall.vertexData[4 + i] = color.r
    batchDrawCall.vertexData[5 + i] = color.g
    batchDrawCall.vertexData[6 + i] = color.b

    // top right
    batchDrawCall.vertexData[7 + i] = rect.x + rect.width
    batchDrawCall.vertexData[8 + i] = rect.y
    batchDrawCall.vertexData[9 + i] = u1
    batchDrawCall.vertexData[10 + i] = v0
    batchDrawCall.vertexData[11 + i] = color.r
    batchDrawCall.vertexData[12 + i] = color.g
    batchDrawCall.vertexData[13 + i] = color.b

    // bottom right
    batchDrawCall.vertexData[14 + i] = rect.x + rect.width
    batchDrawCall.vertexData[15 + i] = rect.y + rect.height
    batchDrawCall.vertexData[16 + i] = u1
    batchDrawCall.vertexData[17 + i] = v1
    batchDrawCall.vertexData[18 + i] = color.r
    batchDrawCall.vertexData[19 + i] = color.g
    batchDrawCall.vertexData[20 + i] = color.b

    // bottom left
    batchDrawCall.vertexData[21 + i] = rect.x
    batchDrawCall.vertexData[22 + i] = rect.y + rect.height
    batchDrawCall.vertexData[23 + i] = u0
    batchDrawCall.vertexData[24 + i] = v1
    batchDrawCall.vertexData[25 + i] = color.r
    batchDrawCall.vertexData[26 + i] = color.g
    batchDrawCall.vertexData[27 + i] = color.b

    batchDrawCall.instanceCount++

    if (batchDrawCall.instanceCount >= MAX_SPRITES) {
      const newBatchDrawCall = new BatchDrawCall(pipeline);
      this.batchDrawCallPerTexture[texture.id].push(newBatchDrawCall);
    }
  }

  public frameEnd() {
    const usedVertexBuffers = []

    for (const key in this.batchDrawCallPerTexture) {
      const arrayOfBatchDrawCalls = this.batchDrawCallPerTexture[key]

      for (const batchDrawCall of arrayOfBatchDrawCalls) {
        if (batchDrawCall.instanceCount === 0) continue

        let vertexBuffer = this.allocatedVertexBuffers.pop()
        if (!vertexBuffer) {
          vertexBuffer = BufferUtil.createVertexBuffer(this.device, batchDrawCall.vertexData)
        } else {
          this.device.queue.writeBuffer(vertexBuffer, 0, batchDrawCall.vertexData)
        }
        usedVertexBuffers.push(vertexBuffer)

        const pipeline = batchDrawCall.pipeline

        this.passEncoder.setPipeline(pipeline.pipeline)

        this.passEncoder.setIndexBuffer(this.indexBuffer, "uint16")
        this.passEncoder.setVertexBuffer(0, vertexBuffer)
        this.passEncoder.setBindGroup(0, pipeline.projectionViewBindGroup)
        this.passEncoder.setBindGroup(1, pipeline.textureBindGroup)

        this.passEncoder.drawIndexed(6 * batchDrawCall.instanceCount)
      }
    }

    for (const vertexBuffer of usedVertexBuffers) {
      this.allocatedVertexBuffers.push(vertexBuffer)
    }
  }
}