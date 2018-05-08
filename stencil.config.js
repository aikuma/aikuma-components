const sass = require('@stencil/sass')

exports.config = {
  namespace: 'aikuma',
  globalStyle: 'src/global/variables.css',
  plugins: [
    sass()
  ],
  outputTargets:[
    { 
      type: 'dist' 
    },
    { 
      type: 'www',
      serviceWorker: false
    }
  ]
}

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}

