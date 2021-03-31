<script>
    import { onMount } from 'svelte';
    import Header from './header.svelte'
    import Tile from './card.svelte'
    import Title from './title.svelte'

    export let applicationState;
    export let externalData;

    var userData;

	onMount(async () => {
        fetch('http://localhost:8080/userInfo').then(r => {
            console.log(r);
            r.json().then(res => {
                console.log(res);
                userData = res;
            });
        });
    })
    
    let titles = [
        {  
            name: 'Chapter 1 - Basic Gates',
            lessons: [
                {
                    name: 'NAND Gate',
                    lessonID: 10
                },
                {
                    name: 'AND Gate',
                    lessonID: 11
                },
                { name: 'Test', lessonID: 12 },
                { name: 'Test', lessonID: 13 },
                { name: 'Test', lessonID: 14 },
                { name: 'Test', lessonID: 15 },
                { name: 'Test', lessonID: 16 },
                { name: 'Test', lessonID: 17 },
                { name: 'Test', lessonID: 18 },
            ]
        },
        { 
            name: 'Chapter 2 - Basic Circuits',
            lessons: [
                {
                    name: 'SR-Latch',
                    lessonID: 10
                },
                {
                    name: 'D-Latch',
                    lessonID: 11
                },
            ]
        },
    ];

    function lesssonSelectionCallback(lessonID) {
        console.log("lesssonSelectionCallback: ", lessonID);

        //Load the logic sim and pass the lessonID to it
        applicationState("sim", lessonID);
    }

</script>

<style>
    .main {
        width: 100%;
        background-color: #1F2933;
    }
    .lessons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
    }
    .chapters {
        margin-left: 14%;
        margin-right: 14%;
    }
</style>

<div class="main">
    <Header></Header>
    {#if userData}
        <div class="chapters">
            {#each titles as title, i}
                <Title titleInfo={title}></Title>
                <div class="lessons">
                    {#each title.lessons as card, k}
                        <Tile cardInfo={card} lessons={userData.lessonsCompleted} pressed={lesssonSelectionCallback}></Tile>
                    {/each}
                </div>
            {/each}
        </div>
    {/if}
</div>