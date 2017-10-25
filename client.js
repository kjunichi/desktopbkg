'use strict';
// In the renderer process.
const {
  desktopCapturer,
  ipcRenderer
} = require('electron');
const winctl = require('winctl');

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
        cs2.height = window.innerHeight;
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
  const geometry = new THREE.PlaneGeometry(18, 18, 2);
  const material =
    new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      map: texture
    });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.scale.x = mesh.scale.x * 10;
  mesh.scale.y = mesh.scale.y * 10;
  mesh.scale.x = mesh.scale.x * window.innerWidth / window.innerHeight;
  scene.add(mesh);
  renderer.render(scene, camera);

  function f() {
    //mesh.rotation.y -= 0.01;
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
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  console.log(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    35, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near
    10000 // Far
  );
  camera.position.set(0, 0, 285);
  camera.lookAt(scene.position);



  var light = new THREE.DirectionalLight(0xFFFFFF);
  light.position.set(0, 0, 10);
  scene.add(light);

  renderer.setClearColor(0xdddddd, 1);

  renderer.render(scene, camera);

}

window.addEventListener('load', () => {
  init();
  gopheronMain();
  // Iterate over all windows with a custom filter -> show all visible windows
  winctl.FindWindows(win => win.isVisible() && win.getTitle()).then(windows => {
    console.log("Visible windows:");
    windows.sort((a, b) => a.getTitle().localeCompare(b.getTitle())).forEach(window => {
      console.log(" - %s [classname=%s, pid=%d, hwnd=%d, parent=%d]", window.getTitle(), window.getClassName(), window.getPid(), window.getHwnd(), window.getParent());
      console.log("window.dim = ", window.dimensions())
    });
  });
});

