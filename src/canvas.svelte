<script>
    import Gate from './gate.svelte';
    
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
        background-image: url(./grid.png);

        transform: scale(1);
    }
</style>

<svelte:window on:keypress={keypressing}/>

<div>
    <Gate/>
</div>