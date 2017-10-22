'use strict';
// In the renderer process.
const {
  desktopCapturer,
  ipcRenderer
} = require('electron');
let gWinNum = 0;
let gCanvas;
desktopCapturer.getSources({
  types: ['window', 'screen']
}, (error, sources) => {
  if (error) throw error;
  for (var i = 0; i < sources.length; ++i) {
    console.log('sources[i].name = ' + sources[i].name);
    addImage(sources[i].thumbnail);
    if (sources[i].name == 'Entire screen') {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sources[i].id,
              minWidth: 1280,
              maxWidth: 3000,
              minHeight: 720,
              maxHeight: 2000
            }
          }
        })
        .then(stream => gotStream(stream))
        .catch(e => handleError(e));
    }
  }
});

function handleError(e) {
  console.log(e);
}

function addImage(image) {
  const elm = document.createElement('img');
  elm.src = image.toDataURL();
  document.body.appendChild(elm);
}

function gotStream(stream) {
  console.dir(stream);
  const ve = document.createElement('video');
  ve.addEventListener('loadeddata', (ev) => {
    console.dir(ev);
    console.log(ve.videoWidth);
    console.log(ve.videoHeight);

    window.setTimeout(() => {
      const cs = document.createElement('canvas');
      console.log(`${ve.videoWidth},${ve.width}`);
      cs.width = ve.videoWidth;
      cs.height = ve.videoHeight;
      const ctx = cs.getContext('2d');

      ctx.drawImage(ve, 0, 0, cs.width, cs.height);
      let frame = ctx.getImageData(0, 0, cs.width, cs.height);
      ipcRenderer.on('reply', (e, a) => {
        const data = JSON.parse(a);
        console.log(data.img.length);
        console.log(data.len);
        const img = ctx.createImageData(cs.width, cs.height);
        //
        let l = data.img.length / 4;
        console.log(`l = ${l}`);
        for (let i = 0; i < l; i++) {
          img.data[i * 4 + 0] = data.img[i * 4 + 0];
          img.data[i * 4 + 1] = data.img[i * 4 + 1];
          img.data[i * 4 + 2] = data.img[i * 4 + 2];
          img.data[i * 4 + 3] = data.img[i * 4 + 3];
        }
        const cs2 = document.createElement('canvas');
        cs2.width = cs.width;
        cs2.height = cs.height;
        const ctx2 = cs2.getContext('2d');

        document.body.appendChild(cs2);
        ctx2.putImageData(img, 0, 0);
        gCanvas = cs2;
        updateTexture(cs2);
        console.log(`done`);
      });
      const obj = {};
      let img = [];
      // obj.len = frame.data.length;
      for (let i = 0; i < frame.data.length; i++) {
        img[i] = frame.data[i];
      }
      // obj.len = frame.data.length;
      obj.img = img;
      ipcRenderer.send('asynchronous-message', JSON.stringify(obj));
      ve.pause();
      // ve.src = "";
    }, 200);
  });
  ve.addEventListener('timeupdate', ev => {
    console.dir(ev);

  });
  ve.srcObject = stream;
}

function getUserMediaError(e) {
  console.log('getUserMediaError');
}

function updateTexture(cs) {
  const cs2 = document.createElement('canvas');
  cs2.width = 4096;
  cs2.height = 4096;
  const ctx = cs2.getContext('2d');
  ctx.drawImage(cs, 0, 0, cs2.width, cs2.height);
  const texture = new THREE.Texture(
    cs2, THREE.UVMapping, THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping);
  texture.needsUpdate = true;
  const geometry = new THREE.PlaneGeometry(15, 15, 2);
  const material =
    new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      map: texture
    });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  renderer.render(scene, camera);

  function f() {
    mesh.rotation.y -= 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(f);
  }
  f();

}
let scene;
let renderer;
let camera;

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(800, 640);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    35, // Field of view
    800 / 640, // Aspect ratio
    0.1, // Near
    10000 // Far
  );
  camera.position.set(0, 0, 20);
  camera.lookAt(scene.position);



  var light = new THREE.PointLight(0xFFFFFF);
  light.position.set(10, 0, 10);
  scene.add(light);

  renderer.setClearColor(0xdddddd, 1);

  renderer.render(scene, camera);
}
window.addEventListener('load', () => {
  init()
});
// init();