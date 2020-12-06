const not = a => ~a & 1;
const and = (a, b) => a && b;
const nand = (a, b) => not(a && b);
const or = (a, b) => a || b;
const nor = (a, b) => not(a || b);
const xor = (a, b) => a ^ b;
const xnor = (a, b) => not(a ^ b);

export const evaluate = (components, componentLookup) => {
  const binaryOp = (logicFn, component) => {
    const aOut = componentLookup[component.inputs[0]];
    const bOut = componentLookup[component.inputs[1]];

    component.state = (aOut === 'x' || bOut === 'x')
      ? 'x'
      : logicFn(aOut.state, bOut.state);
    return;
  }

  components.forEach(component => {
    if (component.type === 'controlled') return;
    if (component.type === 'equal') {
        const aOut = componentLookup[component.inputs[0]];
        component.state = aOut.state;
        return;
    }
    if (component.type === 'and') return binaryOp(and, component);
    if (component.type === 'nand') return binaryOp(nand, component);
    if (component.type === 'or') return binaryOp(or, component);
    if (component.type === 'nor') return binaryOp(nor, component);
    if (component.type === 'xor') return binaryOp(xor, component);
    if (component.type === 'xnor') return binaryOp(xnor, component);
    if (component.type === 'not') {
      const aOut = componentLookup[component.inputs[0]];
      component.state = (aOut === 'x') ? 'x' : not(aOut.state);
      return;
    }
  });
};