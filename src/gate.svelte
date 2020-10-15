<script>
    import { onMount } from 'svelte';
    import Input from './input.svelte';
    import Output from './output.svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    export let inputCallback;
    export let outputCallback;

    export let gate;

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

</script>

<style>
	div {
        width: 32px;
        height: 32px;
        background-repeat: no-repeat;
        position: absolute;
        z-index: -1;
    }
</style>

<div bind:this={dom}>
    {#each gate.Inputs as input, i}
        <Input x_pos={-26} y_pos={i * 16} wireIndex={i} gate={gate} inputCallback={inputCallback}/>
    {/each}
    {#each gate.Outputs as output, i}
        <Output x_pos={42} y_pos={7} wire={output} outputCallback={outputCallback}/>
    {/each}
</div>