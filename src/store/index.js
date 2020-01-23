import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    ready: false,
    defaultBlockSize: {
      width: 200,
      height: 12
    },
    hotKeys: {
      pencil: 'P',
      move: 'M',
      rectangle: 'R',
      circle: 'C',
      triangle: 'T',
      selectPencilTool: {
        key: "p",
        code: "keyP"
      },
      selectMoveTool: {
        key: "m",
        code: "keyM"
      },
      selectRectangle: {
        key: "r",
        code: "keyR"
      },
      selectCircle: {
        key: "c",
        code: "keyC"
      },
      selectTriangle: {
        key: "t",
        code: "keyT"
      },
      holdToSelectMoveTool: {
        key: " ",
        code: "Space"
      },
      toggleGridMode: {
        key: "g",
        code: "keyG"
      }
    },
    shapeColors: {
      rectangle: "#4D82B8",
      circle: "#9868B9",
      triangle: "#76A797"
    },
    modelsLoaded: {
      rectangle: false,
      circle: false,
      triangle: false
    },
    junctureSpots: {
      rectangle: {
        original: [ [0, 0], [0, 1], [1, 0], [1, 1], [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5] ]
      },
      circle: {
        original: [ [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5] ],
      },
      triangle: {
        original: [ [0, 0], [-0.5, 1], [0.5, 1] ],
        "90deg":  [ [1, -0.5], [0, 0], [1, 0.5] ],
        "180deg":  [ [-0.5, -1], [0.5, -1], [0, 0] ],
        "270deg":  [ [-1, -0.5], [-1, 0.5], [0, 0] ],
        flipX:  [ [0, 0], [-0.5, 1], [0.5, 1] ],
        flipY: [ [-0.5, -1], [0.5, -1], [0, 0] ]
      }
    },
    selectedJunctures: [],
    gridMode: false,
    gridCellSize: 16,
    blocks: [],
    junctures: [],
    connectors: [],
    selectedBlock: undefined,
    selectedBlocks: [],
    autoShapes: true,
    autoCloseShapes: true,
    showKnobs: true,
    blockAnchor: "corner",
    previousTool: "pencil",
    currentTool: "pencil",
    drawMode: "frame",
    shapeMode: "test",
    blockBorderRadius: 6,
    baseFrameKnobSize: 12,
    baseFrameLineSize: 10,
    frameKnobSize: 12,
    frameLineSize: 8,
    knobPath: [],
    lastPrintedKnob: {
      printTime: 0,
      posX: -1,
      posY: -1,
      angle: 0
    },
    completedShape: false,
    grabbedBlock: undefined,
    printInterval: 5,
    printSpacing: 1,
    highlightedBlock: undefined,
    drawnShapeImage: undefined,
    modelImageSize: 60,
    gridModelArray: [],
    gridImage: undefined,
    showRawModel: true,
    trainingPatterns: {
      rectangle: [],
      circle: []
    },
    modalShowing: undefined,
    miniModalShowing: undefined,
    selectedPatterns: [],
    currentPrediction: {
      percentages: { rectangle: 0, circle: 0, triangle: 0 },
      permutatedScores: {
        "90deg": 0,
        "180deg": 0,
        "270deg": 0,
        flipX: 0,
        flipY: 0
      },
      circular: true,
      rectangular: true,
      triangular: true
    },
    shapeSymmetries: {
      rectangle: ["90deg, flipX, flipY"],
      circle: ["90deg, flipX, flipY"],
      triangle: ["90deg, flipX, flipY"]
    },
    currentLikely: "",
    currentAttribute: "rectangle",
    modelId: 1,
    aiEvaluation: true,
    showDetectionStats: true
  },
  mutations: {
    setReady(state, newReady) {
      state.ready = newReady;
    },
    setModelsLoaded(state, newModel) {
      state.modelsLoaded[newModel] = true;
    },
    setModalShowing(state, newModalShowing) {
      state.modalShowing = newModalShowing;
    },
    setMiniModalShowing(state, newMiniModalShowing) {
      state.miniModalShowing = newMiniModalShowing;
    },
    setTrainingPatterns(state, newPatterns) {
      state.trainingPatterns = newPatterns;
    },
    setGridImage(state, newGridImage) {
      state.gridImage = newGridImage;
    },
    setGridModelArray(state, newGridModelArray) {
      state.gridModelArray = newGridModelArray || [];
    },
    setLastPrintedKnob(state, payload) {
      state.lastPrintedKnob = payload || {
        printTime: 0,
        posX: -1,
        posY: -1,
        angle: 0
      };
    },
    setKnobPath(state, newKnobPath) {
      state.knobPath = newKnobPath || [];
    },
    setDrawnShapeImage(state, newDrawnShapeImage) {
      state.drawnShapeImage = newDrawnShapeImage;
    },
    setCompletedShape(state, newCompletedShape) {
      state.completedShape = newCompletedShape;
    },
    setCurrentLikely(state, newCurrentLikely) {
      state.currentLikely = newCurrentLikely;
    },
    setCurrentPrediction(state, newCurrentPrediction) {
      if (!newCurrentPrediction) {
        newCurrentPrediction = {
          percentages: { rectangle: 0, circle: 0, triangle: 0 },
          permutatedScores: {
            "90deg": 0,
            "180deg": 0,
            "270deg": 0,
            flipX: 0,
            flipY: 0
          },
          circular: true,
          rectangular: true,
          triangular: true
        };
      }
      state.currentPrediction = newCurrentPrediction;
    },
    changeDrawMode(state, newDrawMode) {
      state.drawMode = newDrawMode;
    },
    changeShapeMode(state, newShapeMode) {
      state.shapeMode = newShapeMode;
      if (newShapeMode === "label") {
        state.autoCloseShapes = false;
        state.autoShapes = false;
      }
      if (newShapeMode === "test") {
        state.autoCloseShapes = true;
        state.autoShapes = true;
      }
    },
    changeDefaultBlockSize(state, newSize) {
      state.defaultBlockSize = newSize;
    },
    changeSelectedBlock(state, newSelectedBlock) {
      state.selectedBlock = newSelectedBlock;
    },
    changeHighlightedBlock(state, newHighlightedBlock) {
      state.highlightedBlock = newHighlightedBlock;
    },
    setSelectedPatterns(state, newSelectedPatterns) {
      state.selectedPatterns = newSelectedPatterns;
    },
    togglePatternSelected(state, patternIndex) {
      if (!state.selectedPatterns.includes(patternIndex)) {
        state.selectedPatterns.push(patternIndex);
      } else {
        state.selectedPatterns = state.selectedPatterns.filter(
          p => p !== patternIndex
        );
      }
    },
    setCurrentTool(state, newCurrentTool) {
      state.previousTool = state.currentTool;
      state.currentTool = newCurrentTool;
    },
    setCurrentToolOption(state, newCurrentToolOption) {
      state.currentToolOption = newCurrentToolOption;
    },
    toggleAutoCloseShapes(state) {
      state.autoCloseShapes = !state.autoCloseShapes;
    },
    toggleAutoShapes(state) {
      state.autoShapes = !state.autoShapes;
    },
    setGridMode(state, newGridMode) {
      state.gridMode = newGridMode;
    },
    scaleFrameSize(state, newScale) {
      state.frameKnobSize = state.baseFrameKnobSize * (1 / newScale);
      state.frameLineSize = state.baseFrameLineSize * (1 / newScale);
    },
    setElements(state, elementType, newElements = []) {
      state[elementType] = newElements;
    },
    addElement(state, elementType, element) {
      state[elementType].push(element);
    },
    removeElement(state, elementType, element) {
      state[elementType].splice(state[elementType].indexOf(element), 1);
      // if (!state[elementType]) {
      //   state[elementType] = [];
      // }
    },
    addJuncture(state, juncture) {
      state.selectedJunctures.push(juncture);
    },
    removeJuncture(state, juncture) {
      state.selectedJunctures.splice(state.selectedJunctures.indexOf(juncture), 1);
    },
    setJunctures(state, newJunctures) {
      console.log('setting new junctures', newJunctures)
      state.junctures = newJunctures;
    },
    setJunctureSpots(state, shapeType, newJunctures) {
      state.junctureSpots[shapeType] = newJunctures;
    },
    setSelectedBlocks(state, newSelectedBlocks=[]) {
      state.selectedBlocks = newSelectedBlocks;
    },
    addSelectedBlock(state, block) {
      state.selectedBlocks.push(block);
    },
    removeSelectedBlock(state, block) {
      state.selectedBlocks.splice(state.selectedBlocks.indexOf(block), 1);
    }
  },
  actions: {},
  modules: {}
});
