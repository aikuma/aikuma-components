import { Component, Element, Event, Method, EventEmitter } from '@stencil/core'
//import { default as WaveSurfer, TimeLinePlugin } from 'wavesurfer.js'
import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js'
import MinimapPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js'

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
  timelineContainer: HTMLElement
  wavesurfer: any
  // 
  // Lifecycle
  //
  componentDidLoad() {
    this.waveContainer = this.el.shadowRoot.querySelector("#wavesurfer") 
    this.timelineContainer = this.el.shadowRoot.querySelector("#timeline") 
    this.wavesurfer = WaveSurfer.create({
      container: this.waveContainer,
      height: 150,
      plugins: [
        TimelinePlugin.create({
            container: this.timelineContainer
        }),
        MinimapPlugin.create(),
        RegionsPlugin.create()
      ]
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
  <div id="timeline"></div>
  <div id="wavesurfer"></div>
</div>   
    )
  }
}
