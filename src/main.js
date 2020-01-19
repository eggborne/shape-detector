import Vue from 'vue'
import App from './App.vue'
import store from './store'
import './registerServiceWorker'

Vue.config.productionTip = false

function setCssVars () {
  window.MOBILE_PORTRAIT = window.innerWidth < window.innerHeight;
  document.documentElement.style.setProperty('--screen-height', window.innerHeight + 'px')
  document.documentElement.style.setProperty('--control-panel-height', Math.round(window.innerHeight * 0.2) + 'px')
}
window.addEventListener('load', setCssVars)
window.addEventListener('resize', setCssVars)
new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
