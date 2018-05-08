(async function() {
  // select the custom element
  let igv = document.querySelector('aikuma-image-gesture-voice')
  // componentOnReady() is a Promise that resolves when the component is... ready
  await igv.componentOnReady()
  console.log('aikuma-image-gesture-voice componentOnReady()')
  // make a list of strings for the demo image files
  let pics = [1,2,3,4,5].map((i) => {
    return 'img/demo_s' + i.toString() + '.jpg'
  })
  // call a method on the component to load these files, note that it's async
  try {
    await igv.loadFromImageURLs(pics, {debug: true})
  } catch(e) {
    console.error('aikuma-image-gesture-voice loadFromImageURLs() failed!')
    console.error(e)
  }
  // this component also has a method that returns a Promise which resolves with the completed data
  let igvdata = await igv.waitForComplete()
  if (!igvdata) {
    console.log('aikuma-image-gesture-voice cancelled')
    return
  }
  // let's take the data from the IGV activity and load it into the translate activity...
  // so first let's remove the IGV element from t he DOM...
  igv.remove()
  // and create a new element using JavaScript ...
  let transIGV = document.createElement('aikuma-translate-igv')
  // ... and then append it to the body of the current document ...
  document.getElementsByTagName('body')[0].appendChild(transIGV)
  // ... and now wait until this component is ready ...
  await transIGV.componentOnReady()
  console.log('aikuma-translate-igv componentOnReady()')
  // ... and call a method which takes the same IGVData type as output by the IGV component
  await transIGV.loadIGVData(igvdata)
  let translation = await transIGV.waitForComplete()
  // ... now we have an IGVTranslation data package, wahey!
})()
