var THREE, temporaryPosition, temporaryVector
const { SSAOEffect, EffectComposer, EffectPass, RenderPass, NormalPass,BlendFunction } = require("postprocessing");
module.exports = function(three, opts) {
  temporaryPosition = new three.Vector3
  temporaryVector = new three.Vector3
  
  return new View(three, opts)
}

function View(three, opts) {
  THREE = three // three.js doesn't support multiple instances on a single page
  this.fov = opts.fov || 60
  this.width = opts.width || 512
  this.height = opts.height || 512
  this.aspectRatio = opts.aspectRatio || this.width/this.height
  this.nearPlane = opts.nearPlane || 1
  this.farPlane = opts.farPlane || 10000
  this.skyColor = opts.skyColor || 0xBFD1E5
  this.ortho = opts.ortho
  this.camera = this.ortho?(new THREE.OrthographicCamera(this.width/-2, this.width/2, this.height/2, this.height/-2, this.nearPlane, this.farPlane)):(new THREE.PerspectiveCamera(this.fov, this.aspectRatio, this.nearPlane, this.farPlane))
  this.camera.lookAt(new THREE.Vector3(0, 0, 0))
  this.clock = new THREE.Clock();
  if (!process.browser) return

  this.createRenderer(opts.canvas)
  this.element = this.renderer.domElement
}

View.prototype.createRenderer = function(canvas) {
  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
      canvas: canvas,
    logarithmicDepthBuffer:true
  })
  this.renderer.shadowMap.enabled = true
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  this.renderer.setClearColor(this.skyColor, 1.0)

  this.effectComposer = new EffectComposer(this.renderer);


 // this.saoPass = new SAOPass(this.scene, this.camera, false, true, new THREE.Vector2(window.innerWidth, window.innerHeight))

  this.effectComposer.setSize(this.width, this.height)
  this.renderer.clear()
}

View.prototype.bindToScene = function(scene) {
  scene.add(this.camera)
  this.normalPass = new NormalPass(scene,this.camera);
  this.renderPass = new RenderPass(scene, this.camera);
  const ssaoEffect =new SSAOEffect(this.camera,this.normalPass.renderTarget.texture, {
    blendFunction: BlendFunction.MULTIPLY,
    samples: 32,
    rings: 10,
    distanceThreshold: 0.25,
    distanceFalloff: 0.5,
    rangeThreshold: 0.0015,
    rangeFalloff: 0.01,
    luminanceInfluence: 0.3,
    radius:15,
    scale: 0.35,
    bias: 1.1
  });
  this.effectPass = new EffectPass(this.camera,ssaoEffect );
  this.renderPass.renderToScreen = false;
  this.effectPass.renderToScreen = true;
 // this.renderPass.renderToScreen = true;
  this.effectComposer.reset();
  this.effectComposer.addPass(this.renderPass)
  this.effectComposer.addPass(this.normalPass)
  this.effectComposer.addPass(this.effectPass)

  // var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
  // light.castShadow = true;
  // scene.add( light );
  var light = new THREE.AmbientLight(0xffe2b0,1.2); // soft white light
  scene.add(light);
  var light2 = new THREE.PointLight(0xffffff,0.3); // soft white light
  light2.position.set( 30, 50, -16 );
  light2.castShadow = true;
  light2.shadow.mapSize.width = 2048;
  light2.shadow.mapSize.height = 2048;
  //light2.shadow.bias =0.0004;

  scene.add(light2);
}

View.prototype.getCamera = function() {
  return this.camera
}

View.prototype.cameraPosition = function() {
  temporaryPosition.multiplyScalar(0)
  temporaryPosition.applyMatrix4(this.camera.matrixWorld)
  return [temporaryPosition.x, temporaryPosition.y, temporaryPosition.z]
}

View.prototype.cameraVector = function() {
  temporaryVector.multiplyScalar(0)
  temporaryVector.z = -1
  temporaryVector.transformDirection( this.camera.matrixWorld )
  return [temporaryVector.x, temporaryVector.y, temporaryVector.z]
}

View.prototype.resizeWindow = function(width, height) {
  if (this.element.parentElement) {
    width = width || this.element.parentElement.clientWidth
    height = height || this.element.parentElement.clientHeight
  }

  this.camera.aspect = this.aspectRatio = width/height
  this.width = width
  this.height = height

  this.camera.updateProjectionMatrix()

  this.effectComposer.setSize( width, height )
}

View.prototype.render = function(scene) {
  this.effectComposer.render(this.clock.getDelta())
 // this.renderer.render(scene, this.camera)
}

View.prototype.appendTo = function(element) {
  if (typeof element === 'object') {
    element.appendChild(this.element)
  }
  else {
    document.querySelector(element).appendChild(this.element)
  }

  this.resizeWindow(this.width,this.height)
}