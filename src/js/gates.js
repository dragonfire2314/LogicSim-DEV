export class Wire {
    constructor () {
        this.state = false;
        this.gate;
        this.port;
    }
    setGate(gate) {
        this.gate = gate;
    }
    getState() {
        return this.state;
    }
    setState(newState) {
        this.state = newState;
        if (this.gate === null) {
            //console.log(this.gate);
            this.port.setState(this.state);
            this.gate.update();
        }
        else {
            console.log('Wires exits gate was null.');
        }
    }
}

class Port {
    constructor() {
        this.state = false;
    }
    getState() {
        return this.state; 
    }
    setState(newState) {
        this.state = newState;
    }
}; 

export class Gate {
    constructor(inputCount, outputCount) {
        this.Inputs = new Array();
        for (var i = 0; i < inputCount; i++)
            this.Inputs.push(new Port());

        this.Outputs = new Array();
        for (var i = 0; i < outputCount; i++)
            this.Outputs.push(new Wire());

        //console.log("Inputs:  " + this.Inputs);
        //console.log("Outputs: " + this.Outputs);
    }

    update() {
        console.log("Default gate is invalid no logic will be done and logic propagation will cease.");
    }
}

export class NAND extends Gate{
    constructor() {
        super(2, 1);
    }

    update() {
        //console.log("Before: " + this.Outputs[0].getState());
        //console.log(this.Inputs);
        this.Outputs[0].setState(!(this.Inputs[0].getState() && this.Inputs[1].getState()));
        //console.log("After:  " + this.Outputs[0].getState());
    }
}