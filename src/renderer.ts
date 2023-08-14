import { BufferUtil } from "./buffer-util"
import { Camera } from "./camera"
import { Content } from "./content"
import { QuadGeometry } from "./geometry"

class Renderer {
  private context!: GPUCanvasContext
  private device!: GPUDevice
  private pipeline!: GPURenderPipeline

  private verticesBuffer!: GPUBuffer
  private indexBuffer!: GPUBuffer
  private projectionViewMatrixBuffer!: GPUBuffer

  private projectViewBindGroup!: GPUBindGroup
  private textureBindGroup!: GPUBindGroup

  private camera!: Camera

  public async init(shaderModule: string) {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement

    this.camera = new Camera(canvas.width, canvas.height)

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

    await Content.init(this.device)

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    })

    const geometry = new QuadGeometry()

    this.projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.device, new Float32Array(16))
    this.verticesBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array(geometry.vertices))
    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, new Uint16Array(geometry.indices))

    this.prepareModel(shaderModule)
  }

  private prepareModel(shaderSource: string) {
    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    })

    const bufferLayout: GPUVertexBufferLayout = {
      arrayStride: 7 * Float32Array.BYTES_PER_ELEMENT,
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2' // 2 floats
        },
        {
          shaderLocation: 1,
          offset: 2 * Float32Array.BYTES_PER_ELEMENT,
          format: 'float32x2'
        },
        {
          shaderLocation: 2,
          offset: 4 * Float32Array.BYTES_PER_ELEMENT,
          format: 'float32x3'
        }
      ],
      stepMode: 'vertex'
    }

    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: 'vertexMain',
      buffers: [
        bufferLayout,
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

    const projectionViewBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform'
          }
        }
      ]
    })

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
        projectionViewBindGroupLayout,
        textureBindGroupLayout
      ]
    })

    this.textureBindGroup = this.device.createBindGroup({
      layout: textureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: Content.playerTexture.sampler
        },
        {
          binding: 1,
          resource: Content.playerTexture.texture.createView()
        }
      ]
    })

    this.projectViewBindGroup = this.device.createBindGroup({
      layout: projectionViewBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.projectionViewMatrixBuffer
          }
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

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    // actual drawing here

    this.device.queue.writeBuffer(
      this.projectionViewMatrixBuffer,
      0,
      this.camera.projectionViewMatrix as Float32Array);

    passEncoder.setPipeline(this.pipeline)

    passEncoder.setIndexBuffer(this.indexBuffer, "uint16")
    passEncoder.setVertexBuffer(0, this.verticesBuffer)
    passEncoder.setBindGroup(0, this.projectViewBindGroup)
    passEncoder.setBindGroup(1, this.textureBindGroup)

    passEncoder.drawIndexed(6)

    passEncoder.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}

export default Renderer