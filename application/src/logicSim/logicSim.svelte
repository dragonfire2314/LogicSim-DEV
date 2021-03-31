<script>
	import { onMount } from 'svelte';
	import Canvas from './canvas.svelte';

	let canvas;

	export let applicationState;
    export let externalData;

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());
    });

	function handleClick() {
		alert("pressed");
	}

	function returnToLessonSelect() {
		//Save the lesson
		//Return to lesson select
		applicationState(0, 0);
	}
</script>

<style>
	button {
		/* width: 90%; */
		background-color: #323F4B;
		margin: 5px;
		border: 0px;
		transition: 0.3s;
	}
	button:hover {
		background-color: #009688;
	}

	.main {
		width: 100%;
		height: 100%; 
		overflow: hidden;
	}
	.menu {
		/* width: 85px;  */
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		/* float: left;  */
		/* height: 100%;  */
		background-color: #1F2933;
		z-index: 1;
		position: relative;
	}
	.canvas {
		/* margin-left: 85px;  */
		height: 100%;
	}
	img {
		/* width: 75px; */
		/* height: 50px; */
		display : block;
    	margin : auto;
	}

	h2 {
		color: white;
		margin: 10px;
        /* text-align: center; */
		/* margin: auto; */
	}
</style>

<div class="main">
	<div class="menu">
		<button on:click={() => returnToLessonSelect()}>
			<h2>Back</h2>
		</button>
		<button on:click={() => canvas.addGate("AND")}>
			<!-- <img src="build/andGateMenu.svg" alt="AND"> -->
			<h2>AND</h2>
		</button>
		<button on:click={() => canvas.addGate("NAND")}>
			<!-- <img src="build/andGateMenu.svg" alt="NAND"> -->
			<h2>NAND</h2>
		</button>
		<button on:click={() => canvas.addGate("OR")}>
			<!-- <img src="build/andGateMenu.svg" alt="OR"> -->
			<h2>OR</h2>
		</button>
		<button on:click={() => canvas.addGate("NOR")}>
			<!-- <img src="build/andGateMenu.svg" alt="NOR"> -->
			<h2>NOR</h2>
		</button>
		<button on:click={() => canvas.addGate("XOR")}>
			<!-- <img src="build/andGateMenu.svg" alt="XOR"> -->
			<h2>XOR</h2>
		</button>
		<button on:click={() => canvas.addGate("NOT")}>
			<!-- <img src="build/andGateMenu.svg" alt="NOT"> -->
			<h2>NOT</h2>
		</button>
		<!-- <button on:click={() => canvas.addGate("1")}>1</button> -->
		<!-- <button on:click={() => canvas.addGate("0")}>0</button> -->
		<button on:click={() => canvas.addGate("Switch")}>
			<h2>SWITCH</h2>
		</button>
		<button on:click={() => canvas.addGate("Save")}>
			<h2>LIGHT</h2>
		</button>


		<button on:click={() => canvas.load()}>
			<h2>LOAD</h2>
		</button>
		<button on:click={() => canvas.save()}>
			<h2>SAVE</h2>
		</button>
		<!-- <button on:click={() => canvas.addGate("dLatch")}>
			<h2>D-LATCH</h2>
		</button>
		<button on:click={() => canvas.addGate("in_bus")}>
			<h2>BUS BEGIN</h2>
		</button>
		<button on:click={() => canvas.addGate("out_bus")}>
			<h2>BUS END</h2>
		</button>
		<button on:click={() => canvas.loadSetup("out_bus")}>
			<h2>LOAD</h2>
		</button>
		<button on:click={() => canvas.debugGates()}>
			<h2>DEBUG</h2>
		</button>
		<button on:click={() => canvas.simulatate()}>
			<h2>PLAY</h2>
		</button>
		<button on:click={() => canvas.save()}>
			<h2>SAVE</h2>
		</button>
		<button on:click={() => canvas.load()}>
			<h2>LOAD</h2>
		</button> -->
	</div>
	<div class="canvas">
		<Canvas externalData={externalData} bind:this={canvas}/>
	</div>
</div>