<script>
    import Gates from './gates.svelte';
    
    let scale = 1;

    function keypressing(event) {
        if (event.key === '=') { //Plus key
            scale += 0.25;
        }
        else if (event.key === '-') { //Minus key
            scale -= 0.25;
        }
        document.getElementById("moveME").style.transform = "scale(" + scale + ")";
    }
</script>

<style>
	div {
        width: 100%;
        height: 100%;
        /*background-image: url(./grid.png);*/
        background-color: #d6d6d6;

        position: relative;

        transform: scale(1);
    }
</style>

<svelte:window on:keypress={keypressing}/>

<div>
    <Gates/>
</div>