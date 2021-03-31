<script>
    import { onMount } from 'svelte';
    import Gate from './gate.svelte';
    import Switch from './switch.svelte';
    import Wire from './wire.svelte';
    import { evaluate } from '../js/simulator.js'
    import Light from './light.svelte';
    import Selection from './selectionBox.svelte'
    import { get } from 'svelte/store';

    //Simple vetor class with basic math functions
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        add(v) {
            this.x += v.x;
            this.y += v.y;
        }
        sub(v) {
            this.x -= v.x;
            this.y -= v.y;
        }
        scale(n) {
            this.x *= n;
            this.y *= n;
        }
        distance(n) {
            return (Math.sqrt(Math.pow(n.x - this.x,2) + Math.pow(n.y - this.y,2)));
        }
    };

    //Creates a new list, that is the components array, but the index is the id
    const indexBy = (array, prop) => array.reduce((output, item) => {
        output[item[prop]] = item;
        return output;
    }, {});

    const canInputOrOuputCountBeChanged = (type) => {
        switch (type) {
        case "and":
        case "nor":
        case "nand":
        case "or":
        case "xor":
        case "out_bus":
        case "in_bus":
            return true;
            break;
        default:
            return false;
            break;
        }
    };

    /*
    This array contains all the gates that exist on the screen
    The format for the data stored is as follows
    {
        id: 'name',                     //Name of the gate, identifies this exact gate
        in_count: 2,                    //The number of inputs this gate has
        out_count: 1,                   //The number of outputs this gate has
        in_widths: [],                  //The widths of each input
        out_widths: [],                 //The widths of each output
        type: 'and',                    //The type of gate (used to determine function of gate by simulator)
        inputs: [                       //The inputs to the gate
            {                           //An input, contains data about the input
                gate_id: 'bus_end',     //Id of the gate connecting to this input
                index: 0,               //The index of the output of the connecting gate
            },
        ],
        output_states: [0],             //An array of outputs the gate has

        position: new Vector(0,0),      //The (x,y) position of the gate
        image: "./build/AND_GATE.svg",  //The image used for said gate
        style: {                        //Styles for the gate, will be passed to the gate in svelte, anything can be put here for any of the gate,
                                        //they do not have to be consistant. Different gate types can have special style info in this array
                                        //As per the spec these are suggested values that could appear in this array
            isHighlighted: false,

        },                     
    }
    */
    let components = [

    ];

    /*
    This stores the information for rendering a wire
    This array is rendered item by item
    The format is
    {
        startPos: new Vector(0, 0),     //Starting postion of the wire (aka gate output)
        endPos: new Vector(0, 0),       //Ending postion of the wire (aka gate input)
        id: id,                         //Id of the gate that the wire comes from
        id_in: id                       //Id of the gate that the wire goes to
        index: 0,                       //Index into the outputs gates outputs
        state: [0],                     //The states that wire holds in an array
        width: 1                        //The width of the wire
    }
    */
    let wires = [
        
    ];

    let nextGateID = 0;

    let mousePosition;
    let workspaceDom;
    let zoomLayerDom;

    let gridSpacing;

    let isPlacing = false;
    let placingComponent;

    let scale = 1;
    let screenPos = new Vector(0, 0);
    let isGrabbing = false;
    let begGrabPos;
    let endGrabPos;

    let isGateSelected;

    let isGrabbingGate;
    let gateGrabbedId;
    let didGateMove;

    let selectedGatesIds = [];

    //Selection box
    let isSelecting = false;
    let isSelecting_Draw = false;
    let canSelect = true;
    let selectionBegin;
    let selectionEnd;

    export let externalData;

    onMount(async () => {
        //Load the users data for this lesson
        console.log("externalData: ", externalData)
        load(externalData);
    });

    //TODO - move without place the gate held
    function mouseDown(event) {
        console.log("click");
        //Check if mouse 2 is pressed, if so only move board
        if (event.button !== 2) {
            //Place a gate if mouse 1 is pressed, and is in the range of the board
            if (isPlacing) {
                //Add gate to componets array
                components = [...components, placingComponent];
                isPlacing = false;
            } else if (!isSelecting && canSelect){
                //Start making a selction box
                isSelecting = true;
                //Make sure the box is on the cursor
                let zoomLayerOffset = offset(zoomLayerDom);
                zoomLayerOffset.left *= (1/scale);
                zoomLayerOffset.top *= (1/scale);
                selectionBegin = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
                selectionEnd = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
            }
        }
        else {
            //Moving around the workspace
            isGrabbing = true;
            begGrabPos = new Vector(event.pageX, event.pageY);
        }
    }
    function mouseUp(event) {
        console.log("click release");
        // Mouse button 1 released (left)
        if (event.button === 0) {
            if (isGrabbingGate && !didGateMove) {
                //Clear the selection and select the new gate
                clearSelection();

                //Set the gate as selected
                selectedGatesIds.push(gateGrabbedId);
                getComponent(selectedGatesIds[0]).style.isHighlighted = true;
                //Tell sevlte to update
                components = components;
            }
            else if (didGateMove) {
                //Dont unselect any thing
            }
            else {
                //Clear the selection
                clearSelection();
            }
            if (isSelecting) {

                isSelecting = false;

                if (isSelecting_Draw) {
                    let zoomLayerOffset = offset(zoomLayerDom);
                    zoomLayerOffset.left *= (1/scale);
                    zoomLayerOffset.top *= (1/scale);
                    selectionEnd = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
                    isSelecting_Draw = false;
                    
                    //Select the things in the box
                    selectComponentsInBox(selectionBegin, selectionEnd);
                }
            }

            //Set grabbing back to false
            isGrabbingGate = false;
        }
        if (event.button === 2) {
            //Moving around the workspace
            isGrabbing = false;
            endGrabPos = new Vector(event.pageX, event.pageY);

            begGrabPos.sub(endGrabPos);
            screenPos.sub(begGrabPos);

            document.getElementById("zoomLayer").style.left = screenPos.x + "px";
            document.getElementById("zoomLayer").style.top = screenPos.y + "px";
        }
    }
    function mouseMove(event) {
        //Keep mouse position
        mousePosition = new Vector(event.pageX, event.pageY);
        //Move the gate being placed to the cursor when the mouse moves
        if (isPlacing) {
            //Lock to grid movement
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            let gatePos = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
            placingComponent.position = new Vector(Math.round((gatePos.x / 32) - 0.5) * 32, Math.round((gatePos.y / 32) - 0.5) * 32);
        }
        //Move the wire being placed
        if (isWire) {
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            let wirePos = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
            placingWire.endPos = new Vector(wirePos.x, wirePos.y);
        }
        //Moving around the workspace
        if (isGrabbing) {
            endGrabPos = new Vector(event.pageX, event.pageY);

            var begGrabCopy = new Vector(begGrabPos.x, begGrabPos.y);

            begGrabCopy.sub(endGrabPos);
            screenPos.sub(begGrabCopy);

            document.getElementById("zoomLayer").style.left = screenPos.x + "px";
            document.getElementById("zoomLayer").style.top = screenPos.y + "px";

            begGrabPos = new Vector(endGrabPos.x, endGrabPos.y);
        }
        //Moving a selection or a gate around
        if (isGrabbingGate) {
            //Make sure the gate grabbed is a selected gate
            var isPartOfGroup = false;
            for (var i = 0; i < selectedGatesIds.length; i++) {
                if (selectedGatesIds[i] === gateGrabbedId)
                    isPartOfGroup = true;
            }

            //Maybe make it so it has to move a certain distance
            didGateMove = true;

            if (isPartOfGroup) {
                for (var i = 0; i < selectedGatesIds.length; i ++) {
                    getComponent(selectedGatesIds[i]).position = new Vector(Math.round((gatePos.x / 32) - 0.5) * 32, Math.round((gatePos.y / 32) - 0.5) * 32);
                }
            } else {
                //Lock to grid movement
                let zoomLayerOffset = offset(zoomLayerDom);
                zoomLayerOffset.left *= (1/scale);
                zoomLayerOffset.top *= (1/scale);
                let gatePos = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
                getComponent(gateGrabbedId).position = new Vector(Math.round((gatePos.x / 32) - 0.5) * 32, Math.round((gatePos.y / 32) - 0.5) * 32);
            }

            //SVELT NEED TO SEE AN ASGINMENT OF THE ARRAY TO KNOW THAT IT CHANGE AND TO UPDATE THE PROPS
            //see https://svelte.dev/tutorial/updating-arrays-and-objects for more information
            components = components;
            //Move the wires with the gate
            //Inputs
            //console.log(getWiresById(gateGrabbedId));
        }
        //If the user is selecting and not dragging
        if (isSelecting && !isGrabbingGate) {
            //Enable once drag has become large enough
            if (selectionBegin.distance(selectionEnd) > 10) {
                isSelecting_Draw = true;
            }
            
            let zoomLayerOffset = offset(zoomLayerDom);
            zoomLayerOffset.left *= (1/scale);
            zoomLayerOffset.top *= (1/scale);
            selectionEnd = new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top);
        }
    }
    
    function keypressing(event) {
        if (event.key === '=') { //Plus key
            if (scale < 3)
                scale += 0.25;
        }
        else if (event.key === '-') { //Minus key
            if (scale > 0.25)
                scale -= 0.25;
        }
        document.getElementById("zoomLayer").style.transform = "scale(" + scale + ")";

        //Delete a gate
        if (event.keyCode === 46) {
            console.log("delete");
            removeGates();
        }
    }

    function getWiresById(id) {
        var ret_wires = [];

        for (let i = 0; i < wires.length; i++) {
            if (wires[i].id === id) {
                ret_wires.push(wires[i].id);
            }
            if (wires[i].id_in === id) {
                ret_wires.push(wires[i].id_in);
            }
        }
        return ret_wires;
    }

    export function addGate(gateType) {
        //Math for the zoom stuffs
        let zoomLayerOffset = offset(zoomLayerDom);
        zoomLayerOffset.left *= (1/scale);
        zoomLayerOffset.top *= (1/scale);
        //Sets isPlacing as a state for what to do on mouse clicks and other stuff
        isPlacing = true;
        //Generates a temperary component for placing
        placingComponent = {
            id: nextGateID.toString(),
            inputs: [],
            output_states: [0],
            position: new Vector((1/scale) * event.pageX - zoomLayerOffset.left, (1/scale) * event.pageY - zoomLayerOffset.top),
            style: {
                isHighlighted: false,
            },
        }
        //Sets the gate speccific data for gate type requested, some of the preset data may be changed
        switch (gateType) {
        case "AND":
            placingComponent.in_count = 2;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1, 1];
            placingComponent.out_widths = [1];
            placingComponent.type = 'and';
            placingComponent.image = "./build/AND_GATE.svg";
            break;
        case "NAND":
            placingComponent.in_count = 2;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1, 1];
            placingComponent.out_widths = [1];
            placingComponent.type = 'nand';
            placingComponent.image = "./build/NAND_GATE.svg";
            break;
        case "NOT":
            placingComponent.in_count = 1;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1];
            placingComponent.out_widths = [1];
            placingComponent.type = 'not';
            placingComponent.image = "./build/NOT_GATE.svg";
            break;
        case "OR":
            placingComponent.in_count = 2;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1, 1];
            placingComponent.out_widths = [1];
            placingComponent.type = 'or';
            placingComponent.image = "./build/OR_GATE.svg";
            break;
        case "NOR":
            placingComponent.in_count = 2;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1, 1];
            placingComponent.out_widths = [1];
            placingComponent.type = 'nor';
            placingComponent.image = "./build/NOR_GATE.svg";
            break;
        case "XOR":
            placingComponent.in_count = 2;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1, 1];
            placingComponent.out_widths = [1];
            placingComponent.type = 'xor';
            placingComponent.image = "./build/XOR_GATE.svg";
            break;
        case "Switch":
            placingComponent.in_count = 0;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [];
            placingComponent.out_widths = [1];
            placingComponent.type = 'switch';
            placingComponent.image = "./build/AND_GATE.svg";
            break;
        case "Light":
            placingComponent.in_count = 1;
            placingComponent.out_count = 0;
            placingComponent.in_widths = [1];
            placingComponent.out_widths = [];
            placingComponent.type = 'light';
            placingComponent.image = "./build/Light.svg";
            break;
        case "dLatch":
            placingComponent.in_count = 2;
            placingComponent.out_count = 2;
            placingComponent.in_widths = [1, 1];
            placingComponent.out_widths = [1, 1];
            placingComponent.type = 'dLatch';
            placingComponent.image = "./build/Light.svg";
            break;
        case "in_bus":
            placingComponent.in_count = 8;
            placingComponent.out_count = 1;
            placingComponent.in_widths = [1, 1, 1, 1, 1, 1, 1, 1];
            placingComponent.out_widths = [8];
            placingComponent.type = 'in_bus';
            placingComponent.image = "./build/Light.svg";
            break;
        case "out_bus":
            placingComponent.in_count = 1;
            placingComponent.out_count = 8;
            placingComponent.in_widths = [8];
            placingComponent.out_widths = [1, 1, 1, 1, 1, 1, 1, 1];
            placingComponent.type = 'out_bus';
            placingComponent.image = "./build/Light.svg";
            break;
        default:
            console.log("Gate does not exist.");
            break;
        }
        //Tell svelte that the array updated
        placingComponent = placingComponent;
        //Incrament the gate id
        nextGateID++;
    }

    export function removeGates() {
        //Remove the currently selected gate or gates and the wires attched to the gates

        //This function requires that the id exists
        const getIndexIntoComponentsArray = (id) => {
            for (var i = 0; i < components.length; i++) {
                if (components[i].id === id)
                    return i;
            }
        };

        const removeWireByID = (id) => {
            for (var i = 0; i < wires.length; i++) {
                if (wires[i].id === id) {
                    //Follow the output and delete data in the component
                    getComponent(wires[i].id_in).inputs = [];
                    //Remove the wire
                    wires.splice(i, 1);
                    return 1;
                }
                if (wires[i].id_in === id) {
                    //Remove the wire
                    wires.splice(i, 1);
                    return 1;
                }
            }
            return 0;
        };

        const remove1Gate = (id) => {
            //Remove the attached wires
            while (removeWireByID(id)) {}
            //Remove the gate
            var index = getIndexIntoComponentsArray(id);
            components.splice(index, 1);
        };

        for (var i = 0; i < selectedGatesIds.length; i++) {
            remove1Gate(selectedGatesIds[i]);
        }

        selectedGatesIds = [];

        //Tell svelte to update the components
        components = components;
        wires = wires;
    }

    //Returns a component from an id
    //TODO - consider using the componentLookup for this
    function getComponent(id) {
        for (let i = 0; i < components.length; i++) { 
            if (components[i].id === id) {
                return components[i];
            }
        }
    }

    let isWire = false;
    let placingWire;

    //Is called when an output node is clicked on
    export function outputCallback(x_pos, y_pos, outWireIndex, id) {
        //Check if the same ouput was selected (cancel the selection)
        if (isWire) {
            if (placingWire.id === id) {
                isWire = false;
                return;
            }
        }

        canSelect = false;

        //Get the component
        var component = getComponent(id);

        isWire = true;

        let internalState = component.output_states[outWireIndex];
        placingWire = {
            startPos: new Vector(x_pos, y_pos),
            endPos: new Vector(x_pos, y_pos),
            id: id,
            index: outWireIndex,
            state: [internalState], //Should be 'x'?
            width: component.out_widths[outWireIndex]
        };
    }

    //Is called when an input node is clicked on
    //TODO - Component conencting doesn't handle multiple outputs
    export function inputCallback(x_pos, y_pos, inWireIndex, id) {
        console.log("Input callback");
        //Checks to see if an output node was already selected, if so it connects the nodes in the system
        if (isWire) {
            //Check if the widths match
            if (placingWire.width !== getComponent(id).in_widths[inWireIndex]) {
                //Wire widths are differnt, dont connect them
                return;
            }
            isWire = false;
            placingWire.endPos = new Vector(x_pos, y_pos);
            placingWire.id_in = id;
            wires = [...wires, placingWire];
            //Connect components in the array
            for (let i = 0; i < components.length; i++) { 
                if (components[i].id === id) {
                    components[i].inputs[inWireIndex] = {gate_id: placingWire.id, index: placingWire.index};
                }
            }

            canSelect = true;
        }
    }

    let gateSelected;

    function gateGrabbed(id) {
        console.log("Gate grabbed");
        //Setup some states
        isGrabbingGate = true;
        gateGrabbedId = id;
        didGateMove = false;
    }

    function gateReleased(id) {
        //Find out if it is a switch
        if (getComponent(id).type === "switch") {
            //If the gate didn't move, then change the state
            if (!didGateMove)
                switchState(id);
        }

        console.log("Gate released");

        //gateSelected = getComponent(id);
        //isGateSelected = true;

        
        //isGrabbingGate = false;
        //gateGrabbedId = -1;
    }

    function checkIfWireIsValid(id, isInput) {

        if (isInput) {

        } else {

        }
    }

    function increaseWidth() {
        if (!canInputOrOuputCountBeChanged(gateSelected.type))
            return;
        //Determine if it is a bus (slightly special case for these)
        if (gateSelected.type === "out_bus") {
            //Increase the out count
            gateSelected.out_count += 1;
            //Add to the in_widths
            gateSelected.out_widths = [...gateSelected.out_widths, 1];
            //Increase the input bus width
            gateSelected.in_widths = [gateSelected.in_widths[0] + 1];
        }
        else if (gateSelected.type === "in_bus") {
            //Increase the in count
            gateSelected.in_count += 1;
            //Add to the in_widths
            gateSelected.in_widths = [...gateSelected.in_widths, 1];
            //Increase the output width 
            gateSelected.out_widths = [gateSelected.out_widths[0] + 1];
        }
        else {
            //Increase the in count
            gateSelected.in_count += 1;
            //Add to the in_widths
            gateSelected.in_widths = [...gateSelected.in_widths, 1];
        }

        //Tells svelte to update everthing that uses the components array
        components = components;

    }

    function decreaseWidth() {
        if (!canInputOrOuputCountBeChanged(gateSelected.type))
            return;
        //The minimun for any gate that can change is 1
        if (gateSelected.in_count === 1)
            return;
        //Determine if it is a bus (slightly special case for these)
        if (gateSelected.type === "out_bus") {
            //Increase the out count
            gateSelected.out_count -= 1;
            //remove to the in_widths
            gateSelected.out_widths.pop();
            gateSelected = gateSelected; //DO NOT REMOVE (NOT REDUNDANT)
            //Increase the input bus width
            gateSelected.in_widths = [gateSelected.in_widths[0] - 1];
        }
        else if (gateSelected.type === "in_bus") {
            //Increase the in count
            gateSelected.in_count -= 1;
            //Add to the in_widths
            gateSelected.in_widths.pop();
            gateSelected = gateSelected; //DO NOT REMOVE (NOT REDUNDANT)
            //Increase the output width 
            gateSelected.out_widths = [gateSelected.out_widths[0] - 1];
        }
        else {
            //Increase the in count
            gateSelected.in_count -= 1;
            //Add to the in_widths
            gateSelected.in_widths.pop();
            gateSelected = gateSelected; //DO NOT REMOVE (NOT REDUNDANT)
        }

        //Tells svelte to update everthing that uses the components array
        components = components;
    }

    export function debugGates() {
        //Print info about all gates
        console.log("Gate debug:");
        console.log("Components Array: ");
        console.log(components);
        console.log("Wires Array: ");
        console.log(wires);
    }

    export function simulatate() {
        //Idk does something lol
        const componentLookup = indexBy(components, 'id');
        //Run for 1 step
        for (let iteration = 0; iteration < 1; iteration++) {
            for (let i = 0; i < 5; i++) {
                evaluate(components, componentLookup);
            }
        }
        //Update wire states for rendering purpose (Inefficent temp code)
        for (let w = 0; w < wires.length; w++) { 
            for (let i = 0; i < components.length; i++) { 
                if (components[i].id === wires[w].id) {
                    wires[w].state[0] = components[i].output_states[wires[w].index];
                }
            }
        }
        //Update outputs for all the component, this is for svlete to send changes to componments that may need to use them
        //If the simluator.js is brought into this file this can most likely go away
        //compoents = compoents; might work instead
        for (let i = 0; i < components.length; i++) { 
            components[i].output_states = components[i].output_states;
        }
    }

    export function loadSetup(setupType) {
        switch(setupType) {
        case 'bus':

            break;
        default:
            console.log("premade gate setup doesn't exsit.");
        }
    }

    function selectComponentsInBox(topPoint, bottomPoint) {
        //Smaller point is the top, bigger is the bottom, sort them
        //Correct format: p1 has the smallest x and y, p2 has the biggest x and y
        var p1 = new Vector(topPoint.x < bottomPoint.x ? topPoint.x : bottomPoint.x,
            topPoint.y < bottomPoint.y ? topPoint.y : bottomPoint.y);
        var p2 = new Vector(topPoint.x > bottomPoint.x ? topPoint.x : bottomPoint.x,
            topPoint.y > bottomPoint.y ? topPoint.y : bottomPoint.y);
 
        //Clear the variable to hold selection
        selectedGatesIds = new Array();

        //Check each of the points for a collision
        //1 point for each corner of an oject
        //Right now, if 1 point is selected the whole get is, this can be changed later
        for (var i = 0; i < components.length; i++) {
            let check1 = boxPointCollisionCheck(p1, p2, components[i].position);
            let check2 = boxPointCollisionCheck(p1, p2, new Vector(components[i].position.x + 32, components[i].position.y));
            let check3 = boxPointCollisionCheck(p1, p2, new Vector(components[i].position.x + 32, components[i].position.y + 32));
            let check4 = boxPointCollisionCheck(p1, p2, new Vector(components[i].position.x, components[i].position.y + 32));
            if (check1 || check2 || check3 || check4) {
                selectedGatesIds = [...selectedGatesIds, components[i].id];
            }
        }

        //Highlight the gates the were selected
        for (var i = 0; i < selectedGatesIds.length; i++) {
            getComponent(selectedGatesIds[i]).style.isHighlighted = true;
        }

        //Tell svelte to update the objects
        components = components;
    }

    function boxPointCollisionCheck(topPoint, bottomPoint, checkPoint) {
        //Simple AABB bounds checking for the selction box and points
        if (checkPoint.x > topPoint.x && checkPoint.x < bottomPoint.x) {
            if (checkPoint.y > topPoint.y && checkPoint.y < bottomPoint.y) {
                return true;
            }
        }
        return false;
    }

    function clearSelection() {
        //Clear the selection and select the new gate
        if (selectedGatesIds.length > 0) {
            //unhighlight the selected
            for (var i = 0; i < selectedGatesIds.length; i++) {
                getComponent(selectedGatesIds[i]).style.isHighlighted = false;
            }
            //Then Unselect what is selected
            selectedGatesIds = [];
            //Tell svelte to update
            components = components;
        }
    }

    //TODO - will be broken, fix
    function switchState(id) {
        console.log("Called");
        let comp = getComponent(id);
        if (comp.output_states[0])
            comp.output_states[0] = 0;
        else
            comp.output_states[0] = 1;
        //Rerun sim
        simulatate();
    }

    function offset(el) {
        var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }

    const typeToImg = {
        "and": "./build/AND_GATE.svg",
        "nand": "./build/NAND_GATE.svg",
        "not": "./build/NOT_GATE.svg",
        "or": "./build/OR_GATE.svg",
        "nor": "./build/NOR_GATE.svg",
        "xor": "./build/XOR_GATE.svg",
        "switch": "./build/AND_GATE.svg",
        "light": "./build/Light.svg",
    };

    function generateComponentsData(fullData) {
        //Sort the options
        var data = fullData.comps;
        nextGateID = fullData.nextGateID;

        //Clear the components array
        components = [];

        console.log(data);

        //Fill in the missing data for the components
        for (var i = 0; i < data.length; i++) {
            let newComponent = {
                id: data[i].id,
                in_count: data[i].in_w.length,
                out_count: data[i].ou_w.length,
                in_widths: data[i].in_w,
                out_widths: data[i].ou_w,
                type: data[i].type,
                inputs: data[i].in,
                output_states: [],
                position: data[i].pos,
                image: typeToImg[data[i].type],
                style: {
                    isHighlighted: false
                }
            };
            for (var k = 0; k < data[i].ou_w.length; k++)
                newComponent.output_states.push(0);
            components.push(newComponent);
        }

        //Generate the wires that connect the gates
        wires = [];

        const findWirePos = (component, index, total, isInput) => {
            //Find where a wire should go, it is hardcoded in the html

            let ret = new Vector(0, 0);

            if (isInput) {
                ret.x = component.position.x - 26 + 8;
            }
            else {
                ret.x = component.position.x + 42 + 8;
            }

            if (total === 1) {
                ret.y = component.position.y + 8 + 8;
            }
            else {
                //This is based on the index
                ret.y = component.position.y + 16 * index + 8;
            }

            return ret;
        };

        for (var i = 0; i < components.length; i++) {
            for (var k = 0; k < components[i].inputs.length; k++) {
                let newWire = {
                    //Wire position still incorrect
                    startPos: findWirePos(getComponent(components[i].inputs[k].gate_id), components[i].inputs[k].index, getComponent(components[i].inputs[k].gate_id).out_count, false),
                    endPos: findWirePos(components[i], k, components[i].inputs.length, true),
                    id: components[i].inputs[k].gate_id,
                    id_in: components[i].id,
                    index: components[i].inputs[k].index,
                    state: [],
                    width: components[i].in_widths[k],
                }
                //Add one for each width of the bus
                for (var q = 0; q < components[i].in_widths[k].length; q++)
                    newWire.push(0);

                wires.push(newWire);
            }
        }

        console.log("Component Array Built: ", components);

        //Tell svelte to update stuff
        components = components;
        wires = wires;
    }

    export function load(lessonID) {
        fetch("http://localhost:8080/api/load", {
            headers: {
                "content-type":"application/json"
            },
            method: "POST", 
            body: JSON.stringify({
                lessonID: externalData,
            })
        }).then(res => {
            return res.json();
        }).then(res => {
            console.log("Request complete! response:", res)
            //Load the information into the components array
            generateComponentsData(res.data);
        }).catch(error => {
        });
    }

    export function save() {
        //Make a post to the server with the json data to save
        //Clean the data to be sent
        //Remove all non essential information
        let sendData = [];
        for (var i = 0; i < components.length; i++) {
            let entry = {
                'id'   : components[i].id,
                'in_w' : components[i].in_widths,
                'ou_w' : components[i].out_widths,
                'type' : components[i].type,
                'in'   : components[i].inputs,
                'pos'  : components[i].position,
            };

            sendData = [...sendData, entry];
        }

        var sendDataWithOptions = {
            comps: sendData,
            nextGateID: nextGateID,
        }

        console.log("Sending data: ", sendDataWithOptions);

        fetch("http://localhost:8080/api/save", {
            headers: {
                "content-type":"application/json"
            },
            method: "POST", 
            body: JSON.stringify({
                lessonID: externalData,
                lessonData: sendDataWithOptions,
            })
        }).then(res => {
            console.log("Request complete! response:", res)
        });
    }

