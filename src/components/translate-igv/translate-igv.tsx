import { Component, State, Method, Listen, Element } from '@stencil/core'
import { IGVData, IGVOptions, IGVTranslation, Slide } from '../../interface'
import { Subject } from 'rxjs/Subject'
import { Gestate } from '@aikuma/gestate'
import { Microphone, WebAudioPlayer } from '@aikuma/webaudio'
import fontawesome from '@fortawesome/fontawesome'
import { faPlay, faStop, faPause, faCheckCircle, faTimesCircle } from '@fortawesome/fontawesome-free-solid'
fontawesome.library.add(faPlay, faStop, faPause, faCheckCircle, faTimesCircle)

interface State {
  recording?: boolean,
  playing?: boolean,
  elapsed?: string,
  enableRecord?: boolean,
  enablePlay?: boolean,
  havePlayed?: boolean,
  showControls?: boolean,
  debug?: boolean
  reviewMode?: boolean,
  lastAction?: string, 
  playEnded?: boolean
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
  slides: Slide[] = []
  options: IGVOptions = {
    debug: false
  }
  completeSubject: Subject<IGVTranslation> = new Subject()
  // one Audio Context to rule them all: Because Chrome is now blocking playback unless you resume() a ctx in a gesture cb
  audioCtx: AudioContext = new AudioContext()
  mic: Microphone = new Microphone({audioContext: this.audioCtx})
  player: WebAudioPlayer = new WebAudioPlayer({audioContext: this.audioCtx}) 
  audioResumed: boolean = false // on first gesture, call audioCtx.resume() and then set this true
  igvdata: IGVData
  currentIndex: number = 0
  translateSegments: {startMs: number, endMS?: number}[] = []
  // respeak logic
  playRegion: {start: number, end: number} = {start: 0, end: 0} // these are in seconds
  playedRegions: {start: number, end: number}[] = [] // for progress bar
  recordRegion: {start: number, end: number} = {start: 0, end: 0}
  @State() state: State = {
    recording: false,
    playing: false,
    elapsed: '0.0',
    enableRecord: false, // show record buttons
    enablePlay: false,
    havePlayed: false,  // have ever played
    showControls: true,
    debug: false,
    reviewMode: false,
    lastAction: 'start',
    playEnded: false
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

  componentDidUnload() {
    this.gestate.destroy()
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
    this.gestate = new Gestate({debug: this.options.debug})
    this.progress.setProgress(0)
    try {
      await this.mic.connect()
    } catch(e) {
      // if we catch an error from a dependency, we should re-throw it to say what caused the error, and what that message was
      throw new Error('Microphone.connect() failed with ' + e.message) 
    }
    this.registerPlaybackObserver()
    this.changeState({enablePlay: true})
  }

  registerPlaybackObserver() {
    const checkSlide = (t: number) => {
      let timeMs = ~~(t * 1000)
      let thisslide = 0
      // Use the estimated respeak timeline if we are in review mode
      let segments = this.state.reviewMode ? 
        this.translateSegments :
        this.igvdata.segments
      for (let i = segments.length - 1; i > 0; --i ) {
        if (timeMs >segments[i].startMs) {
          thisslide = i
          break
        }
      }
      if (thisslide !== this.currentIndex) {
        this.ssc.slideTo(thisslide)
      }
    }
    this.player.observeProgress().subscribe((time) => {
      if (this.state.playing) {
        if (time === -1 ) {
          this.gestate.stopPlay()
          this.changeState({playing: false, showControls: true})
          this.progress.setProgress(1) // set progress bar full when audio has ended
        } else {
          let elapsedms = ~~(time*1000)
          let newElapsed = this.getNiceTime(elapsedms) // getNiceTime wants ms
          this.changeState({elapsed: newElapsed})
          this.progress.setProgress(elapsedms / this.igvdata.length.ms) // bar needs val from 0 to 1
          if (!this.ssc.isChanging) {
            checkSlide(time)
          }
          if (!this.state.reviewMode) {
            this.playRegion.end = time // update play region end
          }
        }
      }
    })
  }

  @Method()
  waitForComplete(): Promise<IGVTranslation> {
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
  // async registerRegion() {
  //   let rstats: {frames: number, offset: number, ms: number}
  //   if (this.mic.isRecording()) {
  //     rstats = await this.mic.stop()
  //     this.consoleLog('recorded', rstats.frames, 'frames')
  //   }
  //   this.playedRegions.push({
  //     start: (this.playRegion.start / (this.igvdata.length.ms / 1000)),
  //     end: (this.playRegion.end / (this.igvdata.length.ms / 1000))
  //   })
  //   this.respeakTimeline.push({
  //     source: {
  //       start: ~~(this.playRegion.start * 1000),
  //       end: ~~(this.playRegion.end * 1000)
  //     },
  //     secondary: {
  //       start: this.recordRegion.start,
  //       end: this.recordRegion.end
  //     }
  //   })
  //   console.log('playedregions',this.playedRegions)
  //   console.log('rtimeline', this.respeakTimeline)
  // }

  //
  // Template Logic
  //
  canPlay() {
    return this.state.enablePlay
  }
  canRecord() {
    return this.state.enableRecord && this.mic.canRecord()
  }
  @Listen('clickEvent')
  async clickEventHandler(event: CustomEvent) {
    if (!this.audioResumed) {
      this.audioCtx.resume() // unlocks audio playback in Chrome
      this.audioResumed = true
    }
    let id = event.detail.id
    let type = event.detail.type
    this.consoleLog('event', event)
    if (id === 'play' && type === 'down') {
      this.consoleLog('play down')
      this.changeState({havePlayed: true, playing: true, playEnded: false, showControls: false})
      let el = await this.ssc.getCurrentImageElement()
      if (this.state.lastAction === 'record') { 
        //this.registerRegion()
        this.playRegion.start = this.playRegion.end 
        this.player.play()
        this.gestate.playGestures(el, 0)
      } else {
        this.player.play(this.playRegion.start)
        this.gestate.playGestures(el, this.playRegion.start)
      }
    } else if (id === 'play' && type === 'up') {
      this.consoleLog('play up')
      if (this.state.playing) {
        this.player.pause()
        this.gestate.stopPlay()
        this.changeState({playing: false})
      }
      if ((!this.state.playEnded) && ((this.playRegion.end - this.playRegion.start) < 1)) {
        //this._showTooShortToast()
        this.consoleLog('too short!')
      } else {
        this.changeState({enableRecord: true, lastAction: 'play'})
      }
    } else if (id === 'record' && type === 'down') {
      this.recordRegion.start = this.recordRegion.end 
      this.mic.record()
      this.consoleLog('record down')
      this.changeState({recording: true, showControls: false})
    } else if (id === 'record' && type === 'up') {
      this.consoleLog('record up')
      this.changeState({recording: false})
      await this.mic.pause()
      this.changeState({showControls: true, enablePlay: true})
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
      {/* <div class="elapsed">{this.state.elapsed}</div> */}
    </div>
  </aikuma-buttony> 
  <aikuma-buttony 
      disabled={!this.canRecord()} 
      id="record" size="85" color="red">
    <div class="recordbutton">
      <div class="buttonicon"
        innerHTML={fontawesome.icon(this.state.recording ? faPause : faStop).html[0]}>
      </div>
      {/* <div class="elapsed">{this.state.elapsed}</div> */}
    </div>
  </aikuma-buttony> 
  </div>
</div>
    )
  }
}

