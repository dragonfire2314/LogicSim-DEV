<script>
    import { onMount } from 'svelte';
    import Input from './input.svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    export let inputCallback;

    export let state;
    export let inputs;
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

    $: if (state) {
        dom.style.backgroundColor = 'blue';
    }
    else {
        if (dom !== undefined)
            dom.style.backgroundColor = 'white';
    }

    //Called whenever x or y position is updated externally from parent or internally
    $: if (x_pos || y_pos) {
        updatePosition();
    }

</script>

<style>
	div {
        background-color: blue;
        width: 32px;
        height: 32px;
        background-repeat: no-repeat;
        position: absolute;
        z-index: -1;
    }
</style>

<div bind:this={dom}>
    {#each Array(inputs) as _, i}
        <Input x_pos={-26} y_pos={i * 16} wireIndex={i} id={id} inputCallback={inputCallback}/>
    {/each}
</div>