import { Component, Element, State, Method, Listen, Event, EventEmitter } from '@stencil/core'
import { Slide } from '../slide-show/slide-show'
//import { Gesture, Gestate } from './gestate'
import { Gesture, Gestate } from '@aikuma/gestate'
import { Microphone, WebAudioPlayer } from '@aikuma/webaudio'
import prettyprint from 'prettyprint'
import fontawesome from '@fortawesome/fontawesome'
import { faPlay, faStop, faPause, faCheckCircle, faTimesCircle } from '@fortawesome/fontawesome-free-solid'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
fontawesome.library.add(faPlay, faStop, faPause, faCheckCircle, faTimesCircle)

export interface IGVPrompt {
  id: string,
  type: string,
  image?: Slide
}

export interface IGVSegment {
  prompt: IGVPrompt
  startMs: number,
  endMs?: number
  gestures?: Gesture[]
}

export interface IGVData {
  segments: IGVSegment[]
  audio: Blob
  length: {ms: number, frames: number}
}

export interface IGVOptions {
  debug: boolean
}

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

@Component({
  tag: 'aikuma-image-gesture-voice',
  //styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'image-gesture-voice.scss'],
  styleUrls: ['image-gesture-voice.scss'],
  shadow: true
})
export class ImageGestureVoice {
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
  currentIndex: number = 0
  player: WebAudioPlayer = new WebAudioPlayer()
  recObs: Observable<number>
  playProgressObs: Observable<number>
  completeSubject: Subject<any> = new Subject()
  recording: {
    recordLength: {ms: number, frames: number},
    audioBlob: Blob
  } = { recordLength: {ms: 0, frames: 0}, audioBlob: null}
  
  @Event() aikumaIGV: EventEmitter<string>
  @Listen('slideEvent')
  slideEvenHandler(event: CustomEvent) {
    let t = event.detail.type
    let v = event.detail.val
    this.consoleLog('slide-show emited slideEvent', t)
    if (t === 'init') {
      this.consoleLog('igv got slide init')
    } else if (t === 'changestart') {
      this.consoleLog('slide change begin', v)
      if (this.state.recording) {
        this.consoleLog('stopping gesture recording')
        this.gestate.stopRecord()
      }
      if (this.state.playing) {
        this.consoleLog('stopping gesture playing')
        this.gestate.stopPlay()
      }
    } else if (t === 'changeend') {
      this.consoleLog('slide change end', v)
      this.slideChangeEvent(v)
    } 
  }
  @Listen('clickEvent')
  clickEventHandler(event: CustomEvent) {
    let id = event.detail.id
    let type = event.detail.type
    if (type === 'up') {
      // regular clicks
      if (id === 'record') {
        this.pressRec()
      } else if (id === 'cancel') {
        this.pressClear()
      } else if (id === 'accept') {
        this.pressAccept()
      } else if (id === 'play') {
        this.pressPlay()
      }
    }
  }
  consoleLog(...args) {
    if (this.options.debug) {
      console.log('IGV:', ...args)
    }
  }
  // Lifecycle
  //
  // componentWillLoad() {
  //   this.consoleLog('IGV componentWillLoad()')
  // }

  componentDidLoad() {
    this.ssc = this.el.shadowRoot.querySelector('aikuma-slide-show')
    this.modal = this.el.shadowRoot.querySelector('aikuma-modal')
    this.aikumaIGV.emit('init')
  }
  // componentDidUnload() {
  //   this.consoleLog('The view has been removed from the DOM');
  // }