</script>

<style>
	div {
        width: 100%;
        height: 100%;

        position: relative;

        transform: scale(1);
    }
    .options {
        background-color: lightgray;
        right: 30px;
        bottom: 30px;
        width: 300px;
        height: 150px;
        z-index: 2;
        position: absolute;

        text-align: center;
        border-color: gray;
        border-style: solid;
        border-radius: 10px;
    }
    .workspace {
        background-color: #d6d6d6;
    }
    #zoomLayer {
        /* background-image: url(./grid_dark.png); */
        background-color: #1F2933;
        width: 2048px;
        height: 2048px;
    }
    .wire {
        position: relative;
        z-index: -2;
    }

    .options_content {
        width: 100%;
        height: 135px;
    }

    .width_buttons {
        display: flex;
        justify-content: center;  
        width: 100%;
        height: 50px;
    }

    button {
        width: 50px;
        height: 100%;
    }

    p {
        margin: 8px;
    }

</style>

<svelte:window on:mouseup={mouseUp} on:mousemove={mouseMove} on:keydown={keypressing}/>

<div class="workspace" bind:this={workspaceDom}>
    {#if isGateSelected}
    <div class="options">
        <div class="options_content">
            <p>Gate Name<p>
            <input type="text" id="fname" name="fname">
            <div class="width_buttons">
                <button on:click={decreaseWidth}>-</button>
                <p>{gateSelected.in_count}</p>
                <button on:click={increaseWidth}>+</button>
            </div>
        </div>
    </div>
    {/if}
    <div id="zoomLayer" bind:this={zoomLayerDom} on:mousedown={mouseDown}>
        {#if isSelecting_Draw}
            <Selection start_x_pos={selectionBegin.x} start_y_pos={selectionBegin.y} end_x_pos={selectionEnd.x} end_y_pos={selectionEnd.y} />
        {/if}
        <div class="wire">
            <svg width="2048" height="2048">
                {#each wires as wire, i}
                    <Wire start_x_pos={wires[i].startPos.x} start_y_pos={wires[i].startPos.y}
                        end_x_pos={wires[i].endPos.x} end_y_pos={wires[i].endPos.y} state={wires[i].state[0]}
                    />
                {/each}
                {#if isWire}
                    <Wire start_x_pos={placingWire.startPos.x} start_y_pos={placingWire.startPos.y}
                        end_x_pos={placingWire.endPos.x} end_y_pos={placingWire.endPos.y} state={placingWire.state[0]}
                    />
                {/if}
            </svg>
        </div>
        {#each components as gate, i}
            {#if gate.type === 'light'}
                <Light x_pos={components[i].position.x} y_pos={components[i].position.y} image={components[i].image}
                    inputs={components[i].in_count} id={components[i].id} inputCallback={inputCallback} state={components[i].output_states[0]}
                    grabbing={gateGrabbed} released={gateReleased}
                />
            {:else}
                <Gate bind:this={gate.update} x_pos={gate.position.x} y_pos={gate.position.y}
                    image={gate.image} inputs={gate.in_count} outputs={gate.out_count} id={gate.id}
                    outputCallback={outputCallback} inputCallback={inputCallback} grabbing={gateGrabbed} released={gateReleased} styles={gate.style}
                />
            {/if}
        {/each}
        {#if isPlacing}
            <Gate x_pos={placingComponent.position.x} y_pos={placingComponent.position.y} image={placingComponent.image}
                inputs={placingComponent.in_count} outputs={placingComponent.out_count} id={placingComponent.id} styles={placingComponent.style}
            />
        {/if}
    </div>
</div>