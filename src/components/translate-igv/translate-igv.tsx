import { Component } from '@stencil/core'

@Component({
  tag: 'aikuma-translate-igv',
  styleUrl: 'translate-igv.css',
  shadow: true
})
export class TranslateIGV {
 

  componentWillLoad() {
    console.log('TIGV is about to be rendered')
  }

  componentDidLoad() {
    console.log('TIGV was rendered');
        this.init()
  }



  init() {
   
  }

  render() {
    return (
<aikuma-slide-show></aikuma-slide-show>
    )
  }
}
