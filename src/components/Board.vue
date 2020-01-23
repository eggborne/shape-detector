<template>
  <div 
    :class='[
      !$store.state.modalShowing ? $store.state.currentTool : ``,
      $store.state.shapeMode
    ]' 
    id='block-board' 
    class="board"
  >
    <div id='board-background'
      :style='{
        backgroundSize: `calc(${$store.state.gridCellSize * boardScale}px)`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
        imageRendering: boardScale > 2 ? `pixelated` : ``,
        opacity: this.$store.state.gridMode ? 0.5 : $store.state.shapeMode === `compose` ? 0.15 : 0.25
      }'
    ></div>
    <div v-show='$store.state.shapeMode !== `compose`' class='ai-status-label' :class='[`board-label`, AILoaded ? `highlighted` : ``]'>{{
      `Neural Network ${AILoaded ? 'ready' : 'loading...'}`
    }}</div>
    <div v-if='$store.state.shapeMode === `test` && $store.state.showDetectionStats' class='board-label ai-prediction-label'>
      <ShapeResult :shapeType='`rectangle`' :bestPermutation='bestPermutation' :ruledOut='!$store.state.currentPrediction.rectangular'/>
      <ShapeResult :shapeType='`circle`' :bestPermutation='bestPermutation' :ruledOut='!$store.state.currentPrediction.circular'/>
      <ShapeResult :shapeType='`triangle`' :bestPermutation='bestPermutation' :ruledOut='!$store.state.currentPrediction.triangular'/>    
    </div>
    <div 
    :class='[
      `board-label`, 
      `db-message`, 
      this.DBMessage ? this.DBMessage.indexOf(`...`) > -1 ? `saving` : `` : `obscured`
    ]'>{{
      `${this.DBMessage}`
    }}</div>
    <ControlPanel 
      :blockAmount='blocks.length'
      :onClickNewBlock='handleClickNewBlock' 
      :toggleTrainingHistory='toggleTrainingHistory'
      :trainAI='trainAI'
      :scanHistory='scanHistory'
      :onClickClearAll='handleClickClearAll'
      :onClickDeleteSelectedPatterns='handleClickDeleteSelectedPatterns'
      :labelBlock='labelBlock'
      :editBlock='editBlock'
      :handleChangeMode='handleChangeMode'
      :deleteSelectedBlock='deleteSelectedBlock'
    />    
    <TrainingHistoryScreen
      v-if='$store.state.modalShowing === `trainingHistory`'
    />
    <div v-show='$store.state.shapeMode !== `compose`' :class='[$store.state.shapeMode]' id='mini-image-area'>
      <img v-show='$store.state.currentPrediction.imageUrl' id='mini-image' :src='$store.state.currentPrediction.imageUrl' />
      <div id='mini-image-display'></div>
      <div v-if='$store.state.shapeMode === `test`' id='mini-label-area'>
        <div>Sharpest angle: </div>
        <div>{{ $store.state.currentPrediction.rectangular.sharpestAngle || 0 }}</div>
        <!-- <div>Sharp angles: {{ $store.state.currentPrediction.rectangular.numberOfSharpAngles }}</div> -->
        <div>Roundness: </div>
        <div>{{ 100 - $store.state.currentPrediction.circular.totalDiffPercent || 0 }}%</div>
        <!-- <div>Sharp angles: {{ $store.state.currentPrediction.circular.largestDiffPercent }}</div> -->
      </div>
    </div>
    <div v-if='$store.state.shapeMode === `compose`' :class='[$store.state.shapeMode]' id='mini-map'>

    </div>
    
    <div v-if='$store.state.selectedBlock' :class='$store.state.miniModalShowing === `labelShape` ? `` : `obscured`' id='full-image-display'>
      <img :src='$store.state.gridImage' />
    </div>
    <footer :class='$store.state.miniModalShowing ===`labelShape` ? `` : `obscured`' id='full-image-header'>
      What is this?
    </footer>
    <footer :class='$store.state.miniModalShowing ===`labelShape` ? `` : `obscured`' id='full-image-footer'>
      <Button id='identify-rectangle-button' class='label-button' type='control' label='Rectangle' :clickAction='() => addNewTrainingPattern(`rectangle`, this.$store.state.gridModelArray, `rectangle`, 1)' />
      <Button id='identify-circle-button' class='label-button' type='control' label='Circle' :clickAction='() => addNewTrainingPattern(`rectangle`, this.$store.state.gridModelArray, `circle`, 1)' />
      <Button id='identify-triangle-button' class='label-button' type='control' label='Triangle' :clickAction='() => { addNewTrainingPattern(`rectangle`, this.$store.state.gridModelArray, `triangle`, 1); }' />
    </footer>
    <!-- </div> -->
    <!-- <div id='board-buttons'> -->
      <!-- <button @click='() => onClickZoom(`out`)' id='zoom-out-button' :class='[`board-button`]'>-</button>
      <button @click='() => onClickZoom(`in`)' id='zoom-in-button' :class='[`board-button`]'>+</button> -->
    <!-- </div> -->
    <ToolPanel 
      :handleClickToolButton='handleClickToolButton'
      :handleClickToolOption='handleClickToolOption'
    />
    <!-- <canvas :width='800' :height='200' id='board-canvas'></canvas> -->
  </div>
</template>

<script>
import ControlPanel from './ControlPanel';
import Button from './Button.vue';
import ToolPanel from './ToolPanel.vue';
import { Application, Container, Loader, utils } from 'pixi.js';
import { initializeCanvas } from '../pixi/canvas.js';
import { blockCreator, pointAtAngle, angleOfPointABFromXY, distanceFromABToXY, degToRad, radToDeg } from '../scripts/blockcreator.js';
import ShapeResult from './ShapeResult.vue';
import ShapeScanner from '../scripts/ai.js';
import TrainingHistoryScreen from './TrainingHistoryScreen.vue';
import * as DB from '../scripts/api.js';
import html2canvas from 'html2canvas';

let spinInterval;
let loader;
let imgUrl;
let knobUrl;

window.TOUCHES = [];
window.IMAGE_LOADER = new Loader();
window.IMAGE_LOADER
    // .add('drawicon', require('../assets/icons/drawicon.png'))
  .add('pixel', require('../assets/pixel.png'))
  .add('knob', require('../assets/knob.png'))
  .load((e) => {
    console.log('loaded images.')
});
window.SPACE_DOWN = false;

let showKnobs = false;

const isKey = (event, hotKey) => {
  return event.key === hotKey.key || event.code === hotKey.code;
}

