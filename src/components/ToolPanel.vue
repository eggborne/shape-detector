<template>
  <div id='tool-panel'>
    <div class='tool-buttons'>
      <div class='tool-button-container'>
        <button @click='handleClickToolButton' id='pencil-button' :class='[`tool-panel-button`, $store.state.currentTool.indexOf(`pencil`) > -1 && `selected`]'></button>
      </div>
      <div v-if='$store.state.shapeMode === `compose`' class='tool-button-container'>
        <button @click='handleClickToolButton' id='rectangle-button' :class='[`tool-panel-button`, $store.state.currentTool === `rectangle` && `selected`]'></button>
      </div>
      <div v-if='$store.state.shapeMode === `compose`' class='tool-button-container'>
        <button @click='handleClickToolButton' id='circle-button' :class='[`tool-panel-button`, $store.state.currentTool === `circle` && `selected`]'></button>          
      </div>
      <div v-if='$store.state.shapeMode === `compose`' class='tool-button-container'>
        <button @click='handleClickToolButton' id='triangle-button' :class='[`tool-panel-button`, $store.state.currentTool === `triangle` && `selected`]'></button>          
      </div>
      <div :style='{marginLeft: `0.5rem`}' class='tool-button-container'>
        <button @click='handleClickToolButton' id='move-button' :class='[`tool-panel-button`, $store.state.currentTool.indexOf(`move`) > -1 && `selected`]'></button>
      </div>
        <!-- <button @click='handleClickToolButton' 
          id='shapes-button' 
          :class='[$store.state.currentTool, `tool-panel-button`, $store.state.currentTool.indexOf(`shapes`) > -1 && `selected`]'
        >
        </button>
        <ToolOptions
          v-if='$store.state.currentTool === `shapes`'        
          :handleClickToolOption='handleClickToolOption'
        /> -->
    </div>
    
    <div v-show='true ||  [`pencil`, `move`, `shapes`].includes($store.state.currentTool)'>{{ $store.state.currentTool }} ({{ $store.state.hotKeys[$store.state.currentTool] || 'Space' }})</div>
    
    <div id='panel-end'>
      <!-- <button @click='handleClickToolButton' id='auto-close-button' :class='[`tool-panel-button`, $store.state.autoCloseShapes && `selected`]'>
        AUTO COMPLETE
      </button>    -->
      <button v-if='$store.state.shapeMode === `compose`' @click='handleClickToolButton' id='auto-shapes-button' :class='[`tool-panel-button`, $store.state.autoShapes && `selected`]'>
        DETECT SHAPE 
      </button>
      <button @click='handleClickToolButton' id='grid-button' :class='[`tool-panel-button`, $store.state.gridMode && `selected`]'></button>    
    </div>
  </div>
</template>

<script>
import Button from './Button'
import ToolOptions from './ToolOptions'

export default {
  name: 'ToolPanel',
  components: {
    Button,
    ToolOptions
  },
  props: {
    onClickZoom: Function,
    handleClickToolButton: Function,
    handleClickToolOption: Function
  },
  methods: {
  }
}
</script>

<style scoped>
#tool-panel {
  position: fixed;
  width: calc(100vw - (var(--footer-height) * 0.2));
  height: var(--footer-height);
  box-sizing: border-box;
  bottom: var(--footer-bottom);
  padding: 0 calc((var(--footer-height) * 0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
  pointer-events: none;
}
.tool-buttons {
  display: flex;
}
.tool-button-container {
  position: relative; 
  background: blue;
  pointer-events: all;
}
#panel-end {
  justify-self: flex-end;
  max-height: var(--footer-height);
  display: flex;
  pointer-events: all;
}
#panel-end > button {
  background-color: #ccc;
  outline: calc((var(--footer-height) * 0.1)) outset rgb(209, 209, 209);
}
#panel-end > button:not(:last-child) {
  margin-right: calc((var(--footer-height) * 0.2));
}
#panel-end > button.selected {
  outline-style: inset;
  transform: scale(0.95);
  background-color: rgb(183, 221, 183);
}
.tool-panel-button {
  height: calc((var(--footer-height) * 0.8));
  width: calc((var(--footer-height) * 0.8));
  background-size: auto 90%;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
}
.tool-button-container:not(:last-child) {
  margin-right: calc((var(--footer-height) * 0.1));
}
.tool-panel-button.selected {
  border-style: inset;
  background-color: rgb(183, 221, 183);
  background-size: auto 85%;
}
#pencil-button {
  background-image: url(../assets/cursors/pencil.png);    
}
#move-button {
  background-image: url(../assets/cursors/move.png);    
}
#shapes-button {
  background-image: url(../assets/icons/shapesicon.png);
}
#rectangle-button {
  background-image: url(../assets/icons/rectanglebutton.png);
  background-size: 70%;
}
#circle-button {
  background-image: url(../assets/icons/circlebutton.png);
  background-size: 70%;
}
#triangle-button {
  background-image: url(../assets/icons/trianglebutton.png);
  background-size: 70%;
}
#grid-button {
  background-image: url(../assets/icons/gridicon.png);
}
#auto-shapes-button, #auto-close-button {
  /* box-sizing: border-box; */
  position: relative;  
  width: calc(var(--footer-height) * 1.5);
  font-weight: bold;
  color: rgb(41, 41, 41);
  font-size:  calc((var(--footer-height) * 0.2));
}
button:disabled {
  background: transparent !important;
  border-color: transparent !important;
  outline-color: transparent !important;
  pointer-events: none;
  color: rgb(153, 143, 143);
  box-shadow: none;
}
.tool-options {
  position: absolute;
}

@media (orientation: landscape) {
  #tool-panel {
    width: calc(100vw - var(--control-panel-width));
    left: var(--control-panel-width);
  }
  .tool-options {
    position: absolute;
    bottom: var(--footer-height);
    lefT: 0;
  }
}
</style>
