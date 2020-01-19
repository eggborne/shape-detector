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
      selectPencilTool: {
        key: "d",
        code: "keyD"
      },
      selectMoveTool: {
        key: "m",
        code: "keyM"
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
      rectangle: "#007700",
      circle: "#3030b6",
      triangle: "#997700"
    },
    modelsLoaded: {
      rectangle: false,
      circle: false,
      triangle: false
    },
    gridMode: false,
    gridCellSize: 16,
    blocks: [],
    selectedBlock: undefined,
    autoShapes: true,
    autoCloseShapes: true,
    showKnobs: true,
    blockAnchor: "corner",
    previousTool: "pencil",
    currentTool: "pencil",
    drawMode: "frame",
    shapeMode: "compose",
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
      circular: true
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
      console.warn("setting pred to", newCurrentPrediction);
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
          circular: true
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
      console.log("set to", state.currentTool);
      console.log("pev set to", state.previousTool);
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
    setBlocks(state, newBlocks) {
      state.blocks = newBlocks;
    }
  },
  actions: {},
  modules: {}
});
