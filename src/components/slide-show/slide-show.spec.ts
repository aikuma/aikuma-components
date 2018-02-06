import { flush, render } from '@stencil/core/testing'
import { SlideShow } from './slide-show'

describe('aikuma-translate-igv', () => {
  it('should build', () => {
    expect(new SlideShow()).toBeTruthy()
  })

  describe('rendering', () => {
    let element
    beforeEach(async () => {
      element = await render({
        components: [SlideShow],
        html: '<aikuma-slide-show></aikuma-slide-show>'
      })
    })
  })
})