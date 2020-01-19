<template>
<div class='dropdown'>
  <div class='title'>{{ title }}:</div>
  <select class='dropdown-select' @change='onSelect'>
    <option v-for='option in options' :key='option.value' :value='option.value'>{{ option.label }}</option>
  </select>
</div>
</template>

<script>
import Button from './Button'

export default {
  name: 'Dropdown',
  props: {
    title: String,
    options: Array,
    onSelect: Function
  }
}
</script>

<style scoped>
.dropdown {
  position: relative;
	box-sizing: border-box;  
  display: flex;
  align-items: center;
  padding: 0.5rem
}
.dropdown > .title {
  min-width: max-content;
  padding-left: 0.25rem;
  padding-right: 0.5rem;
  color: white;
}
.dropdown-select {
	box-sizing: border-box;
  width: 100%;
  font-size: 16px;  
  appearance: none;
	-moz-appearance: none;
	-webkit-appearance: none;
	background-color: #fff;
	background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'),
	  linear-gradient(to bottom, #ffffff 0%,#e5e5e5 100%);
	background-repeat: no-repeat, repeat;
	background-position: right .7em top 50%, 0 0;
	background-size: .65em auto, 100%;
  display: inline-block;
	color: #444;
	line-height: 1.3;
	padding: 0.6em 1.4em 0.5em 0.8em;
	margin: 0;
	border: 1px solid #aaa;
	box-shadow: 0 1px 0 1px rgba(0,0,0,.1);
	border-radius: 0.5em;
}
.dropdown-select::-ms-expand {
	display: none;
}
.dropdown-select:hover {
	border-color: #888;
}
.dropdown-select:focus {
	border-color: #aaa;
	box-shadow: 0 0 1px 3px rgba(173, 197, 223, 0.7);
	box-shadow: 0 0 0 3px -moz-mac-focusring;
	color: #222;
	outline: none;
}
.title {
  color: black;
}
@media (orientation: landscape) {

}
</style>