function gopheronMain() {

  function createGopher() {
    console.log(`createGopher start`);
    console.log(`${gopherHRMesh}, ${gopherERMesh}, ${gopherEarRMesh} ${gopherFRMesh}, ${gopherHLMesh}, ${gopherELMesh}, ${gopherEarLMesh}, ${gopherFLMesh}, ${gopherBodyMesh}`)
    if (gopherHRMesh && gopherERMesh &&
      gopherEarRMesh && gopherFRMesh &&
      gopherHLMesh && gopherELMesh &&
      gopherEarLMesh && gopherFLMesh &&
      gopherBodyMesh) {

      root.add(gopherBodyMesh);

      root.add(rootEarR);
      root.add(rootEarL);

      root.add(rootER);
      root.add(rootEL);

      root.add(rootHR);
      root.add(rootHL);

      root.add(rootFR);
      root.add(rootFL);

      scene.add(root);

      gopher();
    }
  }

  function addParts(obj, geom, material, scale) {
    geom.computeFaceNormals();
    geom.computeVertexNormals();

    geom.computeBoundingBox();
    const bb = geom.boundingBox;
    const v = new THREE.Vector3();
    v.addVectors(bb.min, bb.max);
    v.multiplyScalar(0.5);
    v.multiplyScalar(scale);
    obj.position.add(v);
    geom.center();
    const mesh = new THREE.Mesh(geom, material);
    mesh.scale.set(scale, scale, scale);
    obj.add(mesh);
    return mesh;
  }

  function gopher() {

    root.position.x = -100;
    root.position.y = -50;
    root.rotation.y = -0.8;

    root.scale.x = 0.12;
    root.scale.y = 0.12;
    root.scale.z = 0.12;
    let accx = 1;
    let isJumpping = false;
    let accy = 1;
    let sHR = 1;
    let sHL = -1;

    const animate = () => {
      if (root.position.x > 150) {
        accx = -0.6;
        root.rotation.y = -2.8;
      }
      if (root.position.x < -150) {
        accx = 0.6;
        root.rotation.y = -0.8;
      }

      if (isJumpping) {
        gopherFRMesh.rotation.x = -Math.PI / 2;
        gopherFLMesh.rotation.x = -Math.PI / 2;
        gopherHRMesh.rotation.z = Math.PI / 2;
        gopherHLMesh.rotation.z = Math.PI / 2;
        root.position.y += 3 * accy;
        if (root.position.y > 20) {
          accy = -0.7;
        }
        if (root.position.y < -100) {
          accy = 0.7;
          root.position.y = -100;
          isJumpping = false;
        }
      } else {
        gopherFRMesh.rotation.x = 0;
        gopherFLMesh.rotation.x = 0;
        if (Math.random() > 0.98 && gopherMove) {
          isJumpping = true;
        }
      }

      if (gopherMove) {
        root.position.x = root.position.x + accx * 1;
      }

      gopherFLMesh.position.y += (Math.random() - 0.5) * 8;
      if (gopherFLMesh.position.y > 20) {
        gopherFLMesh.position.y = 20;
      }
      if (gopherFLMesh.position.y < 0) {
        gopherFLMesh.position.y = 0;
      }
      gopherFRMesh.position.y += (Math.random() - 0.5) * 8;
      if (gopherFRMesh.position.y > 20) {
        gopherFRMesh.position.y = 20;
      }
      if (gopherFRMesh.position.y < 0) {
        gopherFRMesh.position.y = 0;
      }
      gopherHRMesh.position.y += (Math.random() - 0.5) * 4;
      if (gopherHRMesh.position.y > 20) {
        gopherHRMesh.position.y = 20;
      }
      if (gopherHRMesh.position.y < -10) {
        gopherHRMesh.position.y = -10;
      }

      gopherHRMesh.rotation.z += sHR * 0.14;
      if (gopherHRMesh.rotation.z < -0.5) {
        gopherHRMesh.position.z = -0.5;
        sHR = 1;
      }
      if (gopherHRMesh.rotation.z > 1.0) {
        gopherHRMesh.position.z = 1.0;
        sHR = -1;
      }
      gopherHLMesh.rotation.z += sHL * 0.14;
      if (gopherHLMesh.rotation.z < -0.5) {
        gopherHLMesh.position.z = -0.5;
        sHL = 1;
      }
      if (gopherHLMesh.rotation.z > 1.0) {
        gopherHLMesh.position.z = 1.0;
        sHL = -1;
      }
      gopherHLMesh.position.y += (Math.random() - 0.5) * 4;
      if (gopherHLMesh.position.y > 20) {
        gopherHLMesh.position.y = 20;
      }
      if (gopherHLMesh.position.y < -10) {
        gopherHLMesh.position.y = -10;
      }

      gopherELMesh.rotation.x += (0.5 - Math.random()) * 0.2;
      if (gopherELMesh.rotation.x > 0.5) {
        gopherELMesh.rotation.x = 0.5
      }
      if (gopherELMesh.rotation.x < -0.5) {
        gopherELMesh.rotation.x = -0.5
      }
      gopherERMesh.rotation.x += (0.5 - Math.random()) * 0.2;
      if (gopherERMesh.rotation.x > 0.5) {
        gopherERMesh.rotation.x = 0.5
      }
      if (gopherERMesh.rotation.x < -0.5) {
        gopherERMesh.rotation.x = -0.5
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }
  // モデル
  //オブジェクト

  let gopherHRMesh;
  let gopherERMesh;
  let gopherEarRMesh;
  let gopherFRMesh;
  let gopherHLMesh;
  let gopherELMesh;
  let gopherEarLMesh;
  let gopherFLMesh;
  let gopherBodyMesh;

  const root = new THREE.Object3D();
  const rootEL = new THREE.Object3D();
  const rootER = new THREE.Object3D();
  const rootEarL = new THREE.Object3D();
  const rootEarR = new THREE.Object3D();
  const rootHL = new THREE.Object3D();
  const rootHR = new THREE.Object3D();
  const rootFL = new THREE.Object3D();
  const rootFR = new THREE.Object3D();

  const loader = new THREE.JSONLoader();
  loader.load('./models/gopher_slimdataHR.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherHRMesh = addParts(rootHR, geometry, faceMaterial, 40);
    createGopher();
  });

  loader.load('./models/gopher_slimdataHL.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherHLMesh = addParts(rootHL, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataER.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherERMesh = addParts(rootER, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataEL.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherELMesh = addParts(rootEL, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataFR.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherFRMesh = addParts(rootFR, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataFL.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherFLMesh = addParts(rootFL, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataEarR.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherEarRMesh = addParts(rootEarR, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataEarL.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    gopherEarLMesh = addParts(rootEarL, geometry, faceMaterial, 40);
    createGopher();
  });
  loader.load('./models/gopher_slimdataBody.json', (geometry, materials) => {
    const faceMaterial = new THREE.MultiMaterial(materials);
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    gopherBodyMesh = new THREE.Mesh(geometry, faceMaterial);
    gopherBodyMesh.scale.set(40, 40, 40);

    createGopher();
  });
  let gopherMove = true;

}