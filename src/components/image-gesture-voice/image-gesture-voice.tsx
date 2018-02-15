import { Component, Element, State, Method, Listen, Event, EventEmitter } from '@stencil/core'
import { SlideShowElement } from '../slide-show/slide-show'
import { Gesture, Gestate } from './gestate'
import { Microphone, WebAudioPlayer } from 'aikumic'
import prettyprint from 'prettyprint'
import fontawesome from '@fortawesome/fontawesome'
import { faPlay, faStop, faPause, faCheckCircle, faTimesCircle } from '@fortawesome/fontawesome-free-solid'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ModalElement } from '../modal/modal'
fontawesome.library.add(faPlay, faStop, faPause, faCheckCircle, faTimesCircle)

export interface IGVData {
  timeLine: {id: string, url: string, ms: number}[]
  gestures: Gesture[]
  audio: Blob
}

interface State {
  recording?: boolean,
  playing?: boolean,
  mode?: string,
  contentSize?: DOMRect,
  frameSize?: DOMRect,
  elapsed?: string,
  enableRecord?: boolean,
  havePlayed?: boolean,
  restored?: boolean,
  madeChanges?: boolean,
  showControls?: boolean
}

@Component({
  tag: 'aikuma-image-gesture-voice',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'image-gesture-voice.scss'],
  shadow: true
})
export class ImageGestureVoice {
  @Element() el: HTMLElement
  ssc: SlideShowElement
  gestate: Gestate
  modal: ModalElement
  mic: Microphone = new Microphone()
  timeLine: {t: number}[] = []
  @State() state: State = {
    recording: false,
    playing: false,
    mode: 'record',
    contentSize: null,  // Rect of an aspect-adjusted image in the frame
    frameSize: null,    // Rect of a slide frame
    elapsed: '0.0',
    enableRecord: false, // show record buttons
    havePlayed: false,  // have ever played
    restored: false,    // restored complete slides (with recording)
    madeChanges: false,  // if we have made any changes
    showControls: false
  }
  currentIndex: number = 0
  numberOfSlides: number = 0
  player: WebAudioPlayer = new WebAudioPlayer()
  recObs: Observable<number>
  completeSubject: Subject<any> = new Subject()
  recording: {
    recordLength: number,
    audioBlob: Blob
  } = { recordLength: 0, audioBlob: null}
  gestureElement: HTMLElement
  @Event() AikumaIGV: EventEmitter<string>
  @Listen('slideSize')
  slideSizeHandler(event: CustomEvent) {
    console.log('igv got slide size notification', event.detail)
    if (event.detail) {
      this.changeState({contentSize: event.detail.content, frameSize: event.detail.frame})
    }
  }
  @Listen('slideEvent')
  slideEvenHandler(event: CustomEvent) {
    let t = event.detail.type
    let v = event.detail.val
    if (t === 'init') {
      console.log('igv got slide init')
    } else if (t === 'changeslide') {
      console.log('slide change begin',v)
      if (this.state.recording) {
        this.gestate.stopRecord()
      }
    } else if (t === 'newslide') {
      console.log('slide change ending',v)
      //this.changeState({contentSize: v})
      this.gestureElement = v.element
      if (this.state.recording) {
        this.gestate.record(this.gestureElement, 'attention', this.mic.getElapsed())
      }
      this.slideChange(v)
    } 
  }
  @Listen('clickEvent')
  clickEventHandler(event: CustomEvent) {
    console.log('button', event.detail.id, event.detail.type)
    let id = event.detail.id
    let type = event.detail.type
    if (type === 'up') {
      // regular clicks
      if (id === 'record') {
        this.pressPlayRec()
      } else if (id === 'cancel') {
        this.pressClear()
      } else if (id === 'accept') {
        this.pressAccept()
      }
    }
  }
  //faPlusIcon: fontawesome.Icon = fontawesome.icon(faPlus)
  //
  // Lifecycle
  //
  componentWillLoad() {
    console.log('IGV componentWillLoad()')
  }

  componentDidLoad() {
    console.log('IGV componentDidLoad()')
    this.ssc = this.el.shadowRoot.querySelector('aikuma-slide-show')
    this.modal = this.el.shadowRoot.querySelector('aikuma-modal')
    this.gestate = new Gestate({debug: true})
    this.AikumaIGV.emit('init')
  }

