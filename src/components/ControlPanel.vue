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
        $store.state.shapeMode === `test` ? `Edit ${$store.state.selectedBlock ? $store.state.selectedBlock.type : ``}` : ``
      ' 
      :clickAction='
        $store.state.modalShowing === `trainingHistory` ? scanHistory : 
        $store.state.shapeMode === `label` ? labelBlock : 
        $store.state.shapeMode === `test` ? editBlock : () => null
      '
      :disabled='$store.state.modalShowing !== `trainingHistory` && !$store.state.selectedBlock'
    />
    <Button 
      id='delete-block-button' 
      type='control'
      class='danger'
      :label='`Delete ${$store.state.selectedBlock ? $store.state.selectedBlock.type : ``}`' 
      :disabled='!$store.state.selectedBlock' 
      :clickAction='deleteSelectedBlock' 
    />
    <Button 
      id='clear-button' 
      class='danger' 
      type='control' 
      :label='$store.state.modalShowing === `trainingHistory` ? `Delete ${$store.state.selectedPatterns.length || ``}` : `Clear All`' 
      :clickAction='$store.state.modalShowing === `trainingHistory` ? onClickDeleteSelectedPatterns : onClickClearAll'
      :disabled='($store.state.modalShowing === `trainingHistory` && !$store.state.selectedPatterns.length)
      || (!$store.state.modalShowing && !blockAmount)
      '
    />
    <div class='toggle-area'>
      <Button 
        id='test-mode-button' 
        type='control' 
        :label='`Test`'
        :class='[$store.state.shapeMode === `test` ? `mode-button selected` : `mode-button`]'
        :clickAction='handleChangeMode' 
      />
      <Button 
        id='label-mode-button' 
        type='control' 
        :label='`Label`'
        :class='[$store.state.shapeMode === `label` ? `mode-button selected` : `mode-button`]'
        :clickAction='handleChangeMode' 
      />
      <Button 
        id='test-mode-button' 
        type='control' 
        :label='`Compose`'
        :class='[$store.state.shapeMode === `compose` ? `mode-button selected` : `mode-button`]'
        :clickAction='handleChangeMode' 
      />
    </div>
  </div>
</template>

<script>
import Button from './Button'

export default {
  name: 'ControlPanel',
  props: {
    blockAmount: Number,
    onClickNewBlock: Function,
    trainAI: Function,
    toggleTrainingHistory: Function,
    scanHistory: Function,
    onClickClearAll: Function,
    onClickDeleteSelectedPatterns: Function,
    labelBlock: Function,
    editBlock: Function,
    handleChangeMode: Function,
    deleteSelectedBlock: Function
  },
  components: {
    Button
  }
}
</script>

<style scoped>
  #control-panel {  
    box-sizing: border-box;
    grid-row-start: 2;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    padding: 0.5rem;
    width: var(--control-panel-width);
    height: var(--control-panel-height);
    bottom: 0;
    background: #808080;
    display: grid;
    grid-column-gap: 0.5rem;
    grid-row-gap: 0.5rem;
    cursor: auto;
  }
  #control-panel {
    position: fixed;
    left: 0;
  }
  #clear-button {
    /* grid-column-start: 4; */
  }
  #draw-mode-button {
    /* grid-column-end: span 2; */
    background: rgb(65, 65, 99);
  }
  #control-panel button.control-button {
    height: var(--button-height);
    max-height: var(--button-height);
    /* font-size: calc(var(--control-panel-height) / 8); */
  }
  #control-panel button.control-button.toggled {
    background: rgb(228, 208, 118);
    color: rgb(117, 107, 107);
  }
  .toggle-area {
    border: 1px solid #00000099;
    border-radius: 0.25rem;
    /* padding: 0.5rem; */
    align-self: stretch;
    /* height: 100%; */
    grid-column-start: 4;
    grid-row-start: 1;
    grid-row-end: span 2;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-evenly;
    padding: 1rem;

  }
  .toggle-area > .mode-button {
    border: 0.35rem outset rgba(143, 125, 87, 0.85);
    background: rgb(143, 125, 87);
    min-height: unset;
    flex-grow: 1;
  }
  .toggle-area > .mode-button.selected {
    border: 0.35rem outset rgba(142, 175, 131, 0.911);
    background: rgb(142, 175, 131);
    border-style: inset;
    color: yellow;
    font-weight: bold;
  }
  button:disabled {
    background: rgb(104, 91, 91) !important;
    pointer-events: none;
    color: rgb(153, 143, 143);
    box-shadow: none;
  }
  @media (orientation: landscape) {
    #control-panel {
      grid-row-start: 1;
      grid-column-start: 1;
      grid-template-columns: unset;
      grid-template-rows: unset;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(3, min-content) 1fr;
      padding: 1rem;
      width: var(--control-panel-width);
      height: var(--screen-height);
      top: 0;
    }
    .toggle-area {
      grid-column-start: 1;
      grid-column-end: span 2;
      grid-row-start: 4;
      align-self: end;
    }
    .toggle-area > .mode-button {
      width: 100%;
    }
    .toggle-area > .mode-button:hover:not(.selected) {
      background: rgb(168, 150, 111);
    }
    .toggle-area > .mode-button:nth-of-type(2) {
      margin: 0.5rem 0;
    }
    #clear-button {
      grid-column-start: unset;
    }
  }

</style>
