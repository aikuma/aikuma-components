import { Component } from '@stencil/core'

@Component({
  tag: 'aikuma-image-gesture-voice',
  styleUrls: ['../../../node_modules/swiper/dist/css/swiper.css', 'image-gesture-voice.scss'],
  shadow: true
})
export class ImageGestureVoice {
 

  componentWillLoad() {
    console.log('IGV is about to be rendered')
  }

  componentDidLoad() {
    console.log('IGV was rendered');
        this.init()
  }



  init() {
   
  }

  render() {
    return (
<slide-show-component></slide-show-component>
    )
  }
}
