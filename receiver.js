function shutdownReceiver() {
  if (!window.currentStream) {
    return;
  }

  var player = document.getElementById('player');
  player.srcObject = null;
  var tracks = window.currentStream.getTracks();
  for (var i = 0; i < tracks.length; ++i) {
    tracks[i].stop();
  }
  window.currentStream = null;
}


window.addEventListener('load', function() {

  // setup stream source and audio element
  player.srcObject = window.currentStream;
  player.play();
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(window.currentStream);

  // add the analyzer to the source
  var analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 256;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);




  // Visuals
  const COLOR_PALETTES = [{"background": "#555B6E", "off": "rgb(71,255,244)", "on": "rgb(255,191,0)", "bgObject": "#F7ACCF"},
                          {"background": "#D3E298", "off": "rgb(162,59,114)", "on": "rgb(241,143,1)", "bgObject": "#2E86AB"},
                          {"background": "#EAF2E3", "off": "rgb(0,20,39)", "on": "rgb(191,6,3)", "bgObject": "#61E8E1"},
                          {"background": "#26413C", "off": "rgb(199,242,167)", "on": "rgb(17,138,178)", "bgObject": "#EF709D"},
                          {"background": "#212227", "off": "rgb(244,201,93)", "on": "rgb(228,87,46)", "bgObject": "#99A1A6"},
                          {"background": "#000000", "off": "rgb(117,154,171)", "on": "rgb(237,191,198)", "bgObject": "#254441"}];


  var colors = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setClearColor(colors["background"]);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // resize canvas to fit window
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // create 3D boxes
  var boxes = [];
  var isRotated = [];
  for (let x=0; x<21; x++){
    var rows = [];
    var rotatedRows = [];
    for (let y=0; y<11; y++){
      var geometry = new THREE.BoxGeometry(1,1,1);
      var material = new THREE.MeshLambertMaterial({color: colors["off"]});
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-30 + 3 * x, -15 + 3 * y, 0);
      scene.add(mesh);
      rows.push(mesh);
      rotatedRows.push(false);
    }
    boxes.push(rows);
    isRotated.push(rotatedRows);
  }

  // create background boxes
	var boxCount = 12;
	var boxRotationStep = Math.PI * 2 / boxCount;
  var radius = 5;
  var pivotPoint = new THREE.Object3D();

  function createBackgroundBoxes(z){
    var geometry = new THREE.BoxGeometry(1,1,1);
    var material = new THREE.MeshLambertMaterial({color: colors["bgObject"]});
    var mesh = new THREE.Mesh(geometry, material);
    var bgBoxes = [];
    for (let i=0; i<boxCount; i++){
      bgBoxes[i] = mesh.clone();
      bgBoxes[i].position.set(Math.cos((boxRotationStep * i) * radius), Math.sin((boxRotationStep * i) * radius), z)
      pivotPoint.add(bgBoxes[i]);
      scene.add(bgBoxes[i]);
    }
    scene.add(pivotPoint);
    return bgBoxes;
  }
  //bgBoxes = createBackgroundBoxes(-20);
  var bgBoxList = [];
  for (let i=0; i<10; i++){
    bgBoxList.push(bgBoxes1 = createBackgroundBoxes(-10 - (10 * i)));
  }

  // create 3D flower
  var petals = [];
	var petalCount = 12;
	var petalRotationStep = Math.PI * 2 / petalCount;

  function createFlower() {
    var radius = 25;
    var petalMaterial = new THREE.MeshPhongMaterial({color: colors["bgObject"], side: THREE.DoubleSide});
    var petalGeometry = new THREE.SphereBufferGeometry(radius, 20, 20, Math.PI / 3, Math.PI / 3, 0, Math.PI);
    petalGeometry.translate(0,-radius,0);
    petalGeometry.rotateX(Math.PI / 2);
    var petalMesh = new THREE.Mesh(petalGeometry, petalMaterial);
    for (let i = 0; i < petalCount; i ++) {
      petals[i] = petalMesh.clone();
      petals[i].position.z = -60;
      scene.add(petals[i]);
    }
  }
  //createFlower();

  // add lighting
  var light = new THREE.PointLight(0xFFFFFF, 1, 1000)
  light.position.set(0,0,50);
  scene.add(light);

  // camera placement
  camera.position.z = 40;
  camera.lookAt(scene.position);

  var flowerOpening = 0;
  var boxRotationAmt = 0;
  var radiusChange = 0.1;
  // render loop
  var render = function() {
    requestAnimationFrame(render);

    // dataArray.length is 128  different frequencies hjgher frequencies are not counted
    analyser.getByteFrequencyData(dataArray);
    // first ten frequencies are individual then other 74 are divided
    for (let i=0; i<11; i++){
      var dB = dataArray[i];
      for (let j=0; j<11; j++){
        if (j<Math.floor(dB/(255/11))){
          turnOn(i, j);
          rotateRight(i, j);
          isRotated[i][j] = true;
        } else if (isRotated[i][j]){
          turnOff(i, j);
          rotateLeft(i, j);
        }
      }
    }
    for (let i=11; i<91; i+=8){
      var dB = (dataArray[i] + dataArray[i+1] + dataArray[i+2] + dataArray[i+3] + dataArray[i+4] + dataArray[i+5] + dataArray[i+6] + dataArray[i+7]) / 8;
      for (let j=0; j<11; j++){
        if (j<Math.floor(dB/(255/11))){
          turnOn(10+Math.floor(i/8), j);
          rotateRight(10+Math.floor(i/8), j);
          isRotated[10+Math.floor(i/8)][j] = true;
        } else if (isRotated[10+Math.floor(i/8)][j]){
          turnOff(10+Math.floor(i/8), j);
          rotateLeft(10+Math.floor(i/8), j);
        }
      }
    }

    if (radius > 20 || radius < 2){
      radiusChange = -radiusChange;
    }
    radius += radiusChange;
    boxRotationAmt += 0.01;
    //updateBGBoxes(bgBoxes, boxRotationAmt, radius);
    for (let i=0; i<bgBoxList.length; i++){
      updateBGBoxes(bgBoxList[i], boxRotationAmt, radius);
    }

    /*
    // animate flower
    var direction = 1
    if (flowerOpening > 2 * Math.PI) direction = -direction;
    flowerOpening -= direction * (Math.PI/3000);
    updateFlower(flowerOpening);
    */

    renderer.render(scene, camera);
  }

  //animations
  function rotateRight(i, j){
    tl = new TimelineMax();
    tl.to(boxes[i][j].rotation, 0.5, {y: Math.PI/2});
  }
  function rotateLeft(i, j){
    tl = new TimelineMax();
    tl.to(boxes[i][j].rotation, 0.5, {y: 0});
  }
  function turnOn(i, j){
    TweenLite.to(boxes[i][j].material.color, 0.5, {colorProps:{set: colors["on"]}, ease: Power1.easeIn});
  }
  function turnOff(i, j){
    TweenLite.to(boxes[i][j].material.color, 0.5, {colorProps:{set: colors["off"]}, ease: Power1.easeIn});
  }
  function rotateDown(bgBoxes, i){
    tl = new TimelineMax();
    tl.to(bgBoxes[i].rotation, 0.5, {x: Math.PI/2});
  }
  function rotateUp(bgBoxes, i){
    tl = new TimelineMax();
    tl.to(bgBoxes[i].rotation, 0.5, {x: 0});
  }

  function updateBGBoxes(bgBoxes, bgBoxRotationAmt, radius){
    for (let i=0; i<bgBoxes.length; i++){
      bgBoxes[i].position.x = Math.cos((boxRotationStep * i)+boxRotationAmt) * radius;
      bgBoxes[i].position.y = Math.sin((boxRotationStep * i)+boxRotationAmt) * radius;
      bgBoxes[i].scale.x = radius / 5 + 0.5;
      bgBoxes[i].scale.y  = radius / 5 + 0.5;
      bgBoxes[i].scale.z  = radius / 5 + 0.5;
      if (Math.round(radius) == 20){
        rotateDown(bgBoxes, i);
      } else if (Math.round(radius) == 2){
        rotateUp(bgBoxes, i);
      }
    }
  }

  function updateFlower(petalRotation) {
  	for (var i = 0; i < petalCount; i++) {
    	petals[i].rotation.set(Math.PI/2, 0, 0);
      petals[i].rotateY(petalRotationStep * i);
      petals[i].rotateX((Math.PI / 2) * Math.abs(Math.cos(petalRotation)));
    }
  }

  render();
});

window.addEventListener('beforeunload', shutdownReceiver);
