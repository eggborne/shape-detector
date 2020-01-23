<template>
  <div id='training-history-modal'>
    <header>
      <h3 class='shadowed-text'>TRAINING HISTORY</h3>
      <Dropdown 
        :title='`Sort by`'
        :options='[
          { value: `time`, label: `Time` },
          { value: `shape`, label: `Shape` }
        ]'
        :onSelect='handleSelectSortType'
      />      
      <!-- <h4>Rectangle: {{ this.$store.state.trainingPatterns['rectangle'].length }} | Circle: {{ this.$store.state.trainingPatterns['circle'].length }}</h4> -->
      <!-- <div class='button-area'>
        <Button :class='attributesShowing.includes(`rectangle`) ? `selected` : ``' type='control' label='Rectangle' :clickAction='() => toggleAttributeShowing(`rectangle`)' />
        <Button :class='attributesShowing.includes(`circle`) ? `selected` : ``' type='control' label='Circle' :clickAction='() => toggleAttributeShowing(`circle`)' />
      </div> -->
    </header>
    <div v-if='$store.state.trainingPatterns.rectangle.length' id='history-list'>
      <div class='history-item-grid'>
        <div
          v-for='pattern in sortedList' 
          :key='pattern.id'
          :class='[
            `history-item`,
            pattern.ioObj.output.rectangle ? `rectangle` : ``,
            pattern.ioObj.output.circle ? `circle` : ``,
            pattern.ioObj.output.triangle ? `triangle` : ``,
            $store.state.selectedPatterns.includes(pattern.id) ? `selected` : ``
          ]'
          @click='() => toggleSelected(pattern.id)'
        >
          <div :class='[`history-label shadowed-text`]'>{{ pattern.scanResult !== undefined ? pattern.scanResult.rectangle + '%' : ``}}</div>
          <div :class='[`history-label shadowed-text`]'>{{ pattern.scanResult !== undefined ? pattern.scanResult.circle + '%' : ``}}</div>
          <div :class='[`history-label shadowed-text`]'>{{ pattern.scanResult !== undefined ? pattern.scanResult.triangle + '%' : ``}}</div>
          <img class='history-image' :src='pattern.imageUrl' />
          <!-- <div :class='[`id-label`]'>{{ pattern.id.toString().substr(pattern.id.toString().length - 6, 6) }}</div> -->
          <div :class='[`id-label shadowed-text`]'>{{ pattern.scanResult && pattern.scanResult.likely }}</div>
        </div>
      </div>
    </div>
    <div v-else class='loading-display'>
      <div class='loading-label shadowed-text'>Loading...</div>
      <img class='loading-icon' src='../assets/icons/chicken.png' />
    </div>
    <Button v-if='historyShowing < $store.state.trainingPatterns[attributesShowing[0]].length' id='more-history-button' class='label-button' type='control' label='LOAD MORE' :clickAction='this.loadMoreHistory' />
  </div>
</template>

<script>
import Button from './Button'
import Dropdown from './Dropdown'

export default {
  name: 'TrainingHistoryScreen',
  components: {
    Button,
    Dropdown
  },
  data: () => ({
    attributeShowing: 'rectangle',
    attributesShowing: ['rectangle'],
    historyShowing: 100,
    sortType: 'time',
    shapesShowing: ['rectangle', 'circle', 'triangle'],    
  }),
  mounted() {
  },
  computed: {
    sortedList: function() {
      let sorted = [...this.$store.state.trainingPatterns.rectangle];
      sorted.filter(pat => this.shapesShowing.includes(Object.keys(pat.ioObj.output)[0]))
      .sort((a, b) => {
        if (this.sortType === 'time') {
          return b.id - a.id;
        } else if (this.sortType === 'shape') {
          let rectangles = sorted.filter(pat => { return Object.keys(pat.ioObj.output)[0] === 'rectangle' });
          let circles = sorted.filter(pat => { return Object.keys(pat.ioObj.output)[0] === 'circle' });
          let triangles = sorted.filter(pat => { return Object.keys(pat.ioObj.output)[0] === 'triangle' });
          sorted = [...rectangles, ...circles, ...triangles];
        }
      })
      return sorted;
    }
  },
  methods: {
    loadMoreHistory() {
      this.historyShowing += 15;
    },
    toggleSelected(patternId) {
      this.$store.commit('togglePatternSelected', patternId)
    },
    toggleAttributeShowing(newShowing) {
      // let newShowingArray = [...this.attributesShowing];
      // if (newShowingArray.includes(newShowing)) {
      //   newShowingArray = newShowingArray.filter(i => i !== newShowing);
      // } else {
      //   newShowingArray.push(newShowing)
      // }
      // this.attributesShowing = [newShowingArray]
      this.attributesShowing = [newShowing]
    },
    handleSelectSortType(e) {
      let newSortType = e.target.value;
      console.warn('clicked sort', newSortType);
      this.sortType = newSortType;
    }
  }
}
</script>