export default {
  name: 'Board',
  components: {
    ControlPanel,
    Button,
    ToolPanel,
    ShapeResult,
    TrainingHistoryScreen
  },
  data: () => ({
    cells: {
      filled: [],
      currentStroke: []
    },
    blocks: [],
    boardCanvas: undefined,
    blockCreator: undefined,
    aiType: undefined,
    DBMessage: '',
    AILoaded: false,    
    scanners: {},
    boardScale: 1,
    offset: { x: 0, y: 0 },
    zoomLimit: { min: 0.25, max: 5 },
    bestPermutation: {
      permType: undefined,
      shapeType: undefined
    },
    blockTouched: false
  }),
  // created () {
    
  // },
  mounted () {
    this.boardCanvas = initializeCanvas();
    this.boardCanvas.touchManager = this.boardCanvas.renderer.plugins.interaction;
    this.boardCanvas.touchManager.on('pointerdown', this.handleWindowTouchDown);
    this.boardCanvas.touchManager.on('pointermove', this.handleWindowTouchMove);
    this.boardCanvas.touchManager.on('pointerup', this.handleWindowTouchUp);
    this.boardCanvas.viewport.on('zoomed', e => {
      if (this.boardCanvas.viewport.scaled < this.zoomLimit.min) {
        this.boardCanvas.viewport.setZoom(this.zoomLimit.min);
      } else if (this.boardCanvas.viewport.scaled > this.zoomLimit.max) {
        this.boardCanvas.viewport.setZoom(this.zoomLimit.max);
      }
      this.boardScale = e.viewport.scale.x;
      this.$store.commit('scaleFrameSize', e.viewport.scale.x);
      console.log('we is', this.$store.state.junctures)
      this.$store.state.junctures.map(junct => {
        console.log('on junct', junct.width, junct.height)
        junct.width = (this.$store.state.frameKnobSize * 1.5);
        junct.height = (this.$store.state.frameKnobSize * 1.5);
        console.log('now', junct.width, junct.height)
      })
    });
    this.boardCanvas.viewport.on('moved', e => {
      let newOffset = {
        x: this.boardCanvas.viewport.x,
        y: this.boardCanvas.viewport.y
      };
      this.offset = newOffset;
    });

    // this.boardCanvas.renderer.resizeTo = document.getElementById('block-board');

    // boardCanvas.touchManager.interactionFrequency = this.$store.state.printInterval;
    // boardCanvas.touchManager.interactionFrequency = 1;

    document.documentElement.style.setProperty('--model-image-size', this.$store.state.modelImageSize + 'px');
    document.documentElement.style.setProperty('--model-array-size', this.$store.state.modelImageSize);
    document.documentElement.style.setProperty('--rectangle-color',this.$store.state.shapeColors.rectangle);
    document.documentElement.style.setProperty('--circle-color', this.$store.state.shapeColors.circle);
    document.documentElement.style.setProperty('--triangle-color', this.$store.state.shapeColors.triangle);

    window.addEventListener('keydown', (e) => {
      console.error('pressed', e.key)
      const hotKeys = this.$store.state.hotKeys;
      const formerTool = this.$store.state.currentTool + '';
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
      }
      if (isKey(e, hotKeys.holdToSelectMoveTool)) {
        if (this.$store.state.currentTool !== 'move') {
          this.boardCanvas.viewport.threshold = 0;
          if (this.$store.state.currentTool.indexOf('move-holding') === -1) {
            this.$store.commit('setCurrentTool', 'move-holding')
          }
        }
      }
      if (isKey(e, hotKeys.selectMoveTool)) {
        this.boardCanvas.viewport.threshold = 0;
        if (this.$store.state.currentTool !== 'move') {
          this.handleClickToolButton('move');
        }
      }
      if (isKey(e, hotKeys.selectPencilTool)) {
        if (this.$store.state.currentTool !== 'pencil') {
          this.handleClickToolButton('pencil');
        }
      }
      if (isKey(e, hotKeys.selectRectangle)) {
        if (this.$store.state.currentTool !== 'rectangle') {
          this.handleClickToolButton('rectangle');
        }
      }
      if (isKey(e, hotKeys.selectCircle)) {
        if (this.$store.state.currentTool !== 'circle') {
          this.handleClickToolButton('circle');
        }
      }
      if (isKey(e, hotKeys.selectTriangle)) {
        if (this.$store.state.currentTool !== 'triangle') {
          this.handleClickToolButton('triangle');
        }
      }
      if (isKey(e, hotKeys.toggleGridMode)) {
        this.$store.commit('setGridMode', !this.$store.state.gridMode)
      }
    });
    window.addEventListener('keyup', (e) => {
      const hotKeys = this.$store.state.hotKeys;
      if (this.$store.state.currentTool !== 'move' && isKey(e, hotKeys.holdToSelectMoveTool) && !this.boardCanvas.viewport.threshold) {
        this.boardCanvas.viewport.threshold = 1000;
        this.$store.commit('setCurrentTool', this.$store.state.previousTool)
      };
    });

    this.shapeScanner = new ShapeScanner('NeuralNetwork', [
      { attributeName: 'rectangle', modelId: 1, gridSize: this.$store.state.modelImageSize },
      { attributeName: 'circle', modelId: 3, gridSize: this.$store.state.modelImageSize }
    ]);
    this.$store.commit('setReady', true);
    // this.shapeScanner.updateModels().then(() => this.AILoaded = true );
    this.shapeScanner.updateModel('rectangle').then(rectangleLoaded => {
      if (rectangleLoaded) {
        this.AILoaded = true;
        this.$store.commit('setModelsLoaded', 'rectangle')
      }
    });
    setTimeout(() => {
      // this.getPatterns();      
    }, 1000);
  },
  computed: {
    currentPrediction: function() {
      return this.$store.state.currentPrediction;
    }
  },
  methods: {    
    labelBlock() {
      this.$store.commit('setMiniModalShowing', 'labelShape');
    },
    editBlock() {
      console.warn('CLICKED TO EDIT BLOCK!!')
    },
    onClickZoom(direction, amount=0.1) {
      if (direction === 'out') {
        this.boardCanvas.stage.scale.x -= amount;                  
        this.boardCanvas.stage.scale.y -= amount;
      } else {
        this.boardCanvas.stage.scale.x += amount;                
        this.boardCanvas.stage.scale.y += amount;                
      }
      let newScale = this.boardCanvas.stage.scale.x;
      this.boardScale = newScale;
    },
    handleChangeMode(e) {
      console.log('e', e);
      const newMode = e.target.innerText.toLowerCase();
      console.log(newMode)
      this.handleClickClearAll();
      this.$store.commit(`changeShapeMode`, newMode);
    },
    async getPatterns() {
      // let newPatterns = {...this.$store.state.trainingPatterns};
      let gotPatterns = await this.shapeScanner.getTrainingPatterns();
      for (let attributeName in gotPatterns) {
        gotPatterns[attributeName].map(entry => {
          entry.imageUrl = 'data:image/png;base64,' + entry.imageUrl;            
        });
      }
      console.warn('GOT TRAINING', gotPatterns)
      this.$store.commit('setTrainingPatterns', gotPatterns);;
      return gotPatterns;
    },
    async addNewTrainingPattern(attributeName, modelArray, feature, value) {
      if (!this.$store.state.trainingPatterns.rectangle.length) {
        await this.getPatterns();
      }      
      let currentPatterns = [ ...this.$store.state.trainingPatterns.rectangle ];      
      const originalGrid = [...modelArray];
      const ioObj = this.shapeScanner.condenseIOFromGridArray(originalGrid, feature, value);
      if (ioObj.input) {
        let sent;
        let newPattern = {
          ioObj,
          gridSize: this.$store.state.modelImageSize,
          // originalGrid,        
          id: Date.now(),
          imageUrl: this.$store.state.gridImage
        }
        currentPatterns.push(newPattern);
        currentPatterns = currentPatterns.sort((a, b) => b.id - a.id);
        this.$store.commit('setTrainingPatterns', {rectangle: currentPatterns});
        this.$store.commit('setMiniModalShowing', undefined);      
        this.DBMessage = 'Saving...';
        let modelId = this.shapeScanner.nets[attributeName].modelId;
        sent = await DB.saveTrainingPatterns(modelId, currentPatterns);
        this.DBMessage = 'Saved training pattern!';
      } else {
        this.DBMessage = 'I/O was bad';
      }
      this.deleteSelectedBlock();
      setTimeout(() => {
        this.DBMessage = '';
      }, 1500);
    },
    async deleteSelectedBlock() {
      this.boardCanvas.container.removeChild(this.$store.state.selectedBlock);
      this.boardCanvas.container.removeChild(this.$store.state.selectedBlock.frame);
      this.$store.commit('setDrawnShapeImage', undefined);
      this.$store.commit('setGridModelArray');
      this.$store.commit('setGridImage');
      this.blocks = this.blocks.splice(this.blocks.indexOf(this.$store.state.selectedBlock), 1);
      this.$store.commit('changeSelectedBlock', undefined);
      this.$store.commit('setCurrentPrediction');
      document.getElementById('mini-image-display').innerHTML = '';
    },
    async trainAI(e, attributeName=this.$store.state.currentAttribute) {
      // attributeName = 'circle';
      const currentPatterns = JSON.parse(JSON.stringify(this.$store.state.trainingPatterns));
      const preparedIoList = [];
      currentPatterns[attributeName].forEach(pat => {
        preparedIoList.push(pat.ioObj);
      });
      this.DBMessage = 'Training...';
      let trained = await this.shapeScanner.trainScanner(preparedIoList, attributeName);
      this.DBMessage = 'Trained!';
      setTimeout(() => {
        this.DBMessage = '';
      }, 1000);
      let modelSaved = await this.shapeScanner.saveModel(attributeName);
    },
    handleClickClearAll() {
      this.boardCanvas.container.removeChildren();
      this.$store.commit('setElements', 'blocks');
      this.$store.commit('setElements', 'connectors');
      this.cells = { filled: [], currentStroke: [] };
      blockCreator.frameContainer = undefined;
      if (this.$store.state.selectedBlock) {
        this.$store.commit('changeSelectedBlock', undefined);
      }
      this.$store.commit('setDrawnShapeImage', undefined);
      this.$store.commit('setGridModelArray');
      this.$store.commit('setGridImage');
      document.getElementById('mini-image-display').innerHTML = '';
      this.$store.commit('setCurrentLikely');
      this.$store.commit('setCurrentPrediction');
      this.blocks = [];
    },
    async handleClickDeleteSelectedPatterns() {
      const patternIds = this.$store.state.selectedPatterns;
      let currentPatterns = JSON.parse(JSON.stringify(this.$store.state.trainingPatterns));
      currentPatterns.rectangle = currentPatterns.rectangle.filter(p => !patternIds.includes(p.id));
      this.$store.commit('setTrainingPatterns', currentPatterns);
      this.DBMessage = 'Deleting...';
      let sent;
      if (process.env.NODE_ENV === "development") {
        sent = await DB.saveTrainingPatterns(this.$store.state.modelId, currentPatterns.rectangle);
      } else {
        sent = true;
      }
      if (sent) {
        this.DBMessage = `Deleted ${patternIds.length} training pattern${patternIds.length > 1 ? 's' : ''}.`;
        this.$store.commit('setSelectedPatterns', []);
        setTimeout(() => {
          this.DBMessage = '';
        }, 1500);
      }
    },
    handleClickNewBlock () {
      
    },
    async toggleTrainingHistory () {
      this.$store.commit('setModalShowing', this.$store.state.modalShowing === 'trainingHistory' ? undefined : 'trainingHistory');
      if (!this.$store.state.trainingPatterns.rectangle.length) {
        const gotPatterns = await this.getPatterns();
        if (gotPatterns) {
          console.warn('GOT PATTERNS after toggle >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', gotPatterns)
        }
      }
    },
    handleSpawnBlock(posX, posY, width, height) {
      let newBlock = blockCreator.spawnBlock(posX, posY, width, height, this.$store.state.blockBorderRadius);
      newBlock.imageUrl = this.$store.state.gridImage;
      this.boardCanvas.container.addChild(newBlock);
      this.blocks.push(newBlock);
      return newBlock;
    },
    handleSpawnPoly(color) {
      let points = [];
      blockCreator.frameContainer.children.sort((b, a) => b.index - a.index).forEach((knob, k, arr) => {
        if (knob.type === 'frameKnob') {
          let canvasX = Math.round(knob.x);
          let canvasY = Math.round(knob.y);
          points.push(canvasX, canvasY);
        }
      });
      let newPoly = blockCreator.spawnPolygon(points, color);
      newPoly.points = points;
      this.boardCanvas.container.addChild(newPoly);
      this.blocks.push(newPoly);
      return newPoly;
    },
    handleSpawnCell(posX, posY) {
      let cellPos = this.closestGridNode({ x: posX, y: posY }, 'down');
      let lastCell = this.cells.currentStroke[this.cells.currentStroke.length-1] ||
      this.cells[this.cells.length - 1] || undefined; 
      let shouldPrint = !lastCell || this.cells.filled.filter(cell => cell.x === cellPos.x && cell.y === cellPos.y).length === 0;
      if (shouldPrint) {        
        let newCell = blockCreator.spawnCell(cellPos.x, cellPos.y, this.$store.state.gridCellSize+1);
        // this.boardCanvas.container.addChild(newCell);
        this.cells.currentStroke.push(newCell);
        this.cells.filled.push(newCell)
      }
    },
    handleSpawnFrameKnob (posX, posY, width, visible) {      
      let lineAngle = 0;
      if (!blockCreator.frameContainer) {
        let newFrame = blockCreator.createFrame();
        this.boardCanvas.container.addChild(newFrame);
      }
      let lastPrinted = this.$store.state.lastPrintedKnob;      
      let newIndex = blockCreator.frameContainer.children.length;
      let newFrameKnob = blockCreator.spawnFrameKnob(posX, posY, this.$store.state.frameKnobSize, visible);
      newFrameKnob.index = newIndex;
      if (blockCreator.frameContainer.children.length > 1) {
        let newConnector = blockCreator.spawnLine(posX, posY, lastPrinted.posX, lastPrinted.posY, this.$store.state.frameLineSize);
        lineAngle = newConnector.rotation;
        // let lastAngle = blockCreator.frameContainer.children[blockCreator.frameContainer.children.length - 3].angle || 0;
        // blockCreator.frameContainer.children[blockCreator.frameContainer.children.length - 1].angleChange = 
        //   lineAngle - lastAngle;
        newConnector.index = newIndex;
      }
      this.$store.commit('setLastPrintedKnob', {printTime: Date.now(), posX: posX, posY: posY, angle: lineAngle});
      if (this.$store.state.gridMode) {
        // this.handleSpawnCell(eventX, eventY);
      }
    },
    handleSecondTouch(e) {
      
    },
    handleWindowTouchDown(e) {
      if (this.$store.state.miniModalShowing) {
        this.$store.commit('setMiniModalShowing', undefined);
      }
      const newTouchId = e.data.identifier;
      const eventX = Math.round(e.data.originalEvent.clientX) || Math.round(e.data.originalEvent.changedTouches[0].clientX);
      const eventY = Math.round(e.data.originalEvent.clientY) || Math.round(e.data.originalEvent.changedTouches[0].clientY);
      
      window.TOUCHES.push({
        id: newTouchId,
        startingX: eventX,
        startingY: eventY,
        touchedObj: e.target,
        currentlyOver: e.target,
        eventX,
        eventY
      });
      if (window.TOUCHES.length === 1) {
        if (!e.target.type && this.$store.state.currentTool === 'pencil' && this.$store.state.drawMode === 'frame') {          
          this.handlePencilDown(eventX, eventY);
        }
      } else {
        if (this.$store.state.currentTool === 'pencil') {
          this.handleLiftPencil(window.TOUCHES[0].id);
          window.TOUCHES = [];
        }
      }
      if (e.target.type) {     
        if (e.target.type === 'block') {
          this.handleTouchBlock(e.target);
          return;
        }
        if (e.target.type === 'juncture') {
          this.handleTouchJuncture(e.target);
          return;
        }
      }      
    },
    async handleWindowTouchMove (e) {
      if (window.TOUCHES.length === 1) {
        if (this.$store.state.currentTool === 'pencil') {
          const newTouchId = e.data.identifier;
          const currentIndex = window.TOUCHES.findIndex(t => t.id === newTouchId);
          const currentTouch = window.TOUCHES[currentIndex];
          let eventX = Math.round(e.data.originalEvent.clientX) || Math.round(e.data.originalEvent.changedTouches[0].clientX);
          let eventY = Math.round(e.data.originalEvent.clientY) || Math.round(e.data.originalEvent.changedTouches[0].clientY);          
          currentTouch.posX = eventX;
          currentTouch.posY = eventY;
          if (window.TOUCHES[0].touchedObj && window.TOUCHES[0].touchedObj.type === 'juncture') {
            if (e.target.type && e.target.type === 'juncture' && window.TOUCHES[0].currentlyOver && window.TOUCHES[0].currentlyOver.type !== 'juncture'
            && e.target.owner !== window.TOUCHES[0].touchedObj.owner) {
              this.handleMoveOntoJuncture(e.target);
            } else if ((!e.target.type || e.target.type !== 'juncture') && 
            window.TOUCHES[0].currentlyOver !== window.TOUCHES[0].touchedObj && window.TOUCHES[0].currentlyOver.type === 'juncture') {
              this.handleMoveOffOfJuncture(window.TOUCHES[0].currentlyOver);              
            }
          } else {
            this.handleMovePencil(currentTouch, eventX, eventY)
          }
          window.TOUCHES[0].currentlyOver = e.target;
        } 
        if (this.$store.state.currentTool === 'move') {
          
        } 
      }
    },
    async handleWindowTouchUp (e) {
      const newTouchId = e.data.identifier;
      const currentIndex = window.TOUCHES.findIndex(t => t.id === newTouchId);
      const currentTouch = window.TOUCHES[currentIndex];
      let eventX = Math.round(e.data.originalEvent.clientX) || Math.round(e.data.originalEvent.changedTouches[0].clientX);
      let eventY = Math.round(e.data.originalEvent.clientY) || Math.round(e.data.originalEvent.changedTouches[0].clientY);
      if (window.TOUCHES.filter(t => t.id === newTouchId).length) {
        if (this.$store.state.currentTool === 'pencil') {
          if (window.TOUCHES[0].touchedObj.type) {
            if (window.TOUCHES[0].touchedObj.type === 'juncture') {
              this.handleReleaseJuncture(window.TOUCHES[0].touchedObj);
              let notSelected = this.blocks.filter(b => this.$store.state.selectedBlock !== b);
              if (this.$store.state.shapeMode === 'compose') {
                blockCreator.hideAllJunctures(notSelected);            
              }
            }
            if (e.target.type) {
              if (e.target.type === 'juncture') {
                this.handleReleaseJuncture(e.target);
              }
            }
          }
          this.handleLiftPencil(currentTouch, eventX, eventY);
          
        }
        if (this.$store.state.currentTool.indexOf('move') > -1) {
          this.handleLiftPanTool(newTouchId);
        }
        window.TOUCHES = window.TOUCHES.filter(t => t.id !== newTouchId);
      }
      this.blockTouched = false;
    },
    handlePencilDown(eventX, eventY) {
      const worldEvent = this.boardCanvas.viewport.toWorld(eventX, eventY);
      eventX = worldEvent.x;
      eventY = worldEvent.y;
      this.handleSpawnFrameKnob(eventX, eventY, this.$store.state.frameKnobSize, (this.$store.state.showKnobs && !this.$store.state.gridMode));            
      this.$store.commit('setKnobPath');
      if (this.$store.state.selectedBlock) {
        blockCreator.unHighlightBlock(this.$store.state.selectedBlock, this.$store.state.shapeMode === 'compose')
        this.$store.commit('changeSelectedBlock', undefined);
      }
      this.$store.commit('setCurrentLikely');
      this.$store.commit('setCurrentPrediction');
    },
    handleMovePencil(receivedTouch, eventX, eventY, totalDistance) {
      const worldEvent = this.boardCanvas.viewport.toWorld(eventX, eventY);
      const worldCurrent = this.boardCanvas.viewport.toWorld(receivedTouch.posX, receivedTouch.posY);
      const worldStarting = this.boardCanvas.viewport.toWorld(receivedTouch.startingX, receivedTouch.startingY);  
      eventX = worldEvent.x;
      eventY = worldEvent.y;
      const currentTouch = {
        posX: worldCurrent.x,
        posY: worldCurrent.y,
        startingX: worldStarting.x,
        startingY: worldStarting.y,
        touchedObj: window.TOUCHES[0].touchedObj,
      };
      window.TOUCHES[0].posX = currentTouch.posX;
      window.TOUCHES[0].posY = currentTouch.posY;
      if (this.$store.state.drawMode === 'frame') {        
        const totalDistance = {
          x: Math.abs(currentTouch.startingX - eventX),
          y: Math.abs(currentTouch.startingY - eventY)
        }
        let shapeIncomplete = !this.$store.state.completedShape;
        const completeShapeDistance = this.$store.state.frameKnobSize;
        const frameOkay = blockCreator.frameContainer && blockCreator.frameContainer.children.length > 6;
        const inCompletionRange = (totalDistance.x < completeShapeDistance && totalDistance.y < completeShapeDistance);
        if (frameOkay && !shapeIncomplete && !inCompletionRange) {
          let lastLine = blockCreator.frameContainer.children.filter(piece => piece.type === 'finishing-line')[0];
          blockCreator.frameContainer.removeChild(lastLine);
          blockCreator.colorFrame(lastLine.originalTint, 'line');
          blockCreator.colorFrame(lastLine.originalTint, 'frameKnob');
          this.$store.commit('setCompletedShape', false);
          shapeIncomplete = true;
        }
        const lastPrinted = this.$store.state.lastPrintedKnob;
        const lastPrintedWorld = this.boardCanvas.viewport.toWorld(lastPrinted.posX, lastPrinted.posY);
        const sincePrinted = Date.now() - lastPrinted.printTime;
        const timeOkay = sincePrinted >= this.$store.state.printInterval;
        if (timeOkay && shapeIncomplete) {
          // let movedX = Math.abs(lastPrintedWorld.x - eventX);
          // let movedY = Math.abs(lastPrintedWorld.y - eventY);
          let movedX = Math.abs(lastPrinted.posX - eventX);
          let movedY = Math.abs(lastPrinted.posY - eventY);
          let minMovementDistance = this.$store.state.frameKnobSize * this.$store.state.printSpacing;
          let angleAway = angleOfPointABFromXY(lastPrinted.posX, lastPrinted.posY, eventX, eventY);
          const lastAngle = lastPrinted.angle;
          const angleDifference = Math.abs(lastAngle - (angleAway - Math.PI / 2));
          const angleChanged = angleDifference > degToRad(80);
          const actualLineSize = this.$store.state.frameLineSize;
          const movedMin = (movedX >= minMovementDistance || movedY >= minMovementDistance) && ((totalDistance.x >= actualLineSize || totalDistance.y >= actualLineSize) 
          && (movedX >= actualLineSize || movedY >= actualLineSize));
          const movedEnough = (movedMin) || 
          ((totalDistance.x >= minMovementDistance || totalDistance.y >= minMovementDistance) 
          && (movedX >= minMovementDistance || movedY >= minMovementDistance));
          let straightDistance = distanceFromABToXY(eventX, eventY, lastPrinted.posX, lastPrinted.posY);
          if (straightDistance < this.$store.state.frameLineSize) {
            straightDistance = this.$store.state.frameLineSize;
          }
          if ((timeOkay && movedEnough)) {           
            this.handleSpawnFrameKnob(eventX, eventY, this.$store.state.frameKnobSize, (this.$store.state.showKnobs && !this.$store.state.gridMode));            
            // create or update auto closing line
            if (this.$store.state.autoCloseShapes && blockCreator.frameContainer.children.length >= 5) {
              if (blockCreator.frameContainer.children.length === 5) {
                blockCreator.closingLine = blockCreator.spawnLine(currentTouch.startingX, currentTouch.startingY, currentTouch.posX, currentTouch.posY, this.$store.state.frameLineSize, true);
                blockCreator.closingLine.type = 'auto-closing-line';
                blockCreator.closingLine.alpha = 0.65;
                blockCreator.frameContainer.addChild(blockCreator.closingLine);
              } else {
                blockCreator.frameContainer.removeChild(blockCreator.closingLine);
                blockCreator.closingLine = blockCreator.spawnLine(currentTouch.startingX, currentTouch.startingY, currentTouch.posX, currentTouch.posY, this.$store.state.frameLineSize, true);
                blockCreator.closingLine.type = 'auto-closing-line';
                blockCreator.closingLine.alpha = 0.65;
                blockCreator.frameContainer.addChild(blockCreator.closingLine);
              }
            }
          }    
          if (frameOkay && inCompletionRange) {
            if (blockCreator.closingLine) {
              // blockCreator.frameContainer.removeChild(blockCreator.closingLine);
              blockCreator.closingLine = undefined;
            }
            let finishingLine = blockCreator.spawnLine(currentTouch.startingX, currentTouch.startingY, lastPrinted.posX, lastPrinted.posY, this.$store.state.frameLineSize);
            finishingLine.scale.y = finishingLine.originalScaleY;
            finishingLine.type = 'finishing-line';
            finishingLine.index = blockCreator.frameContainer.children.length;
            blockCreator.closingLine = finishingLine;
            if (this.$store.state.gridMode) {
              // this.handleSpawnCell(eventX, eventY)
            }
            this.$store.commit('setCompletedShape', true);

            let frameColor = '#00ff00';
            if (this.$store.state.shapeMode === 'label' || this.$store.state.autoShapes) {
              // const aiResult = this.evaluateNewShape();
              // frameColor = this.$store.state.shapeColors[aiResult.likely];
            }
            frameColor = utils.string2hex(frameColor)
            blockCreator.colorFrame(frameColor, 'line');
            blockCreator.colorFrame(frameColor, 'frameKnob');
          }
        }
        
      } else if (this.$store.state.drawMode === 'grow') {
        const movedWest = currentTouch.startingX > eventX;
        const movedNorth = currentTouch.startingY > eventY;
        let orientedScale = { x: movedWest ? -1 : 1, y: movedNorth ? -1 : 1 };
        if (!this.$store.state.selectedBlock) {
          let newBlock = this.handleSpawnBlock(eventX, eventY, 12, 12);
          this.$store.commit('changeSelectedBlock', newBlock);          
          newBlock.alpha = 0.4;
        } else {
          const currentBlockScale = { x: this.$store.state.selectedBlock.scale.x, y: this.$store.state.selectedBlock.scale.y };
          const shouldFlip = 
            (currentBlockScale.x > 0 && orientedScale.x < 0)
            || (currentBlockScale.y > 0 && orientedScale.y < 0)
            || (currentBlockScale.x < 0 && orientedScale.x > 0)
            || (currentBlockScale.y < 0 && orientedScale.y > 0)
          ;
          if (shouldFlip) {
            this.$store.state.selectedBlock.scale = orientedScale
          }
        }
        if (this.$store.state.selectedBlock) {            
          if (this.$store.state.blockAnchor === 'corner') {
            this.$store.state.selectedBlock.width = totalDistance.x * 1;
            this.$store.state.selectedBlock.height = totalDistance.y * 1;          
          } else if (this.$store.state.blockAnchor === 'center') {
            this.$store.state.selectedBlock.width = totalDistance.x * 2;
            this.$store.state.selectedBlock.height = totalDistance.y * 2;  
          }
        }
      }
    },
    async handleLiftPencil(finalTouch) {      
      this.cells.currentStroke.length = 0;
      let okayToClose = true;
      if (blockCreator.frameContainer) {
        okayToClose = blockCreator.frameContainer.children.length >= 12;
      }
      if (this.$store.state.drawMode === 'frame') {
        if ((blockCreator.closingLine) || this.$store.state.completedShape) {
          if (this.$store.state.shapeMode === 'label') {
            // if (!this.$store.state.autoCloseShapes) {
              let newPoly = this.handleSpawnPoly(0x993333);
              newPoly.interactive = true;
              // newPoly.on('pointerdown', this.handleTouchBlock);
              if (this.$store.state.selectedBlock) {
                blockCreator.unHighlightBlock(this.$store.state.selectedBlock, this.$store.state.shapeMode === 'compose')
                this.$store.commit('changeSelectedBlock', undefined);
              }            
              blockCreator.createHighlight(newPoly, 8)
              this.$store.commit('changeSelectedBlock', newPoly);
              // const polyResult = await this.evaluateNewShape();
              let shapeBounds = this.getDrawnShapeBounds();
              console.warn('calling recoreddraw', blockCreator.closingLine, this.$store.state.completedShape);
              const polyResult = await this.recordDrawnShape(shapeBounds.west.x, shapeBounds.north.y);
              newPoly.prediction = { imageUrl: polyResult };
              this.$store.commit('setCurrentPrediction', newPoly.prediction)
              this.blocks.push(newPoly);
              // this.$store.commit('setCompletedShape', false)
              // newPoly.likely = polyResult.likely;
              // newPoly.prediction = {...polyResult };
              // newPoly.bestPermutation = { ...this.bestPermutation };
              // let polyColor = this.$store.state.shapeColors[polyResult.likely];
            // }
            blockCreator.closingLine = undefined;
          } else if (this.$store.state.shapeMode === 'test' || this.$store.state.shapeMode === 'compose') {
            let isLine = this.isLine();
            if (isLine && okayToClose) {
              // blockCreator.closingLine.alpha = 1;
              // blockCreator.closingLine.tint = 0x0000ff;
              // console.log('finalTouch', finalTouch);
              // let newConnectingLine = blockCreator.spawnLine(
              //   finalTouch.posX, finalTouch.posY, 
              //   finalTouch.startingX, finalTouch.startingY, 
              //   this.$store.state.frameLineSize * 1.5
              // );
              const screenFinal = this.boardCanvas.viewport.toWorld(finalTouch.posX, finalTouch.posY);
              const screenOrigin = this.boardCanvas.viewport.toWorld(finalTouch.startingX, finalTouch.startingY);
              let connectorWidth = (this.$store.state.frameLineSize * 1.5) * this.boardScale
              let newConnectingLine = blockCreator.spawnLine(
                screenFinal.x, screenFinal.y, 
                screenOrigin.x, screenOrigin.y, 
                connectorWidth
              );
              this.boardCanvas.container.addChild(newConnectingLine);
              this.$store.commit('addElement', 'connectors', newConnectingLine);
              blockCreator.closingLine = undefined;
            } else if (okayToClose) {
              this.boardCanvas.container.removeChild(blockCreator.closingLine);
              blockCreator.closingLine = undefined;
              let polyColor = 0x772222;
              let winner;
              const aiResult = await this.evaluateNewShape();
              if (this.$store.state.currentLikely) {
                winner = this.$store.state.currentLikely
                polyColor = this.$store.state.shapeColors[winner];
              }
              if (this.$store.state.autoShapes) {
                let autoBlock;
                let permutation = aiResult.permutation
                if (this.$store.state.gridMode) {             
                  let closestNode = this.closestGridNode({
                    x: blockCreator.shapeBounds.x,
                    y: blockCreator.shapeBounds.y
                  }, 'down');
                  blockCreator.shapeBounds.x = closestNode.x;
                  blockCreator.shapeBounds.y = closestNode.y;
                  blockCreator.shapeBounds.width += this.$store.state.gridCellSize - (blockCreator.shapeBounds.width % this.$store.state.gridCellSize);
                  blockCreator.shapeBounds.height += this.$store.state.gridCellSize - (blockCreator.shapeBounds.height % this.$store.state.gridCellSize);
                  
                  let extraWidth = blockCreator.shapeBounds.width % this.$store.state.gridCellSize;
                  let extraHeight = blockCreator.shapeBounds.height % this.$store.state.gridCellSize;      
                  blockCreator.shapeBounds.width += extraWidth;         
                  blockCreator.shapeBounds.height += extraHeight;                           
                }
                if (winner === 'rectangle') {
                  permutation = 'original';
                  autoBlock = blockCreator.spawnAutoBlock(
                    'rectangle', {
                      posX: blockCreator.shapeBounds.x,
                      posY: blockCreator.shapeBounds.y, 
                      width: blockCreator.shapeBounds.width, 
                      height: blockCreator.shapeBounds.height, 
                      color: polyColor,
                      radius: this.$store.state.blockBorderRadius
                    }
                  );                  
                }
                if (winner === 'triangle') {
                  let basePos1;
                  let basePos2;
                  let tipPoint;
                  if (permutation === 'original' || permutation === 'flipX') {
                    // tip to north
                    let baseAdjustment = Math.round((blockCreator.shapeBounds.west.y - blockCreator.shapeBounds.east.y) / 2);
                    let xDiff = (blockCreator.shapeBounds.east.x - blockCreator.shapeBounds.west.x)
                    let halfwayX = Math.round(blockCreator.shapeBounds.west.x + (xDiff/2))
                    basePos1 = {
                      x: blockCreator.shapeBounds.west.x,
                      y: blockCreator.shapeBounds.west.y - baseAdjustment,
                    }               
                    basePos2 = {
                      x: blockCreator.shapeBounds.east.x,
                      y: blockCreator.shapeBounds.east.y + baseAdjustment,
                    }        
                    tipPoint = {
                      x: halfwayX,
                      y: blockCreator.shapeBounds.north.y
                    };
                  } else if (permutation === '180deg' || permutation === 'flipY') {
                    // tip to south
                    let xDiff = (blockCreator.shapeBounds.east.x - blockCreator.shapeBounds.west.x)
                    let halfwayX = Math.round(blockCreator.shapeBounds.west.x + (xDiff/2));
                    let baseAdjustment = Math.round((blockCreator.shapeBounds.west.y - blockCreator.shapeBounds.east.y) / 2);
                    basePos1 = {
                      x: blockCreator.shapeBounds.west.x,
                      y: blockCreator.shapeBounds.west.y - baseAdjustment,
                    };              
                    basePos2 = {
                      x: blockCreator.shapeBounds.east.x,
                      y: blockCreator.shapeBounds.east.y + baseAdjustment,
                    };
                    tipPoint = {
                      x: halfwayX,
                      y: blockCreator.shapeBounds.south.y
                    };
                  } else if (permutation === '90deg') {
                    // tip to west
                    let yDiff = (blockCreator.shapeBounds.south.y - blockCreator.shapeBounds.north.y);
                    let halfwayY = Math.round(blockCreator.shapeBounds.north.y + (yDiff/2));
                    let baseAdjustment = Math.abs(Math.round((blockCreator.shapeBounds.north.x - blockCreator.shapeBounds.south.x) / 2));
                    let baseX;
                    if (blockCreator.shapeBounds.north.x < blockCreator.shapeBounds.south.x) {
                      baseX = blockCreator.shapeBounds.north.x + baseAdjustment;
                    } else {
                      baseX = blockCreator.shapeBounds.north.x - baseAdjustment;
                    }
                    basePos1 = {
                      x: baseX,
                      y: blockCreator.shapeBounds.north.y,
                    };             
                    basePos2 = {
                      x: baseX,
                      y: blockCreator.shapeBounds.south.y
                    };
                    tipPoint = {
                      x: blockCreator.shapeBounds.west.x,
                      y: halfwayY
                    }
                  } else if (permutation === '270deg') {
                    // tip to east
                    let yDiff = (blockCreator.shapeBounds.south.y - blockCreator.shapeBounds.north.y);
                    let halfwayY = Math.round(blockCreator.shapeBounds.north.y + (yDiff/2));
                    let baseAdjustment = Math.abs(Math.round((blockCreator.shapeBounds.north.x - blockCreator.shapeBounds.south.x) / 2));
                    let baseX;
                    if (blockCreator.shapeBounds.north.x < blockCreator.shapeBounds.south.x) {
                      baseX = blockCreator.shapeBounds.north.x + baseAdjustment;
                    } else {
                      baseX = blockCreator.shapeBounds.north.x - baseAdjustment;
                    }
                    basePos1 = {
                      x: baseX,
                      y: blockCreator.shapeBounds.north.y,
                    };             
                    basePos2 = {
                      x: baseX,
                      y: blockCreator.shapeBounds.south.y
                    };
                    tipPoint = {
                      x: blockCreator.shapeBounds.east.x,
                      y: halfwayY
                    }
                  }
                  autoBlock = blockCreator.spawnAutoBlock(
                    'triangle', {
                      posX: basePos1,
                      posY: tipPoint,
                      posZ: basePos2,
                      color: polyColor
                    }
                  );                  
                }
                if (winner === 'circle') {
                  permutation = 'original';
                  let circleRadius = (blockCreator.shapeBounds.width / 2);
                  if (this.$store.state.gridMode) {
                    circleRadius += circleRadius % this.$store.state.gridCellSize;
                  }
                  autoBlock = blockCreator.spawnAutoBlock(
                    'circle', {
                      posX: blockCreator.shapeBounds.x, 
                      posY: blockCreator.shapeBounds.y, 
                      radius: circleRadius, 
                      color: polyColor
                    }
                  );
                }
                if (autoBlock) {
                  let spots = this.$store.state.junctureSpots[autoBlock.shape][permutation];
                  if (this.$store.state.shapeMode === 'compose') {
                    let junctures = blockCreator.spawnJunctures(autoBlock, spots, (this.$store.state.frameKnobSize * 1.5), '#0000ff');
                    this.$store.commit('setJunctures', [...this.$store.state.junctures, ...junctures])
                  }
                  autoBlock.interactive = true;
                  // autoBlock.on('pointerdown', this.handleTouchBlock);
                  autoBlock.likely = winner;
                  autoBlock.prediction = {...this.$store.state.currentPrediction};
                  autoBlock.bestPermutation = { ...this.bestPermutation };
                  autoBlock.imageUrl = this.$store.state.gridImage;   
                  blockCreator.createHighlight(autoBlock, 8);          
                  if (this.$store.state.selectedBlock) {
                    blockCreator.unHighlightBlock(this.$store.state.selectedBlock, this.$store.state.shapeMode === 'compose')
                  }
                  this.blocks.push(autoBlock);                  
                  this.$store.commit('changeSelectedBlock', autoBlock);
                  autoBlock.frame = blockCreator.frameContainer;
                  this.boardCanvas.container.addChild(autoBlock);
                }
              } else {
                let freehandPoly = this.handleSpawnPoly(0x993333);
                freehandPoly.interactive = true;
                // freehandPoly.on('pointerdown', this.handleTouchBlock);
                blockCreator.createHighlight(freehandPoly, 8);
                this.$store.commit('changeSelectedBlock', freehandPoly);
                // if (this.$store.state.autoShapes) {
                  const polyResult = this.evaluateNewShape();
                  freehandPoly.likely = this.$store.state.currentLikely;
                  freehandPoly.prediction = { ...this.$store.state.currentPrediction };
                  freehandPoly.bestPermutation = { ...this.bestPermutation };
  
                // }
              }
            }
          }
        }
        if (blockCreator.frameContainer) {          
          this.boardCanvas.container.removeChild(blockCreator.frameContainer);
          if (this.$store.state.shapeMode === 'test') {
            this.boardCanvas.container.addChild(blockCreator.frameContainer);
            blockCreator.frameContainer.alpha = 0.2;
            blockCreator.colorFrame(0x990000);
          }
        }
        requestIdleCallback(() => {
          if (blockCreator.frameContainer) {
            blockCreator.frameContainer = undefined;
            this.$store.commit('setLastPrintedKnob');
          }
          this.$store.commit('setCompletedShape', false);
        });
      }
    },
    isLine() {
      const angleChange = this.getChangeInAngle();
      let isLine = true;
      let previousDistance;
      let pathArr = blockCreator.frameContainer.children.filter(f => f.type.indexOf('line') > -1);
      let origin = pathArr[1];
      for (let i = 2; i < pathArr.length - 1; i += 1) {
        let point = pathArr[i];
        let currentDistance = distanceFromABToXY(point.x, point.y, origin.x, origin.y);
        let currentAngleChange = this.getChangeInAngle(point.angle, origin.angle);
        if (currentAngleChange > 30) {
          return false;
        }
        if (currentDistance <= previousDistance) {
          isLine = false;
          break;
        }
        previousDistance = currentDistance;
      }
      return isLine;
    },
    closestGridNode(point, roundDirection) {
      let newPoint = {};
      let xDistFromNode = point.x % this.$store.state.gridCellSize;
      let yDistFromNode = point.y % this.$store.state.gridCellSize;
      if (roundDirection === 'down') {
        newPoint.x = point.x - xDistFromNode;
        newPoint.y = point.y - yDistFromNode;
      } else {
        newPoint.x = point.x + xDistFromNode;                  
        newPoint.y = point.y + yDistFromNode;                  
      }
      return newPoint;
    },
    getChangeInAngle(currentAngle, previousAngle) {
      let changeInAngle = Math.round(currentAngle) - Math.round(previousAngle);
      while (changeInAngle < -180) {
        changeInAngle += 360;
      }
      while (changeInAngle > 180) {
        changeInAngle -= 360;
      }
      return changeInAngle;
    },
    getPathAngleChanges() {
      let knobChanges = [];
      let lineSprites = blockCreator.frameContainer.children.filter(f => f.type.indexOf('line') > -1);
      let previousAngle = lineSprites[1].angle;
      for (let i = 2; i < lineSprites.length - 1; i += 1) {
        const frameLine = lineSprites[i];
        let currentAngle = frameLine.angle;
        let changeInAngle = this.getChangeInAngle(currentAngle, previousAngle);
        knobChanges[i] = changeInAngle;        
        previousAngle = currentAngle;
      }
      return knobChanges;
    },
    isCircular(cellGrid) {
      const angleChanges = this.getPathAngleChanges();
      let sorted = angleChanges.sort((a, b) => Math.abs(b) - Math.abs(a));
      let highestAngleChange = Math.abs(sorted[0]);
      if (highestAngleChange > 60) {
        return false;
      } else {
      }
      let centerPoint = {
        x: blockCreator.shapeBounds.x + (blockCreator.shapeBounds.width / 2),
        y: blockCreator.shapeBounds.y + (blockCreator.shapeBounds.height / 2)
      }
      let closest = 9999;
      let furthest = 0;
      let largestDifference = 0;
      let lastDistance;
      blockCreator.frameContainer.children.filter(f => f.type === 'frameKnob').forEach(framePiece => {
        const centerDistance = Math.round(distanceFromABToXY(centerPoint.x, centerPoint.y, framePiece.x, framePiece.y) * this.boardScale);
        const difference = lastDistance ? Math.abs(centerDistance - lastDistance) : 0;
        if (centerDistance < closest) { closest = centerDistance }
        if (centerDistance > furthest) { furthest = centerDistance }
        if (difference > largestDifference) { largestDifference = difference }
        lastDistance = centerDistance
      });
      let largestDiffPercent = Math.round((largestDifference / furthest) * 100)
      let totalDifference = (furthest - closest);
      let totalDiffPercent = Math.round((totalDifference / furthest) * 100);
      let deviationsOkay = largestDiffPercent < 15;
      let totalDiffOkay = totalDiffPercent < 50;
      let possible = deviationsOkay && totalDiffOkay;
      let result = { possible, totalDiffPercent, largestDiffPercent }
      return result;
    },
    isRectangular(cellGrid) {
      let possible = true;
      const angleChanges = this.getPathAngleChanges();
      let numberOfSharpAngles = angleChanges.filter(c => Math.abs(c) > 60).length;
      let sorted = angleChanges.sort((a, b) => Math.abs(b) - Math.abs(a));
      let sharpestAngle = Math.abs(sorted[0]);
      if (sharpestAngle > 120) {
        console.error('ANGLE CHANGE', sharpestAngle, 'TOO HIGH FOR RECT! ------------------------------------>');
        possible = false;
      } else if (sharpestAngle < 75) {
        console.error('ANGLE CHANGE', sharpestAngle, 'TOO LOW FOR RECT! ------------------------------------>');
      } else {
        console.error('ANGLE CHANGE', sharpestAngle, 'OK FOR RECT! ------------------------------------>');
      }
      const drawnBounds = blockCreator.shapeBounds;
      console.warn('-----------', drawnBounds);

      let sizeAtEdge = {
        'top': (drawnBounds.x + drawnBounds.width)
      }
      let result = { possible, numberOfSharpAngles, sharpestAngle }
      return result;
    },
    handleClickScanShape(shape) {
      const polyResult = this.evaluateNewShape(shape);
      shape.likely = polyResult.likely;
      shape.prediction = {...polyResult };
      shape.bestPermutation = { ...this.bestPermutation };
    },
    async evaluateNewShape() {
      const furthestSegments = this.getDrawnShapeBounds();
      let drawnBlockSize = {
        width: furthestSegments.east.x - furthestSegments.west.x,
        height: furthestSegments.south.y - furthestSegments.north.y - (this.$store.state.frameKnobSize / 2)
      }
      let imageUrl = await this.recordDrawnShape(furthestSegments.west.x, furthestSegments.north.y);
      const shapeBounds = {
        ...furthestSegments,
        x: furthestSegments.west.x,
        y: furthestSegments.north.y,
        width: drawnBlockSize.width,
        height: drawnBlockSize.height
      }
      blockCreator.shapeBounds = shapeBounds;
      let gridCopy = JSON.parse(JSON.stringify(this.$store.state.gridModelArray));
      const flatGrid = this.$store.state.gridModelArray.flat();

      const rectResult = this.isRectangular(gridCopy);
      const circleResult = this.isCircular(gridCopy);
      
      const aiResult = {
        likely: this.shapeScanner.getLikely(flatGrid),
        permutation: 'original',
        percentages: this.shapeScanner.nets.rectangle.network.run(flatGrid),
        permutatedScores: {},
        rectangular: rectResult,
        circular: circleResult,
        triangular: true,
        imageUrl: imageUrl
      }

      const permResults = this.shapeScanner.evaluatePermutations(gridCopy, ['90deg', '180deg', '270deg', 'flipX', 'flipY']);
      let permsToCheck = permResults;
      if (!aiResult.circular.possible) {
        for (let perm in permsToCheck) {
          delete permsToCheck[perm].circle;
        }
        aiResult.percentages.circle = 0;
      }
      if (!aiResult.rectangular.possible) {
        for (let perm in permsToCheck) {
          delete permsToCheck[perm].rectangle;
        }
        aiResult.percentages.rectangle = 0;
      }
      let likeliest = this.shapeScanner.getLikeliest(permsToCheck);
      for (let result in permResults) {
        for (let score in permResults[result]) {
          permResults[result][score] = parseFloat((permResults[result][score] * 100).toFixed(1));
        }
      }
      this.bestPermutation = likeliest;
      if (likeliest.score > aiResult.percentages[aiResult.likely]) {
        aiResult.likely = likeliest.shapeType;
        aiResult.permutation = likeliest.permType
      }
      aiResult.permutatedScores = permResults;
      this.$store.commit('setCurrentLikely', aiResult.likely);
      this.$store.commit('setCurrentPrediction', aiResult);
      return aiResult;                
    },
    handleMovePanTool(currentTouch, eventX, eventY, totalDistance) {
      let movedX = currentTouch.posX - eventX;
      let movedY = currentTouch.posY - eventY;
      if (!isNaN(movedX) || !isNaN(movedX)) {
        // let newOffset = {...this.offset};
        // newOffset.x -= movedX; 
        // newOffset.y -= movedY;
        // this.offset = newOffset;
      }
    },
    handleLiftPanTool() {
      console.log('lifted pan tool.');    
    },
    handleTouchBlock(touchedBlock) {
      if (this.$store.state.currentTool.indexOf('move') === -1 && this.$store.state.selectedBlock !== touchedBlock) {
        this.blockTouched = true;      
        if (this.$store.state.selectedBlock) {
          blockCreator.unHighlightBlock(this.$store.state.selectedBlock, this.$store.state.shapeMode === 'compose')
        }
        blockCreator.highlightBlock(touchedBlock, 8, this.$store.state.shapeMode === 'compose');
        this.$store.commit('changeSelectedBlock', touchedBlock);
        if (this.$store.state.autoShapes || this.$store.state.shapeMode === 'label') {
          this.$store.commit('setCurrentPrediction', touchedBlock.prediction);
          this.$store.commit('setCurrentLikely', touchedBlock.likely);
          this.bestPermutation = touchedBlock.bestPermutation;
          this.$store.commit('setGridImage', touchedBlock.prediction.imageUrl);
        }        
      }
    },
    handleMoveOntoJuncture(touchedJuncture) {
      this.handleTouchJuncture(touchedJuncture);
    },
    handleMoveOffOfJuncture(touchedJuncture) {
      this.handleReleaseJuncture(touchedJuncture);
    },
    handleTouchJuncture(touchedJuncture) {
      touchedJuncture.alpha = 1;
      touchedJuncture.scale = touchedJuncture.largeScale;
      this.$store.commit('addJuncture', touchedJuncture);
      if (this.$store.state.shapeMode === 'compose') {
        blockCreator.showAllJunctures(this.blocks)
      }
    },
    handleReleaseJuncture(touchedJuncture) {
      touchedJuncture.alpha = 0.5;
      touchedJuncture.scale = touchedJuncture.originalScale;
      this.$store.commit('removeJuncture', touchedJuncture);
    },
    async recordDrawnShape(drawnImageX, drawnImageY) {      
      let imageData;
      // center the drawn shape in a square
      let longerDimension = blockCreator.frameContainer.width > blockCreator.frameContainer.height ? blockCreator.frameContainer.width : blockCreator.frameContainer.height;      
      longerDimension = Math.round(longerDimension);
      const squareOffsetX = (this.$store.state.frameLineSize / 2) + ((longerDimension - blockCreator.frameContainer.width) / 2);
      const squareOffsetY = (this.$store.state.frameLineSize / 2) + ((longerDimension - blockCreator.frameContainer.height) / 2);
      blockCreator.createContainingSquare(drawnImageX - squareOffsetX, drawnImageY - squareOffsetY, longerDimension);
      const scaleAdjustmentAmount = this.$store.state.modelImageSize / longerDimension;      
      [...document.getElementsByClassName('grid-cell')].forEach(el => {
        el.classList.remove('black');
        el.classList.remove('red');
      });

      const relativePathCoords = [];
      blockCreator.frameContainer.children.filter(piece => piece.type === 'frameKnob').forEach((piece, p) => {
        let pieceXSquare = Math.round((piece.x - (drawnImageX - squareOffsetX)) * scaleAdjustmentAmount);
        let pieceYSquare = Math.round((piece.y - (drawnImageY - squareOffsetY)) * scaleAdjustmentAmount);
        let lineAngle = piece.index > 0 && blockCreator.frameContainer.children.filter(p => p.index === piece.index && p.type === 'line')[0].rotation;
        relativePathCoords.push({
          x: pieceXSquare,
          y: pieceYSquare,
          relativeX: pieceXSquare / this.$store.state.modelImageSize,
          relativeY: pieceYSquare / this.$store.state.modelImageSize,
          angle: lineAngle, 
          index: piece.index
        });        
      });

      let imageArray = new Array(this.$store.state.modelImageSize).fill(new Array(this.$store.state.modelImageSize));      
      let arrCopy = JSON.parse(JSON.stringify((imageArray)));              
      let newRelativeCoords = [...relativePathCoords];
      relativePathCoords.forEach((knobCoords, c) => {
        const destIndex = relativePathCoords[c + 1] ? c + 1 : 0
        const destCoords = relativePathCoords[destIndex];
        const distance = distanceFromABToXY(knobCoords.x, knobCoords.y, destCoords.x, destCoords.y);
        let nextStep;
        let angleAway = destCoords.angle ? destCoords.angle - (Math.PI / 2) : angleOfPointABFromXY(destCoords.x, destCoords.y, knobCoords.x, knobCoords.y);
        for (let i = 0; i < distance; i += 1) {
          nextStep = pointAtAngle(knobCoords.x, knobCoords.y, angleAway, (i + 1));
          let interCoordSet = {...knobCoords};
          interCoordSet.x = Math.round(nextStep.x);
          interCoordSet.y = Math.round(nextStep.y);
          interCoordSet.interstitial = true;
          newRelativeCoords.splice(c + i, 0, interCoordSet);
        }
      });

     
            
      newRelativeCoords.forEach((coordSet, c) => {      
        if (!arrCopy[coordSet.y]) {
          arrCopy[coordSet.y] = [];
        }   
        arrCopy[coordSet.y][coordSet.x] = 1;
        if (this.$store.state.showRawModel) {
          let cellId = `mini-cell-${coordSet.x}-${coordSet.y}`;
          let blackCell = document.getElementById(cellId);
          if (!blackCell) {
            blackCell = document.createElement('span');
            blackCell.style.gridColumnStart = coordSet.x;
            blackCell.style.gridRowStart = coordSet.y;
            blackCell.classList.add('grid-cell')
            blackCell.id = cellId;
            document.getElementById('mini-image-display').appendChild(blackCell);
          }
          blackCell.classList.add('black')
          // const markClone = blackCell.cloneNode(true);
          // document.getElementById('full-image-display').appendChild(markClone);
        }
      });     

      arrCopy = arrCopy.map(row => row = row.map(d => d = !d ? 0 : d));
      this.$store.commit('setGridModelArray', arrCopy);

       if (this.$store.state.shapeMode === 'label' || this.$store.state.shapeMode === 'test') {
        let canvas = await html2canvas(document.getElementById('mini-image-display'));
        imageData = canvas.toDataURL();
        document.getElementById('mini-image-display').innerHTML = '';
        console.log('created imageData', imageData)
        this.$store.commit('setGridImage', imageData);
      }

      // console.log('created arrCopy', arrCopy)
      // let flatArr = arrCopy.flat();
      // console.log('flatArr', flatArr);
      // let arrString = flatArr.join('');
      // console.log('arrString', arrString);
      // let compressed = LZUTF8.compress(arrString);
      // console.log('compressed', compressed);
      // let decompressed = LZUTF8.decompress(compressed)
      // console.log('decompressed', decompressed);
      this.$store.commit('setKnobPath', newRelativeCoords);
      return imageData;
    },    
    getDrawnShapeBounds() {
      const furthestSegments = {
        north: {y: 9999}, south: {y: -9999}, west: {x: 9999}, east: {x: -9999}
      };
      blockCreator.frameContainer.children.forEach(piece => {
        let pieceX = piece.x || piece.posX;
        let pieceY = piece.y || piece.posY;
        if (pieceY < furthestSegments.north.y) { furthestSegments.north = piece }
        if (pieceY > furthestSegments.south.y) { furthestSegments.south = piece }
        if (pieceX > furthestSegments.east.x) { furthestSegments.east = piece }
        if (pieceX < furthestSegments.west.x) { furthestSegments.west = piece }
      });     
      return furthestSegments;
    },
    scanHistory(e, attributeName=this.$store.state.currentAttribute) { 
      let newPatterns = {...this.$store.state.trainingPatterns};
      newPatterns[attributeName].forEach((pat, p) => {
        const decodedInput = this.shapeScanner.decodeCondensedArray(pat.ioObj.input);
        let result = this.shapeScanner.nets[attributeName].network.run(decodedInput);
        let likely = this.shapeScanner.getLikely(decodedInput);
        let scanResult = {
          rectangle: parseFloat((result.rectangle * 100).toFixed(1)),
          circle: parseFloat((result.circle * 100).toFixed(1)),
          triangle: parseFloat((result.triangle * 100).toFixed(1)),
          likely
        };
        pat.scanResult = scanResult;
      });
      this.$store.commit('setTrainingPatterns', newPatterns)
    },
    handleClickToolButton(e) {
      const newTool = e.target ? e.target.id.split('-').slice(0, -1).join('-') : e;
      if (newTool === 'move') {
        this.boardCanvas.viewport.threshold = 0;
      } else if (!this.boardCanvas.viewport.threshold) {
        console.error('seeting threesh to 1000!')
        this.boardCanvas.viewport.threshold = 1000;
      }
      if (newTool === 'grid') {
        this.$store.commit('setGridMode', !this.$store.state.gridMode);
      } else if (newTool === 'auto-shapes') {
        this.$store.commit('toggleAutoShapes');
      } else if (newTool === 'auto-close') {
        this.$store.commit('toggleAutoCloseShapes');
      } else {
        console.log('settting new tool to', newTool)
        this.$store.commit('setCurrentTool', newTool);
      }
    },
    handleClickToolOption(e) {
      const currentTool = e.target ? e.target.id.split('-')[0] : e[0];      
      const newToolOption = e.target ? e.target.id.split('-')[1] : e[1];
      console.log('clicked', `${currentTool}-${newToolOption}`);
      this.$store.commit('setCurrentTool', `${currentTool}-${newToolOption}`);
    }
  }
}
</script>

