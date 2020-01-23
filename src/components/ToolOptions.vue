<template>
  <div class='tool-options'>
    <button @click='handleClickToolOption' id='shapes-rectangle-button' :class='[`tool-panel-button`, $store.state.currentTool === `shapes-rectangle` > -1 && `selected`]'></button>
    <button @click='handleClickToolOption' id='shapes-circle-button' :class='[`tool-panel-button`, $store.state.currentTool === `shapes-circle` > -1 && `selected`]'></button>          
    <button @click='handleClickToolOption' id='shapes-triangle-button' :class='[`tool-panel-button`, $store.state.currentTool === `shapes-triangle` > -1 && `selected`]'></button>          
  </div>
</template>

<script>
import Button from './Button'

export default {
  name: 'ToolOptions',
  components: {
    Button
  },
  props: {
    handleClickToolOption: Function
  },
  methods: {
  }
}
</script>

<style scoped>
.tool-options {
  position: absolute;
  /* width: var(--footer-height); */
  box-sizing: border-box;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  background: #C0C0C0;
}
.tool-panel-button {
  height: calc((var(--footer-height) * 0.8));
  width: calc((var(--footer-height) * 0.8));
  background-size: auto 90%;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
}
.tool-panel-button:not(:last-child) {
  margin-bottom: calc((var(--footer-height) * 0.1));
}
.tool-panel-button.selected {
  border-style: inset;
  background-color: rgb(183, 221, 183);
  background-size: auto 85%;
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

@media (orientation: landscape) {
  #tool-options {
    left: calc((var(--footer-height) * 0.1));
  }
}
</style>