  init() {
    this.mic.connect()
    this.recObs = this.mic.observeProgress().subscribe((t) => {
      this.changeState({elapsed: this.getNiceTime(t)})
    })
    this.changeState({'enableRecord': true})
  }
  //
  // Public Methods
  //
  @Method()
  loadFromImageURLs(images: string[]) {
    this.ssc.loadImages(images)
    this.numberOfSlides = images.length
    this.init()
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
  slideChange(slide: number) {
    this.currentIndex = slide // even if we are in transition
    if (this.state.mode === 'record') {
      if (this.state.recording) {
        this.registerSlideChange(this.mic.getElapsed(), this.currentIndex)
      }
      if (this.state.playing) {
        this.player.pause()
        let timeMs = this.timeLine[this.currentIndex].t
        this.player.playMs(timeMs)
        this.gestate.playGestures(timeMs)
      }
    } else if (this.state.mode === 'play') {
      let t = this.timeLine[slide].t
      if (this.state.playing) {
        this.player.pause()
        this.player.play(t/1000)
        this.gestate.playGestures(t)
      } else {
        this.changeState({elapsed: this.getNiceTime(t)})
      }
    }
  }

  registerSlideChange (time: number, imageIndex: number) {
    this.timeLine.push({
      t: time,
    })
    console.log('registerSlideChange, timeLine is', this.timeLine)
  }
  async stopRecording() {
    this.changeState({enableRecord: false, recording: false})
    await this.mic.stop()
    this.changeState({enableRecord: true, showControls: true})
    this.gestate.stopRecord()
    this.ssc.unlockPrevious()
  }
  stopPlaying() {
    this.player.pause()
    this.gestate.stopPlay()
    this.changeState({playing: false, showControls: true})
  }
  slideTo(slide: number): void {
    this.ssc.slideTo(slide)
  }
  async enterReviewMode() {
    this.changeState({mode: 'review', showControls: false})
    await this.player.loadFromBlob(this.recording.audioBlob)
    this.changeState({elapsed: this.getNiceTime(0), showControls: true})
    this.slideTo(0)
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
    return this.mic.hasRecordedData()
  }
  canRecord(): boolean {
    return true
  }
  canCancel(): boolean {
    return this.state.mode === 'record' ? this.timeLine.length > 0 : true
  }
  canAccept(): boolean {
    if (this.state.mode === 'record') {
      return (this.timeLine.length === this.numberOfSlides) 
    } else {
      return true
    }
  }
  // button presses
  pressPlayRec(): void {
    if (this.state.mode === 'record') {
      if (this.state.recording) {
        this.stopRecording()
      } else {
        // we were not recording
        if (this.timeLine.length) {
          // If we are somewhere other than the last slide, go back to the last slide
          this.currentIndex = this.timeLine.length - 1
          this.slideTo(this.currentIndex)
        } else {
          // otherwise record first slide at 0
          this.slideTo(0)
          this.registerSlideChange(this.mic.getElapsed(), 0)
        }      
        // Animate buttons out, begin microphone recording, start gesture recording
        this.mic.record()
        this.state.recording = true
        this.changeState({recording: true, showControls: false})
        this.ssc.lockPrevious()
        this.gestate.record(this.gestureElement, 'attention', this.mic.getElapsed())
      }
    } else if (this.state.mode === 'review') {
      if (this.state.playing) {
        this.stopPlaying()
      } else {
        // We were not playing
        this.changeState({havePlayed: true, playing: true})
        if (this.player.ended) {
          // Playback had finished (end of slides)
          this.slideTo(0)
          this.player.play(0)
          this.gestate.playGestures(0)
        } else {
          // Otherwise resume by restarting from this slide
          let time = this.timeLine[this.ssc.getCurrent()].t // milliseconds
          this.player.play(time/1000)
          this.gestate.playGestures(time)
        }
      }
    }
  }

  async pressClear(): Promise<any> {
    const reset = () => {
      console.log('reset')
      this.slideTo(0)
      this.mic.clear()
      this.changeState({elapsed: ''})
      this.timeLine = []
      this.gestate.clearAll()
      if (this.state.restored)  {
        this.changeState({madeChanges: true})
      }
      this.changeState({enableRecord: true})
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
      this.recording.recordLength = this.mic.getTotalLength().ms
      this.recording.audioBlob = this.mic.exportAllWav()
      this.mic.clear()
      await this.enterReviewMode()
      this.pressPlayRec()
    } else if (this.state.mode === 'review') {
      if (this.state.restored && !this.state.madeChanges) {
        // just exit
        this.completeSubject.complete()
      } else {
        this.completeSubject.next({
          timeLine: [],
          gestures: this.gestate.getGestures(),
          audio: this.recording.audioBlob
        })
        this.completeSubject.complete()
      }
    }
  }

  //
  // Render
  //
  render() {
    return (
<div class="igv">
  <aikuma-modal></aikuma-modal>
  <div class="slidewrapper">
    <aikuma-slide-show></aikuma-slide-show>
  </div>
  <div class="controls">
    {
      this.state.enableRecord ?
        <aikuma-buttony 
            disabled={!this.canRecord()} 
            id="record" size="85">
          <div class="recbutton">
            <div class="buttonicon"
              innerHTML={fontawesome.icon(this.state.recording ? faPause: faStop).html[0]}>
            </div>
            <div class="elapsed">{this.state.elapsed}</div>
          </div>
        </aikuma-buttony> :
        null
    }
  
    {
      this.state.showControls ? 
        <div class="ctrlwrapper">
          <aikuma-buttony clear size="50" id="cancel" disabled={!this.canCancel()} >
            <div class="clearbuttonicon" 
              innerHTML={fontawesome.icon(faTimesCircle).html[0]}>
            </div>
          </aikuma-buttony>
          <div class="spacer"></div>
          <aikuma-buttony clear size="50" id="accept" disabled={!this.canAccept()}>
            <div class="clearbuttonicon" 
              innerHTML={fontawesome.icon(faCheckCircle).html[0]}>
            </div>
          </aikuma-buttony>
        </div> :
        null
    }
    {/* <aikuma-buttony 
      disabled={!this.canPlay()} 
      id="play" size="85">
      <div class="buttonicon"
        innerHTML={fontawesome.icon(this.state.playing ? faStop: faPlay).html[0]}>
      </div>
    </aikuma-buttony> */}
  </div>
  
  <pre>{prettyprint(this.state)}</pre>
</div>
    )
  }
}
