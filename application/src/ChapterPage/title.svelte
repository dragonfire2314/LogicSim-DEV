<script>
    import { onMount } from 'svelte';

	onMount(async () => {
        //document.addEventListener('contextmenu', event => event.preventDefault());       
    });
    
    export let titleInfo;

</script>

<style>
    .title {
        width: 100%;
    }
    h1 {
        color: white;
    }
</style>

<div class="title">
    <h1>{titleInfo.name}</h1>
</div>