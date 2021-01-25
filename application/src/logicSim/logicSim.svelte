<script>
	import { onMount } from 'svelte';
	import Canvas from './canvas.svelte';

	let canvas;

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());       
    });

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
		<button on:click={() => canvas.addGate("AND")}>AND</button>
		<button on:click={() => canvas.addGate("NAND")}>NAND</button>
		<button on:click={() => canvas.addGate("OR")}>OR</button>
		<button on:click={() => canvas.addGate("NOR")}>NOR</button>
		<button on:click={() => canvas.addGate("XOR")}>XOR</button>
		<button on:click={() => canvas.addGate("NOT")}>NOT</button>
		<!-- <button on:click={() => canvas.addGate("1")}>1</button> -->
		<!-- <button on:click={() => canvas.addGate("0")}>0</button> -->
		<button on:click={() => canvas.addGate("Switch")}>Switch</button>
		<button on:click={() => canvas.addGate("Light")}>Light</button>
		<button on:click={() => canvas.addGate("dLatch")}>D-Latch</button>
		<button on:click={() => canvas.addGate("in_bus")}>Bus Begin</button>
		<button on:click={() => canvas.addGate("out_bus")}>Bus End</button>
		<button on:click={() => canvas.loadSetup("out_bus")}>Load</button>
		<button on:click={() => canvas.debugGates()}>DEBUG</button>
		<button on:click={() => canvas.simulatate()}>PLAY</button>
		<button on:click={() => canvas.save()}>Save</button>
		<button on:click={() => canvas.load()}>Load</button>
	</div>
	<div class="canvas">
		<Canvas bind:this={canvas}/>
	</div>
</div>