<script>
    import { onMount } from 'svelte';

	onMount(async () => {
        
    });

    const checkForLesson = (lessonID) => {
        for (var i = 0; i < lessons.length; i++) {
            if (lessonID == lessons[i].lessonID) {
                //Check status ret accordingly
                switch (lessons[i].status) {
                    case "Completed":
                        return 2;
                    case "Progress":
                        return 1;
                    default:
                        return 0;
                }
            }
        }
        // console.log("No Match");
        return 0;
    };
    
    export let cardInfo;

    export let lessons;

    export let pressed;

</script>

<style>
    .card {
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        background-color: #323F4B; 
        transition: 0.3s;
        width: 23.5%;
        /* height: 300px; */
        min-height: 300px;
        margin: 0.75%;
        /* flex-grow: 1; */
        border-radius: 5px;
    }

    .card:hover {
        background-color: #009688;
        /* box-shadow: 0 4px 8px 0 rgba(0,41,37,0.2); */
    }

    img {
        border-radius: 5px 5px 0 0;
        width: 65%;
        padding-left: 17.5%;
    }

    .container {
        padding: 2px 16px;
        display: flex;
        flex-direction: column;
    }

    h4 {
        font-size: 20px;
        text-align: center;
    }

    p, h4 {
        color: white;
        text-align: center;
    }

</style>

<div class="card" on:click={pressed(cardInfo.lessonID)}>
    <div class="slide-fwd-center">
        <div class="container">
            <h4><b>{cardInfo.name}</b></h4> 
            <!-- <p>Test Line i cansdiuhfauisdhfg uh fhsad fuih sdui fhsui fhius hfiu hsd fuyihsda</p>  -->
            {#if checkForLesson(cardInfo.lessonID) === 2}
                <!-- <img class="check" src="build/star.svg" alt="check"> -->
                <img class="check" src="build/green_check.svg" alt="check">
                <!-- <p>Completed</p> -->
            {:else if checkForLesson(cardInfo.lessonID) === 1}
                <img class="middle_check" src="build/orange_middle.svg" alt="in_progress">
            {:else}
                <img class="no_check" src="build/red_x.svg" alt="no_check">
                <!-- <p>Incomplete</p> -->
            {/if}
            <br>
        </div>
    </div>
</div>