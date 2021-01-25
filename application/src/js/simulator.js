const not = a => ~a & 1;
const and = (values) => {
  var ret = values[0];
  console.log(values);
  for (var i = 1; i < values.length; i++)
    ret = ret && values[i];
  console.log(ret);
  return ret;
};
const nand = (values) => {
  var ret = values[0];
  console.log(values);
  for (var i = 1; i < values.length; i++)
    ret = ret && values[i];
  console.log(ret);
  return not(ret);
};
const or = (values) => {
  var ret = values[0];
  console.log(values);
  for (var i = 1; i < values.length; i++)
    ret = ret || values[i];
  console.log(ret);
  return ret;
};
const nor = (values) => {
  var ret = values[0];
  console.log(values);
  for (var i = 1; i < values.length; i++)
    ret = ret || values[i];
  console.log(ret);
  return not(ret);
};
const xor = (values) => { //Broken with more than 2 bits at the moment
  var ret = values[0];
  console.log(values);
  for (var i = 1; i < values.length; i++)
    ret = ret ^ values[i];
  console.log(ret);
  return ret;
};
const nxor = (values) => { //Broken with more than 2 bits at the moment
  var ret = values[0];
  console.log(values);
  for (var i = 1; i < values.length; i++)
    ret = ret ^ values[i];
  console.log(ret);
  return not(ret);
};

const validateInputs = (component, inputCount) => {
  for (var i = 0; i < inputCount; i++) {
    if (!component.inputs[i]) {
      return 0;
    }
  }
  return 1;
};

function bus_in(component, componentLookup) { //Does not handle the case of 'x'
  if (!validateInputs(component, component.in_count)) return;

  var outputs = [];

  for (var i = 0; i < component.in_count; i++) {
    outputs.push(componentLookup[component.inputs[i].gate_id].output_states[component.inputs[i].index]);
  }

  component.output_states = [outputs];
}

//TODO - bigger bus sizes
function bus_out(component, componentLookup) { //Does not handle the case of 'x'
  //console.log(aOut);
  if (!validateInputs(component, component.in_count)) return;

  const aOut = componentLookup[component.inputs[0].gate_id].output_states[component.inputs[0].index];

  for (var i = 0; i < component.out_count; i++) {
    component.output_states[i] = aOut[i];
  }
}

function d_latch(component, componentLookup) { //Does not handle the case of 'x'
  if (!validateInputs(component, component.in_count)) return;
  //Data
  const aOut = componentLookup[component.inputs[0].gate_id];
  //Clock
  const bOut = componentLookup[component.inputs[1].gate_id];
  //Q
  component.output_states[0] = (bOut.output_states[component.inputs[1].index]) ? aOut.output_states[component.inputs[1].index] : component.output_states[0];
  component.output_states[1] = not(component.output_states[0]);
}

export const evaluate = (components, componentLookup) => {
    const binaryOp = (logicFn, component) => {
      if (!validateInputs(component, component.in_count)) return;
      
      var outputs = [];

      for (var i = 0; i < component.in_count; i++) {
        outputs.push(componentLookup[component.inputs[i].gate_id].output_states[component.inputs[i].index]);
      }
    
      component.output_states[0] = logicFn(outputs);
      return;
    }

  components.forEach(component => {
    if (component.type === 'controlled') return;
    if (component.type === 'switch') return;
    if (component.type === 'light') {
        if (!validateInputs(component, 1)) return;
        const aOut = componentLookup[component.inputs[0].gate_id];
        component.output_states[0] = aOut.output_states[component.inputs[0].index];
        return;
    }
    if (component.type === 'and') return binaryOp(and, component);
    if (component.type === 'nand') return binaryOp(nand, component);
    if (component.type === 'or') return binaryOp(or, component);
    if (component.type === 'nor') return binaryOp(nor, component);
    if (component.type === 'xor') return binaryOp(xor, component);
    if (component.type === 'xnor') return binaryOp(xnor, component);
    if (component.type === 'not') {
      if (!validateInputs(component, 2)) return;
      const aOut = componentLookup[component.inputs[0].gate_id];
      component.output_states[0] = (aOut === 'x') ? 'x' : not(aOut.output_states[component.inputs[0].index]);
      return;
    }
    if (component.type === 'in_bus') return bus_in(component, componentLookup);
    if (component.type === 'out_bus') return bus_out(component, componentLookup);
    //Circuits
    if (component.type === 'dLatch') return d_latch(component, componentLookup);
  });
};