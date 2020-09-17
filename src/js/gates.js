export class Wire {
    constructor () {
        this.state = false;
        this.gate;
    }
    setGate(gate) {
        this.gate = gate;
    }
    getState() {
        return this.state;
    }
    setState(newState) {
        this.state = newState;
        /* if (this.gate !== null)
            this.gate.update();
        else {
            console.log('Wires exits gate was null.');
        } */
    }
}

export class Gate {
    constructor(inputCount, outputCount) {
        this.Inputs = new Array();
        for (var i = 0; i < inputCount; i++)
            this.Inputs.push(new Wire());

        this.Outputs = new Array();
        for (var i = 0; i < outputCount; i++)
            this.Outputs.push(new Wire());

        console.log("Inputs:  " + this.Inputs);
        console.log("Outputs: " + this.Outputs);
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
        console.log("Before: " + this.Outputs[0].getState());
        this.Outputs[0].setState(!(this.Inputs[0].getState() && this.Inputs[1].getState()));
        console.log("After:  " + this.Outputs[0].getState());
    }
}