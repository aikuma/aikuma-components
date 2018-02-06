import { flush, render } from '@stencil/core/testing'
import { Gestate } from './gestate'

describe('aikuma-gestate', () => {
  it('should build', () => {
    expect(new Gestate()).toBeTruthy()
  })

  describe('rendering', () => {
    let element
    beforeEach(async () => {
      element = await render({
        components: [Gestate],
        html: '<aikuma-gestate></aikuma-gestate>'
      })
    })
  })
})