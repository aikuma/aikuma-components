import { Component, State, Method, Listen, Element } from '@stencil/core'
import { IGVData, IGVOptions, IGVSegment } from '../image-gesture-voice/image-gesture-voice'
import { Subject } from 'rxjs/Subject'
import { Slide } from '../slide-show/slide-show'
import { Gestate } from '@aikuma/gestate'
import { Microphone, WebAudioPlayer } from '@aikuma/webaudio'
import fontawesome from '@fortawesome/fontawesome'
import { faPlay, faStop, faPause, faCheckCircle, faTimesCircle } from '@fortawesome/fontawesome-free-solid'
fontawesome.library.add(faPlay, faStop, faPause, faCheckCircle, faTimesCircle)

interface State {
  recording?: boolean,
  playing?: boolean,
  elapsed?: string,
  startplayms?: number,
  enableRecord?: boolean,
  havePlayed?: boolean,
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
  styleUrl: 'translate-igv.scss',
  shadow: true
})
export class TranslateIGV {
  @Element() el: HTMLElement
  ssc: HTMLAikumaSlideShowElement
  gestate: Gestate
  modal: HTMLAikumaModalElement
  progress: HTMLAikumaProgressElement
  mic: Microphone = new Microphone()
  slides: Slide[] = []
  options: IGVOptions = {
    debug: false
  }
  completeSubject: Subject<IGVTranslation> = new Subject()
  player: WebAudioPlayer = new WebAudioPlayer()
  igvdata: IGVData
  @State() state: State = {
    recording: false,
    playing: false,
    elapsed: '0.0',
    startplayms: 0,
    enableRecord: false, // show record buttons
    havePlayed: false,  // have ever played
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
    this.progress = this.el.shadowRoot.querySelector('aikuma-progress')
  }

  //
  // Public Methods
  //
  @Method()
  async loadIGVData(data: IGVData, opts?: IGVOptions): Promise<any> {
    this.igvdata = data
    await this.player.loadFromBlob(data.audio)
    this.slides = data.segments.map(seg => seg.prompt.image)
    this.consoleLog('calling this.ssc.loadSlides with', this.slides)
    await this.ssc.loadSlides(this.slides)
    this.player.observeProgress().subscribe((time) => {
      if (this.state.playing) {
        if (time === -1 ) {
          this.gestate.stopPlay()
          this.changeState({playing: false, showControls: true})
        } else {
          let elapsedms = ~~(time*1000)
          let newElapsed = this.getNiceTime(elapsedms) // getNiceTime wants ms
          this.changeState({elapsed: newElapsed})
          this.progress.setProgress(elapsedms / this.igvdata.length.ms) // bar needs val from 0 to 1
          if (!this.ssc.isChanging()) {
            //checkPlaybackSlide(elapsedms)
          }
        }
      }
    })
    this.gestate = new Gestate({debug: this.options.debug})
    this.progress.setProgress(0)
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
    //
  // Util
  //
  getNiceTime(milliseconds: number): string {
    let d = new Date(null)
    d.setMilliseconds(milliseconds)
    let m = d.getUTCMinutes().toLocaleString('en', {minimumIntegerDigits:2,minimumFractionDigits:0,useGrouping:false})
    let s = d.getUTCSeconds().toLocaleString('en', {minimumIntegerDigits:2,minimumFractionDigits:0,useGrouping:false})
    let ms = (d.getUTCMilliseconds() / 1000).toFixed(1).slice(1)
    return m + ':' + s + ms
  }
  changeState(newStates: State) {
    let s = Object.assign({}, this.state)
    Object.assign(s, newStates)
    this.state = s
  }
  //
  // Logic 
  //
  pressPlay() {

  }
  pressRecord() {

  }

  //
  // Template Logic
  //
  canPlay() {
    return true
  }
  canRecord() {
    return true
  }
  @Listen('clickEvent')
  clickEventHandler(event: CustomEvent) {
    let id = event.detail.id
    let type = event.detail.type
    this.consoleLog('event', event)
    if (id === 'play' && type === 'down') {
      this.consoleLog('play down')
      this.changeState({havePlayed: true, playing: true, showControls: false})
      this.player.play(this.state.startplayms)
    } else if (id === 'play' && type === 'up') {
      this.consoleLog('play up')
      this.changeState({playing: false, showControls: true})
      this.player.pause()
    }
  }

  render() {
    return (
<div class="tigv">
  <aikuma-modal></aikuma-modal>
  <div class="slidewrapper">
    <aikuma-slide-show></aikuma-slide-show>
  </div>
  <aikuma-progress></aikuma-progress>
  <div class="controls">
  <aikuma-buttony 
      disabled={!this.canPlay()} 
      id="play" size="85" color="green">
    <div class="playbutton">
      <div class="buttonicon"
        innerHTML={fontawesome.icon(this.state.playing ? faPause : faPlay).html[0]}>
      </div>
      <div class="elapsed">{this.state.elapsed}</div>
    </div>
  </aikuma-buttony> 
  </div>
</div>
    )
  }
}
