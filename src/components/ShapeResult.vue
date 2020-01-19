<template>
  <div 
    :id='`${shapeType}-result`'
    :class='[`shape-score-display`, $store.state.modelsLoaded[shapeType] ? `ready` : ``, $store.state.currentLikely === shapeType ? `highlighted` : ``]'
  >
    <div>{{ shapeType[0].toUpperCase() + shapeType.substr(1, shapeType.length )}}</div>        
    <div class='shape-details'>
      <span 
        :class='[
          $store.state.currentPrediction.percentages && $store.state.currentPrediction.percentages[shapeType] > 50 && `highlighted`,        
          bestPermutation && bestPermutation.shapeType === shapeType && 
          $store.state.currentPrediction.permutatedScores && $store.state.currentPrediction.permutatedScores[bestPermutation.permType][bestPermutation.shapeType] < $store.state.currentPrediction.percentages[shapeType] && `likely`        
        ]'
      >
      <div>{{ parseFloat(($store.state.currentPrediction.percentages[shapeType] * 100).toFixed(1)) }}%</div>
      </span>
      <span 
        v-for='permType in Object.keys($store.state.currentPrediction.permutatedScores)' 
        :key='permType'
        :class='[
          $store.state.currentPrediction.permutatedScores && $store.state.currentPrediction.permutatedScores[permType][shapeType] > 50 && `highlighted`,        
          bestPermutation && bestPermutation.shapeType === shapeType && bestPermutation.permType === permType && `likely`        
        ]'
      >
      <div>{{ `${permType}` }}</div>
      <div>{{ $store.state.currentPrediction.permutatedScores[permType][shapeType] }}%</div>
      </span>
    </div>
  </div>
</template>

<script>
import Button from './Button'

export default {
  name: 'ShapeResult',
  components: {
    Button
  },
  props: {
    shapeType: String,
    bestPermutation: Object
  },
  methods: {

  }
}
</script>

<style scoped>
.shape-score-display {
  margin-bottom: 0rem;
  /* padding: 0.25rem; */
  border: 2px solid #00000033;
  border-radius: 4px;
}
.ai-prediction-label .shape-details {
  font-size: 0.8em;
  padding: 0.2rem;
  color: #00000066 !important;
  display: flex;
  justify-content: flex-end;
  flex-grow: 1;
}
.ai-prediction-label .shape-details > span {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem;
  min-width: 2rem;
}
.ai-prediction-label .shape-details > span:first-child {
  font-size: 1rem;
  color: #000000aa;
}
.ai-prediction-label .shape-details > span > div {
  display: flex;
  align-items: center;
  flex-grow: 1;
}
.ai-prediction-label .shape-details > span.highlighted {
  /* font-weight: bold; */
  color: rgb(99, 144, 99) !important;
}
.ai-prediction-label .shape-details > span.likely {
  font-weight: bold;
  color: rgb(4, 137, 4) !important;
  outline: 1px solid green;
}
.shape-score-display {
  display: flex;
  align-items: center;
  color: var(--rectangle-color);
}
.shape-score-display > div:first-child {
  font-size: 0.9rem;
  padding-left: 0.5rem;
}
#rectangle-result {
  color: var(--rectangle-color);
}
#circle-result {
  color: var(--circle-color);
}
#triangle-result {
  color: var(--triangle-color);
}
#rectangle-result.highlighted {
  border-color: var(--rectangle-color);
}
#circle-result.highlighted {
  border-color: var(--circle-color);
}
#triangle-result.highlighted {
  border-color: var(--triangle-color);
}
.ai-prediction-label > span:not(.highlighted) {
  font-weight: normal;
  color: black !important;
}
.ai-prediction-label > span.highlighted {
  font-weight: bold;
  color: brown !important;
}

@media (orientation: landscape) {
  .ai-prediction-label .shape-details > span {
    min-width: 5vw;
  }
}
</style>
