import { Component, State, Method, Element } from '@stencil/core'
import { IGVData, IGVOptions, IGVSegment } from '../image-gesture-voice/image-gesture-voice'
import { Subject } from 'rxjs/Subject'
import { Slide } from '../slide-show/slide-show'
import { Gestate } from '@aikuma/gestate'
import { Microphone, WebAudioPlayer } from '@aikuma/webaudio'

interface State {
  recording?: boolean,
  playing?: boolean,
  mode?: string,
  elapsed?: string,
  enableRecord?: boolean,
  havePlayed?: boolean,
  restored?: boolean,
  madeChanges?: boolean,
  showControls?: boolean,
  debug?: boolean
}

export interface IGVTranslation {
  segments: IGVSegment[]
  audio: Blob
  length: {ms: number, frames: number}
}

@Component({
  tag: 'aikuma-translate-igv',
  styleUrl: 'translate-igv.css',
  shadow: true
})
export class TranslateIGV {
  @Element() el: HTMLElement
  ssc: HTMLAikumaSlideShowElement
  gestate: Gestate
  modal: HTMLAikumaModalElement
  mic: Microphone = new Microphone()
  slides: Slide[] = []
  timeLine: IGVSegment[] = []
  options: IGVOptions = {
    debug: false
  }
  completeSubject: Subject<IGVTranslation> = new Subject()
  player: WebAudioPlayer = new WebAudioPlayer()
  @State() state: State = {
    recording: false,
    playing: false,
    mode: 'record',
    elapsed: '0.0',
    enableRecord: false, // show record buttons
    havePlayed: false,  // have ever played
    restored: false,    // restored complete slides (with recording)
    madeChanges: false,  // if we have made any changes
    showControls: true,
    debug: false
  }
  consoleLog(...args) {
    if (this.options.debug) {
      console.log('TIGV:', ...args)
    }
  }
  //
  // Lifecycle
  //

  componentDidLoad() {
    this.ssc = this.el.shadowRoot.querySelector('aikuma-slide-show')
    this.modal = this.el.shadowRoot.querySelector('aikuma-modal')
  }

  //
  // Public Methods
  //
  @Method()
  async loadIGVData(data: IGVData, opts?: IGVOptions): Promise<any> {
    this.timeLine = data.segments
    await this.player.loadFromBlob(data.audio)
    this.slides = data.segments.map(seg => seg.prompt.image)
    this.consoleLog('calling this.ssc.loadSlides with', this.slides)
    await this.ssc.loadSlides(this.slides)
  }
  @Method()
  waitForComplete(): Promise<IGVData> {
    return new Promise((resolve) => {
      let retDat: IGVTranslation
      this.completeSubject.subscribe((d) => {
        retDat = d
      }, 
      null, 
      () => {
        resolve(retDat)
      })
    })
  }


  render() {
    return (
<div class="tigv">
  <aikuma-modal></aikuma-modal>
  <div class="slidewrapper">
    <aikuma-slide-show></aikuma-slide-show>
  </div>
  <div class="controls">
  </div>
</div>
    )
  }
}
