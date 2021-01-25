<script>
    import { onMount } from 'svelte';
    import Output from './output.svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    export let outputCallback;

    export let switchState;
    export let outputs;
    export let id;

    let dom;

    onMount(async () => {
        //Move to position assigned by the creator on startup
		dom.style.left = x_pos + "px";
        dom.style.top = y_pos + "px";
        dom.style.backgroundImage = "url(" + image + ")";     
    });

    function updatePosition() {
        if (dom) {
            dom.style.left = x_pos + "px";
            dom.style.top = y_pos + "px";
        }
    }

    //Called whenever x or y position is updated externally from parent or internally
    $: if (x_pos || y_pos) {
        updatePosition();
    }

    function mouseDown() {
        //Change state
        switchState(id);
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
    .gate, .connections{
        position: absolute;
    }
</style>

<div class='wrapper' bind:this={dom}>
    <div class='connections'>
        {#each Array(outputs) as _, i}
            <Output x_pos={42} y_pos={7} id={id} outputCallback={outputCallback}/>
        {/each}
    </div>
    <div class='gate' on:mousedown={mouseDown}>
    </div>
</div>