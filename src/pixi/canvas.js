import { Application, Container } from 'pixi.js';
import { Viewport } from "pixi-viewport";

const initializeCanvas = () =>  {
  let canvasDimensions = {
    x: parseInt( window.getComputedStyle(document.documentElement).getPropertyValue('--canvas-x')),
    y: parseInt( window.getComputedStyle(document.documentElement).getPropertyValue('--canvas-y')),
    width: 
      document.getElementById('block-board').offsetWidth,
    height: 
      document.getElementById('block-board').offsetHeight ,
  };
  console.warn("canvasDimensions", canvasDimensions);
  const boardCanvas = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    autoResize: true,
    autoDensity: true,
    resolution: window.devicePixelRatio,
  });
  boardCanvas.resize();
  boardCanvas.viewport = new Viewport({
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

  boardCanvas.container = new Container();
  boardCanvas.stage.addChild(boardCanvas.viewport);
  boardCanvas.viewport.addChild(boardCanvas.container);
  document.getElementById('block-board').appendChild(boardCanvas.view);
  // boardCanvas.resize();  
  return boardCanvas;
}

export { initializeCanvas };
