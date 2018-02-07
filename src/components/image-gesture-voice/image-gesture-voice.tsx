import { Component, Element } from '@stencil/core'
import { SlideShowElement } from '../slide-show/slide-show'
import { Microphone } from 'aikumic'

@Component({
  tag: 'aikuma-image-gesture-voice',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'image-gesture-voice.scss'],
  shadow: true
})
export class ImageGestureVoice {
  @Element() el: HTMLElement
  ssc: SlideShowElement
  mic: Microphone = new Microphone()

  componentWillLoad() {
    console.log('IGV is about to be rendered')
  }

  componentDidLoad() {
    this.ssc = this.el.shadowRoot.querySelector('aikuma-slide-show')
    this.init()
  }

  init() {
    let pics = [1,2,3].map((i) => {
      return 'http://localhost:8000/som-hand'+i.toString()+'.jpg'
    })
    this.ssc.loadImages(pics)
    this.mic.connect()
  }

  render() {
    return (
<aikuma-slide-show></aikuma-slide-show>
    )
  }
}
