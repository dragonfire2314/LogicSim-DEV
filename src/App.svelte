<script>
	import Canvas from './canvas.svelte';

	function handleClick() {
		alert("pressed");
	}
</script>

<style>
	button {
		width: 90%;
		margin: 5%;
	}
</style>

<div style="width: 100%; height: 100%; overflow: hidden;">
	<div style="width: 80px; float: left; height: 100%; z-index: 1;">
		<button on:click={handleClick}>AND</button>
		<button on:click={handleClick}>NAND</button>
	</div>
	<div style="margin-left: 85px; height: 100%;"> 
		<Canvas/>
	</div>
</div>