<script>
    import { onMount } from 'svelte';

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());       
    });
    
    export let tileInfo;

</script>

<style>
    .card {
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
        width: 40%;
        border-radius: 5px;
    }

    img {
        border-radius: 5px 5px 0 0;
    }

    .container {
        padding: 2px 16px;
    }

    p, h4 {
        color: white;
    }
</style>

<div class="card">
    <img src="img_avatar2.png" alt="Avatar" style="width:100%">
    <div class="container">
        <h4><b>{tileInfo.name}</b></h4> 
        <p>Test Line</p> 
    </div>
</div>