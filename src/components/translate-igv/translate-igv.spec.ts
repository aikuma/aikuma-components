import { flush, render } from '@stencil/core/testing'
import { TranslateIGV } from './translate-igv'

describe('aikuma-translate-igv', () => {
  it('should build', () => {
    expect(new TranslateIGV()).toBeTruthy()
  })

  describe('rendering', () => {
    let element
    beforeEach(async () => {
      element = await render({
        components: [TranslateIGV],
        html: '<aikuma-translate-igv></aikuma-translate-igv>'
      })
    })
  })
})