<script>
    import { onMount } from 'svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    let real_x_pos = 0;
    let real_y_pos = 0;

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
        background-image: url(./ADN.svg);
        background-repeat: no-repeat;
        background-size: cover;
        position: absolute;
        z-index: -1;
    }
</style>

<div bind:this={dom}></div>