  async init(): Promise<any> {
    this.gestate = new Gestate({debug: this.options.debug})
    try {
      await this.mic.connect()
    } catch(e) {
      // if we catch an error from a dependency, we should re-throw it to say what caused the error, and what that message was
      throw new Error('Microphone.connect() failed with ' + e.message) 
    }
    this.recObs = this.mic.observeProgress().subscribe((t) => {
      this.changeState({elapsed: this.getNiceTime(t)})
    })
    this.changeState({'enableRecord': true})
    const checkPlaybackSlide = (timems: number): void => {
      let thisslide = 0
      for (let i = this.timeLine.length - 1; i > 0; --i ) {
        if (timems > this.timeLine[i].startMs) {
          thisslide = i
          break
        }
      }
      if (thisslide !== this.currentIndex) {
        this.ssc.slideTo(thisslide)
      }
    }
    this.player.observeProgress().subscribe((time) => {
      //this.consoleLog(time)
      if (this.state.playing) {
        if (time === -1 ) {
          this.gestate.stopPlay()
          this.changeState({playing: false, showControls: true})
        } else {
          let elapsedms = ~~(time*1000)
          let newElapsed = this.getNiceTime(elapsedms) // getNiceTime wants ms
          this.changeState({elapsed: newElapsed})
          if (!this.ssc.isChanging()) {
            checkPlaybackSlide(elapsedms)
          }
        }
      }
    })
  }
  //
  // Public Methods
  //
  @Method()
  async loadFromImageURLs(images: string[], opts?: IGVOptions): Promise<any> {
    if (opts) {
      Object.assign(this.options, opts)
      this.changeState({debug: this.options.debug})
    }
    this.slides = await this.ssc.loadImages(images)
    this.consoleLog('aikuma-slide-show loaded slides', this.slides)
    await this.init()
  }
  @Method()
  restoreFromIGVData(igvd: IGVData) {
    
  }
  @Method()
  waitForComplete(): Promise<IGVData> {
    return new Promise((resolve) => {
      let retDat: IGVData
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
  // Logic 
  //
  slideChangeEvent(slide: number) {
    let priorIndex = this.currentIndex
    this.currentIndex = slide   
    let isNextSlide = priorIndex === 0 || this.currentIndex === priorIndex + 1 // stops the player pause / start occuring after player starts from 0
    this.consoleLog('slideChangeEvent()', slide, isNextSlide)
    if (this.state.mode === 'record') {
      if (this.state.recording) {
        this.timeLine[priorIndex].gestures = this.gestate.getGestures() // save to old slide
        this.registerSlideChange(this.mic.getElapsed(), this.currentIndex)
        let el = this.ssc.getCurrentImageElement()
        this.consoleLog('recording gestures')
        this.gestate.clearAll()
        this.gestate.record(el, 'attention', 0)
      }
    } else if (this.state.mode === 'review') { 
      let t = this.timeLine[slide].startMs
      if (this.state.playing) {
        if (!isNextSlide) {
          this.player.pause()
        }
        this.consoleLog('loading gestures', this.timeLine[slide].gestures)
        this.gestate.loadGestures(this.timeLine[slide].gestures)
        if (!isNextSlide) {
          this.consoleLog('playing from', t/1000)
          this.player.play(t/1000)
        }
        let el = this.ssc.getCurrentImageElement()
        this.consoleLog('playing gestures')
        this.gestate.playGestures(el, 0)
      } else {
        this.changeState({elapsed: this.getNiceTime(t)})
      }
    }
  }

  registerSlideChange (time: number, imageIndex: number) {
    let p: IGVPrompt = {
      id: imageIndex.toString(),
      type: 'image',
      image: this.slides[imageIndex]
    }
    this.timeLine.push({
      startMs: time,
      prompt: p
    })
    this.consoleLog('registerSlideChange, timeLine is', this.timeLine, imageIndex)
    this.ssc.highlightSlide(imageIndex)
  }
  async stopRecording() {
    this.changeState({enableRecord: false, recording: false})
    await this.mic.stop()
    this.changeState({enableRecord: true, showControls: true})
    this.gestate.stopRecord()
    this.consoleLog('gestures', this.gestate.getGestures())
    this.ssc.unlockPrevious()
  }
  stopPlaying() {
    this.player.pause()
    this.gestate.stopPlay()
    this.changeState({playing: false, showControls: true})
  }

  async enterReviewMode() {
    this.changeState({mode: 'review', showControls: false})
    await this.player.loadFromBlob(this.recording.audioBlob)
    this.changeState({elapsed: this.getNiceTime(0), showControls: true})
    this.ssc.slideTo(0, false)
    this.currentIndex = 0 // so play action will start from 0
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
  //
  // Template Logic
  //

  canPlay(): boolean {
    return this.timeLine.length > 0
  }
  canRecord(): boolean {
    return true
  }
  canCancel(): boolean {
    return this.state.mode === 'record' ? this.timeLine.length > 0 : true
  }
  canAccept(): boolean {
    if (this.state.mode === 'record') {
      return (this.timeLine.length === this.slides.length) 
    } else {
      return true
    }
  }
  // button presses
  pressRec(): void {
    if (this.state.mode === 'record') {
      if (this.state.recording) {
        this.stopRecording()
      } else {
        // we were not recording
        if (this.timeLine.length) {
          // If we are somewhere other than the last slide, go back to the last slide
          this.currentIndex = this.timeLine.length - 1
          this.ssc.slideTo(this.currentIndex, true)
        } else {
          // otherwise record first slide at 0
          this.ssc.slideTo(0)
          this.registerSlideChange(this.mic.getElapsed(), 0)
        }      
        // Animate buttons out, begin microphone recording, start gesture recording
        this.mic.record()
        this.state.recording = true
        this.changeState({recording: true, showControls: false})
        this.ssc.lockPrevious()
        let el = this.ssc.getCurrentImageElement()
        this.gestate.record(el, 'attention', this.mic.getElapsed())
      }
    } 
  }
  pressPlay(): void {
    if (this.state.mode === 'review') {
      if (this.state.playing) {
        this.stopPlaying()
      } else {
        // We were not playing
        this.changeState({havePlayed: true, playing: true, showControls: false})
        if (this.player.ended) {
          // Playback had finished (end of slides)
          this.ssc.slideTo(0, true)
          this.gestate.loadGestures(this.timeLine[0].gestures)
          let el = this.ssc.getCurrentImageElement()
          this.gestate.playGestures(el, 0)
          this.player.play(0)
        } else {
          // Otherwise resume by restarting from this slide
          let time = this.timeLine[this.currentIndex].startMs // milliseconds
          this.gestate.loadGestures(this.timeLine[this.currentIndex].gestures)
          let el = this.ssc.getCurrentImageElement()
          this.gestate.playGestures(el, 0)
          this.player.play(time/1000)
        }
      }
    }
  }

  async pressClear(): Promise<any> {
    const reset = () => {
      this.consoleLog('reset')
      this.ssc.slideTo(0)
      this.ssc.highlightSlide(-1)
      this.mic.clear()
      this.changeState({elapsed: '', enableRecord: true})
      this.timeLine = []
      this.gestate.clearAll()
      if (this.state.restored)  {
        this.changeState({madeChanges: true})
      }
    }
    if (this.state.restored) {
      if (!(await this.modal.presentDialog('Clear recording?', 'Do you want clear the current recording?', 'Clear', 'Cancel'))) {
        return
      }
    }
    if (this.state.mode === 'review') {
      this.changeState({mode: 'record', havePlayed: false})
    }
    reset()
  }

  async pressAccept(): Promise<any> {
    if (this.state.mode === 'record') {
      this.timeLine[this.currentIndex].gestures = this.gestate.getGestures()
      this.recording.recordLength = this.mic.getTotalLength()
      this.recording.audioBlob = this.mic.exportAllWav()
      this.mic.clear()
      await this.enterReviewMode()
      this.pressPlay()
    } else if (this.state.mode === 'review') {
      if (this.state.restored && !this.state.madeChanges) {
        // just exit
        this.completeSubject.complete()
      } else {
        let igvData: IGVData = {
          segments: this.timeLine,
          audio: this.recording.audioBlob,
          length: this.recording.recordLength
        }
        this.completeSubject.next(igvData)
        this.completeSubject.complete()
      }
    }
  }

  //
  // Render
  //
  render() {
    const getBigButton = () => {
      if (this.state.mode === 'record') {
        return <aikuma-buttony 
            disabled={!this.canRecord()} 
            id="record" size="85">
          <div class="recbutton">
            <div class="buttonicon"
              innerHTML={fontawesome.icon(this.state.recording ? faPause: faStop).html[0]}>
            </div>
            <div class="elapsed">{this.state.elapsed}</div>
          </div>
        </aikuma-buttony> 
      } else if (this.state.mode === 'review') {
        return <aikuma-buttony 
            disabled={!this.canPlay()} 
            id="play" size="85" color="green">
          <div class="recbutton">
            <div class="buttonicon"
              innerHTML={fontawesome.icon(this.state.playing ? faPause: faPlay).html[0]}>
            </div>
            <div class="elapsed">{this.state.elapsed}</div>
          </div>
        </aikuma-buttony> 
      }
    }
    return (
<div class="igv">
  <aikuma-modal></aikuma-modal>
  <div class="slidewrapper">
    <aikuma-slide-show></aikuma-slide-show>
  </div>
  <div class="controls">
    {
      getBigButton()
    }
    {
      this.state.showControls ? 
        <div class="ctrlwrapper">
          <aikuma-buttony clear size="50" id="cancel" color="grey" disabled={!this.canCancel()} >
            <div class="clearbuttonicon" 
              innerHTML={fontawesome.icon(faTimesCircle).html[0]}>
            </div>
          </aikuma-buttony>
          <div class="spacer"></div>
          <aikuma-buttony clear size="50" id="accept" color="grey" disabled={!this.canAccept()}>
            <div class="clearbuttonicon" 
              innerHTML={fontawesome.icon(faCheckCircle).html[0]}>
            </div>
          </aikuma-buttony>
        </div> :
        null
    }
  </div>
  {
    this.options.debug ? 
      <pre>{prettyprint(this.state)}<br/>
      {prettyprint([this.timeLine.length, this.slides.length])}
      </pre> :
      null
  }
</div>
    )
  }
}
