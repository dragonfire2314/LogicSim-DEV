<script>
    import { onMount } from 'svelte';

    export let start_x_pos = 0;
    export let start_y_pos = 0;
    export let end_x_pos = 0;
    export let end_y_pos = 0;

    let dom;

    onMount(async () => {
        //Move to position assigned by the creator on startup
		//dom.style.left = x_pos + "px";
        //dom.style.top = y_pos + "px";
        updatePosition();
    });

    export function updatePosition() {
        if (dom) {
            if (end_x_pos - start_x_pos === 0 && end_y_pos - start_y_pos === 0) {
                dom.style.left = start_x_pos + "px";
                dom.style.top = start_y_pos + "px";

                dom.style.width = end_x_pos - start_x_pos + "px";
                dom.style.height = end_y_pos - start_y_pos + "px";
            }
            if (end_x_pos - start_x_pos < 0 && end_y_pos - start_y_pos < 0) {
                dom.style.left = end_x_pos + "px";
                dom.style.top = end_y_pos + "px";

                dom.style.width = start_x_pos - end_x_pos + "px";
                dom.style.height = start_y_pos - end_y_pos + "px";
            }
            else if (end_x_pos - start_x_pos > 0 && end_y_pos - start_y_pos > 0) {
                dom.style.left = start_x_pos + "px";
                dom.style.top = start_y_pos + "px";

                dom.style.width = end_x_pos - start_x_pos + "px";
                dom.style.height = end_y_pos - start_y_pos + "px";
            }
            else if (end_x_pos - start_x_pos > 0 && end_y_pos - start_y_pos < 0) {
                dom.style.left = start_x_pos + "px";
                dom.style.top = end_y_pos + "px";

                dom.style.width = end_x_pos - start_x_pos + "px";
                dom.style.height = start_y_pos - end_y_pos + "px";
            }
            else if (end_x_pos - start_x_pos < 0 && end_y_pos - start_y_pos > 0) {
                dom.style.left = end_x_pos + "px";
                dom.style.top = start_y_pos + "px";

                dom.style.width = start_x_pos - end_x_pos + "px";
                dom.style.height = end_y_pos - start_y_pos + "px";
            }
        }
    }

    //Called whenever x or y position is updated externally from parent or internally
    $: if (start_x_pos || start_y_pos || end_x_pos || end_y_pos) {
        updatePosition();
    }

</script>

<style>
    .selection {
        background-color: rgba(143, 236, 255, 0.25);
        width: 300px;
        height: 150px;
        z-index: 2;
        position: absolute;
        text-align: center;
        border-color: gray;
        border-style: solid;
        border-radius: 10px;
    }
</style>

<div class="selection" bind:this={dom}>
        
</div>