import { BufferUtil } from "./buffer-util"
import { QuadGeometry } from "./geometry"
import { Texture } from "./texture"

class Renderer {
  private context!: GPUCanvasContext
  private device!: GPUDevice
  private pipeline!: GPURenderPipeline

  private positionBuffer!: GPUBuffer
  private colorsBuffer!: GPUBuffer
  private texCoordsBuffer!: GPUBuffer
  private textureBindGroup!: GPUBindGroup
  private indexBuffer!: GPUBuffer

  private testTexture!: Texture

  public async init(shaderModule: string) {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement

    this.context = canvas.getContext('webgpu')!

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

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })

    this.testTexture = await Texture.createTextureFromURL(this.device, "assets/uv-test.jpg")
    this.prepareModel(shaderModule)

    const geometry = new QuadGeometry()

    this.positionBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array(geometry.positions))
    this.colorsBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array(geometry.colors))
    this.texCoordsBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array(geometry.texCoords))
    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, new Uint16Array(geometry.indices))
  }

  private prepareModel(shaderSource: string) {
    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    })

    const positionBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2' // 2 floats
        }
      ],
      stepMode: 'vertex'
    }

    const colorBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
      attributes: [
        {
          shaderLocation: 1,
          offset: 0,
          format: 'float32x3' // 2 floats
        }
      ],
      stepMode: 'vertex'
    }

    const textureCoordsLayout: GPUVertexBufferLayout = {
      arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
      attributes: [
        {
          shaderLocation: 2,
          offset: 0,
          format: 'float32x2' // 2 floats
        }
      ],
      stepMode: 'vertex'
    }

    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [
        positionBufferLayout,
        colorBufferLayout,
        textureCoordsLayout
      ]
    }

    const fragmentState: GPUFragmentState = {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add'
            }
          }
        }
      ]
    }

    const textureBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {}
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {}
        }
      ]
    })

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        textureBindGroupLayout
      ]
    })

    this.textureBindGroup = this.device.createBindGroup({
      layout: textureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.testTexture.sampler
        },
        {
          binding: 1,
          resource: this.testTexture.texture.createView()
        }
      ]
    })

    this.pipeline = this.device.createRenderPipeline({
      vertex: vertexState,
      fragment: fragmentState,
      primitive: {
        topology: 'triangle-list'
      },
      layout: pipelineLayout
    })
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

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    // actual drawing here
    passEncoder.setPipeline(this.pipeline)

    passEncoder.setIndexBuffer(this.indexBuffer, "uint16")
    passEncoder.setVertexBuffer(0, this.positionBuffer)
    passEncoder.setVertexBuffer(1, this.colorsBuffer)
    passEncoder.setVertexBuffer(2, this.texCoordsBuffer)
    passEncoder.setBindGroup(0, this.textureBindGroup)

    passEncoder.drawIndexed(6)

    passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}

export default Renderer