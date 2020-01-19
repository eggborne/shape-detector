<template>
  <div class="block">
    Block
  </div>
</template>

<script>

export default {
  name: 'Block',
  data: () => ({
    width: 72,
    height: 72
  }),
  props: {
    size: Object
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .block {
    background: blue;
  }
</style>
