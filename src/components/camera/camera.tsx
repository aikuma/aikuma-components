import { Component, Prop, Element, Watch, Method } from '@stencil/core';
//import { format } from '../../utils/utils';

@Component({
  tag: 'aikuma-camera',
  styleUrl: 'camera.css',
  shadow: true
})
export class Camera {
  divElement: HTMLVideoElement
  videoElement: HTMLVideoElement
  canvasElement: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  stream: MediaStream
  paused: boolean = false
  streaming: boolean = false
  manualCamera: boolean = false 
  devices: string[] = []
  selectedDevice: number = 0

  @Prop() imageType: string = 'webp'
  @Watch('imageType')
  validateImageType(newValue: string) {
    if (newValue !== 'webp' && newValue !== 'png' && newValue !=='jpg') {
      throw new Error("image-type can only be 'webp' (default), 'png' or 'jpg'.")
    }
  }
  @Prop() imageQuality: number = 0.7
  @Watch('imageQuality')
  validateImageQuality(newValue: number) {
    if (typeof newValue !== 'number') {
      throw new Error('image-quality must be a number.')
    } else if (newValue < 0 || newValue > 1) {
      throw new Error('image-quality must be between 0 and 1.')
    }
  }

  @Element() private element: HTMLElement;

  @Prop() width: number = 640;
  @Prop() height: number = 480;
  @Prop() facingMode: string = 'user'
  validateFacingMode(newValue: string) {
    if (newValue !== 'user' && newValue !== 'environment') {
      throw new Error("facing-mode can only be 'user' (default) or 'environment'.")
    }
  }
  
  @Method()
  async takePicture(pause: boolean = true): Promise<Blob> {
    const canvasSave = (canvas: HTMLCanvasElement, imagetype: string, imagequal: number): Promise<Blob> => {
      return new Promise((resolve) => {
        canvas.toBlob((b) => {
          resolve(b)
        }, imagetype, imagequal)
      })
    }
    this.pause()
    let imageblob = await canvasSave(this.canvasElement,'image/'+this.imageType,this.imageQuality)
    if (!pause) {
      this.resume()
    }
    return imageblob
  }

  @Method()
  pause() {
    this.ctx.drawImage(this.videoElement, 0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight)
    this.paused = true
  }

  @Method()
  resume() {
    this.ctx.clearRect(0,0,this.videoElement.videoWidth,this.videoElement.videoHeight)
    this.paused = false
  }

  @Method()
  async switchCamera() {
    if (this.devices.length < 2) {
      throw new Error('need more than one camera.')
    }
    await this.stopVideo()
    this.selectedDevice++
    if (this.selectedDevice > (this.devices.length - 1)) {
      this.selectedDevice = 0
    }
    await this.startVideo()
  }

  async startVideo() {
    const videoConstraint = this.manualCamera? {
        width: this.width,
        height: this.height,
        deviceId: this.devices[this.selectedDevice]
      } : {
        width: this.width,
        height: this.height,
        facingMode: this.facingMode
    }
    this.stream = await navigator.mediaDevices.getUserMedia({video: videoConstraint, audio: false })
    console.log(this.stream.getVideoTracks()[0].getCapabilities().deviceId)
    this.videoElement.srcObject = this.stream
    this.videoElement.addEventListener('canplay', () => {
        if (!this.streaming) {
          console.log('videodim', this.videoElement.videoWidth, this.videoElement.videoHeight)
          this.videoElement.style.width = this.width+'px'
          this.videoElement.style.height = this.videoElement.videoHeight+'px'
          this.canvasElement.style.width = this.width+'px'
          this.canvasElement.setAttribute('width', this.width.toString())
          this.canvasElement.style.height = this.videoElement.videoHeight+'px'
          this.canvasElement.setAttribute('height', this.height.toString())
          this.streaming = true
        }
      },
      {once: true}
    )
    this.videoElement.play()
  }

  async stopVideo() {
    this.stream.getTracks().forEach(track => {
      track.stop();
    });
    this.streaming = false
  }

  async componentDidLoad() {
    this.divElement = this.element.shadowRoot.querySelector('#camera');
    this.divElement.style.width = this.width+'px'
    this.divElement.style.height = this.height+'px'
    this.videoElement = this.element.shadowRoot.querySelector('#video');
    this.canvasElement = this.element.shadowRoot.querySelector('#canvas');
    this.ctx = this.canvasElement.getContext('2d')
    const devices = await navigator.mediaDevices.enumerateDevices()
    this.devices = devices.filter(x => x.kind === 'videoinput').map(x => x.deviceId)
    console.log('devices', this.devices)
    if (!this.devices) {
      throw new Error('No video devices.')
    }
    this.startVideo()
  }

  componentDidUnload() {
    if (this.streaming) {
      this.stopVideo()
    }
  }

  render() {
    return <div id="camera">
      <video id="video"></video>
      <canvas id="canvas"></canvas>
    </div>
  }
}
