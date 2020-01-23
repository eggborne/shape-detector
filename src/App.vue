<template>
  <div id="app">
    <Board />
    <Footer />
  </div>
</template>

<script>
import Board from './components/Board.vue';
import Footer from './components/Footer.vue';

export default {
  name: 'app',
  components: {
    Board,
    Footer
  }
}
</script>

<style>
:root {
  /* set in main.js and on resize */
  --screen-height: 10vh;
  --control-panel-width: 100vw;
  --control-panel-height: calc(var(--screen-height) * 0.2);
  --footer-height: calc(var(--screen-height) * 0.08);
  --footer-bottom: var(--control-panel-height);
  /* set in main.js and on resize */
  --canvas-x: 0;
  --canvas-y: 0;
  --canvas-width: 100vw;
  --canvas-height: calc(var(--screen-height) - var(--control-panel-height) - var(--footer-height));
  --button-height: 100%;
  --model-image-size: 0px;
  --model-array-size: 0;
  --training-history-item-size: var(--model-image-size);

  --mini-modal-width: 90vw;
  --mini-modal-height: 90vw;
  --mini-modal-top: 6rem;
  --mini-modal-right: 5vw;
  --mini-modal-header-size: 5rem;
  --modal-header-height: calc(var(--footer-height) * 1.25);

  /* --rectangle-color: #007700;
  --circle-color: #3030b6;
  --triangle-color: #997700; */


}
html {
  font-size: 16px;
  user-select: none;
}
body {
  box-sizing: border-box;
  margin: 0;
  overflow: hidden;
}
small {
  font-size: 0.65rem;
  color: #cccccc99;
}
h3 {
  margin: 0.25rem 0;
}
#drawn-image-display, #full-image-display {
  position: fixed;
  top: 5vmin;
  right: 5vmin;
  background: rgb(228, 212, 192);
  width: calc(var(--model-image-size) * 4);
  height: calc(var(--model-image-size) * 4);
  outline: 1px solid rgb(112, 105, 105);  
}
#full-image-display, #mini-image-display, #mini-label-area  {  
  background: rgb(167, 187, 167);
  top: unset;
  top: calc(var(--mini-modal-top));
  right: var(--mini-modal-right);
  width: var(--mini-modal-width);
  height: var(--mini-modal-height);
  background-color: white;
  display: grid;
  image-rendering: pixelated;
  grid-template-columns: repeat(var(--model-array-size), 1fr);
  grid-template-rows: repeat(var(--model-array-size), 1fr);
  transition: opacity 210ms ease;
  z-index: 1;
}
#full-image-display {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--mini-modal-width) / 6);
}
#full-image-display > img {
  width: 100%;
  height: 100%;
}
#mini-image-area {
  position: absolute;
  height: var(--model-image-size);  
  transform-origin: bottom left;
  left: calc(var(--model-image-size) / 4.5);
  bottom: calc((var(--model-image-size) / 4.5));
  display: flex;
}
#mini-image-display, #mini-image {
  width: var(--model-image-size);
  height: var(--model-image-size);  
  box-sizing: border-box;
  outline: calc(var(--model-image-size) / 9) solid white;
  margin-right: 0.5rem;
}
#mini-image {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
}
#mini-label-area {
  width: auto;
  height: var(--model-image-size);  
  display: grid;
  align-items: center;
  justify-items: end;
  grid-template-columns: max-content auto;
  grid-template-rows: 1fr 1fr;
  grid-row-gap: 0.5rem;
  grid-column-gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  box-sizing: border-box;
  pointer-events: all !important;
  font-size: 0.8rem;
  align-self: stretch;
  outline: calc(var(--model-image-size) / 9) solid white;

  /* display: none; */
}
#mini-label-area > div:nth-child(2n) {
  text-align: left;
  justify-self: start;
}
.label-button.mini.control-button {
  min-width: unset;
  min-height: unset;
  width: 100%;
  height: 3rem;
  cursor: pointer;
  max-width: 8rem !important;
  pointer-events: all !important;
}
.label-button.mini.control-button:first-of-type {
  background-color: var(--rectangle-color);
}
.label-button.mini.control-button:nth-of-type(2) {
  background-color: var(--circle-color);
}
.label-button.mini.control-button:nth-of-type(3) {
  background-color: var(--triangle-color);
}
#full-image-header, #full-image-footer {
  box-sizing: border-box;
  position: absolute;  
  right: var(--mini-modal-right);
  width: var(--mini-modal-width);
  height: var(--mini-modal-header-size);  
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  padding: 1em;
  z-index: 4;
}
#full-image-header {
  top: calc(var(--mini-modal-top) - var(--mini-modal-header-size));
  background: rgb(17, 20, 41);
  color: #ddd;
  font-weight: bold;
  font-size: 1.5rem;
}
#full-image-footer {
  top: calc(var(--mini-modal-top) + var(--mini-modal-height));
  background: rgb(31, 39, 31);
}
#full-image-footer > button {
  font-weight: bold;
  font-size: 1.5rem;
  height: 100%;
}
.obscured {
  opacity: 0;
  pointer-events: none;
}
/* .no-display {
  display: none;
} */
.grid-cell {
  background-color: white;
}
.grid-cell.white {
  outline: 1px solid rgb(188, 188, 188); 
}
.grid-cell.black {
  background-color: black;
  outline: 0;
}
.grid-cell.red {
  background-color: red;
  opacity: 0.5;
  outline: 0;
}
.hidden {
  opacity: 0;
  pointer-events: none;
}
#app {
  box-sizing: border-box;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: var(--screen-height);
  display: grid;
  grid-template-rows: 1fr var(--control-panel-height) var(--footer-height);
  background-color: transparent;
}
.loading-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: var(--canvas-height);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.loading-label {
  font-weight: bold;
  font-size: 1.25rem;
  animation: stretch 1600ms linear alternate-reverse infinite;
}
.loading-icon {
  width: var(--footer-height);
  height: var(--footer-height);
  animation: spin 800ms linear infinite;
  margin: calc(var(--canvas-height) / 16);
}
.shadowed-text {
  text-shadow: 
    -1px -1px 0 #00000099,  
    1px -1px 0 #00000099,
    -1px 1px 0 #00000099,
    1px 1px 0 #00000099
  ;
}
@keyframes spin {
  0% {
    transform: rotate(0) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.3);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
@keyframes stretch {
  0% {
    transform: scale(1, 1.3);
  }
  50% {
    transform: scale(1.3, 1);
  }
}
@media (orientation: landscape) {
  :root {
    --button-height: 3.5rem;    
    --control-panel-width: 12rem;
    --control-panel-height: var(--screen-height);
    --training-history-item-size: calc(var(--model-image-size) * 2);
    --footer-height: 2.5rem;
    --footer-bottom: 0;
    --canvas-x: 0;
    --canvas-y: 0;
    --canvas-height: calc(var(--screen-height) - var(--footer-height));

    --mini-modal-height: calc(var(--screen-height) - 12rem);
    --mini-modal-width: calc(var(--mini-modal-height));
    --mini-modal-top: 6rem;
    --mini-modal-right: calc(((100vw - var(--control-panel-width)) - var(--mini-modal-width)) / 2);
    --mini-modal-header-size: 5rem;
    --modal-header-height: calc(var(--footer-height) * 1.5);
  }
  #training-history-modal {
    width: 100%;
    min-height: var(--screen-height);
    right: 0;
  }
  #app {
    grid-template-rows: 1fr var(--footer-height);
    grid-template-columns: var(--control-panel-width) 1fr;
  }
}
</style>
