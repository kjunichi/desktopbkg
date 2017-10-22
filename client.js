"use strict";
// In the renderer process.
const { desktopCapturer, ipcRenderer } = require("electron");
let gWinNum = 0;
desktopCapturer.getSources(
  { types: ["window", "screen"] },
  (error, sources) => {
    if (error) throw error;
    for (var i = 0; i < sources.length; ++i) {
      console.log("sources[i].name = " + sources[i].name);
      addImage(sources[i].thumbnail);
      if (sources[i].name == "Entire screen") {
        // navigator.webkitGetUserMedia(
        //   {
        //     audio: false,
        //     video: {
        //       mandatory: {
        //         chromeMediaSource: "desktop",
        //         chromeMediaSourceId: sources[i].id,
        //         minWidth: 1280,
        //         maxWidth: 1280,
        //         minHeight: 720,
        //         maxHeight: 720
        //       }
        //     }
        //   },
        //   gotStream,
        //   getUserMediaError
        // );
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: sources[i].id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
              }
            }
          })
          .then(stream => gotStream(stream))
          .catch(e => handleError(e));
      }
    }
  }
);

function handleError(e) {
  console.log(e);
}
function addImage(image) {
  const elm = document.createElement("img");
  elm.src = image.toDataURL();
  document.body.appendChild(elm);
}

function gotStream(stream) {
  console.dir(stream);
  const ve = document.createElement("video");
  ve.addEventListener("loadeddata", (ev) => {
    console.dir(ev);
    console.log(ve.videoWidth);
    console.log(ve.videoHeight);

    window.setTimeout(() => {
      const cs = document.createElement("canvas");
      console.log(`${ve.videoWidth},${ve.width}`);
      cs.width = ve.videoWidth;
      cs.height = ve.videoHeight;
      const ctx = cs.getContext("2d");

      ctx.drawImage(ve, 0, 0, cs.width, cs.height);
      let frame = ctx.getImageData(0, 0, cs.width, cs.height);
      ipcRenderer.on("reply", (e, a) => {
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
        const cs2 = document.createElement("canvas");
        cs2.width = cs.width;
        cs2.height = cs.height;
        const ctx2 = cs2.getContext("2d");

        document.body.appendChild(cs2);
        ctx2.putImageData(img, 0, 0);
        console.log(`done`);
      });
      const obj = {};
      let img = [];
      //obj.len = frame.data.length;
      for (let i = 0; i < frame.data.length; i++) {
        img[i] = frame.data[i];
      }
      //obj.len = frame.data.length;
      obj.img = img;
      ipcRenderer.send("asynchronous-message", JSON.stringify(obj));
      ve.pause();
      //ve.src = "";
    }, 200);
  });
  ve.addEventListener("timeupdate", ev => {
    console.dir(ev);
    
  });
  //ve.clientWidth=640;
  //ve.width = 640;
  //ve.height = 480;

  //ve.src = URL.createObjectURL(stream);
  ve.srcObject = stream;
}

function getUserMediaError(e) {
  console.log("getUserMediaError");
}
