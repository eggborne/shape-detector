<template>
  <footer id="footer">
    
  </footer>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    msg: String
  }
}
</script>
<style scoped>
#footer {
  position: fixed;
  bottom: var(--footer-bottom);
  right: 0;
  box-sizing: border-box;
  width: var(--control-panel-width);
  height: var(--footer-height);
  display: flex;
  align-items: center;
  background: #C0C0C0;
  color: #ddd;
  font-size: 0.8rem;
  z-index: 1;
  cursor: normal;
}
@media (orientation: landscape) {
  #footer {
    bottom: var(--footer-bottom);
    width: calc(100vw - var(--control-panel-width));
  }
}
</style>
