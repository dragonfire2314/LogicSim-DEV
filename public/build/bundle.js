
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class Wire {
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
    }
    class Gate {
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

    class NAND extends Gate{
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

    /* src\input.svelte generated by Svelte v3.25.0 */
    const file = "src\\input.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "line svelte-13kec9l");
    			add_location(div0, file, 53, 0, 1319);
    			attr_dev(div1, "class", "port svelte-13kec9l");
    			add_location(div1, file, 55, 0, 1368);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			/*div0_binding*/ ctx[10](div0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			/*div1_binding*/ ctx[11](div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mouseover", /*hoving*/ ctx[2], false, false, false),
    					listen_dev(div1, "mouseout", /*leaveing*/ ctx[3], false, false, false),
    					listen_dev(div1, "mousedown", /*mouseDown*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[10](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[11](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { wireIndex } = $$props;
    	let { id } = $$props;
    	let { inputCallback } = $$props;
    	let line_dom;
    	let circle_dom;

    	onMount(async () => {
    		$$invalidate(1, circle_dom.style.left = x_pos + "px", circle_dom);
    		$$invalidate(1, circle_dom.style.top = y_pos + "px", circle_dom);
    		$$invalidate(1, circle_dom.style.backgroundImage = "url(build/PORT_CIRCLE.svg)", circle_dom);
    		$$invalidate(0, line_dom.style.left = x_pos + 11 + "px", line_dom);
    		$$invalidate(0, line_dom.style.top = y_pos + 7 + "px", line_dom);
    		$$invalidate(0, line_dom.style.backgroundImage = "url(build/PORT_LINE.svg)", line_dom);
    	});

    	function hoving(event) {
    		$$invalidate(1, circle_dom.style.transform = "scale(" + 1.5 + ")", circle_dom);
    	}

    	function leaveing() {
    		$$invalidate(1, circle_dom.style.transform = "scale(" + 1 + ")", circle_dom);
    	}

    	function mouseDown() {
    		let temp = circle_dom.parentNode.style;
    		inputCallback(x_pos + parseInt(temp.left) + 8, y_pos + parseInt(temp.top) + 8, wireIndex, id);
    	}

    	const writable_props = ["x_pos", "y_pos", "wireIndex", "id", "inputCallback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			line_dom = $$value;
    			$$invalidate(0, line_dom);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			circle_dom = $$value;
    			$$invalidate(1, circle_dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(5, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(6, y_pos = $$props.y_pos);
    		if ("wireIndex" in $$props) $$invalidate(7, wireIndex = $$props.wireIndex);
    		if ("id" in $$props) $$invalidate(8, id = $$props.id);
    		if ("inputCallback" in $$props) $$invalidate(9, inputCallback = $$props.inputCallback);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Wire,
    		x_pos,
    		y_pos,
    		wireIndex,
    		id,
    		inputCallback,
    		line_dom,
    		circle_dom,
    		hoving,
    		leaveing,
    		mouseDown
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(5, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(6, y_pos = $$props.y_pos);
    		if ("wireIndex" in $$props) $$invalidate(7, wireIndex = $$props.wireIndex);
    		if ("id" in $$props) $$invalidate(8, id = $$props.id);
    		if ("inputCallback" in $$props) $$invalidate(9, inputCallback = $$props.inputCallback);
    		if ("line_dom" in $$props) $$invalidate(0, line_dom = $$props.line_dom);
    		if ("circle_dom" in $$props) $$invalidate(1, circle_dom = $$props.circle_dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		line_dom,
    		circle_dom,
    		hoving,
    		leaveing,
    		mouseDown,
    		x_pos,
    		y_pos,
    		wireIndex,
    		id,
    		inputCallback,
    		div0_binding,
    		div1_binding
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			x_pos: 5,
    			y_pos: 6,
    			wireIndex: 7,
    			id: 8,
    			inputCallback: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*wireIndex*/ ctx[7] === undefined && !("wireIndex" in props)) {
    			console.warn("<Input> was created without expected prop 'wireIndex'");
    		}

    		if (/*id*/ ctx[8] === undefined && !("id" in props)) {
    			console.warn("<Input> was created without expected prop 'id'");
    		}

    		if (/*inputCallback*/ ctx[9] === undefined && !("inputCallback" in props)) {
    			console.warn("<Input> was created without expected prop 'inputCallback'");
    		}
    	}

    	get x_pos() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x_pos(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y_pos() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y_pos(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wireIndex() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wireIndex(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputCallback() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputCallback(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\output.svelte generated by Svelte v3.25.0 */
    const file$1 = "src\\output.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "line svelte-13kec9l");
    			add_location(div0, file$1, 52, 0, 1283);
    			attr_dev(div1, "class", "port svelte-13kec9l");
    			add_location(div1, file$1, 54, 0, 1332);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			/*div0_binding*/ ctx[9](div0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			/*div1_binding*/ ctx[10](div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mouseover", /*hoving*/ ctx[2], false, false, false),
    					listen_dev(div1, "mouseout", /*leaveing*/ ctx[3], false, false, false),
    					listen_dev(div1, "mousedown", /*mouseDown*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[9](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Output", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { id } = $$props;
    	let { outputCallback } = $$props;
    	let line_dom;
    	let circle_dom;

    	onMount(async () => {
    		$$invalidate(1, circle_dom.style.left = x_pos + "px", circle_dom);
    		$$invalidate(1, circle_dom.style.top = y_pos + "px", circle_dom);
    		$$invalidate(1, circle_dom.style.backgroundImage = "url(build/PORT_CIRCLE.svg)", circle_dom);
    		$$invalidate(0, line_dom.style.left = x_pos - 11 + "px", line_dom);
    		$$invalidate(0, line_dom.style.top = y_pos + 7 + "px", line_dom);
    		$$invalidate(0, line_dom.style.backgroundImage = "url(build/PORT_LINE.svg)", line_dom);
    	});

    	function hoving(event) {
    		$$invalidate(1, circle_dom.style.transform = "scale(" + 1.5 + ")", circle_dom);
    	}

    	function leaveing() {
    		$$invalidate(1, circle_dom.style.transform = "scale(" + 1 + ")", circle_dom);
    	}

    	function mouseDown() {
    		let temp = circle_dom.parentNode.style;
    		outputCallback(x_pos + parseInt(temp.left) + 8, y_pos + parseInt(temp.top) + 8, id);
    	}

    	const writable_props = ["x_pos", "y_pos", "id", "outputCallback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Output> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			line_dom = $$value;
    			$$invalidate(0, line_dom);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			circle_dom = $$value;
    			$$invalidate(1, circle_dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(5, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(6, y_pos = $$props.y_pos);
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    		if ("outputCallback" in $$props) $$invalidate(8, outputCallback = $$props.outputCallback);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Wire,
    		x_pos,
    		y_pos,
    		id,
    		outputCallback,
    		line_dom,
    		circle_dom,
    		hoving,
    		leaveing,
    		mouseDown
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(5, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(6, y_pos = $$props.y_pos);
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    		if ("outputCallback" in $$props) $$invalidate(8, outputCallback = $$props.outputCallback);
    		if ("line_dom" in $$props) $$invalidate(0, line_dom = $$props.line_dom);
    		if ("circle_dom" in $$props) $$invalidate(1, circle_dom = $$props.circle_dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		line_dom,
    		circle_dom,
    		hoving,
    		leaveing,
    		mouseDown,
    		x_pos,
    		y_pos,
    		id,
    		outputCallback,
    		div0_binding,
    		div1_binding
    	];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			x_pos: 5,
    			y_pos: 6,
    			id: 7,
    			outputCallback: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[7] === undefined && !("id" in props)) {
    			console.warn("<Output> was created without expected prop 'id'");
    		}

    		if (/*outputCallback*/ ctx[8] === undefined && !("outputCallback" in props)) {
    			console.warn("<Output> was created without expected prop 'outputCallback'");
    		}
    	}

    	get x_pos() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x_pos(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y_pos() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y_pos(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputCallback() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputCallback(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\gate.svelte generated by Svelte v3.25.0 */
    const file$2 = "src\\gate.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (51:4) {#each Array(inputs) as _, i}
    function create_each_block_1(ctx) {
    	let input;
    	let current;

    	input = new Input({
    			props: {
    				x_pos: -26,
    				y_pos: /*i*/ ctx[13] * 16,
    				wireIndex: /*i*/ ctx[13],
    				id: /*id*/ ctx[4],
    				inputCallback: /*inputCallback*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input_changes = {};
    			if (dirty & /*id*/ 16) input_changes.id = /*id*/ ctx[4];
    			if (dirty & /*inputCallback*/ 1) input_changes.inputCallback = /*inputCallback*/ ctx[0];
    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(51:4) {#each Array(inputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (54:4) {#each Array(outputs) as _, i}
    function create_each_block(ctx) {
    	let output;
    	let current;

    	output = new Output({
    			props: {
    				x_pos: 42,
    				y_pos: 7,
    				id: /*id*/ ctx[4],
    				outputCallback: /*outputCallback*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(output.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(output, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const output_changes = {};
    			if (dirty & /*id*/ 16) output_changes.id = /*id*/ ctx[4];
    			if (dirty & /*outputCallback*/ 2) output_changes.outputCallback = /*outputCallback*/ ctx[1];
    			output.$set(output_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(output, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(54:4) {#each Array(outputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = Array(/*inputs*/ ctx[2]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = Array(/*outputs*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-vwda1d");
    			add_location(div, file$2, 49, 0, 1102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(div, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[9](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id, inputCallback, inputs*/ 21) {
    				each_value_1 = Array(/*inputs*/ ctx[2]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*id, outputCallback, outputs*/ 26) {
    				each_value = Array(/*outputs*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[9](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gate", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { image } = $$props;
    	let { inputCallback } = $$props;
    	let { outputCallback } = $$props;
    	let { inputs } = $$props;
    	let { outputs } = $$props;
    	let { id } = $$props;
    	let dom;

    	onMount(async () => {
    		//Move to position assigned by the creator on startup
    		$$invalidate(5, dom.style.left = x_pos + "px", dom);

    		$$invalidate(5, dom.style.top = y_pos + "px", dom);
    		$$invalidate(5, dom.style.backgroundImage = "url(" + image + ")", dom);
    	});

    	function updatePosition() {
    		if (dom) {
    			$$invalidate(5, dom.style.left = x_pos + "px", dom);
    			$$invalidate(5, dom.style.top = y_pos + "px", dom);
    		}
    	}

    	const writable_props = [
    		"x_pos",
    		"y_pos",
    		"image",
    		"inputCallback",
    		"outputCallback",
    		"inputs",
    		"outputs",
    		"id"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gate> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			$$invalidate(5, dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(6, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(7, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(8, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("outputCallback" in $$props) $$invalidate(1, outputCallback = $$props.outputCallback);
    		if ("inputs" in $$props) $$invalidate(2, inputs = $$props.inputs);
    		if ("outputs" in $$props) $$invalidate(3, outputs = $$props.outputs);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Input,
    		Output,
    		x_pos,
    		y_pos,
    		image,
    		inputCallback,
    		outputCallback,
    		inputs,
    		outputs,
    		id,
    		dom,
    		updatePosition
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(6, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(7, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(8, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("outputCallback" in $$props) $$invalidate(1, outputCallback = $$props.outputCallback);
    		if ("inputs" in $$props) $$invalidate(2, inputs = $$props.inputs);
    		if ("outputs" in $$props) $$invalidate(3, outputs = $$props.outputs);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("dom" in $$props) $$invalidate(5, dom = $$props.dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x_pos, y_pos*/ 192) {
    			//Called whenever x or y position is updated externally from parent or internally
    			 if (x_pos || y_pos) {
    				updatePosition();
    			}
    		}
    	};

    	return [
    		inputCallback,
    		outputCallback,
    		inputs,
    		outputs,
    		id,
    		dom,
    		x_pos,
    		y_pos,
    		image,
    		div_binding
    	];
    }

    class Gate$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			x_pos: 6,
    			y_pos: 7,
    			image: 8,
    			inputCallback: 0,
    			outputCallback: 1,
    			inputs: 2,
    			outputs: 3,
    			id: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gate",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[8] === undefined && !("image" in props)) {
    			console.warn("<Gate> was created without expected prop 'image'");
    		}

    		if (/*inputCallback*/ ctx[0] === undefined && !("inputCallback" in props)) {
    			console.warn("<Gate> was created without expected prop 'inputCallback'");
    		}

    		if (/*outputCallback*/ ctx[1] === undefined && !("outputCallback" in props)) {
    			console.warn("<Gate> was created without expected prop 'outputCallback'");
    		}

    		if (/*inputs*/ ctx[2] === undefined && !("inputs" in props)) {
    			console.warn("<Gate> was created without expected prop 'inputs'");
    		}

    		if (/*outputs*/ ctx[3] === undefined && !("outputs" in props)) {
    			console.warn("<Gate> was created without expected prop 'outputs'");
    		}

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<Gate> was created without expected prop 'id'");
    		}
    	}

    	get x_pos() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x_pos(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y_pos() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y_pos(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputCallback() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputCallback(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputCallback() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputCallback(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputs() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputs(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputs() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputs(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\userInput.svelte generated by Svelte v3.25.0 */
    const file$3 = "src\\userInput.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (54:4) {#each Array(outputs) as _, i}
    function create_each_block$1(ctx) {
    	let output;
    	let current;

    	output = new Output({
    			props: {
    				x_pos: 42,
    				y_pos: 7,
    				id: /*id*/ ctx[2],
    				outputCallback: /*outputCallback*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(output.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(output, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const output_changes = {};
    			if (dirty & /*id*/ 4) output_changes.id = /*id*/ ctx[2];
    			if (dirty & /*outputCallback*/ 1) output_changes.outputCallback = /*outputCallback*/ ctx[0];
    			output.$set(output_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(output, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(54:4) {#each Array(outputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Array(/*outputs*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-vwda1d");
    			add_location(div, file$3, 52, 0, 1121);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[9](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "mousedown", /*mouseDown*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id, outputCallback, outputs*/ 7) {
    				each_value = Array(/*outputs*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[9](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("UserInput", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { image } = $$props;
    	let { outputCallback } = $$props;
    	let { switchState } = $$props;
    	let { outputs } = $$props;
    	let { id } = $$props;
    	let dom;

    	onMount(async () => {
    		//Move to position assigned by the creator on startup
    		$$invalidate(3, dom.style.left = x_pos + "px", dom);

    		$$invalidate(3, dom.style.top = y_pos + "px", dom);
    		$$invalidate(3, dom.style.backgroundImage = "url(" + image + ")", dom);
    	});

    	function updatePosition() {
    		if (dom) {
    			$$invalidate(3, dom.style.left = x_pos + "px", dom);
    			$$invalidate(3, dom.style.top = y_pos + "px", dom);
    		}
    	}

    	function mouseDown() {
    		//Change state
    		switchState(id);
    	}

    	const writable_props = ["x_pos", "y_pos", "image", "outputCallback", "switchState", "outputs", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UserInput> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			$$invalidate(3, dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(5, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(6, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(7, image = $$props.image);
    		if ("outputCallback" in $$props) $$invalidate(0, outputCallback = $$props.outputCallback);
    		if ("switchState" in $$props) $$invalidate(8, switchState = $$props.switchState);
    		if ("outputs" in $$props) $$invalidate(1, outputs = $$props.outputs);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Output,
    		x_pos,
    		y_pos,
    		image,
    		outputCallback,
    		switchState,
    		outputs,
    		id,
    		dom,
    		updatePosition,
    		mouseDown
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(5, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(6, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(7, image = $$props.image);
    		if ("outputCallback" in $$props) $$invalidate(0, outputCallback = $$props.outputCallback);
    		if ("switchState" in $$props) $$invalidate(8, switchState = $$props.switchState);
    		if ("outputs" in $$props) $$invalidate(1, outputs = $$props.outputs);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("dom" in $$props) $$invalidate(3, dom = $$props.dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x_pos, y_pos*/ 96) {
    			//Called whenever x or y position is updated externally from parent or internally
    			 if (x_pos || y_pos) {
    				updatePosition();
    			}
    		}
    	};

    	return [
    		outputCallback,
    		outputs,
    		id,
    		dom,
    		mouseDown,
    		x_pos,
    		y_pos,
    		image,
    		switchState,
    		div_binding
    	];
    }

    class UserInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			x_pos: 5,
    			y_pos: 6,
    			image: 7,
    			outputCallback: 0,
    			switchState: 8,
    			outputs: 1,
    			id: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserInput",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[7] === undefined && !("image" in props)) {
    			console.warn("<UserInput> was created without expected prop 'image'");
    		}

    		if (/*outputCallback*/ ctx[0] === undefined && !("outputCallback" in props)) {
    			console.warn("<UserInput> was created without expected prop 'outputCallback'");
    		}

    		if (/*switchState*/ ctx[8] === undefined && !("switchState" in props)) {
    			console.warn("<UserInput> was created without expected prop 'switchState'");
    		}

    		if (/*outputs*/ ctx[1] === undefined && !("outputs" in props)) {
    			console.warn("<UserInput> was created without expected prop 'outputs'");
    		}

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<UserInput> was created without expected prop 'id'");
    		}
    	}

    	get x_pos() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x_pos(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y_pos() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y_pos(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputCallback() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputCallback(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get switchState() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set switchState(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputs() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputs(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<UserInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<UserInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\wire.svelte generated by Svelte v3.25.0 */
    const file$4 = "src\\wire.svelte";

    function create_fragment$4(ctx) {
    	let path0;
    	let path0_d_value;
    	let t;
    	let path1;
    	let path1_d_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			t = space();
    			path1 = svg_element("path");
    			attr_dev(path0, "d", path0_d_value = "M " + /*start_x_pos*/ ctx[0] + " " + /*start_y_pos*/ ctx[1] + " \r\n    C " + (/*start_x_pos*/ ctx[0] + 128) + " " + /*start_y_pos*/ ctx[1] + ", " + (/*end_x_pos*/ ctx[2] - 128) + " " + /*end_y_pos*/ ctx[3] + ", " + /*end_x_pos*/ ctx[2] + " " + /*end_y_pos*/ ctx[3]);
    			attr_dev(path0, "stroke", "black");
    			attr_dev(path0, "fill", "transparent");
    			attr_dev(path0, "stroke-width", "6");
    			add_location(path0, file$4, 33, 0, 642);
    			attr_dev(path1, "d", path1_d_value = "M " + /*start_x_pos*/ ctx[0] + " " + /*start_y_pos*/ ctx[1] + " \r\n    C " + (/*start_x_pos*/ ctx[0] + 128) + " " + /*start_y_pos*/ ctx[1] + ", " + (/*end_x_pos*/ ctx[2] - 128) + " " + /*end_y_pos*/ ctx[3] + ", " + /*end_x_pos*/ ctx[2] + " " + /*end_y_pos*/ ctx[3]);
    			attr_dev(path1, "stroke", /*color*/ ctx[4]);
    			attr_dev(path1, "fill", "transparent");
    			attr_dev(path1, "stroke-width", "3");
    			add_location(path1, file$4, 40, 0, 984);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, path1, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*start_x_pos, start_y_pos, end_x_pos, end_y_pos*/ 15 && path0_d_value !== (path0_d_value = "M " + /*start_x_pos*/ ctx[0] + " " + /*start_y_pos*/ ctx[1] + " \r\n    C " + (/*start_x_pos*/ ctx[0] + 128) + " " + /*start_y_pos*/ ctx[1] + ", " + (/*end_x_pos*/ ctx[2] - 128) + " " + /*end_y_pos*/ ctx[3] + ", " + /*end_x_pos*/ ctx[2] + " " + /*end_y_pos*/ ctx[3])) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*start_x_pos, start_y_pos, end_x_pos, end_y_pos*/ 15 && path1_d_value !== (path1_d_value = "M " + /*start_x_pos*/ ctx[0] + " " + /*start_y_pos*/ ctx[1] + " \r\n    C " + (/*start_x_pos*/ ctx[0] + 128) + " " + /*start_y_pos*/ ctx[1] + ", " + (/*end_x_pos*/ ctx[2] - 128) + " " + /*end_y_pos*/ ctx[3] + ", " + /*end_x_pos*/ ctx[2] + " " + /*end_y_pos*/ ctx[3])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*color*/ 16) {
    				attr_dev(path1, "stroke", /*color*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(path1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Wire", slots, []);
    	let { start_x_pos } = $$props, { start_y_pos } = $$props;
    	let { end_x_pos } = $$props, { end_y_pos } = $$props;
    	let { state } = $$props;
    	let color = "white";

    	onMount(async () => {
    		if (state) {
    			//console.log("I want to get this function to be called");
    			$$invalidate(4, color = "blue");
    		} else {
    			$$invalidate(4, color = "white");
    		}
    	});

    	const writable_props = ["start_x_pos", "start_y_pos", "end_x_pos", "end_y_pos", "state"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Wire> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("start_x_pos" in $$props) $$invalidate(0, start_x_pos = $$props.start_x_pos);
    		if ("start_y_pos" in $$props) $$invalidate(1, start_y_pos = $$props.start_y_pos);
    		if ("end_x_pos" in $$props) $$invalidate(2, end_x_pos = $$props.end_x_pos);
    		if ("end_y_pos" in $$props) $$invalidate(3, end_y_pos = $$props.end_y_pos);
    		if ("state" in $$props) $$invalidate(5, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Wire,
    		start_x_pos,
    		start_y_pos,
    		end_x_pos,
    		end_y_pos,
    		state,
    		color
    	});

    	$$self.$inject_state = $$props => {
    		if ("start_x_pos" in $$props) $$invalidate(0, start_x_pos = $$props.start_x_pos);
    		if ("start_y_pos" in $$props) $$invalidate(1, start_y_pos = $$props.start_y_pos);
    		if ("end_x_pos" in $$props) $$invalidate(2, end_x_pos = $$props.end_x_pos);
    		if ("end_y_pos" in $$props) $$invalidate(3, end_y_pos = $$props.end_y_pos);
    		if ("state" in $$props) $$invalidate(5, state = $$props.state);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*state*/ 32) {
    			 if (state) {
    				//console.log("I want to get this function to be called");
    				$$invalidate(4, color = "blue");
    			} else {
    				$$invalidate(4, color = "white");
    			}
    		}
    	};

    	return [start_x_pos, start_y_pos, end_x_pos, end_y_pos, color, state];
    }

    class Wire_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			start_x_pos: 0,
    			start_y_pos: 1,
    			end_x_pos: 2,
    			end_y_pos: 3,
    			state: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wire_1",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*start_x_pos*/ ctx[0] === undefined && !("start_x_pos" in props)) {
    			console.warn("<Wire> was created without expected prop 'start_x_pos'");
    		}

    		if (/*start_y_pos*/ ctx[1] === undefined && !("start_y_pos" in props)) {
    			console.warn("<Wire> was created without expected prop 'start_y_pos'");
    		}

    		if (/*end_x_pos*/ ctx[2] === undefined && !("end_x_pos" in props)) {
    			console.warn("<Wire> was created without expected prop 'end_x_pos'");
    		}

    		if (/*end_y_pos*/ ctx[3] === undefined && !("end_y_pos" in props)) {
    			console.warn("<Wire> was created without expected prop 'end_y_pos'");
    		}

    		if (/*state*/ ctx[5] === undefined && !("state" in props)) {
    			console.warn("<Wire> was created without expected prop 'state'");
    		}
    	}

    	get start_x_pos() {
    		throw new Error("<Wire>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start_x_pos(value) {
    		throw new Error("<Wire>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start_y_pos() {
    		throw new Error("<Wire>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start_y_pos(value) {
    		throw new Error("<Wire>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_x_pos() {
    		throw new Error("<Wire>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_x_pos(value) {
    		throw new Error("<Wire>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_y_pos() {
    		throw new Error("<Wire>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_y_pos(value) {
    		throw new Error("<Wire>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Wire>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Wire>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const not = a => ~a & 1;
    const and = (a, b) => a && b;
    const nand = (a, b) => not(a && b);
    const or = (a, b) => a || b;
    const nor = (a, b) => not(a || b);
    const xor = (a, b) => a ^ b;
    const xnor = (a, b) => not(a ^ b);

    const evaluate = (components, componentLookup) => {
      const binaryOp = (logicFn, component) => {
        const aOut = componentLookup[component.inputs[0]];
        const bOut = componentLookup[component.inputs[1]];

        component.state = (aOut === 'x' || bOut === 'x')
          ? 'x'
          : logicFn(aOut.state, bOut.state);
        return;
      };

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

    /* src\light.svelte generated by Svelte v3.25.0 */
    const file$5 = "src\\light.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (58:4) {#each Array(inputs) as _, i}
    function create_each_block$2(ctx) {
    	let input;
    	let current;

    	input = new Input({
    			props: {
    				x_pos: -26,
    				y_pos: /*i*/ ctx[12] * 16,
    				wireIndex: /*i*/ ctx[12],
    				id: /*id*/ ctx[2],
    				inputCallback: /*inputCallback*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input_changes = {};
    			if (dirty & /*id*/ 4) input_changes.id = /*id*/ ctx[2];
    			if (dirty & /*inputCallback*/ 1) input_changes.inputCallback = /*inputCallback*/ ctx[0];
    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(58:4) {#each Array(inputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	let each_value = Array(/*inputs*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-1ae5smc");
    			add_location(div, file$5, 56, 0, 1233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[8](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id, inputCallback, inputs*/ 7) {
    				each_value = Array(/*inputs*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[8](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Light", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { image } = $$props;
    	let { inputCallback } = $$props;
    	let { state } = $$props;
    	let { inputs } = $$props;
    	let { id } = $$props;
    	let dom;

    	onMount(async () => {
    		//Move to position assigned by the creator on startup
    		$$invalidate(3, dom.style.left = x_pos + "px", dom);

    		$$invalidate(3, dom.style.top = y_pos + "px", dom);
    		$$invalidate(3, dom.style.backgroundImage = "url(" + image + ")", dom);
    	});

    	function updatePosition() {
    		if (dom) {
    			$$invalidate(3, dom.style.left = x_pos + "px", dom);
    			$$invalidate(3, dom.style.top = y_pos + "px", dom);
    		}
    	}

    	const writable_props = ["x_pos", "y_pos", "image", "inputCallback", "state", "inputs", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Light> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			($$invalidate(3, dom), $$invalidate(7, state));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(4, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(5, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(6, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("state" in $$props) $$invalidate(7, state = $$props.state);
    		if ("inputs" in $$props) $$invalidate(1, inputs = $$props.inputs);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Input,
    		x_pos,
    		y_pos,
    		image,
    		inputCallback,
    		state,
    		inputs,
    		id,
    		dom,
    		updatePosition
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(4, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(5, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(6, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("state" in $$props) $$invalidate(7, state = $$props.state);
    		if ("inputs" in $$props) $$invalidate(1, inputs = $$props.inputs);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("dom" in $$props) $$invalidate(3, dom = $$props.dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*state, dom*/ 136) {
    			 if (state) {
    				$$invalidate(3, dom.style.backgroundColor = "blue", dom);
    			} else {
    				if (dom !== undefined) $$invalidate(3, dom.style.backgroundColor = "white", dom);
    			}
    		}

    		if ($$self.$$.dirty & /*x_pos, y_pos*/ 48) {
    			//Called whenever x or y position is updated externally from parent or internally
    			 if (x_pos || y_pos) {
    				updatePosition();
    			}
    		}
    	};

    	return [inputCallback, inputs, id, dom, x_pos, y_pos, image, state, div_binding];
    }

    class Light extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			x_pos: 4,
    			y_pos: 5,
    			image: 6,
    			inputCallback: 0,
    			state: 7,
    			inputs: 1,
    			id: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Light",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[6] === undefined && !("image" in props)) {
    			console.warn("<Light> was created without expected prop 'image'");
    		}

    		if (/*inputCallback*/ ctx[0] === undefined && !("inputCallback" in props)) {
    			console.warn("<Light> was created without expected prop 'inputCallback'");
    		}

    		if (/*state*/ ctx[7] === undefined && !("state" in props)) {
    			console.warn("<Light> was created without expected prop 'state'");
    		}

    		if (/*inputs*/ ctx[1] === undefined && !("inputs" in props)) {
    			console.warn("<Light> was created without expected prop 'inputs'");
    		}

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<Light> was created without expected prop 'id'");
    		}
    	}

    	get x_pos() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x_pos(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y_pos() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y_pos(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputCallback() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputCallback(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputs() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputs(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\canvas.svelte generated by Svelte v3.25.0 */

    const { console: console_1, window: window_1 } = globals;
    const file$6 = "src\\canvas.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    // (468:16) {#each wires as wire, i}
    function create_each_block_1$1(ctx) {
    	let wire;
    	let current;

    	wire = new Wire_1({
    			props: {
    				start_x_pos: /*wires*/ ctx[3][/*i*/ ctx[36]].startPos.x,
    				start_y_pos: /*wires*/ ctx[3][/*i*/ ctx[36]].startPos.y,
    				end_x_pos: /*wires*/ ctx[3][/*i*/ ctx[36]].endPos.x,
    				end_y_pos: /*wires*/ ctx[3][/*i*/ ctx[36]].endPos.y,
    				state: /*wires*/ ctx[3][/*i*/ ctx[36]].state
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wire.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(wire, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const wire_changes = {};
    			if (dirty[0] & /*wires*/ 8) wire_changes.start_x_pos = /*wires*/ ctx[3][/*i*/ ctx[36]].startPos.x;
    			if (dirty[0] & /*wires*/ 8) wire_changes.start_y_pos = /*wires*/ ctx[3][/*i*/ ctx[36]].startPos.y;
    			if (dirty[0] & /*wires*/ 8) wire_changes.end_x_pos = /*wires*/ ctx[3][/*i*/ ctx[36]].endPos.x;
    			if (dirty[0] & /*wires*/ 8) wire_changes.end_y_pos = /*wires*/ ctx[3][/*i*/ ctx[36]].endPos.y;
    			if (dirty[0] & /*wires*/ 8) wire_changes.state = /*wires*/ ctx[3][/*i*/ ctx[36]].state;
    			wire.$set(wire_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wire.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wire.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wire, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(468:16) {#each wires as wire, i}",
    		ctx
    	});

    	return block;
    }

    // (473:16) {#if isWire}
    function create_if_block_5(ctx) {
    	let wire;
    	let current;

    	wire = new Wire_1({
    			props: {
    				start_x_pos: /*placingWire*/ ctx[9].startPos.x,
    				start_y_pos: /*placingWire*/ ctx[9].startPos.y,
    				end_x_pos: /*placingWire*/ ctx[9].endPos.x,
    				end_y_pos: /*placingWire*/ ctx[9].endPos.y,
    				state: /*placingWire*/ ctx[9].state
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(wire.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(wire, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const wire_changes = {};
    			if (dirty[0] & /*placingWire*/ 512) wire_changes.start_x_pos = /*placingWire*/ ctx[9].startPos.x;
    			if (dirty[0] & /*placingWire*/ 512) wire_changes.start_y_pos = /*placingWire*/ ctx[9].startPos.y;
    			if (dirty[0] & /*placingWire*/ 512) wire_changes.end_x_pos = /*placingWire*/ ctx[9].endPos.x;
    			if (dirty[0] & /*placingWire*/ 512) wire_changes.end_y_pos = /*placingWire*/ ctx[9].endPos.y;
    			if (dirty[0] & /*placingWire*/ 512) wire_changes.state = /*placingWire*/ ctx[9].state;
    			wire.$set(wire_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wire.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wire.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wire, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(473:16) {#if isWire}",
    		ctx
    	});

    	return block;
    }

    // (489:12) {:else}
    function create_else_block_1(ctx) {
    	let gate;
    	let current;

    	gate = new Gate$1({
    			props: {
    				x_pos: /*gates*/ ctx[2][/*i*/ ctx[36]].position.x,
    				y_pos: /*gates*/ ctx[2][/*i*/ ctx[36]].position.y,
    				image: /*gates*/ ctx[2][/*i*/ ctx[36]].image,
    				inputs: /*gates*/ ctx[2][/*i*/ ctx[36]].inputs,
    				outputs: /*gates*/ ctx[2][/*i*/ ctx[36]].outputs,
    				id: /*gates*/ ctx[2][/*i*/ ctx[36]].id,
    				outputCallback: /*outputCallback*/ ctx[0],
    				inputCallback: /*inputCallback*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gate, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gate_changes = {};
    			if (dirty[0] & /*gates*/ 4) gate_changes.x_pos = /*gates*/ ctx[2][/*i*/ ctx[36]].position.x;
    			if (dirty[0] & /*gates*/ 4) gate_changes.y_pos = /*gates*/ ctx[2][/*i*/ ctx[36]].position.y;
    			if (dirty[0] & /*gates*/ 4) gate_changes.image = /*gates*/ ctx[2][/*i*/ ctx[36]].image;
    			if (dirty[0] & /*gates*/ 4) gate_changes.inputs = /*gates*/ ctx[2][/*i*/ ctx[36]].inputs;
    			if (dirty[0] & /*gates*/ 4) gate_changes.outputs = /*gates*/ ctx[2][/*i*/ ctx[36]].outputs;
    			if (dirty[0] & /*gates*/ 4) gate_changes.id = /*gates*/ ctx[2][/*i*/ ctx[36]].id;
    			gate.$set(gate_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(489:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (485:50) 
    function create_if_block_4(ctx) {
    	let light;
    	let current;

    	light = new Light({
    			props: {
    				x_pos: /*gates*/ ctx[2][/*i*/ ctx[36]].position.x,
    				y_pos: /*gates*/ ctx[2][/*i*/ ctx[36]].position.y,
    				image: /*gates*/ ctx[2][/*i*/ ctx[36]].image,
    				outputs: /*gates*/ ctx[2][/*i*/ ctx[36]].outputs,
    				id: /*gates*/ ctx[2][/*i*/ ctx[36]].id,
    				inputCallback: /*inputCallback*/ ctx[1],
    				state: /*gates*/ ctx[2][/*i*/ ctx[36]].state
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(light.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(light, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const light_changes = {};
    			if (dirty[0] & /*gates*/ 4) light_changes.x_pos = /*gates*/ ctx[2][/*i*/ ctx[36]].position.x;
    			if (dirty[0] & /*gates*/ 4) light_changes.y_pos = /*gates*/ ctx[2][/*i*/ ctx[36]].position.y;
    			if (dirty[0] & /*gates*/ 4) light_changes.image = /*gates*/ ctx[2][/*i*/ ctx[36]].image;
    			if (dirty[0] & /*gates*/ 4) light_changes.outputs = /*gates*/ ctx[2][/*i*/ ctx[36]].outputs;
    			if (dirty[0] & /*gates*/ 4) light_changes.id = /*gates*/ ctx[2][/*i*/ ctx[36]].id;
    			if (dirty[0] & /*gates*/ 4) light_changes.state = /*gates*/ ctx[2][/*i*/ ctx[36]].state;
    			light.$set(light_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(light.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(light.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(light, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(485:50) ",
    		ctx
    	});

    	return block;
    }

    // (481:12) {#if gates[i].logic_button === 1}
    function create_if_block_3(ctx) {
    	let userinput;
    	let current;

    	userinput = new UserInput({
    			props: {
    				x_pos: /*gates*/ ctx[2][/*i*/ ctx[36]].position.x,
    				y_pos: /*gates*/ ctx[2][/*i*/ ctx[36]].position.y,
    				image: /*gates*/ ctx[2][/*i*/ ctx[36]].image,
    				outputs: /*gates*/ ctx[2][/*i*/ ctx[36]].outputs,
    				id: /*gates*/ ctx[2][/*i*/ ctx[36]].id,
    				outputCallback: /*outputCallback*/ ctx[0],
    				switchState: /*switchState*/ ctx[14]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(userinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const userinput_changes = {};
    			if (dirty[0] & /*gates*/ 4) userinput_changes.x_pos = /*gates*/ ctx[2][/*i*/ ctx[36]].position.x;
    			if (dirty[0] & /*gates*/ 4) userinput_changes.y_pos = /*gates*/ ctx[2][/*i*/ ctx[36]].position.y;
    			if (dirty[0] & /*gates*/ 4) userinput_changes.image = /*gates*/ ctx[2][/*i*/ ctx[36]].image;
    			if (dirty[0] & /*gates*/ 4) userinput_changes.outputs = /*gates*/ ctx[2][/*i*/ ctx[36]].outputs;
    			if (dirty[0] & /*gates*/ 4) userinput_changes.id = /*gates*/ ctx[2][/*i*/ ctx[36]].id;
    			userinput.$set(userinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(481:12) {#if gates[i].logic_button === 1}",
    		ctx
    	});

    	return block;
    }

    // (480:8) {#each gates as gate, i}
    function create_each_block$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_if_block_4, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*gates*/ ctx[2][/*i*/ ctx[36]].logic_button === 1) return 0;
    		if (/*gates*/ ctx[2][/*i*/ ctx[36]].logic_button === 2) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(480:8) {#each gates as gate, i}",
    		ctx
    	});

    	return block;
    }

    // (496:8) {#if isPlacing}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*isPlacing*/ ctx[6].logic_button === 1) return 0;
    		if (/*placingGate*/ ctx[7].logic_button === 2) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(496:8) {#if isPlacing}",
    		ctx
    	});

    	return block;
    }

    // (505:12) {:else}
    function create_else_block(ctx) {
    	let gate;
    	let current;

    	gate = new Gate$1({
    			props: {
    				x_pos: /*placingGate*/ ctx[7].position.x,
    				y_pos: /*placingGate*/ ctx[7].position.y,
    				image: /*placingGate*/ ctx[7].image,
    				inputs: /*placingGate*/ ctx[7].inputs,
    				outputs: /*placingGate*/ ctx[7].outputs,
    				id: /*placingGate*/ ctx[7].id
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gate, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gate_changes = {};
    			if (dirty[0] & /*placingGate*/ 128) gate_changes.x_pos = /*placingGate*/ ctx[7].position.x;
    			if (dirty[0] & /*placingGate*/ 128) gate_changes.y_pos = /*placingGate*/ ctx[7].position.y;
    			if (dirty[0] & /*placingGate*/ 128) gate_changes.image = /*placingGate*/ ctx[7].image;
    			if (dirty[0] & /*placingGate*/ 128) gate_changes.inputs = /*placingGate*/ ctx[7].inputs;
    			if (dirty[0] & /*placingGate*/ 128) gate_changes.outputs = /*placingGate*/ ctx[7].outputs;
    			if (dirty[0] & /*placingGate*/ 128) gate_changes.id = /*placingGate*/ ctx[7].id;
    			gate.$set(gate_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(505:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (501:53) 
    function create_if_block_2(ctx) {
    	let light;
    	let current;

    	light = new Light({
    			props: {
    				x_pos: /*placingGate*/ ctx[7].position.x,
    				y_pos: /*placingGate*/ ctx[7].position.y,
    				image: /*placingGate*/ ctx[7].image,
    				outputs: /*placingGate*/ ctx[7].outputs,
    				id: /*placingGate*/ ctx[7].id,
    				inputCallback: /*inputCallback*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(light.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(light, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const light_changes = {};
    			if (dirty[0] & /*placingGate*/ 128) light_changes.x_pos = /*placingGate*/ ctx[7].position.x;
    			if (dirty[0] & /*placingGate*/ 128) light_changes.y_pos = /*placingGate*/ ctx[7].position.y;
    			if (dirty[0] & /*placingGate*/ 128) light_changes.image = /*placingGate*/ ctx[7].image;
    			if (dirty[0] & /*placingGate*/ 128) light_changes.outputs = /*placingGate*/ ctx[7].outputs;
    			if (dirty[0] & /*placingGate*/ 128) light_changes.id = /*placingGate*/ ctx[7].id;
    			light.$set(light_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(light.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(light.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(light, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(501:53) ",
    		ctx
    	});

    	return block;
    }

    // (497:12) {#if isPlacing.logic_button === 1}
    function create_if_block_1(ctx) {
    	let userinput;
    	let current;

    	userinput = new UserInput({
    			props: {
    				x_pos: /*placingGate*/ ctx[7].position.x,
    				y_pos: /*placingGate*/ ctx[7].position.y,
    				image: /*placingGate*/ ctx[7].image,
    				outputs: /*placingGate*/ ctx[7].outputs,
    				id: /*placingGate*/ ctx[7].id,
    				switchState: /*switchState*/ ctx[14]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(userinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(userinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const userinput_changes = {};
    			if (dirty[0] & /*placingGate*/ 128) userinput_changes.x_pos = /*placingGate*/ ctx[7].position.x;
    			if (dirty[0] & /*placingGate*/ 128) userinput_changes.y_pos = /*placingGate*/ ctx[7].position.y;
    			if (dirty[0] & /*placingGate*/ 128) userinput_changes.image = /*placingGate*/ ctx[7].image;
    			if (dirty[0] & /*placingGate*/ 128) userinput_changes.outputs = /*placingGate*/ ctx[7].outputs;
    			if (dirty[0] & /*placingGate*/ 128) userinput_changes.id = /*placingGate*/ ctx[7].id;
    			userinput.$set(userinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(userinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(userinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(userinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(497:12) {#if isPlacing.logic_button === 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let svg;
    	let each0_anchor;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*wires*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let if_block0 = /*isWire*/ ctx[8] && create_if_block_5(ctx);
    	let each_value = /*gates*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block1 = /*isPlacing*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			each0_anchor = empty();
    			if (if_block0) if_block0.c();
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(svg, "width", "2048");
    			attr_dev(svg, "height", "2048");
    			add_location(svg, file$6, 466, 12, 15231);
    			attr_dev(div0, "class", "wire svelte-1wyl557");
    			add_location(div0, file$6, 465, 8, 15199);
    			attr_dev(div1, "id", "zoomLayer");
    			attr_dev(div1, "class", "svelte-1wyl557");
    			add_location(div1, file$6, 464, 4, 15144);
    			attr_dev(div2, "class", "workspace svelte-1wyl557");
    			add_location(div2, file$6, 463, 0, 15090);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, svg);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(svg, null);
    			}

    			append_dev(svg, each0_anchor);
    			if (if_block0) if_block0.m(svg, null);
    			append_dev(div1, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			/*div1_binding*/ ctx[18](div1);
    			/*div2_binding*/ ctx[19](div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "mousedown", /*mouseDown*/ ctx[10], false, false, false),
    					listen_dev(window_1, "mouseup", /*mouseUp*/ ctx[11], false, false, false),
    					listen_dev(window_1, "mousemove", /*mouseMove*/ ctx[12], false, false, false),
    					listen_dev(window_1, "keypress", /*keypressing*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*wires*/ 8) {
    				each_value_1 = /*wires*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(svg, each0_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*isWire*/ ctx[8]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*isWire*/ 256) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(svg, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*gates, outputCallback, switchState, inputCallback*/ 16391) {
    				each_value = /*gates*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (/*isPlacing*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*isPlacing*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(if_block0);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(if_block0);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			/*div1_binding*/ ctx[18](null);
    			/*div2_binding*/ ctx[19](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function offset(el) {
    	var rect = el.getBoundingClientRect(),
    		scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    		scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    	return {
    		top: rect.top + scrollTop,
    		left: rect.left + scrollLeft
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Canvas", slots, []);

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
    	}

    	

    	const indexBy = (array, prop) => array.reduce(
    		(output, item) => {
    			output[item[prop]] = item;
    			return output;
    		},
    		{}
    	);

    	let components = [];

    	let gates = []; //{ id: '0', position: new Vector(64,32),  image: "./build/AND_GATE.svg", gate: new NAND() },
    	//{ id: '1', position: new Vector(128,0), image: "./build/AND_GATE.svg",  gate: new NAND() }

    	let wires = [];
    	let nextGateID = 0;
    	let mousePosition;
    	let workspaceDom;
    	let zoomLayerDom;
    	let gridSpacing;
    	let isPlacing = false;
    	let placingGate;
    	let placingComponent;
    	let scale = 1;
    	let screenPos = new Vector(0, 0);
    	let isGrabbing = false;
    	let begGrabPos;
    	let endGrabPos;

    	onMount(async () => {
    		
    	}); //Call the update function on all the gates that already exist

    	function mouseDown(event) {
    		//Placing a gate
    		if (isPlacing) {
    			//Add to list of gates
    			$$invalidate(2, gates = [...gates, placingGate]);

    			$$invalidate(6, isPlacing = false);

    			//Add gate to componets array
    			components = [...components, placingComponent];
    		}

    		if (event.button === 2) {
    			//Moving around the workspace
    			isGrabbing = true;

    			begGrabPos = new Vector(event.pageX, event.pageY);
    		}
    	}

    	function mouseUp(event) {
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

    			zoomLayerOffset.left *= 1 / scale;
    			zoomLayerOffset.top *= 1 / scale;
    			let gatePos = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top);
    			$$invalidate(7, placingGate.position = new Vector(Math.round(gatePos.x / 32 - 0.5) * 32, Math.round(gatePos.y / 32 - 0.5) * 32), placingGate);
    		}

    		//Move the wire being placed
    		if (isWire) {
    			let zoomLayerOffset = offset(zoomLayerDom);
    			zoomLayerOffset.left *= 1 / scale;
    			zoomLayerOffset.top *= 1 / scale;
    			let wirePos = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top);
    			$$invalidate(9, placingWire.endPos = new Vector(wirePos.x, wirePos.y), placingWire);
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
    	}

    	function keypressing(event) {
    		if (event.key === "=") {
    			//Plus key
    			if (scale < 3) scale += 0.25;
    		} else if (event.key === "-") {
    			//Minus key
    			if (scale > 0.25) scale -= 0.25;
    		}

    		document.getElementById("zoomLayer").style.transform = "scale(" + scale + ")";
    	}

    	function addGate(gateType) {
    		let zoomLayerOffset = offset(zoomLayerDom);
    		zoomLayerOffset.left *= 1 / scale;
    		zoomLayerOffset.top *= 1 / scale;

    		switch (gateType) {
    			case "AND":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/NEW_AND.svg",
    					inputs: 2,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "and",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "NAND":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/NEW_NAND.svg",
    					inputs: 2,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "nand",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "0":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/AND_GATE.svg",
    					inputs: 0,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "controlled",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "1":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/AND_GATE.svg",
    					inputs: 0,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "controlled",
    					inputs: [],
    					state: 1
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "Logic_Button":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/AND_GATE.svg",
    					inputs: 0,
    					outputs: 1,
    					logic_button: 1,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "controlled",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "Light":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/Light.svg",
    					inputs: 1,
    					outputs: 0,
    					logic_button: 2,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "equal",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "OR":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/OR_GATE.svg",
    					inputs: 2,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "or",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "XOR":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/XOR_GATE.svg",
    					inputs: 2,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "xor",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "NOT":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/NOT_GATE.svg",
    					inputs: 1,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "not",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    			case "NOR":
    				$$invalidate(7, placingGate = {
    					id: nextGateID.toString(),
    					position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    					image: "./build/NOR_GATE.svg",
    					inputs: 2,
    					outputs: 1,
    					logic_button: 0,
    					state: 0
    				});
    				placingComponent = {
    					id: nextGateID.toString(),
    					type: "nor",
    					inputs: [],
    					state: 0
    				};
    				$$invalidate(6, isPlacing = true);
    				nextGateID++;
    				break;
    		}
    	}

    	function getComponent(id) {
    		for (let i = 0; i < components.length; i++) {
    			if (components[i].id === id) {
    				return components[i];
    			}
    		}
    	}

    	let isWire = false;
    	let placingWire;
    	let outputID;

    	function outputCallback(x_pos, y_pos, id) {
    		console.log("Output callback");
    		$$invalidate(8, isWire = true);
    		outputID = id;
    		let internalState = getComponent(id).state;

    		$$invalidate(9, placingWire = {
    			startPos: new Vector(x_pos, y_pos),
    			endPos: new Vector(x_pos, y_pos),
    			id,
    			state: internalState, //Should be 'x'?
    			
    		});
    	}

    	function inputCallback(x_pos, y_pos, inWireIndex, id) {
    		console.log("Input callback");

    		if (isWire) {
    			$$invalidate(8, isWire = false);
    			$$invalidate(9, placingWire.endPos = new Vector(x_pos, y_pos), placingWire);
    			$$invalidate(3, wires = [...wires, placingWire]);

    			//Connect components in the array
    			for (let i = 0; i < components.length; i++) {
    				if (components[i].id === id) {
    					components[i].inputs.push(outputID);
    				}
    			}
    		}
    	}

    	function debugGates() {
    		//Print info about all gates
    		console.log("Gate debug:");

    		console.log("Components Array: ");
    		console.log(components);
    	}

    	function simulatate() {
    		//Idk does something lol
    		const componentLookup = indexBy(components, "id");

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
    					$$invalidate(3, wires[w].state = components[i].state, wires);
    				}
    			}
    		}

    		//Update gate states for rendering purpose (Inefficent temp code)
    		for (let w = 0; w < gates.length; w++) {
    			for (let i = 0; i < components.length; i++) {
    				if (components[i].id === gates[w].id) {
    					$$invalidate(2, gates[w].state = components[i].state, gates);
    				}
    			}
    		}
    	}

    	function switchState(id) {
    		console.log("Called");
    		let comp = getComponent(id);
    		if (comp.state) comp.state = 0; else comp.state = 1;

    		//Rerun sim
    		simulatate();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			zoomLayerDom = $$value;
    			$$invalidate(5, zoomLayerDom);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			workspaceDom = $$value;
    			$$invalidate(4, workspaceDom);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Gate: Gate$1,
    		UserInput,
    		Wire: Wire_1,
    		NAND,
    		evaluate,
    		Light,
    		Vector,
    		indexBy,
    		components,
    		gates,
    		wires,
    		nextGateID,
    		mousePosition,
    		workspaceDom,
    		zoomLayerDom,
    		gridSpacing,
    		isPlacing,
    		placingGate,
    		placingComponent,
    		scale,
    		screenPos,
    		isGrabbing,
    		begGrabPos,
    		endGrabPos,
    		mouseDown,
    		mouseUp,
    		mouseMove,
    		keypressing,
    		addGate,
    		getComponent,
    		isWire,
    		placingWire,
    		outputID,
    		outputCallback,
    		inputCallback,
    		debugGates,
    		simulatate,
    		switchState,
    		offset
    	});

    	$$self.$inject_state = $$props => {
    		if ("components" in $$props) components = $$props.components;
    		if ("gates" in $$props) $$invalidate(2, gates = $$props.gates);
    		if ("wires" in $$props) $$invalidate(3, wires = $$props.wires);
    		if ("nextGateID" in $$props) nextGateID = $$props.nextGateID;
    		if ("mousePosition" in $$props) mousePosition = $$props.mousePosition;
    		if ("workspaceDom" in $$props) $$invalidate(4, workspaceDom = $$props.workspaceDom);
    		if ("zoomLayerDom" in $$props) $$invalidate(5, zoomLayerDom = $$props.zoomLayerDom);
    		if ("gridSpacing" in $$props) gridSpacing = $$props.gridSpacing;
    		if ("isPlacing" in $$props) $$invalidate(6, isPlacing = $$props.isPlacing);
    		if ("placingGate" in $$props) $$invalidate(7, placingGate = $$props.placingGate);
    		if ("placingComponent" in $$props) placingComponent = $$props.placingComponent;
    		if ("scale" in $$props) scale = $$props.scale;
    		if ("screenPos" in $$props) screenPos = $$props.screenPos;
    		if ("isGrabbing" in $$props) isGrabbing = $$props.isGrabbing;
    		if ("begGrabPos" in $$props) begGrabPos = $$props.begGrabPos;
    		if ("endGrabPos" in $$props) endGrabPos = $$props.endGrabPos;
    		if ("isWire" in $$props) $$invalidate(8, isWire = $$props.isWire);
    		if ("placingWire" in $$props) $$invalidate(9, placingWire = $$props.placingWire);
    		if ("outputID" in $$props) outputID = $$props.outputID;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		outputCallback,
    		inputCallback,
    		gates,
    		wires,
    		workspaceDom,
    		zoomLayerDom,
    		isPlacing,
    		placingGate,
    		isWire,
    		placingWire,
    		mouseDown,
    		mouseUp,
    		mouseMove,
    		keypressing,
    		switchState,
    		addGate,
    		debugGates,
    		simulatate,
    		div1_binding,
    		div2_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$6,
    			create_fragment$6,
    			safe_not_equal,
    			{
    				addGate: 15,
    				outputCallback: 0,
    				inputCallback: 1,
    				debugGates: 16,
    				simulatate: 17
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get addGate() {
    		return this.$$.ctx[15];
    	}

    	set addGate(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputCallback() {
    		return this.$$.ctx[0];
    	}

    	set outputCallback(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputCallback() {
    		return this.$$.ctx[1];
    	}

    	set inputCallback(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debugGates() {
    		return this.$$.ctx[16];
    	}

    	set debugGates(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get simulatate() {
    		return this.$$.ctx[17];
    	}

    	set simulatate(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.25.0 */
    const file$7 = "src\\App.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let button4;
    	let t9;
    	let button5;
    	let t11;
    	let button6;
    	let t13;
    	let button7;
    	let t15;
    	let button8;
    	let t17;
    	let button9;
    	let t19;
    	let button10;
    	let t21;
    	let button11;
    	let t23;
    	let div1;
    	let canvas_1;
    	let current;
    	let mounted;
    	let dispose;
    	let canvas_1_props = {};
    	canvas_1 = new Canvas({ props: canvas_1_props, $$inline: true });
    	/*canvas_1_binding*/ ctx[13](canvas_1);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "AND";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "NAND";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "OR";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "NOR";
    			t7 = space();
    			button4 = element("button");
    			button4.textContent = "XOR";
    			t9 = space();
    			button5 = element("button");
    			button5.textContent = "NOT";
    			t11 = space();
    			button6 = element("button");
    			button6.textContent = "1";
    			t13 = space();
    			button7 = element("button");
    			button7.textContent = "0";
    			t15 = space();
    			button8 = element("button");
    			button8.textContent = "Switch";
    			t17 = space();
    			button9 = element("button");
    			button9.textContent = "Light";
    			t19 = space();
    			button10 = element("button");
    			button10.textContent = "DEBUG";
    			t21 = space();
    			button11 = element("button");
    			button11.textContent = "PLAY";
    			t23 = space();
    			div1 = element("div");
    			create_component(canvas_1.$$.fragment);
    			attr_dev(button0, "class", "svelte-12glzbw");
    			add_location(button0, file$7, 41, 2, 661);
    			attr_dev(button1, "class", "svelte-12glzbw");
    			add_location(button1, file$7, 42, 2, 724);
    			attr_dev(button2, "class", "svelte-12glzbw");
    			add_location(button2, file$7, 43, 2, 789);
    			attr_dev(button3, "class", "svelte-12glzbw");
    			add_location(button3, file$7, 44, 2, 850);
    			attr_dev(button4, "class", "svelte-12glzbw");
    			add_location(button4, file$7, 45, 2, 913);
    			attr_dev(button5, "class", "svelte-12glzbw");
    			add_location(button5, file$7, 46, 2, 976);
    			attr_dev(button6, "class", "svelte-12glzbw");
    			add_location(button6, file$7, 47, 2, 1039);
    			attr_dev(button7, "class", "svelte-12glzbw");
    			add_location(button7, file$7, 48, 2, 1098);
    			attr_dev(button8, "class", "svelte-12glzbw");
    			add_location(button8, file$7, 49, 2, 1157);
    			attr_dev(button9, "class", "svelte-12glzbw");
    			add_location(button9, file$7, 50, 2, 1232);
    			attr_dev(button10, "class", "svelte-12glzbw");
    			add_location(button10, file$7, 51, 2, 1299);
    			attr_dev(button11, "class", "svelte-12glzbw");
    			add_location(button11, file$7, 52, 2, 1362);
    			attr_dev(div0, "class", "menu svelte-12glzbw");
    			add_location(div0, file$7, 40, 1, 639);
    			attr_dev(div1, "class", "canvas svelte-12glzbw");
    			add_location(div1, file$7, 54, 1, 1432);
    			attr_dev(div2, "class", "main svelte-12glzbw");
    			add_location(div2, file$7, 39, 0, 618);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(div0, t3);
    			append_dev(div0, button2);
    			append_dev(div0, t5);
    			append_dev(div0, button3);
    			append_dev(div0, t7);
    			append_dev(div0, button4);
    			append_dev(div0, t9);
    			append_dev(div0, button5);
    			append_dev(div0, t11);
    			append_dev(div0, button6);
    			append_dev(div0, t13);
    			append_dev(div0, button7);
    			append_dev(div0, t15);
    			append_dev(div0, button8);
    			append_dev(div0, t17);
    			append_dev(div0, button9);
    			append_dev(div0, t19);
    			append_dev(div0, button10);
    			append_dev(div0, t21);
    			append_dev(div0, button11);
    			append_dev(div2, t23);
    			append_dev(div2, div1);
    			mount_component(canvas_1, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[4], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[5], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[6], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[7], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[8], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[9], false, false, false),
    					listen_dev(button9, "click", /*click_handler_9*/ ctx[10], false, false, false),
    					listen_dev(button10, "click", /*click_handler_10*/ ctx[11], false, false, false),
    					listen_dev(button11, "click", /*click_handler_11*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_1_changes = {};
    			canvas_1.$set(canvas_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*canvas_1_binding*/ ctx[13](null);
    			destroy_component(canvas_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleClick() {
    	alert("pressed");
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let canvas;

    	onMount(async () => {
    		document.addEventListener("contextmenu", event => event.preventDefault());
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => canvas.addGate("AND");
    	const click_handler_1 = () => canvas.addGate("NAND");
    	const click_handler_2 = () => canvas.addGate("OR");
    	const click_handler_3 = () => canvas.addGate("NOR");
    	const click_handler_4 = () => canvas.addGate("XOR");
    	const click_handler_5 = () => canvas.addGate("NOT");
    	const click_handler_6 = () => canvas.addGate("1");
    	const click_handler_7 = () => canvas.addGate("0");
    	const click_handler_8 = () => canvas.addGate("Logic_Button");
    	const click_handler_9 = () => canvas.addGate("Light");
    	const click_handler_10 = () => canvas.debugGates();
    	const click_handler_11 = () => canvas.simulatate();

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({ onMount, Canvas, canvas, handleClick });

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvas,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		canvas_1_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
