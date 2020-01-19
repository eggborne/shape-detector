import { Application, Container } from 'pixi.js';
import { Viewport } from "pixi-viewport";

const initializeCanvas = () =>  {
  // let canvasSize = {};
  let controlPanelWidth = parseInt(getComputedStyle(document.documentElement).fontSize) * 12;
  let canvasDimensions = {
    x: parseInt( window.getComputedStyle(document.documentElement).getPropertyValue('--canvas-x')),
    y: parseInt( window.getComputedStyle(document.documentElement).getPropertyValue('--canvas-y')),
    width: 
      document.getElementById('block-board').offsetWidth,
    height: 
      document.getElementById('block-board').offsetHeight ,
  };
  // if (window.innerWidth < window.innerHeight) {
  //   canvasSize.width = window.innerWidth;
  //   canvasSize.height = window.innerHeight * 0.72;
  // } else {
  //   canvasSize.width = window.innerWidth;
  //   canvasSize.height = window.innerHeight;
  // }
  console.warn("canvasDimensions", canvasDimensions);
  const boardCanvas = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    // backgroundColor: 0xeeff8877,
    autoResize: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
    // view: document.querySelector('#board-canvas')
  });
  boardCanvas.resize();
  boardCanvas.viewport = new Viewport({
    // screenWidth: window.innerWidth,
    // screenHeight: window.innerHeight,
    disableOnContextMenu: true,
    threshold: 1000,
    interaction: boardCanvas.renderer.plugins.interaction
  });
  boardCanvas.viewport
    .pinch({
      noDrag: false
    })
    .wheel({
      percent: 0.0075
    })
    .drag({
      mouseButtons: "left"
    });
  // boardCanvas.viewport.on("zoomed", e => {
  //   if (boardCanvas.viewport.scaled < this.zoomLimit.min) {
  //     boardCanvas.viewport.setZoom(this.zoomLimit.min);
  //   } else if (boardCanvas.viewport.scaled > this.zoomLimit.max) {
  //     boardCanvas.viewport.setZoom(this.zoomLimit.max);
  //   }
  //   this.boardScale = e.viewport.scale.x;
  //   this.$store.commit("scaleFrameSize", e.viewport.scale.x);
  // });
  // boardCanvas.viewport.on("moved", e => {
  //   let newOffset = {
  //     x: boardCanvas.viewport.x,
  //     y: boardCanvas.viewport.y
  //   };
  //   this.offset = newOffset;
  // });

  boardCanvas.container = new Container();
  boardCanvas.stage.addChild(boardCanvas.viewport);
  boardCanvas.viewport.addChild(boardCanvas.container);
  document.getElementById('block-board').appendChild(boardCanvas.view);
  // boardCanvas.resize();  
  return boardCanvas;
}

export { initializeCanvas };
