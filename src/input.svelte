<script>
    import { onMount } from 'svelte';
    import { Wire } from './js/gates.js'

    export let x_pos = 0;
    export let y_pos = 0;

    export let wireIndex;
    export let gate;

    export let inputCallback;

    let line_dom;
    let circle_dom;

    onMount(async () => {
		circle_dom.style.left = x_pos + "px";
        circle_dom.style.top = y_pos + "px";
        circle_dom.style.backgroundImage = "url(build/PORT_CIRCLE.svg)";

        line_dom.style.left = x_pos + 11 + "px";
        line_dom.style.top = y_pos + 7 + "px";
        line_dom.style.backgroundImage = "url(build/PORT_LINE.svg)";
    });

    function hoving(event) {
        circle_dom.style.transform = "scale(" + 1.5 + ")";
    }
    function leaveing() {
        circle_dom.style.transform = "scale(" + 1 + ")";
    }
    function mouseDown() {
        let temp = circle_dom.parentNode.style;
        inputCallback(x_pos + parseInt(temp.left) + 8, y_pos + parseInt(temp.top) + 8, wireIndex, gate);
    }

</script>

<style>
	div {
        width: 16px;
        height: 16px;
        /* background-image: url(./PORT.svg); */
        background-repeat: no-repeat;
        position: absolute;
        z-index: -1;
    }
    .line {
        width: 16px;
        height: 3px;
    }
</style>

<div class="line" bind:this={line_dom}>
</div>
<div class="port" bind:this={circle_dom} on:mouseover={hoving} on:mouseout={leaveing} on:mousedown={mouseDown}>
</div>