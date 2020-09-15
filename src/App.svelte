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
	.main {
		width: 100%;
		height: 100%; 
		overflow: hidden;
	}
	.menu {
		width: 85px; 
		float: left; 
		height: 100%; 
		background-color: white;
		z-index: 1;
		position: relative;
	}
	.canvas {
		margin-left: 85px; 
		height: 100%;
	}
</style>

<div class="main">
	<div class="menu">
		<button on:click={handleClick}>AND</button>
		<button on:click={handleClick}>NAND</button>
	</div>
	<div class="canvas">
		<Canvas/>
	</div>
</div>