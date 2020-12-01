<script>
    import { onMount } from 'svelte';
    import { Wire } from './js/gates.js'

    export let start_x_pos, start_y_pos;
    export let end_x_pos, end_y_pos;

    export let state;

    let color = "white";

    
    onMount(async () => {
        if (state) {
            //console.log("I want to get this function to be called");
            color = "blue";
        }
        else { color = "white"; }
    });
    
    $: if (state) {
        //console.log("I want to get this function to be called");
        color = "blue";
    }
    else { color = "white"; }
    

</script>

<style>
	
</style>

<path d="M {start_x_pos} {start_y_pos} 
    C {start_x_pos + 128} {start_y_pos}, {end_x_pos - 128} {end_y_pos}, {end_x_pos} {end_y_pos}"
    stroke="black" fill="transparent" stroke-width="6"
/>
<!-- <circle cx={start_x_pos + 128} cy={start_y_pos} r="6" fill="red"/>
<circle cx={end_x_pos - 128} cy={end_y_pos} r="6" fill="red"/> -->

<path d="M {start_x_pos} {start_y_pos} 
    C {start_x_pos + 128} {start_y_pos}, {end_x_pos - 128} {end_y_pos}, {end_x_pos} {end_y_pos}"
    stroke={color} fill="transparent" stroke-width="3"
/>
