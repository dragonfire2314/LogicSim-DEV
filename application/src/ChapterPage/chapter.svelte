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
        }).catch(err => {
            alert("Network Error, returning to main site");
            window.location.replace("https://learnlogic.today");
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
                { name: 'OR Gate', lessonID: 12 },
                { name: 'NOR Gate', lessonID: 13 },
                { name: 'XOR Gate', lessonID: 14 },
                { name: 'NOT Gate', lessonID: 15 },
            ]
        },
        { 
            name: 'Chapter 2 - Basic Circuits',
            lessons: [
                {
                    name: 'SR-Latch',
                    lessonID: 16
                },
                {
                    name: 'D-Latch',
                    lessonID: 17
                },
            ]
        },
    ];

    function lesssonSelectionCallback(lessonID) {
        console.log("lesssonSelectionCallback: ", lessonID);

        //Load the logic sim and pass the lessonID to it
        var isProgress = false;
        for (var i = 0; i < userData.lessonStatus; i++) {
            if (userData.lessonStatus[i].lessonID === lessonID) {
                switch (lessons[i].status) {
                    case "Completed":
                        isProgress = true;
                    case "Progress":
                        isProgress = true;
                    default:
                        isProgress = false;
                }
            }
        }
        applicationState("sim", lessonID, isProgress);
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

{#if userData}
<div class="main">
    <Header userName={userData.username}></Header>
    {#if userData}
        <div class="chapters">
            {#each titles as title, i}
                <Title titleInfo={title}></Title>
                <div class="lessons">
                    {#each title.lessons as card, k}
                        <Tile cardInfo={card} lessons={userData.lessonStatus} pressed={lesssonSelectionCallback}></Tile>
                    {/each}
                </div>
            {/each}
        </div>
    {/if}
</div>
{/if}