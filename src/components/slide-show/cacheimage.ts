export class CacheImage {
  cacheImage(url: string): Promise<{width: number, height: number}> {
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => {
        resolve({width: img.naturalWidth, height: img.naturalHeight})
      }
      img.onerror = () => {
        reject()
      }
      img.src = url
    })
  }
  cacheImages(imgs: string[]): Promise<{width: number, height: number}[]> {
    return Promise.all(
      imgs.map((i) => {
        return this.cacheImage(i)
      })
    )
  }
}