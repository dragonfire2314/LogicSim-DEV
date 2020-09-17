<script>
    import { onMount } from 'svelte';
    import Input from './input.svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    let dom;

    onMount(async () => {
        console.log(dom);
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
    <Input x_pos={-26} y_pos={0}/>
    <Input x_pos={-26} y_pos={16}/>
</div>