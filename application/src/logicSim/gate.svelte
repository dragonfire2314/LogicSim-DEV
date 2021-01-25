<script>
    import { onMount } from 'svelte';
    import Input from './input.svelte';
    import Output from './output.svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    export let inputCallback;
    export let outputCallback;

    export let inputs;
    export let outputs;
    export let id;

    export let grabbing;
    export let released;

    export let styles;

    let dom;

    onMount(async () => {
        //Move to position assigned by the creator on startup
		dom.style.left = x_pos + "px";
        dom.style.top = y_pos + "px";
        dom.style.backgroundImage = "url(" + image + ")";

        dom.setAttribute('draggable', false);
    });

    export function updatePosition() {
        if (dom) {
            dom.style.left = x_pos + "px";
            dom.style.top = y_pos + "px";
        }
    }

    //Called whenever x or y position is updated externally from parent or internally
    $: if (x_pos || y_pos) {
        updatePosition();
    } 

    var bigger;

    $: if (inputs || outputs) {
        //Update the shape of the gate to fit
        if (dom) {
            //console.log("biiger?");
            //bigger = (inputs > outputs) ? inputs : outputs;
            //dom.style.height = (bigger * 16) + "px";
        }
    }

    $: if (styles.isHighlighted) {
        dom.classList.add("gateSelected");
    }
    else {
        if (dom) {
            dom.classList.remove("gateSelected");
        }
    }

    function mouseDown() {
        grabbing(id);
    }

    function mouseUp() {
        released(id);
    }

</script>

<style>
	div {
        width: 32px;
        height: 32px;
        background-repeat: no-repeat;
        position: absolute;
        z-index: -1;
    }
    .gateSelected {
        filter: drop-shadow(0px 0px 3px #0079DB);
    }
    .gate, .connections{
        position: absolute;
    }
</style>

<div class="gateSelected" bind:this={dom}>
    <div class='connections'>
        {#if inputs === 1}
            <Input x_pos={-26} y_pos={8} wireIndex={0} id={id} inputCallback={inputCallback}/>
        {:else}
            {#each Array(inputs) as _, i}
                <Input x_pos={-26} y_pos={i * 16} wireIndex={i} id={id} inputCallback={inputCallback}/>
            {/each}
        {/if}
        
        {#if outputs === 1}
            <Output x_pos={42} y_pos={8} wireIndex={0} id={id} outputCallback={outputCallback}/>
        {:else}
            {#each Array(outputs) as _, i}
                <Output x_pos={42} y_pos={i * 16} wireIndex={i} id={id} outputCallback={outputCallback}/>
            {/each}
        {/if}
    </div>
    <div class='gate' on:mousedown={mouseDown} on:mouseup={mouseUp}>
    </div>
</div>