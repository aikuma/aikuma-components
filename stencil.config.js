exports.config = {
  namespace: 'aikuma',
  generateDistribution: true,
  bundles: [
    { components: ['aikuma-image-gesture-voice', 'aikuma-translate-igv', 'aikuma-gestate', 'aikuma-slide-show'] }
  ]
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}
