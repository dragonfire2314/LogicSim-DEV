<script>
	import { onMount } from 'svelte';
	import Canvas from './canvas.svelte';

	let canvas;

	let LessonFullScreen = true;

	export let applicationState;
    export let externalData;
	export let inProgress;

	onMount(async () => {
		

        //document.addEventListener('contextmenu', event => event.preventDefault());
		// Query the element
		// const resizer = document.getElementById('dragMe');
		// const leftSide = resizer.previousElementSibling;
		// const rightSide = resizer.nextElementSibling;

		// // The current position of mouse
		// let x = 0;
		// let y = 0;

		// // Width of left side
		// let leftWidth = 0;

		// // Handle the mousedown event
		// // that's triggered when user drags the resizer
		// const mouseDownHandler = function(e) {
		// 	// Get the current mouse position
		// 	x = e.clientX;
		// 	y = e.clientY;
		// 	leftWidth = leftSide.getBoundingClientRect().width;

		// 	// Attach the listeners to `document`
		// 	document.addEventListener('mousemove', mouseMoveHandler);
		// 	document.addEventListener('mouseup', mouseUpHandler);
		// };
		// // Attach the handler
		// resizer.addEventListener('mousedown', mouseDownHandler);
		// console.log("Listener Added", resizer);
    });

	function handleClick() {
		alert("pressed");
	}

	function returnToLessonSelect() {
		//Save the lesson
		//Return to lesson select
		applicationState(0, 0);
	}

	function playButton() {
		//Remove full screen
		LessonFullScreen = false;
		//Tell the server that the lesson is started

		fetch("http://localhost:8080/updateLessonStatus", {
            headers: {
                "content-type":"application/json"
            },
            method: "POST", 
            body: JSON.stringify({
                lessonID: externalData,
                status: "Progress",
            })
        }).then(res => {
            console.log("Request complete! response:", res)
        });
		// .catch(err => {
        //     alert("Network Error, returning to main site");
        //     window.location.replace("https://learnlogic.today");
        // });
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

	.playButton {
		background-color: #009688;
		margin: 5px;
		border: 0px;
		transition: 0.3s;
		position: absolute;
		top: 100px;
	}
	.playButton:hover {
		background-color: #323F4B;
	}

	.testButton {
		background-color: #009688;
		margin: 5px;
		border: 0px;
		transition: 0.3s;
	}
	.testButton:hover {
		background-color: #323F4B;
	}

	.backButton {
		background-color: #323F4B;
		margin: 5px;
		border: 0px;
		transition: 0.3s;
	}
	.backButton:hover {
		background-color: #ab2048;
	}

	.main {
		width: 100%;
		height: 100%; 
		overflow: hidden;
	}
	.split{
		overflow: hidden;
		width: 100%;
		height: 100%; 
	}
	.menu {
		/* width: 85px;  */
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
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

	.resizer {
		width: 10px;
		background-color: #009688;
		color: #009688;
	}

	.right {
		width: 75%;
		min-width: 750px;
	}
	.frame {
		width: 100%;
		height: 100%;
		border: none;
		
	}

	.FULLframe {
		width: 100%;
		height: 100%;
		border: none;
		/* margin-left: 25%; */
		/* margin-right: 25%; */
	}
	.FullBackground {
		background-color: #1F2933;
	}

	.menuTest {
		width: 20%;
		margin: auto;
	}
	.menuBack {
		margin: auto;
		width: 20%;
	}
</style>

{#if !LessonFullScreen}

<div class="split" style="display: flex">
<!-- Left element -->
<div class="main">
	<div class="menu">
		<div class="menuBack">
			<button class="backButton" on:click={() => returnToLessonSelect()}>
				<h2>Back</h2>
			</button>
		</div>
		<div class="menuGates">
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
			<button on:click={() => canvas.addGate("Light")}>
				<h2>LIGHT</h2>
			</button>


			<button on:click={() => canvas.load()}>
				<h2>LOAD</h2>
			</button>
			<button on:click={() => canvas.save()}>
				<h2>SAVE</h2>
			</button>
		</div>	

		<div class="menuTest">
			<button class="testButton" on:click={() => canvas.testLesson()}>
				<h2>TEST</h2>
			</button>
		</div>
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
		<Canvas externalData={externalData} applicationState={applicationState} bind:this={canvas}/>
	</div>
</div>


<!-- The resizer -->
<div class="resizer" id="dragMe"></div>

<!-- Right element -->
<div class="right">
    <iframe class="frame" src="./build/lessons/lesson{externalData}/lesson{externalData}.html" title="lesson"></iframe>
</div>

</div>

{:else}
<iframe class="FULLframe" src="./build/lessons/lesson{externalData}/lesson{externalData}.html" title="lesson" frameborder="0" 
style="overflow:hidden; display:block; position: absolute; height: 100%; width: 100%"></iframe>

<button class="playButton" on:click={() => playButton()}>
	<h2>Play</h2>
</button>
{/if}