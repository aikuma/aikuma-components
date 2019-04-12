import { newE2EPage } from '@stencil/core/testing';

describe('aikuma-camera', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<aikuma-camera></aikuma-camera>');
    const element = await page.find('aikuma-camera');
    expect(element).toHaveClass('hydrated');
  });

});
