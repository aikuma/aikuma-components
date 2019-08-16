import { Component, Prop, Element, Watch, Method } from '@stencil/core';
//import { format } from '../../utils/utils';
import { Subject } from 'rxjs'
import { h } from '@stencil/core'

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
  aspectratio: number = 75
  readySubject: Subject<any> = new Subject()
  @Prop() imageType: string = 'webp'
  orientlistener: any
  @Watch('imageType')
  validateImageType(newValue: string) {
    if (newValue !== 'webp' && newValue !== 'png' && newValue !=='jpeg') {
      throw new Error("image-type can only be 'webp' (default), 'png' or 'jpeg'.")
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

  @Method()
  ready(): Promise<any> {
    return new Promise((resolve) => {
      this.readySubject.subscribe(null, null, () => {
        resolve()
      })
    })
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
  async pause() {
    this.ctx.drawImage(this.videoElement, 0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight)
    this.paused = true
  }

  @Method()
  async resume() {
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
          this.aspectratio = this.videoElement.videoHeight / this.videoElement.videoWidth
          console.log('videodim', this.videoElement.videoWidth, this.videoElement.videoHeight)
          this.canvasElement.setAttribute('width', this.stream.getVideoTracks()[0].getSettings().width.toString()) 
          this.canvasElement.setAttribute('height', this.stream.getVideoTracks()[0].getSettings().height.toString()) 
          this.resizeVisibles()
          this.streaming = true
          this.readySubject.complete()
        }
      },
      {once: true}
    )
    this.videoElement.play()
  }

  resizeVisibles() {
    this.videoElement.style.width = this.divElement.offsetWidth.toString() + 'px'
    this.canvasElement.style.width = this.divElement.offsetWidth.toString() + 'px'
    this.videoElement.style.height = (this.divElement.offsetWidth * this.aspectratio).toString() + 'px'
    this.canvasElement.style.height = (this.divElement.offsetWidth * this.aspectratio).toString() + 'px'
  }

  async stopVideo() {
    this.stream.getTracks().forEach(track => {
      track.stop();
    });
    this.streaming = false
  }

    // Lifecycle 

  async componentDidLoad() {
    this.divElement = this.element.shadowRoot.querySelector('#camera');
    //this.divElement.style.width = this.width+'px'
    //this.divElement.style.height = this.height+'px'
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
    const orientlistener = () => {
      this.orientationChange()
    }
    this.orientlistener = orientlistener
    window.addEventListener("resize", this.orientlistener)
  }

  orientationChange() {
    this.resizeVisibles()
  }

  componentDidUnload() {
    if (this.streaming) {
      this.stopVideo()
    }
    window.removeEventListener("orientationchange", this.orientlistener)
  }

  render() {
    return <div id="camera" style={{paddingTop: this.aspectratio.toString()+'%'}}>
      <video id="video"></video>
      <canvas id="canvas"></canvas>
    </div>
  }
}