<style scoped>
#training-history-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  position: fixed;
  width: 100vw;
  min-height: calc(var(--screen-height) - var(--control-panel-height) - var(--footer-height));
  max-height: calc(var(--screen-height) - var(--control-panel-height) - var(--footer-height));
  top: 0;
  left: 0;
  background: rgb(109, 109, 109);
  color: #ccc;
  transition: opacity 120ms ease;
  image-rendering: pixelated;
  padding: 10px;
  z-index: 2;
  overflow-y: scroll;
}
header {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
  min-height: var(--modal-header-height);
  font-size: 1rem;
}
header > h3 {
  margin: 0;
}
header > .dropdown {
  width: 12rem;
}
header > .dropdown > select.dropdown-select {
  max-height: 12px !important;
}
header > .button-area {
  flex-grow: 0;
  display: flex;
  flex-direction: row;
}
#training-history-modal > header button.control-button {
  max-width: unset;
  min-height: 2rem;
  min-width: 24vw;
  margin-left: 0.5rem !important;
}
#training-history-modal > header button.control-button.selected {
  background: green;
  outline: 2px solid yellow;
}
#training-history-modal > h3 {
  flex-grow: 1;
}
#training-history-modal > h4 {
  font-size: 0.8rem;
  margin: 0.25rem;
}
#history-list {
  width: 100%;
  margin: 1rem;
}
.history-item-grid {
  width: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 1rem;
}
.history-item {
  position: relative;
  flex-basis: var(--training-history-item-size);
  flex-grow: var(--training-history-item-size);
  height: var(--training-history-item-size);
  outline: calc(var(--training-history-item-size) / 32) solid rgba(0, 0, 0, 0.408);
  margin: calc(var(--training-history-item-size) / 16);
  image-rendering: pixelated;
  margin-bottom: calc(var(--training-history-item-size) / 4);
  cursor: pointer;
}
.history-image {
  width: 100%;
  height: 100%;
}
.history-item::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: var(--training-history-item-size);
  height: var(--training-history-item-size);
  opacity: 0.3;
}
.history-item.rectangle::after {
  background-color: var(--rectangle-color);
}
.history-item.circle::after {
  background-color: var(--circle-color);
}
.history-item.triangle::after {
  background-color: var(--triangle-color);
}
.history-item.selected {
  outline: calc(var(--training-history-item-size) / 24) solid rgb(32, 211, 32);
}
.history-label, .id-label {
  position: absolute;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  color: white;  
  font-weight: bold;
  opacity: 0.8;
  z-index: 1;
}
.history-label {
  opacity: 0.75;
}
.history-label:first-of-type {
  color: var(--rectangle-color);
  top: 25%
}
.history-label:nth-of-type(2) {
  color: var(--circle-color);
  top: 50%;
}
.history-label:nth-of-type(3) {
  color: var(--triangle-color);
  top: 75%;
}
.id-label {
  transform: translate(-50%, 0);
  width: var(--training-history-item-size);
  top: 103%;
  font-size: 0.6rem;
  font-weight: normal;
  text-shadow: none;
}
#more-history-button {
  min-height: 2.5rem;
  font-size: 0.8rem;
}
.has-attribute .history-label {
}
.history-item {
  background: rgb(255, 214, 214);  
}
.has-attribute.history-item {
  background: rgb(184, 255, 184);
}
.history-cell:not(.black) {
  visibility: hidden;  
}
.history-cell.black {
  background: black;
}
@media (orientation: landscape) {
  #training-history-modal {
    width: calc(100vw - var(--control-panel-width));
    min-height: var(--screen-height);
    left: unset;
    right: 0;
  }
  header {
    padding: 0 2rem;
  }
  #training-history-modal > header button.control-button {
    min-width: 6rem;
  }
}
</style>
