import { flush, render } from '@stencil/core/testing'
import { ImageGestureVoice } from './image-gesture-voice'

describe('aikuma-image-gesture-voice', () => {
  it('should build', () => {
    expect(new ImageGestureVoice()).toBeTruthy()
  })

  describe('rendering', () => {
    let element
    beforeEach(async () => {
      element = await render({
        components: [ImageGestureVoice],
        html: '<aikuma-image-gesture-voice></aikuma-image-gesture-voice>'
      })
    })
  })
})
