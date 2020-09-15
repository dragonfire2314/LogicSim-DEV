<script>
    import { onMount } from 'svelte';

    export let x_pos = 0;
    export let y_pos = 0;
    export let image;

    let real_x_pos = 0;
    let real_y_pos = 0;

    onMount(async () => {
        console.log("test");
		document.getElementById("gate").style.left = x_pos + "px";
        document.getElementById("gate").style.top = y_pos + "px";
        document.getElementById("gate").style.backgroundImage = "url(" + image + ")";        
    });

    function updatePosition() {
        document.getElementById("gate").style.left = x_pos + "px";
        document.getElementById("gate").style.top = y_pos + "px";
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

        left: 0px;
        top: 0px;
    }
</style>

<div id="gate"></div>