import { Component, Element, State, Listen } from '@stencil/core'
import { Slide, SlideShowElement } from '../slide-show/slide-show'
import { GestateElement } from '../gestate/gestate'
import { Microphone, WebAudioPlayer } from 'aikumic'
import prettyprint from 'prettyprint'

export interface TimeLine extends Array<{t: number}>{}

interface State {
  recording?: boolean,
  playing?: boolean,
  mode?: string,
  contentSize?: DOMRect,
  frameSize?: DOMRect,
  elapsed?: string,
  enableRecord?: boolean,
  havePlayed?: boolean
}

@Component({
  tag: 'aikuma-image-gesture-voice',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'image-gesture-voice.css'],
  shadow: true
})
export class ImageGestureVoice {
  @Element() el: HTMLElement
  ssc: SlideShowElement
  gestate: GestateElement
  mic: Microphone = new Microphone()
  timeLine: TimeLine = []
  slideList: Slide[] = []
  @State() state: State = {
    recording: false,
    playing: false,
    mode: 'record',
    contentSize: null,
    frameSize: null,
    elapsed: '0.0',
    enableRecord: true,
    havePlayed: false
  }
  currentIndex: number = 0
  player: WebAudioPlayer = new WebAudioPlayer()
  @Listen('slideSize')
  slideSizeHandler(event: CustomEvent) {
    console.log('igv got slide size notification')
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
    } else if (t === 'start') {
      //console.log('slide change',v)
      if (this.state.recording) {
        this.gestate.stopRecord()
      }
    } else if (t === 'end') {
      console.log('slide change ending',v)
      this.changeState({contentSize: v})
      if (this.state.recording) {
        this.gestate.record('attention', this.mic.getElapsed())
      }
      this.slideChange(v)
    }
  }
  //
  // Lifecycle
  //
  componentWillLoad() {
    console.log('IGV is about to be rendered')
  }

  componentDidLoad() {
    this.ssc = this.el.shadowRoot.querySelector('aikuma-slide-show')
    this.gestate = this.el.shadowRoot.querySelector('aikuma-gestate')
    this.init()
  }

  init() {
    let pics = [1,2,4,5].map((i) => {
      return 'http://localhost:8000/som-hand'+i.toString()+'.jpg'
    })
    this.ssc.loadImages(pics)
    this.mic.connect()
  }
  //
  // Logic 
  //
  slideChange(slide: number) {
    this.currentIndex = slide // even if we are in transition
    if (this.state.mode === 'record') {
      if (this.state.recording) {
        //this.registerSlideChange(this.mic_getElapsed(), this.slideList, this.currentIndex)
      }
      if (this.state.playing) {
        //this.player.pause()
        let timeMs = this.timeLine[this.currentIndex].t
        //this.player.playMs(timeMs)
        this.gestate.playGestures(timeMs)
      }
    } else if (this.state.mode === 'play') {
      let t = this.timeLine[slide].t
      if (this.state.playing) {
        //this.player.pause()
        //this.player.play(t/1000)
        this.gestate.playGestures(t)
      } else {
        this.changeState({elapsed: this.getNiceTime(t)})
      }
    }
  }

  registerSlideChange (time: number, images: any[], imageIndex: number) {
    this.timeLine.push({
      t: time,
    })
    console.log('registerSlideChange, timeLine is', this.timeLine)
  }
  async stopRecording() {
    this.changeState({enableRecord: false, recording: false})
    await this.mic.stop()
    this.changeState({enableRecord: true})
    this.gestate.stopRecord()
  }
  stopPlaying() {
    this.player.pause()
    this.gestate.stopPlay()
    this.changeState({playing: false})
  }
  slideTo(slide: number): void {
    this.ssc.slideTo(slide)
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
  // Template Logic
  //

  handleClick(btn: string, evt: UIEvent) {
    if (btn === 'record') {
      this.pressPlayRec()
    }
  }
  canPlay(): boolean {
    return this.mic.hasRecordedData()
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
          this.registerSlideChange(this.mic.getElapsed(), this.slideList, 0)
        }      
        // Animate buttons out, begin microphone recording, start gesture recording
        this.mic.record()
        this.state.recording = true
        this.changeState({recording: true})
        this.gestate.record('attention', this.mic.getElapsed())
      }
    } else {
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

  render() {
    return (
<div class="igv">
  <div class="slidewrapper">
    <aikuma-slide-show></aikuma-slide-show>
    <aikuma-gestate size={{content: this.state.contentSize, frame: this.state.frameSize}}></aikuma-gestate>
  </div>
  <div class="controls"></div>
  <button type="button" 
      onClick={(e: UIEvent) => this.handleClick('record', e)}>
    {
    this.state.recording
      ? 'Stop'
      : 'Record'
    }
  </button>
  <button type="button" disabled={!this.canPlay()}
      onClick={(e: UIEvent) => this.handleClick('play', e)}>
    {
    this.state.playing
      ? 'Stop'
      : 'Play'
    }
  </button>
  <pre>{prettyprint(this.state)}</pre>
</div>
    )
  }
}