<style scoped>
.board {
  position: relative;
  grid-row-end: span 2;
  width: var(--canvas-width);
  height: var(--canvas-height);
}
#board-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 255, 0.108);
}
#board-background {
  position: absolute;
  content: '';
  width: calc(var(--canvas-width) * 1);
  height: calc(var(--canvas-height) * 1);
  background-size: 16px;
  background-image: url(../assets/graphbackground.png);
  background-repeat: repeat;
  background-attachment: local;
  opacity: 1;
  z-index: -1;
  transition: opacity 320ms ease; 
}
.board::before {
  position: absolute;
  bottom: 0;
  left: calc(var(--model-image-size) + 1rem);
  width: inherit;
  height: 1.5rem;
  text-align: left;
  padding: 0 0.5rem;
  color: red;
  display: flex;
  align-items: center;
}
.board.test {
  background-color: rgba(158, 186, 255, 0.571);
}
.board.label {
  background-color: rgba(223, 182, 189, 0.571);
}
.board.label::before {
  content: 'TRAINING MODE';
}
.board.pencil {
  cursor: url(../assets/cursors/pencil.png) 0 32, auto;
}
.board.rectangle {
  cursor: url(../assets/icons/rectanglebutton.png) 16 16, auto;
}
.board.circle {
  cursor: url(../assets/icons/circlebutton.png) 16 16, auto;
}
.board.triangle {
  cursor: url(../assets/icons/trianglebutton.png) 16 16, auto;
}
.board.move:not(:active), .board.move-holding:not(:active) {
  cursor: grab;
}
.board.move:active, .board.move-holding:active {
  cursor: grabbing;
}
.board-label {
  box-sizing: border-box;
  position: absolute;
  text-align: center;
  /* top: 0.25rem;
  left: 0.25rem; */
  pointer-events: none;
  padding: 0.5rem;
  font-size: 0.9rem;
  font-weight: bold; 
  transition: opacity 320ms ease;
  z-index: 0;
}
.ai-status-label {
  top: unset;
  bottom: 0;
  right: 0.25rem;
  z-index: 1;
  font-size: 0.8rem;
}
.db-message {
  left: unset;
  right: 0.5rem;
}
.ai-status-label.highlighted {
  font-weight: bold;
  color: rgb(0, 65, 0);
}
.ai-prediction-label {
  top: 0;
  right: 0;
  font-size: 0.8rem;
  width: 100%;
  color: #00000099;
  min-width: 10rem;
}
.db-message {
  align-self: stretch;
  left: unset;
  right: 0.5rem;
  background: black;
  color: white;
  font-size: 0.8rem;
  border-radius: 0.25rem;
  z-index: 4;
}
.db-message.saving {
  background: #444;
}
#board-buttons {
  position: absolute;
  bottom: var(--footer-height);
  right: 0;
  background: pink;
}
@media (orientation: landscape) {
  .board::before {
    bottom: unset;
    top: 1rem;
    left: calc(var(--control-panel-width) + var(--model-image-size) + 4rem);
  }
  .ai-status-label {
    /* top: 0.5rem; */
    left: var(--control-panel-width);
    right: unset;
  }
  .ai-prediction-label {
    top: 1vmin;
    right: 1vw;
    font-size: 1rem;
    width: auto;
  }
  #mini-image-area {
    top: 2rem;
    left: calc(var(--control-panel-width) + 2rem);
  }
}

</style>
