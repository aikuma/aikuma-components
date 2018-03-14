import { Component, Element, Event, Method, EventEmitter } from '@stencil/core'
import { default as WaveSurfer } from 'wavesurfer.js'
export interface AnnotateElement extends HTMLElement, Annotate {}

@Component({
  tag: 'aikuma-annotate',
  styleUrl: 'annotate.scss',
  shadow: true
})
export class Annotate {
  @Element() el: HTMLElement
  @Event() clickEvent: EventEmitter<{id: string, type: string}>

  // watchHandler(size: {content: DOMRect, frame: DOMRect}) {
   
  // }

  // 
  //  Class Variables
  //
  waveContainer: HTMLElement
  wavesurfer: any
  // 
  // Lifecycle
  //
  componentDidLoad() {
    this.waveContainer = this.el.shadowRoot.querySelector("#wavesurfer") 
    this.wavesurfer = WaveSurfer.create({
      container: this.waveContainer,
      height: 150
    })
  }

  // Logic
  //
  
  // Public
  @Method()
  load(url: string) {
    this.wavesurfer.load(url)
  }
  @Method()
  loadBlob(b: Blob) {
    this.wavesurfer.loadBlob(b)
  }

  render() {
    return (
<div id="root">
  <div id="wavesurfer"></div>
</div>   
    )
  }
}
