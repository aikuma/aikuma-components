import { Component, Element, State, Method, Listen, Event, EventEmitter } from '@stencil/core'
//import { Gestate } from '@aikuma/gestate'
import { Gestate, Gesture } from '../../../../gestate/dist'
import { WebAudioPlayer } from '@aikuma/webaudio'
import prettyprint from 'prettyprint'
import fontawesome from '@fortawesome/fontawesome'
import { faPlay, faPause } from '@fortawesome/fontawesome-free-solid'
//import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Subscription } from 'rxjs/Subscription'
import { IGVOptions, IGVBundle, Slide, SlideshowSettings } from '../../interface'
fontawesome.library.add(faPlay, faPause)
import { classList } from 'dynamic-class-list'

interface State {
  playing?: boolean,
  canplay?: boolean,
  elapsed?: string,
  enableRecord?: boolean,
  havePlayed?: boolean,
  restored?: boolean,
  debug?: boolean
}

@Component({
  tag: 'aikuma-play-igv',
  styleUrls: ['play-igv.scss'],
  shadow: true
})
export class PlayIGV {
  @Element() el: HTMLElement
  ssc: HTMLAikumaSlideShowElement
  gestate: Gestate
  modal: HTMLAikumaModalElement
  // one Audio Context to rule them all: Because Chrome is now blocking playback unless you resume() a ctx in a gesture cb
  audioCtx: AudioContext = new AudioContext()
  player: WebAudioPlayer = new WebAudioPlayer({audioContext: this.audioCtx}) 
  audioResumed: boolean = false // on first gesture, call audioCtx.resume() and then set this true
  slides: Slide[] = []
  timeLine: {id?: string, startMs: number, endMs?: number, gestures: Gesture[]}[] = []
  options: IGVOptions = {
    debug: false
  }
  @State() state: State = {
    playing: false,
    canplay: false,
    elapsed: '0.0',
    havePlayed: false,  // have ever played
    debug: false
  }
  currentIndex: number = 0
  playProgressSub: Subscription
  completeSubject: Subject<any> = new Subject()
  
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
    if (!this.audioResumed) {
      this.audioCtx.resume() // unlocks audio playback in Chrome
      this.audioResumed = true
    }
    let id = event.detail.id
    let type = event.detail.type
    if (type === 'up') {
      // regular clicks
      if (id === 'play') {
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
  componentDidUnload() {
    this.consoleLog('destroying')
    // might not need to do this
    if (this.playProgressSub) {
      this.playProgressSub.unsubscribe()
    }
    if (this.gestate) {
      this.gestate.destroy()
    }
  }

  async init(): Promise<any> {
    this.consoleLog('init()')
    this.gestate = new Gestate({debug: this.options.debug})
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
    this.playProgressSub = this.player.observeProgress().subscribe((time) => {
      //this.consoleLog(time)
      if (this.state.playing) {
        if (time === -1 ) {
          this.gestate.stopPlay()
          this.changeState({playing: false})
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
  async restoreFromIGVBundle(igvb: IGVBundle) {
    await this.player.load(igvb.audiourls[0])
    this.timeLine = igvb.segments
    let sssettings: SlideshowSettings = {
      showThumbs: igvb.imageurls.length > 1
    }
    if (igvb.imageurls.length === 1) {
      // sssettings.ssizeLandscape = {
      //   width: '75vw',
      //   height: '56vw'
      // }
    }
    this.slides = await this.ssc.loadImages(igvb.imageurls, sssettings)
    this.changeState({elapsed: this.getNiceTime(0)})
    this.ssc.slideTo(0, false)
    this.currentIndex = 0 // so play action will start from 0
    await this.init()
    this.changeState({canplay: true})
  }

  //
  // Logic 
  //
  async slideChangeEvent(slide: number) {
    let priorIndex = this.currentIndex
    this.currentIndex = slide   
    let isNextSlide = priorIndex === 0 || this.currentIndex === priorIndex + 1 // stops the player pause / start occuring after player starts from 0
    this.consoleLog('slideChangeEvent()', slide, isNextSlide)
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
      let el = await this.ssc.getCurrentImageElement()
      this.consoleLog('playing gestures')
      this.gestate.playGestures(el, 0)
    } else {
      this.changeState({elapsed: this.getNiceTime(t)})
    }
  }

  stopPlaying() {
    this.player.pause()
    this.gestate.stopPlay()
    this.changeState({playing: false})
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
  
  async pressPlay(): Promise<void> {
    if (this.state.playing) {
      this.stopPlaying()
    } else {
      // We were not playing
      this.changeState({havePlayed: true, playing: true})
      if (this.player.ended) {
        // Playback had finished (end of slides)
        this.ssc.slideTo(0, true)
        this.gestate.loadGestures(this.timeLine[0].gestures)
        let el = await this.ssc.getCurrentImageElement()
        this.gestate.playGestures(el, 0)
        this.player.play(0)
      } else {
        // Otherwise resume by restarting from this slide
        let time = this.timeLine[this.currentIndex].startMs // milliseconds
        this.gestate.loadGestures(this.timeLine[this.currentIndex].gestures)
        let el = await this.ssc.getCurrentImageElement()
        this.gestate.playGestures(el, 0)
        this.player.play(time/1000)
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
  <aikuma-buttony 
      disabled={!this.state.canplay} 
      id="play" size="100" class={ classList({'playing': this.state.playing})}>
    <div class="recbutton">
      <div class="buttonicon"
        innerHTML={fontawesome.icon(this.state.playing ? faPause: faPlay).html[0]}>
      </div>
      <div class="elapsed">{this.state.elapsed}</div>
    </div>
  </aikuma-buttony>

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
