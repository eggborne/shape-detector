<template>
  <button @click='clickAction' :class='`${type}-button`'>
    {{ label }}
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    type: String,
    label: String,
    clickAction: Function
  }
}
</script>

<style scoped>
button.control-button {
  outline: 0;
  border: 0;
  border-radius: 0.5rem;
  background-color: darkolivegreen;
  color: #ddd;
  font-size: 1rem;
  cursor: pointer;
  border: 1px solid #00000033;
  box-shadow: 0 0 0.25rem -1px rgb(24, 24, 24);
  min-height: 100%;
}
button.danger {
  background: rgb(92, 30, 30);
}
button.label-button {
  min-width: 8rem;
}
@media (orientation: landscape) {
  button.control-button {
    padding: 0.5rem !important;
    min-height: 3rem;
    width: calc(var(--control-panel-width) / 2.5);
  }
  button#draw-mode-button {
    width: unset;
  }
  button.control-button:hover {
    background: rgb(96, 117, 58);
    box-shadow: 0 0 0.15rem 0px rgb(24, 24, 24);
  }
  button.control-button.danger:hover {
    background: rgb(117, 58, 58);
  }
}
</style>
