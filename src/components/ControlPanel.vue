<template>
  <div id='control-panel'>    
    <Button type='control' label='Train AI' :clickAction='trainAI' :disabled='!$store.state.modelsLoaded.rectangle' />
    <Button 
      :class='$store.state.modalShowing === `trainingHistory` ? `toggled` : ``' 
      type='control' 
      label='Training History' 
      :clickAction='toggleTrainingHistory'
      :disabled='!$store.state.modelsLoaded.rectangle'
    />
    <Button 
      id='northeast-control-button' 
      type='control' 
      :label='
        $store.state.modalShowing === `trainingHistory` ? `Scan All` : 
        $store.state.shapeMode === `label` ? `Add Label` : 
        $store.state.shapeMode === `compose` ? `Edit Block` : ``
      ' 
      :clickAction='
        $store.state.modalShowing === `trainingHistory` ? scanHistory : 
        $store.state.shapeMode === `label` ? labelBlock : 
        $store.state.shapeMode === `compose` ? editBlock : () => null
      '
      :disabled='$store.state.modalShowing !== `trainingHistory` && !$store.state.selectedBlock'
    />
    <Button 
      id='draw-mode-button' 
      type='control' 
      :label='`Mode: ${$store.state.shapeMode}`' 
      :clickAction='() => $store.commit(`changeShapeMode`, $store.state.shapeMode === `label` ? `compose` : `label`)' 
    />
    <Button 
      id='clear-button' 
      class='danger' 
      type='control' 
      :label='$store.state.modalShowing === `trainingHistory` ? `Delete ${$store.state.selectedPatterns.length || ``}` : `Clear All`' 
      :clickAction='$store.state.modalShowing === `trainingHistory` ? onClickDeleteSelected : onClickClearAll'
      :disabled='($store.state.modalShowing === `trainingHistory` && !$store.state.selectedPatterns.length)
      || (!$store.state.modalShowing && !$store.state.blocks.length)
      '
    />
  </div>
</template>

<script>
import Button from './Button'

export default {
  name: 'ControlPanel',
  props: {
    onClickNewBlock: Function,
    trainAI: Function,
    toggleTrainingHistory: Function,
    scanHistory: Function,
    onClickClearAll: Function,
    onClickDeleteSelected: Function,
    labelBlock: Function,
    editBlock: Function
  },
  components: {
    Button
  }
}
</script>

<style scoped>  
  #control-panel {
    background: #808080;
    display: grid;
    grid-column-gap: 0.5rem;
    grid-row-gap: 0.5rem;
    cursor: auto;
  }
  #control-panel button.control-button {
    height: var(--button-height);
    min-height: var(--button-height);
    max-height: var(--button-height);
    /* font-size: calc(var(--control-panel-height) / 8); */
  }
  #control-panel button.control-button.toggled {
    background: rgb(228, 208, 118);
    color: rgb(117, 107, 107);
  }
  button:disabled {
    background: rgb(104, 91, 91) !important;
    pointer-events: none;
    color: rgb(153, 143, 143);
    box-shadow: none;
  }
</style>
