<script>
    import { onMount } from 'svelte';

    export let x_pos = 0;
    export let y_pos = 0;

    let dom;

    onMount(async () => {
        console.log(dom);
		dom.style.left = x_pos + "px";
        dom.style.top = y_pos + "px";    
    });

</script>

<style>
	div {
        width: 32px;
        height: 32px;
        background-image: url(./PORT.svg);
        background-repeat: no-repeat;
        position: absolute;
        z-index: -1;
    }
</style>

<div bind:this={dom}></div>