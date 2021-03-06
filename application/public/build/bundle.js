
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
            throw new Error('Function called outside component initialization');
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
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
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
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\logicSim\input.svelte generated by Svelte v3.35.0 */
    const file$c = "src\\logicSim\\input.svelte";

    function create_fragment$d(ctx) {
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
    			add_location(div0, file$c, 52, 0, 1288);
    			attr_dev(div1, "class", "port svelte-13kec9l");
    			add_location(div1, file$c, 54, 0, 1337);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    		let temp = circle_dom.parentNode.parentNode.style;
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

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
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
    			id: create_fragment$d.name
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

    /* src\logicSim\output.svelte generated by Svelte v3.35.0 */

    const { console: console_1$3 } = globals;
    const file$b = "src\\logicSim\\output.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(div0, file$b, 54, 0, 1325);
    			attr_dev(div1, "class", "port svelte-13kec9l");
    			add_location(div1, file$b, 56, 0, 1374);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Output", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { wireIndex } = $$props;
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
    		let temp = circle_dom.parentNode.parentNode.style;
    		console.log(temp.left);
    		outputCallback(x_pos + parseInt(temp.left) + 8, y_pos + parseInt(temp.top) + 8, wireIndex, id);
    	}

    	const writable_props = ["x_pos", "y_pos", "wireIndex", "id", "outputCallback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Output> was created with unknown prop '${key}'`);
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
    		if ("outputCallback" in $$props) $$invalidate(9, outputCallback = $$props.outputCallback);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		x_pos,
    		y_pos,
    		wireIndex,
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
    		if ("wireIndex" in $$props) $$invalidate(7, wireIndex = $$props.wireIndex);
    		if ("id" in $$props) $$invalidate(8, id = $$props.id);
    		if ("outputCallback" in $$props) $$invalidate(9, outputCallback = $$props.outputCallback);
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
    		outputCallback,
    		div0_binding,
    		div1_binding
    	];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			x_pos: 5,
    			y_pos: 6,
    			wireIndex: 7,
    			id: 8,
    			outputCallback: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*wireIndex*/ ctx[7] === undefined && !("wireIndex" in props)) {
    			console_1$3.warn("<Output> was created without expected prop 'wireIndex'");
    		}

    		if (/*id*/ ctx[8] === undefined && !("id" in props)) {
    			console_1$3.warn("<Output> was created without expected prop 'id'");
    		}

    		if (/*outputCallback*/ ctx[9] === undefined && !("outputCallback" in props)) {
    			console_1$3.warn("<Output> was created without expected prop 'outputCallback'");
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

    	get wireIndex() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wireIndex(value) {
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

    /* src\logicSim\gate.svelte generated by Svelte v3.35.0 */
    const file$a = "src\\logicSim\\gate.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (95:8) {:else}
    function create_else_block_1$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = Array(/*inputs*/ ctx[2]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id, inputCallback, inputs*/ 21) {
    				each_value_1 = Array(/*inputs*/ ctx[2]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(95:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:8) {#if inputs === 1}
    function create_if_block_1$3(ctx) {
    	let input;
    	let current;

    	input = new Input({
    			props: {
    				x_pos: -26,
    				y_pos: 8,
    				wireIndex: 0,
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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(93:8) {#if inputs === 1}",
    		ctx
    	});

    	return block;
    }

    // (96:12) {#each Array(inputs) as _, i}
    function create_each_block_1$2(ctx) {
    	let input;
    	let current;

    	input = new Input({
    			props: {
    				x_pos: -26,
    				y_pos: /*i*/ ctx[19] * 16,
    				wireIndex: /*i*/ ctx[19],
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
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(96:12) {#each Array(inputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (103:8) {:else}
    function create_else_block$5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Array(/*outputs*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id, outputCallback, outputs*/ 26) {
    				each_value = Array(/*outputs*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(103:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (101:8) {#if outputs === 1}
    function create_if_block$6(ctx) {
    	let output;
    	let current;

    	output = new Output({
    			props: {
    				x_pos: 42,
    				y_pos: 8,
    				wireIndex: 0,
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(101:8) {#if outputs === 1}",
    		ctx
    	});

    	return block;
    }

    // (104:12) {#each Array(outputs) as _, i}
    function create_each_block$4(ctx) {
    	let output;
    	let current;

    	output = new Output({
    			props: {
    				x_pos: 42,
    				y_pos: /*i*/ ctx[19] * 16,
    				wireIndex: /*i*/ ctx[19],
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(104:12) {#each Array(outputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let current_block_type_index_1;
    	let if_block1;
    	let t1;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1$3, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*inputs*/ ctx[2] === 1) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$6, create_else_block$5];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*outputs*/ ctx[3] === 1) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "connections svelte-fz1p9e");
    			add_location(div0, file$a, 91, 4, 2027);
    			attr_dev(div1, "class", "gate svelte-fz1p9e");
    			add_location(div1, file$a, 108, 4, 2736);
    			attr_dev(div2, "class", "gateSelected svelte-fz1p9e");
    			add_location(div2, file$a, 90, 0, 1979);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div0, t0);
    			if_blocks_1[current_block_type_index_1].m(div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			/*div2_binding*/ ctx[15](div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mousedown", /*mouseDown*/ ctx[6], false, false, false),
    					listen_dev(div1, "mouseup", /*mouseUp*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div0, t0);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks_1[current_block_type_index_1];

    				if (!if_block1) {
    					if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			if_blocks_1[current_block_type_index_1].d();
    			/*div2_binding*/ ctx[15](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    	let { grabbing } = $$props;
    	let { released } = $$props;
    	let { styles } = $$props;
    	let dom;

    	onMount(async () => {
    		//Move to position assigned by the creator on startup
    		$$invalidate(5, dom.style.left = x_pos + "px", dom);

    		$$invalidate(5, dom.style.top = y_pos + "px", dom);
    		$$invalidate(5, dom.style.backgroundImage = "url(" + image + ")", dom);
    		dom.setAttribute("draggable", false);
    	});

    	function updatePosition() {
    		if (dom) {
    			$$invalidate(5, dom.style.left = x_pos + "px", dom);
    			$$invalidate(5, dom.style.top = y_pos + "px", dom);
    		}
    	}

    	var bigger;

    	function mouseDown() {
    		grabbing(id);
    	}

    	function mouseUp() {
    		released(id);
    	}

    	const writable_props = [
    		"x_pos",
    		"y_pos",
    		"image",
    		"inputCallback",
    		"outputCallback",
    		"inputs",
    		"outputs",
    		"id",
    		"grabbing",
    		"released",
    		"styles"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gate> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			$$invalidate(5, dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(8, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(9, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(10, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("outputCallback" in $$props) $$invalidate(1, outputCallback = $$props.outputCallback);
    		if ("inputs" in $$props) $$invalidate(2, inputs = $$props.inputs);
    		if ("outputs" in $$props) $$invalidate(3, outputs = $$props.outputs);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("grabbing" in $$props) $$invalidate(11, grabbing = $$props.grabbing);
    		if ("released" in $$props) $$invalidate(12, released = $$props.released);
    		if ("styles" in $$props) $$invalidate(13, styles = $$props.styles);
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
    		grabbing,
    		released,
    		styles,
    		dom,
    		updatePosition,
    		bigger,
    		mouseDown,
    		mouseUp
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(8, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(9, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(10, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("outputCallback" in $$props) $$invalidate(1, outputCallback = $$props.outputCallback);
    		if ("inputs" in $$props) $$invalidate(2, inputs = $$props.inputs);
    		if ("outputs" in $$props) $$invalidate(3, outputs = $$props.outputs);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("grabbing" in $$props) $$invalidate(11, grabbing = $$props.grabbing);
    		if ("released" in $$props) $$invalidate(12, released = $$props.released);
    		if ("styles" in $$props) $$invalidate(13, styles = $$props.styles);
    		if ("dom" in $$props) $$invalidate(5, dom = $$props.dom);
    		if ("bigger" in $$props) bigger = $$props.bigger;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*x_pos, y_pos*/ 768) {
    			//Called whenever x or y position is updated externally from parent or internally
    			if (x_pos || y_pos) {
    				updatePosition();
    			}
    		}

    		if ($$self.$$.dirty & /*inputs, outputs, dom*/ 44) ;

    		if ($$self.$$.dirty & /*styles, dom*/ 8224) {
    			if (styles.isHighlighted) {
    				dom.classList.add("gateSelected");
    			} else {
    				if (dom) {
    					dom.classList.remove("gateSelected");
    				}
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
    		mouseDown,
    		mouseUp,
    		x_pos,
    		y_pos,
    		image,
    		grabbing,
    		released,
    		styles,
    		updatePosition,
    		div2_binding
    	];
    }

    class Gate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			x_pos: 8,
    			y_pos: 9,
    			image: 10,
    			inputCallback: 0,
    			outputCallback: 1,
    			inputs: 2,
    			outputs: 3,
    			id: 4,
    			grabbing: 11,
    			released: 12,
    			styles: 13,
    			updatePosition: 14
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gate",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[10] === undefined && !("image" in props)) {
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

    		if (/*grabbing*/ ctx[11] === undefined && !("grabbing" in props)) {
    			console.warn("<Gate> was created without expected prop 'grabbing'");
    		}

    		if (/*released*/ ctx[12] === undefined && !("released" in props)) {
    			console.warn("<Gate> was created without expected prop 'released'");
    		}

    		if (/*styles*/ ctx[13] === undefined && !("styles" in props)) {
    			console.warn("<Gate> was created without expected prop 'styles'");
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

    	get grabbing() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grabbing(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get released() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set released(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styles() {
    		throw new Error("<Gate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styles(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updatePosition() {
    		return this.$$.ctx[14];
    	}

    	set updatePosition(value) {
    		throw new Error("<Gate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\logicSim\switch.svelte generated by Svelte v3.35.0 */
    const file$9 = "src\\logicSim\\switch.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (58:8) {#each Array(outputs) as _, i}
    function create_each_block$3(ctx) {
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(58:8) {#each Array(outputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Array(/*outputs*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "connections svelte-18x04yo");
    			add_location(div0, file$9, 56, 4, 1226);
    			attr_dev(div1, "class", "gate svelte-18x04yo");
    			add_location(div1, file$9, 61, 4, 1410);
    			attr_dev(div2, "class", "wrapper svelte-18x04yo");
    			add_location(div2, file$9, 55, 0, 1183);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);
    			/*div2_binding*/ ctx[9](div2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "mousedown", /*mouseDown*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id, outputCallback, outputs*/ 7) {
    				each_value = Array(/*outputs*/ ctx[1]);
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
    						each_blocks[i].m(div0, null);
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
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			/*div2_binding*/ ctx[9](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Switch", slots, []);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value) {
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
    		div2_binding
    	];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
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
    			tagName: "Switch",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[7] === undefined && !("image" in props)) {
    			console.warn("<Switch> was created without expected prop 'image'");
    		}

    		if (/*outputCallback*/ ctx[0] === undefined && !("outputCallback" in props)) {
    			console.warn("<Switch> was created without expected prop 'outputCallback'");
    		}

    		if (/*switchState*/ ctx[8] === undefined && !("switchState" in props)) {
    			console.warn("<Switch> was created without expected prop 'switchState'");
    		}

    		if (/*outputs*/ ctx[1] === undefined && !("outputs" in props)) {
    			console.warn("<Switch> was created without expected prop 'outputs'");
    		}

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<Switch> was created without expected prop 'id'");
    		}
    	}

    	get x_pos() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x_pos(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y_pos() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y_pos(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputCallback() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputCallback(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get switchState() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set switchState(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputs() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputs(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\logicSim\wire.svelte generated by Svelte v3.35.0 */
    const file$8 = "src\\logicSim\\wire.svelte";

    function create_fragment$9(ctx) {
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
    			add_location(path0, file$8, 30, 0, 588);
    			attr_dev(path1, "d", path1_d_value = "M " + /*start_x_pos*/ ctx[0] + " " + /*start_y_pos*/ ctx[1] + " \r\n    C " + (/*start_x_pos*/ ctx[0] + 128) + " " + /*start_y_pos*/ ctx[1] + ", " + (/*end_x_pos*/ ctx[2] - 128) + " " + /*end_y_pos*/ ctx[3] + ", " + /*end_x_pos*/ ctx[2] + " " + /*end_y_pos*/ ctx[3]);
    			attr_dev(path1, "stroke", /*color*/ ctx[4]);
    			attr_dev(path1, "fill", "transparent");
    			attr_dev(path1, "stroke-width", "3");
    			add_location(path1, file$8, 37, 0, 930);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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

    class Wire extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			start_x_pos: 0,
    			start_y_pos: 1,
    			end_x_pos: 2,
    			end_y_pos: 3,
    			state: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wire",
    			options,
    			id: create_fragment$9.name
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

    const evaluate = (components, componentLookup) => {
        const binaryOp = (logicFn, component) => {
          if (!validateInputs(component, component.in_count)) return;
          
          var outputs = [];

          for (var i = 0; i < component.in_count; i++) {
            outputs.push(componentLookup[component.inputs[i].gate_id].output_states[component.inputs[i].index]);
          }
        
          component.output_states[0] = logicFn(outputs);
          return;
        };

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

    /* src\logicSim\light.svelte generated by Svelte v3.35.0 */
    const file$7 = "src\\logicSim\\light.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (75:8) {:else}
    function create_else_block$4(ctx) {
    	let each_1_anchor;
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(75:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:8) {#if inputs === 1}
    function create_if_block$5(ctx) {
    	let input;
    	let current;

    	input = new Input({
    			props: {
    				x_pos: -26,
    				y_pos: 8,
    				wireIndex: 0,
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(73:8) {#if inputs === 1}",
    		ctx
    	});

    	return block;
    }

    // (76:12) {#each Array(inputs) as _, i}
    function create_each_block$2(ctx) {
    	let input;
    	let current;

    	input = new Input({
    			props: {
    				x_pos: -26,
    				y_pos: /*i*/ ctx[16] * 16,
    				wireIndex: /*i*/ ctx[16],
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
    		source: "(76:12) {#each Array(inputs) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div2;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*inputs*/ ctx[1] === 1) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "connections svelte-18x04yo");
    			add_location(div0, file$7, 71, 4, 1508);
    			attr_dev(div1, "class", "gate svelte-18x04yo");
    			add_location(div1, file$7, 80, 4, 1876);
    			attr_dev(div2, "class", "wrapper svelte-18x04yo");
    			add_location(div2, file$7, 70, 0, 1465);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			/*div2_binding*/ ctx[12](div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mousedown", /*mouseDown*/ ctx[4], false, false, false),
    					listen_dev(div1, "mouseup", /*mouseUp*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
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
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			/*div2_binding*/ ctx[12](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Light", slots, []);
    	let { x_pos = 0 } = $$props;
    	let { y_pos = 0 } = $$props;
    	let { image } = $$props;
    	let { inputCallback } = $$props;
    	let { state } = $$props;
    	let { inputs } = $$props;
    	let { id } = $$props;
    	let { grabbing } = $$props;
    	let { released } = $$props;
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
    		grabbing(id);
    	}

    	function mouseUp() {
    		released(id);
    	}

    	const writable_props = [
    		"x_pos",
    		"y_pos",
    		"image",
    		"inputCallback",
    		"state",
    		"inputs",
    		"id",
    		"grabbing",
    		"released"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Light> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			($$invalidate(3, dom), $$invalidate(9, state));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("x_pos" in $$props) $$invalidate(6, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(7, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(8, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("state" in $$props) $$invalidate(9, state = $$props.state);
    		if ("inputs" in $$props) $$invalidate(1, inputs = $$props.inputs);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("grabbing" in $$props) $$invalidate(10, grabbing = $$props.grabbing);
    		if ("released" in $$props) $$invalidate(11, released = $$props.released);
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
    		grabbing,
    		released,
    		dom,
    		updatePosition,
    		mouseDown,
    		mouseUp
    	});

    	$$self.$inject_state = $$props => {
    		if ("x_pos" in $$props) $$invalidate(6, x_pos = $$props.x_pos);
    		if ("y_pos" in $$props) $$invalidate(7, y_pos = $$props.y_pos);
    		if ("image" in $$props) $$invalidate(8, image = $$props.image);
    		if ("inputCallback" in $$props) $$invalidate(0, inputCallback = $$props.inputCallback);
    		if ("state" in $$props) $$invalidate(9, state = $$props.state);
    		if ("inputs" in $$props) $$invalidate(1, inputs = $$props.inputs);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("grabbing" in $$props) $$invalidate(10, grabbing = $$props.grabbing);
    		if ("released" in $$props) $$invalidate(11, released = $$props.released);
    		if ("dom" in $$props) $$invalidate(3, dom = $$props.dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*state, dom*/ 520) {
    			if (state) {
    				if (dom !== undefined) $$invalidate(3, dom.style.backgroundColor = "blue", dom);
    			} else {
    				if (dom !== undefined) $$invalidate(3, dom.style.backgroundColor = "white", dom);
    			}
    		}

    		if ($$self.$$.dirty & /*x_pos, y_pos*/ 192) {
    			//Called whenever x or y position is updated externally from parent or internally
    			if (x_pos || y_pos) {
    				updatePosition();
    			}
    		}
    	};

    	return [
    		inputCallback,
    		inputs,
    		id,
    		dom,
    		mouseDown,
    		mouseUp,
    		x_pos,
    		y_pos,
    		image,
    		state,
    		grabbing,
    		released,
    		div2_binding
    	];
    }

    class Light extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			x_pos: 6,
    			y_pos: 7,
    			image: 8,
    			inputCallback: 0,
    			state: 9,
    			inputs: 1,
    			id: 2,
    			grabbing: 10,
    			released: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Light",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[8] === undefined && !("image" in props)) {
    			console.warn("<Light> was created without expected prop 'image'");
    		}

    		if (/*inputCallback*/ ctx[0] === undefined && !("inputCallback" in props)) {
    			console.warn("<Light> was created without expected prop 'inputCallback'");
    		}

    		if (/*state*/ ctx[9] === undefined && !("state" in props)) {
    			console.warn("<Light> was created without expected prop 'state'");
    		}

    		if (/*inputs*/ ctx[1] === undefined && !("inputs" in props)) {
    			console.warn("<Light> was created without expected prop 'inputs'");
    		}

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<Light> was created without expected prop 'id'");
    		}

    		if (/*grabbing*/ ctx[10] === undefined && !("grabbing" in props)) {
    			console.warn("<Light> was created without expected prop 'grabbing'");
    		}

    		if (/*released*/ ctx[11] === undefined && !("released" in props)) {
    			console.warn("<Light> was created without expected prop 'released'");
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

    	get grabbing() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grabbing(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get released() {
    		throw new Error("<Light>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set released(value) {
    		throw new Error("<Light>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\logicSim\selectionBox.svelte generated by Svelte v3.35.0 */
    const file$6 = "src\\logicSim\\selectionBox.svelte";

    function create_fragment$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "selection svelte-15oitp0");
    			add_location(div, file$6, 78, 0, 2702);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[6](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[6](null);
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectionBox", slots, []);
    	let { start_x_pos = 0 } = $$props;
    	let { start_y_pos = 0 } = $$props;
    	let { end_x_pos = 0 } = $$props;
    	let { end_y_pos = 0 } = $$props;
    	let dom;

    	onMount(async () => {
    		//Move to position assigned by the creator on startup
    		//dom.style.left = x_pos + "px";
    		//dom.style.top = y_pos + "px";
    		updatePosition();
    	});

    	function updatePosition() {
    		if (dom) {
    			if (end_x_pos - start_x_pos === 0 && end_y_pos - start_y_pos === 0) {
    				$$invalidate(0, dom.style.left = start_x_pos + "px", dom);
    				$$invalidate(0, dom.style.top = start_y_pos + "px", dom);
    				$$invalidate(0, dom.style.width = end_x_pos - start_x_pos + "px", dom);
    				$$invalidate(0, dom.style.height = end_y_pos - start_y_pos + "px", dom);
    			}

    			if (end_x_pos - start_x_pos < 0 && end_y_pos - start_y_pos < 0) {
    				$$invalidate(0, dom.style.left = end_x_pos + "px", dom);
    				$$invalidate(0, dom.style.top = end_y_pos + "px", dom);
    				$$invalidate(0, dom.style.width = start_x_pos - end_x_pos + "px", dom);
    				$$invalidate(0, dom.style.height = start_y_pos - end_y_pos + "px", dom);
    			} else if (end_x_pos - start_x_pos > 0 && end_y_pos - start_y_pos > 0) {
    				$$invalidate(0, dom.style.left = start_x_pos + "px", dom);
    				$$invalidate(0, dom.style.top = start_y_pos + "px", dom);
    				$$invalidate(0, dom.style.width = end_x_pos - start_x_pos + "px", dom);
    				$$invalidate(0, dom.style.height = end_y_pos - start_y_pos + "px", dom);
    			} else if (end_x_pos - start_x_pos > 0 && end_y_pos - start_y_pos < 0) {
    				$$invalidate(0, dom.style.left = start_x_pos + "px", dom);
    				$$invalidate(0, dom.style.top = end_y_pos + "px", dom);
    				$$invalidate(0, dom.style.width = end_x_pos - start_x_pos + "px", dom);
    				$$invalidate(0, dom.style.height = start_y_pos - end_y_pos + "px", dom);
    			} else if (end_x_pos - start_x_pos < 0 && end_y_pos - start_y_pos > 0) {
    				$$invalidate(0, dom.style.left = end_x_pos + "px", dom);
    				$$invalidate(0, dom.style.top = start_y_pos + "px", dom);
    				$$invalidate(0, dom.style.width = start_x_pos - end_x_pos + "px", dom);
    				$$invalidate(0, dom.style.height = end_y_pos - start_y_pos + "px", dom);
    			}
    		}
    	}

    	const writable_props = ["start_x_pos", "start_y_pos", "end_x_pos", "end_y_pos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectionBox> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			$$invalidate(0, dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("start_x_pos" in $$props) $$invalidate(1, start_x_pos = $$props.start_x_pos);
    		if ("start_y_pos" in $$props) $$invalidate(2, start_y_pos = $$props.start_y_pos);
    		if ("end_x_pos" in $$props) $$invalidate(3, end_x_pos = $$props.end_x_pos);
    		if ("end_y_pos" in $$props) $$invalidate(4, end_y_pos = $$props.end_y_pos);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		start_x_pos,
    		start_y_pos,
    		end_x_pos,
    		end_y_pos,
    		dom,
    		updatePosition
    	});

    	$$self.$inject_state = $$props => {
    		if ("start_x_pos" in $$props) $$invalidate(1, start_x_pos = $$props.start_x_pos);
    		if ("start_y_pos" in $$props) $$invalidate(2, start_y_pos = $$props.start_y_pos);
    		if ("end_x_pos" in $$props) $$invalidate(3, end_x_pos = $$props.end_x_pos);
    		if ("end_y_pos" in $$props) $$invalidate(4, end_y_pos = $$props.end_y_pos);
    		if ("dom" in $$props) $$invalidate(0, dom = $$props.dom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*start_x_pos, start_y_pos, end_x_pos, end_y_pos*/ 30) {
    			//Called whenever x or y position is updated externally from parent or internally
    			if (start_x_pos || start_y_pos || end_x_pos || end_y_pos) {
    				updatePosition();
    			}
    		}
    	};

    	return [
    		dom,
    		start_x_pos,
    		start_y_pos,
    		end_x_pos,
    		end_y_pos,
    		updatePosition,
    		div_binding
    	];
    }

    class SelectionBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			start_x_pos: 1,
    			start_y_pos: 2,
    			end_x_pos: 3,
    			end_y_pos: 4,
    			updatePosition: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectionBox",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get start_x_pos() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start_x_pos(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start_y_pos() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start_y_pos(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_x_pos() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_x_pos(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end_y_pos() {
    		throw new Error("<SelectionBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end_y_pos(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updatePosition() {
    		return this.$$.ctx[5];
    	}

    	set updatePosition(value) {
    		throw new Error("<SelectionBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\logicSim\canvas.svelte generated by Svelte v3.35.0 */

    const { console: console_1$2, window: window_1 } = globals;
    const file$5 = "src\\logicSim\\canvas.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[72] = list[i];
    	child_ctx[73] = list;
    	child_ctx[74] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[75] = list[i];
    	child_ctx[74] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[77] = list[i];
    	child_ctx[74] = i;
    	return child_ctx;
    }

    // (1298:0) {:else}
    function create_else_block$3(ctx) {
    	let div2;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let div0;
    	let svg;
    	let each0_anchor;
    	let t3;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*displayTestResults*/ ctx[12] && create_if_block_6(ctx);
    	let if_block1 = /*isGateSelected*/ ctx[18] && create_if_block_5(ctx);
    	let if_block2 = /*isSelecting_Draw*/ ctx[9] && create_if_block_4(ctx);
    	let each_value_1 = /*wires*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let if_block3 = /*isWire*/ ctx[15] && create_if_block_3(ctx);
    	let each_value = /*components*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block4 = /*isPlacing*/ ctx[7] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			t2 = space();
    			div0 = element("div");
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			each0_anchor = empty();
    			if (if_block3) if_block3.c();
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block4) if_block4.c();
    			attr_dev(svg, "width", "2048");
    			attr_dev(svg, "height", "2048");
    			add_location(svg, file$5, 1329, 12, 46050);
    			attr_dev(div0, "class", "wire svelte-1vu0h8c");
    			add_location(div0, file$5, 1328, 8, 46018);
    			attr_dev(div1, "id", "zoomLayer");
    			attr_dev(div1, "class", "svelte-1vu0h8c");
    			add_location(div1, file$5, 1324, 4, 45748);
    			attr_dev(div2, "class", "workspace svelte-1vu0h8c");
    			add_location(div2, file$5, 1298, 0, 44871);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t0);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, svg);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(svg, null);
    			}

    			append_dev(svg, each0_anchor);
    			if (if_block3) if_block3.m(svg, null);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t4);
    			if (if_block4) if_block4.m(div1, null);
    			/*div1_binding*/ ctx[39](div1);
    			/*div2_binding*/ ctx[40](div2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "mousedown", /*mouseDown*/ ctx[19], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*displayTestResults*/ ctx[12]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(div2, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isGateSelected*/ ctx[18]) if_block1.p(ctx, dirty);

    			if (/*isSelecting_Draw*/ ctx[9]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*isSelecting_Draw*/ 512) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*wires*/ 16) {
    				each_value_1 = /*wires*/ ctx[4];
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

    			if (/*isWire*/ ctx[15]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*isWire*/ 32768) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(svg, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*components, inputCallback, gateGrabbed, gateReleased, outputCallback*/ 25165838) {
    				each_value = /*components*/ ctx[3];
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
    						each_blocks[i].m(div1, t4);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (/*isPlacing*/ ctx[7]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*isPlacing*/ 128) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div1, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(if_block3);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(if_block3);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks_1, detaching);
    			if (if_block3) if_block3.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block4) if_block4.d();
    			/*div1_binding*/ ctx[39](null);
    			/*div2_binding*/ ctx[40](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(1298:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1290:0) {#if islessonComplete}
    function create_if_block$4(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Lesson Completed";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Close";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Return to menu";
    			attr_dev(h1, "class", "svelte-1vu0h8c");
    			add_location(h1, file$5, 1292, 12, 44641);
    			attr_dev(button0, "class", "svelte-1vu0h8c");
    			add_location(button0, file$5, 1293, 12, 44680);
    			attr_dev(button1, "class", "svelte-1vu0h8c");
    			add_location(button1, file$5, 1294, 12, 44758);
    			attr_dev(div0, "class", "alert svelte-1vu0h8c");
    			add_location(div0, file$5, 1291, 8, 44608);
    			attr_dev(div1, "class", "fullScreen svelte-1vu0h8c");
    			add_location(div1, file$5, 1290, 4, 44574);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[36], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[37], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(1290:0) {#if islessonComplete}",
    		ctx
    	});

    	return block;
    }

    // (1300:4) {#if displayTestResults}
    function create_if_block_6(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let p1;
    	let table;
    	let each_value_2 = /*finalTestResultsPasses*/ ctx[13];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Test Results";
    			p1 = element("p");
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p0, "class", "resTitle svelte-1vu0h8c");
    			add_location(p0, file$5, 1302, 12, 45030);
    			attr_dev(p1, "class", "svelte-1vu0h8c");
    			add_location(p1, file$5, 1302, 44, 45062);
    			add_location(table, file$5, 1303, 12, 45079);
    			attr_dev(div0, "class", "options_content svelte-1vu0h8c");
    			add_location(div0, file$5, 1301, 8, 44987);
    			attr_dev(div1, "class", "results svelte-1vu0h8c");
    			add_location(div1, file$5, 1300, 4, 44956);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, p1);
    			append_dev(div0, table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*finalTestResultsPasses*/ 8192) {
    				each_value_2 = /*finalTestResultsPasses*/ ctx[13];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(1300:4) {#if displayTestResults}",
    		ctx
    	});

    	return block;
    }

    // (1305:16) {#each finalTestResultsPasses as pass, i}
    function create_each_block_2(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = /*pass*/ ctx[77] + "";
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Test ");
    			t1 = text(/*i*/ ctx[74]);
    			t2 = text(": ");
    			t3 = text(t3_value);
    			attr_dev(p, "class", "whiteText svelte-1vu0h8c");
    			add_location(p, file$5, 1305, 20, 45167);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*finalTestResultsPasses*/ 8192 && t3_value !== (t3_value = /*pass*/ ctx[77] + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(1305:16) {#each finalTestResultsPasses as pass, i}",
    		ctx
    	});

    	return block;
    }

    // (1312:4) {#if isGateSelected}
    function create_if_block_5(ctx) {
    	let div2;
    	let div1;
    	let p0;
    	let p1;
    	let input;
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let p2;
    	let t4_value = /*gateSelected*/ ctx[17].in_count + "";
    	let t4;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Gate Name";
    			p1 = element("p");
    			input = element("input");
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "-";
    			t3 = space();
    			p2 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			attr_dev(p0, "class", "svelte-1vu0h8c");
    			add_location(p0, file$5, 1314, 12, 45400);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "fname");
    			attr_dev(input, "name", "fname");
    			add_location(input, file$5, 1315, 12, 45429);
    			attr_dev(p1, "class", "svelte-1vu0h8c");
    			add_location(p1, file$5, 1314, 24, 45412);
    			attr_dev(button0, "class", "svelte-1vu0h8c");
    			add_location(button0, file$5, 1317, 16, 45531);
    			attr_dev(p2, "class", "svelte-1vu0h8c");
    			add_location(p2, file$5, 1318, 16, 45592);
    			attr_dev(button1, "class", "svelte-1vu0h8c");
    			add_location(button1, file$5, 1319, 16, 45640);
    			attr_dev(div0, "class", "width_buttons svelte-1vu0h8c");
    			add_location(div0, file$5, 1316, 12, 45486);
    			attr_dev(div1, "class", "options_content svelte-1vu0h8c");
    			add_location(div1, file$5, 1313, 8, 45357);
    			attr_dev(div2, "class", "options svelte-1vu0h8c");
    			add_location(div2, file$5, 1312, 4, 45326);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, p1);
    			append_dev(p1, input);
    			append_dev(p1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(p2, t4);
    			append_dev(div0, t5);
    			append_dev(div0, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*decreaseWidth*/ ctx[26], false, false, false),
    					listen_dev(button1, "click", /*increaseWidth*/ ctx[25], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gateSelected*/ 131072 && t4_value !== (t4_value = /*gateSelected*/ ctx[17].in_count + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(1312:4) {#if isGateSelected}",
    		ctx
    	});

    	return block;
    }

    // (1326:8) {#if isSelecting_Draw}
    function create_if_block_4(ctx) {
    	let selection;
    	let current;

    	selection = new SelectionBox({
    			props: {
    				start_x_pos: /*selectionBegin*/ ctx[10].x,
    				start_y_pos: /*selectionBegin*/ ctx[10].y,
    				end_x_pos: /*selectionEnd*/ ctx[11].x,
    				end_y_pos: /*selectionEnd*/ ctx[11].y
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(selection.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(selection, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const selection_changes = {};
    			if (dirty[0] & /*selectionBegin*/ 1024) selection_changes.start_x_pos = /*selectionBegin*/ ctx[10].x;
    			if (dirty[0] & /*selectionBegin*/ 1024) selection_changes.start_y_pos = /*selectionBegin*/ ctx[10].y;
    			if (dirty[0] & /*selectionEnd*/ 2048) selection_changes.end_x_pos = /*selectionEnd*/ ctx[11].x;
    			if (dirty[0] & /*selectionEnd*/ 2048) selection_changes.end_y_pos = /*selectionEnd*/ ctx[11].y;
    			selection.$set(selection_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selection, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(1326:8) {#if isSelecting_Draw}",
    		ctx
    	});

    	return block;
    }

    // (1331:16) {#each wires as wire, i}
    function create_each_block_1$1(ctx) {
    	let wire;
    	let current;

    	wire = new Wire({
    			props: {
    				start_x_pos: /*wires*/ ctx[4][/*i*/ ctx[74]].startPos.x,
    				start_y_pos: /*wires*/ ctx[4][/*i*/ ctx[74]].startPos.y,
    				end_x_pos: /*wires*/ ctx[4][/*i*/ ctx[74]].endPos.x,
    				end_y_pos: /*wires*/ ctx[4][/*i*/ ctx[74]].endPos.y,
    				state: /*wires*/ ctx[4][/*i*/ ctx[74]].state[0]
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
    			if (dirty[0] & /*wires*/ 16) wire_changes.start_x_pos = /*wires*/ ctx[4][/*i*/ ctx[74]].startPos.x;
    			if (dirty[0] & /*wires*/ 16) wire_changes.start_y_pos = /*wires*/ ctx[4][/*i*/ ctx[74]].startPos.y;
    			if (dirty[0] & /*wires*/ 16) wire_changes.end_x_pos = /*wires*/ ctx[4][/*i*/ ctx[74]].endPos.x;
    			if (dirty[0] & /*wires*/ 16) wire_changes.end_y_pos = /*wires*/ ctx[4][/*i*/ ctx[74]].endPos.y;
    			if (dirty[0] & /*wires*/ 16) wire_changes.state = /*wires*/ ctx[4][/*i*/ ctx[74]].state[0];
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
    		source: "(1331:16) {#each wires as wire, i}",
    		ctx
    	});

    	return block;
    }

    // (1336:16) {#if isWire}
    function create_if_block_3(ctx) {
    	let wire;
    	let current;

    	wire = new Wire({
    			props: {
    				start_x_pos: /*placingWire*/ ctx[16].startPos.x,
    				start_y_pos: /*placingWire*/ ctx[16].startPos.y,
    				end_x_pos: /*placingWire*/ ctx[16].endPos.x,
    				end_y_pos: /*placingWire*/ ctx[16].endPos.y,
    				state: /*placingWire*/ ctx[16].state[0]
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
    			if (dirty[0] & /*placingWire*/ 65536) wire_changes.start_x_pos = /*placingWire*/ ctx[16].startPos.x;
    			if (dirty[0] & /*placingWire*/ 65536) wire_changes.start_y_pos = /*placingWire*/ ctx[16].startPos.y;
    			if (dirty[0] & /*placingWire*/ 65536) wire_changes.end_x_pos = /*placingWire*/ ctx[16].endPos.x;
    			if (dirty[0] & /*placingWire*/ 65536) wire_changes.end_y_pos = /*placingWire*/ ctx[16].endPos.y;
    			if (dirty[0] & /*placingWire*/ 65536) wire_changes.state = /*placingWire*/ ctx[16].state[0];
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(1336:16) {#if isWire}",
    		ctx
    	});

    	return block;
    }

    // (1349:12) {:else}
    function create_else_block_1(ctx) {
    	let gate;
    	let each_value = /*each_value*/ ctx[73];
    	let i = /*i*/ ctx[74];
    	let current;
    	const assign_gate = () => /*gate_binding*/ ctx[38](gate, each_value, i);
    	const unassign_gate = () => /*gate_binding*/ ctx[38](null, each_value, i);

    	let gate_props = {
    		x_pos: /*gate*/ ctx[72].position.x,
    		y_pos: /*gate*/ ctx[72].position.y,
    		image: /*gate*/ ctx[72].image,
    		inputs: /*gate*/ ctx[72].in_count,
    		outputs: /*gate*/ ctx[72].out_count,
    		id: /*gate*/ ctx[72].id,
    		outputCallback: /*outputCallback*/ ctx[1],
    		inputCallback: /*inputCallback*/ ctx[2],
    		grabbing: /*gateGrabbed*/ ctx[23],
    		released: /*gateReleased*/ ctx[24],
    		styles: /*gate*/ ctx[72].style
    	};

    	gate = new Gate({ props: gate_props, $$inline: true });
    	assign_gate();

    	const block = {
    		c: function create() {
    			create_component(gate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gate, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (each_value !== /*each_value*/ ctx[73] || i !== /*i*/ ctx[74]) {
    				unassign_gate();
    				each_value = /*each_value*/ ctx[73];
    				i = /*i*/ ctx[74];
    				assign_gate();
    			}

    			const gate_changes = {};
    			if (dirty[0] & /*components*/ 8) gate_changes.x_pos = /*gate*/ ctx[72].position.x;
    			if (dirty[0] & /*components*/ 8) gate_changes.y_pos = /*gate*/ ctx[72].position.y;
    			if (dirty[0] & /*components*/ 8) gate_changes.image = /*gate*/ ctx[72].image;
    			if (dirty[0] & /*components*/ 8) gate_changes.inputs = /*gate*/ ctx[72].in_count;
    			if (dirty[0] & /*components*/ 8) gate_changes.outputs = /*gate*/ ctx[72].out_count;
    			if (dirty[0] & /*components*/ 8) gate_changes.id = /*gate*/ ctx[72].id;
    			if (dirty[0] & /*components*/ 8) gate_changes.styles = /*gate*/ ctx[72].style;
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
    			unassign_gate();
    			destroy_component(gate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(1349:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (1344:12) {#if gate.type === 'light'}
    function create_if_block_2(ctx) {
    	let light;
    	let current;

    	light = new Light({
    			props: {
    				x_pos: /*components*/ ctx[3][/*i*/ ctx[74]].position.x,
    				y_pos: /*components*/ ctx[3][/*i*/ ctx[74]].position.y,
    				image: /*components*/ ctx[3][/*i*/ ctx[74]].image,
    				inputs: /*components*/ ctx[3][/*i*/ ctx[74]].in_count,
    				id: /*components*/ ctx[3][/*i*/ ctx[74]].id,
    				inputCallback: /*inputCallback*/ ctx[2],
    				state: /*components*/ ctx[3][/*i*/ ctx[74]].output_states[0],
    				grabbing: /*gateGrabbed*/ ctx[23],
    				released: /*gateReleased*/ ctx[24]
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
    			if (dirty[0] & /*components*/ 8) light_changes.x_pos = /*components*/ ctx[3][/*i*/ ctx[74]].position.x;
    			if (dirty[0] & /*components*/ 8) light_changes.y_pos = /*components*/ ctx[3][/*i*/ ctx[74]].position.y;
    			if (dirty[0] & /*components*/ 8) light_changes.image = /*components*/ ctx[3][/*i*/ ctx[74]].image;
    			if (dirty[0] & /*components*/ 8) light_changes.inputs = /*components*/ ctx[3][/*i*/ ctx[74]].in_count;
    			if (dirty[0] & /*components*/ 8) light_changes.id = /*components*/ ctx[3][/*i*/ ctx[74]].id;
    			if (dirty[0] & /*components*/ 8) light_changes.state = /*components*/ ctx[3][/*i*/ ctx[74]].output_states[0];
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
    		source: "(1344:12) {#if gate.type === 'light'}",
    		ctx
    	});

    	return block;
    }

    // (1343:8) {#each components as gate, i}
    function create_each_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*gate*/ ctx[72].type === "light") return 0;
    		return 1;
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
    				} else {
    					if_block.p(ctx, dirty);
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(1343:8) {#each components as gate, i}",
    		ctx
    	});

    	return block;
    }

    // (1356:8) {#if isPlacing}
    function create_if_block_1$2(ctx) {
    	let gate;
    	let current;

    	gate = new Gate({
    			props: {
    				x_pos: /*placingComponent*/ ctx[8].position.x,
    				y_pos: /*placingComponent*/ ctx[8].position.y,
    				image: /*placingComponent*/ ctx[8].image,
    				inputs: /*placingComponent*/ ctx[8].in_count,
    				outputs: /*placingComponent*/ ctx[8].out_count,
    				id: /*placingComponent*/ ctx[8].id,
    				styles: /*placingComponent*/ ctx[8].style
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
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.x_pos = /*placingComponent*/ ctx[8].position.x;
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.y_pos = /*placingComponent*/ ctx[8].position.y;
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.image = /*placingComponent*/ ctx[8].image;
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.inputs = /*placingComponent*/ ctx[8].in_count;
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.outputs = /*placingComponent*/ ctx[8].out_count;
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.id = /*placingComponent*/ ctx[8].id;
    			if (dirty[0] & /*placingComponent*/ 256) gate_changes.styles = /*placingComponent*/ ctx[8].style;
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(1356:8) {#if isPlacing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$4, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*islessonComplete*/ ctx[14]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "mouseup", /*mouseUp*/ ctx[20], false, false, false),
    					listen_dev(window_1, "mousemove", /*mouseMove*/ ctx[21], false, false, false),
    					listen_dev(window_1, "keydown", /*keypressing*/ ctx[22], false, false, false)
    				];

    				mounted = true;
    			}
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
    				} else {
    					if_block.p(ctx, dirty);
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

    function checkIfWireIsValid(id, isInput) {
    }

    function loadSetup(setupType) {
    	switch (setupType) {
    		case "bus":
    			break;
    		default:
    			console.log("premade gate setup doesn't exsit.");
    	}
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

    function offset(el) {
    	var rect = el.getBoundingClientRect(),
    		scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    		scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    	return {
    		top: rect.top + scrollTop,
    		left: rect.left + scrollLeft
    	};
    }

    // for (var i = 0; i < testResults.length; i++) {
    //     console.log("Test Number: " + i);
    //     for (var k = 0; k < testResults[i].inputs.length; k++) {
    //         console.log("Input " + k + " : " + testResults[i].inputs[k]);
    //     }
    //     for (var j = 0; j < testResults[i].inputs.length; j++) {
    //         console.log("Outpu " + j + " : " + testResults[i].outputs[j]);
    //     }
    // }
    function CompareTests(test, lessonID) {
    	var lesson10Results = [[0], [1]];
    	var lesson11Results = [[0], [0], [0], [1]];
    	var testAgainst = [];

    	switch (lessonID) {
    		case 10:
    			testAgainst = lesson10Results;
    			break;
    		case 11:
    			testAgainst = lesson11Results;
    			break;
    	}

    	console.log("Test: ", test);
    	var passes = [];

    	for (var i = 0; i < test.length; i++) {
    		//Inputs Comparisons
    		// for (var k = 0; k < test[i].inputs; k++) {
    		// }
    		//Output Comparisons
    		for (var k = 0; k < test[i].outputs.length; k++) {
    			console.log("pass: " + i);
    			console.log("side1: ", test[i].outputs[k]);
    			console.log("side2: ", testAgainst[i][k]);
    			if (test[i].outputs[k] === testAgainst[i][k]) passes.push("pass"); else passes.push("fail");
    		}
    	}

    	return passes;
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

    		distance(n) {
    			return Math.sqrt(Math.pow(n.x - this.x, 2) + Math.pow(n.y - this.y, 2));
    		}
    	}

    	

    	//Creates a new list, that is the components array, but the index is the id
    	const indexBy = (array, prop) => array.reduce(
    		(output, item) => {
    			output[item[prop]] = item;
    			return output;
    		},
    		{}
    	);

    	const canInputOrOuputCountBeChanged = type => {
    		switch (type) {
    			case "and":
    			case "nor":
    			case "nand":
    			case "or":
    			case "xor":
    			case "out_bus":
    			case "in_bus":
    				return true;
    			default:
    				return false;
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
        removable: true,                  
    }
    */
    	let components = [];

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
    	let wires = [];

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
    	let displayTestResults;
    	let finalTestResults;
    	let finalTestResultsPasses;
    	let islessonComplete = false;
    	let { externalData } = $$props;
    	let { applicationState } = $$props;

    	onMount(async () => {
    		//Load the users data for this lesson
    		console.log("externalData: ", externalData);

    		load();
    	});

    	//TODO - move without place the gate held
    	function mouseDown(event) {
    		console.log("click");

    		//Check if mouse 2 is pressed, if so only move board
    		if (event.button !== 2) {
    			//Place a gate if mouse 1 is pressed, and is in the range of the board
    			if (isPlacing) {
    				//Add gate to componets array
    				$$invalidate(3, components = [...components, placingComponent]);

    				$$invalidate(7, isPlacing = false);
    			} else if (!isSelecting && canSelect) {
    				//Start making a selction box
    				isSelecting = true;

    				//Make sure the box is on the cursor
    				let zoomLayerOffset = offset(zoomLayerDom);

    				zoomLayerOffset.left *= 1 / scale;
    				zoomLayerOffset.top *= 1 / scale;
    				$$invalidate(10, selectionBegin = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top));
    				$$invalidate(11, selectionEnd = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top));
    			}
    		} else {
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
    				$$invalidate(3, components);
    			} else if (didGateMove) ; else {
    				//Clear the selection
    				clearSelection(); //Dont unselect any thing
    			}

    			if (isSelecting) {
    				isSelecting = false;

    				if (isSelecting_Draw) {
    					let zoomLayerOffset = offset(zoomLayerDom);
    					zoomLayerOffset.left *= 1 / scale;
    					zoomLayerOffset.top *= 1 / scale;
    					$$invalidate(11, selectionEnd = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top));
    					$$invalidate(9, isSelecting_Draw = false);

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

    			zoomLayerOffset.left *= 1 / scale;
    			zoomLayerOffset.top *= 1 / scale;
    			let gatePos = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top);
    			$$invalidate(8, placingComponent.position = new Vector(Math.round(gatePos.x / 32 - 0.5) * 32, Math.round(gatePos.y / 32 - 0.5) * 32), placingComponent);
    		}

    		//Move the wire being placed
    		if (isWire) {
    			let zoomLayerOffset = offset(zoomLayerDom);
    			zoomLayerOffset.left *= 1 / scale;
    			zoomLayerOffset.top *= 1 / scale;
    			let wirePos = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top);
    			$$invalidate(16, placingWire.endPos = new Vector(wirePos.x, wirePos.y), placingWire);
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
    				if (selectedGatesIds[i] === gateGrabbedId) isPartOfGroup = true;
    			}

    			//Maybe make it so it has to move a certain distance
    			didGateMove = true;

    			if (isPartOfGroup) {
    				for (var i = 0; i < selectedGatesIds.length; i++) {
    					getComponent(selectedGatesIds[i]).position = new Vector(Math.round(gatePos.x / 32 - 0.5) * 32, Math.round(gatePos.y / 32 - 0.5) * 32);
    				}
    			} else {
    				//Lock to grid movement
    				let zoomLayerOffset = offset(zoomLayerDom);

    				zoomLayerOffset.left *= 1 / scale;
    				zoomLayerOffset.top *= 1 / scale;
    				let gatePos = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top);
    				getComponent(gateGrabbedId).position = new Vector(Math.round(gatePos.x / 32 - 0.5) * 32, Math.round(gatePos.y / 32 - 0.5) * 32);
    			}

    			//SVELT NEED TO SEE AN ASGINMENT OF THE ARRAY TO KNOW THAT IT CHANGE AND TO UPDATE THE PROPS
    			//see https://svelte.dev/tutorial/updating-arrays-and-objects for more information
    			$$invalidate(3, components);
    		} //Move the wires with the gate
    		//Inputs

    		//console.log(getWiresById(gateGrabbedId));
    		//If the user is selecting and not dragging
    		if (isSelecting && !isGrabbingGate) {
    			//Enable once drag has become large enough
    			if (selectionBegin.distance(selectionEnd) > 10) {
    				$$invalidate(9, isSelecting_Draw = true);
    			}

    			let zoomLayerOffset = offset(zoomLayerDom);
    			zoomLayerOffset.left *= 1 / scale;
    			zoomLayerOffset.top *= 1 / scale;
    			$$invalidate(11, selectionEnd = new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top));
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

    	function addGate(gateType) {
    		//Math for the zoom stuffs
    		let zoomLayerOffset = offset(zoomLayerDom);

    		zoomLayerOffset.left *= 1 / scale;
    		zoomLayerOffset.top *= 1 / scale;

    		//Sets isPlacing as a state for what to do on mouse clicks and other stuff
    		$$invalidate(7, isPlacing = true);

    		//Generates a temperary component for placing
    		$$invalidate(8, placingComponent = {
    			id: nextGateID.toString(),
    			inputs: [],
    			output_states: [0],
    			position: new Vector(1 / scale * event.pageX - zoomLayerOffset.left, 1 / scale * event.pageY - zoomLayerOffset.top),
    			style: { isHighlighted: false },
    			removable: true
    		});

    		//Sets the gate speccific data for gate type requested, some of the preset data may be changed
    		switch (gateType) {
    			case "AND":
    				$$invalidate(8, placingComponent.in_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "and", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/AND_GATE.svg", placingComponent);
    				break;
    			case "NAND":
    				$$invalidate(8, placingComponent.in_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "nand", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/NAND_GATE.svg", placingComponent);
    				break;
    			case "NOT":
    				$$invalidate(8, placingComponent.in_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "not", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/NOT_GATE.svg", placingComponent);
    				break;
    			case "OR":
    				$$invalidate(8, placingComponent.in_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "or", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/OR_GATE.svg", placingComponent);
    				break;
    			case "NOR":
    				$$invalidate(8, placingComponent.in_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "nor", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/NOR_GATE.svg", placingComponent);
    				break;
    			case "XOR":
    				$$invalidate(8, placingComponent.in_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "xor", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/XOR_GATE.svg", placingComponent);
    				break;
    			case "Switch":
    				$$invalidate(8, placingComponent.in_count = 0, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.type = "switch", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/AND_GATE.svg", placingComponent);
    				break;
    			case "Light":
    				$$invalidate(8, placingComponent.in_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 0, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [], placingComponent);
    				$$invalidate(8, placingComponent.type = "light", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/Light.svg", placingComponent);
    				break;
    			case "dLatch":
    				$$invalidate(8, placingComponent.in_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 2, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1, 1], placingComponent);
    				$$invalidate(8, placingComponent.type = "dLatch", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/Light.svg", placingComponent);
    				break;
    			case "in_bus":
    				$$invalidate(8, placingComponent.in_count = 8, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [1, 1, 1, 1, 1, 1, 1, 1], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [8], placingComponent);
    				$$invalidate(8, placingComponent.type = "in_bus", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/Light.svg", placingComponent);
    				break;
    			case "out_bus":
    				$$invalidate(8, placingComponent.in_count = 1, placingComponent);
    				$$invalidate(8, placingComponent.out_count = 8, placingComponent);
    				$$invalidate(8, placingComponent.in_widths = [8], placingComponent);
    				$$invalidate(8, placingComponent.out_widths = [1, 1, 1, 1, 1, 1, 1, 1], placingComponent);
    				$$invalidate(8, placingComponent.type = "out_bus", placingComponent);
    				$$invalidate(8, placingComponent.image = "./build/Light.svg", placingComponent);
    				break;
    			default:
    				console.log("Gate does not exist.");
    				break;
    		}

    		//Tell svelte that the array updated
    		$$invalidate(8, placingComponent);

    		//Incrament the gate id
    		nextGateID++;
    	}

    	function removeGates() {
    		//Remove the currently selected gate or gates and the wires attched to the gates
    		//This function requires that the id exists
    		const getIndexIntoComponentsArray = id => {
    			for (var i = 0; i < components.length; i++) {
    				if (components[i].id === id) return i;
    			}
    		};

    		const removeWireByID = id => {
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

    		const remove1Gate = id => {
    			//Remove the attached wires
    			while (removeWireByID(id)) {
    				
    			}

    			//Remove the gate
    			var index = getIndexIntoComponentsArray(id);

    			components.splice(index, 1);
    		};

    		for (var i = 0; i < selectedGatesIds.length; i++) {
    			//Check if the gate can be removed
    			if (getComponent(selectedGatesIds[i]).removable) remove1Gate(selectedGatesIds[i]);
    		}

    		selectedGatesIds = [];

    		//Tell svelte to update the components
    		$$invalidate(3, components);

    		$$invalidate(4, wires);
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

    	function outputCallback(x_pos, y_pos, outWireIndex, id) {
    		//Check if the same ouput was selected (cancel the selection)
    		if (isWire) {
    			if (placingWire.id === id) {
    				$$invalidate(15, isWire = false);
    				return;
    			}
    		}

    		canSelect = false;

    		//Get the component
    		var component = getComponent(id);

    		$$invalidate(15, isWire = true);
    		let internalState = component.output_states[outWireIndex];

    		$$invalidate(16, placingWire = {
    			startPos: new Vector(x_pos, y_pos),
    			endPos: new Vector(x_pos, y_pos),
    			id,
    			index: outWireIndex,
    			state: [internalState], //Should be 'x'?
    			width: component.out_widths[outWireIndex]
    		});
    	}

    	function inputCallback(x_pos, y_pos, inWireIndex, id) {
    		console.log("Input callback");

    		//Checks to see if an output node was already selected, if so it connects the nodes in the system
    		if (isWire) {
    			//Check if the widths match
    			if (placingWire.width !== getComponent(id).in_widths[inWireIndex]) {
    				//Wire widths are differnt, dont connect them
    				return;
    			}

    			$$invalidate(15, isWire = false);
    			$$invalidate(16, placingWire.endPos = new Vector(x_pos, y_pos), placingWire);
    			$$invalidate(16, placingWire.id_in = id, placingWire);
    			$$invalidate(4, wires = [...wires, placingWire]);

    			//Connect components in the array
    			for (let i = 0; i < components.length; i++) {
    				if (components[i].id === id) {
    					$$invalidate(
    						3,
    						components[i].inputs[inWireIndex] = {
    							gate_id: placingWire.id,
    							index: placingWire.index
    						},
    						components
    					);
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
    			if (!didGateMove) switchState(id);
    		}

    		console.log("Gate released");
    	} //gateSelected = getComponent(id);
    	//isGateSelected = true;

    	function increaseWidth() {
    		if (!canInputOrOuputCountBeChanged(gateSelected.type)) return;

    		//Determine if it is a bus (slightly special case for these)
    		if (gateSelected.type === "out_bus") {
    			//Increase the out count
    			$$invalidate(17, gateSelected.out_count += 1, gateSelected);

    			//Add to the in_widths
    			$$invalidate(17, gateSelected.out_widths = [...gateSelected.out_widths, 1], gateSelected);

    			//Increase the input bus width
    			$$invalidate(17, gateSelected.in_widths = [gateSelected.in_widths[0] + 1], gateSelected);
    		} else if (gateSelected.type === "in_bus") {
    			//Increase the in count
    			$$invalidate(17, gateSelected.in_count += 1, gateSelected);

    			//Add to the in_widths
    			$$invalidate(17, gateSelected.in_widths = [...gateSelected.in_widths, 1], gateSelected);

    			//Increase the output width 
    			$$invalidate(17, gateSelected.out_widths = [gateSelected.out_widths[0] + 1], gateSelected);
    		} else {
    			//Increase the in count
    			$$invalidate(17, gateSelected.in_count += 1, gateSelected);

    			//Add to the in_widths
    			$$invalidate(17, gateSelected.in_widths = [...gateSelected.in_widths, 1], gateSelected);
    		}

    		//Tells svelte to update everthing that uses the components array
    		$$invalidate(3, components);
    	}

    	function decreaseWidth() {
    		if (!canInputOrOuputCountBeChanged(gateSelected.type)) return;

    		//The minimun for any gate that can change is 1
    		if (gateSelected.in_count === 1) return;

    		//Determine if it is a bus (slightly special case for these)
    		if (gateSelected.type === "out_bus") {
    			//Increase the out count
    			$$invalidate(17, gateSelected.out_count -= 1, gateSelected);

    			//remove to the in_widths
    			gateSelected.out_widths.pop();

    			$$invalidate(17, gateSelected); //DO NOT REMOVE (NOT REDUNDANT)

    			//Increase the input bus width
    			$$invalidate(17, gateSelected.in_widths = [gateSelected.in_widths[0] - 1], gateSelected);
    		} else if (gateSelected.type === "in_bus") {
    			//Increase the in count
    			$$invalidate(17, gateSelected.in_count -= 1, gateSelected);

    			//Add to the in_widths
    			gateSelected.in_widths.pop();

    			$$invalidate(17, gateSelected); //DO NOT REMOVE (NOT REDUNDANT)

    			//Increase the output width 
    			$$invalidate(17, gateSelected.out_widths = [gateSelected.out_widths[0] - 1], gateSelected);
    		} else {
    			//Increase the in count
    			$$invalidate(17, gateSelected.in_count -= 1, gateSelected);

    			//Add to the in_widths
    			gateSelected.in_widths.pop();

    			$$invalidate(17, gateSelected); //DO NOT REMOVE (NOT REDUNDANT)
    		}

    		//Tells svelte to update everthing that uses the components array
    		$$invalidate(3, components);
    	}

    	function debugGates() {
    		//Print info about all gates
    		console.log("Gate debug:");

    		console.log("Components Array: ");
    		console.log(components);
    		console.log("Wires Array: ");
    		console.log(wires);
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
    					$$invalidate(4, wires[w].state[0] = components[i].output_states[wires[w].index], wires);
    				}
    			}
    		}

    		//Update outputs for all the component, this is for svlete to send changes to componments that may need to use them
    		//If the simluator.js is brought into this file this can most likely go away
    		//compoents = compoents; might work instead
    		for (let i = 0; i < components.length; i++) {
    			$$invalidate(3, components);
    		}
    	}

    	function selectComponentsInBox(topPoint, bottomPoint) {
    		//Smaller point is the top, bigger is the bottom, sort them
    		//Correct format: p1 has the smallest x and y, p2 has the biggest x and y
    		var p1 = new Vector(topPoint.x < bottomPoint.x ? topPoint.x : bottomPoint.x, topPoint.y < bottomPoint.y ? topPoint.y : bottomPoint.y);

    		var p2 = new Vector(topPoint.x > bottomPoint.x ? topPoint.x : bottomPoint.x, topPoint.y > bottomPoint.y ? topPoint.y : bottomPoint.y);

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
    		$$invalidate(3, components);
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
    			$$invalidate(3, components);
    		}
    	}

    	//TODO - will be broken, fix
    	function switchState(id) {
    		console.log("Called");
    		let comp = getComponent(id);
    		if (comp.output_states[0]) comp.output_states[0] = 0; else comp.output_states[0] = 1;

    		//Rerun sim
    		simulatate();
    	}

    	const typeToImg = {
    		"and": "./build/AND_GATE.svg",
    		"nand": "./build/NAND_GATE.svg",
    		"not": "./build/NOT_GATE.svg",
    		"or": "./build/OR_GATE.svg",
    		"nor": "./build/NOR_GATE.svg",
    		"xor": "./build/XOR_GATE.svg",
    		"switch": "./build/AND_GATE.svg",
    		"light": "./build/Light.svg"
    	};

    	function generateComponentsData(fullData) {
    		//Sort the options
    		var data = fullData.comps;

    		nextGateID = fullData.nextGateID;

    		//Clear the components array
    		$$invalidate(3, components = []);

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
    				style: { isHighlighted: false },
    				removable: data[i].isMov
    			};

    			for (var k = 0; k < data[i].ou_w.length; k++) newComponent.output_states.push(0);
    			components.push(newComponent);
    		}

    		//Generate the wires that connect the gates
    		$$invalidate(4, wires = []);

    		const findWirePos = (component, index, total, isInput) => {
    			//Find where a wire should go, it is hardcoded in the html
    			let ret = new Vector(0, 0);

    			if (isInput) {
    				ret.x = component.position.x - 26 + 8;
    			} else {
    				ret.x = component.position.x + 42 + 8;
    			}

    			if (total === 1) {
    				ret.y = component.position.y + 8 + 8;
    			} else {
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
    					width: components[i].in_widths[k]
    				};

    				//Add one for each width of the bus
    				for (var q = 0; q < components[i].in_widths[k].length; q++) newWire.push(0);

    				wires.push(newWire);
    			}
    		}

    		console.log("Component Array Built: ", components);

    		//Tell svelte to update stuff
    		$$invalidate(3, components);

    		$$invalidate(4, wires);
    	}

    	function load(lessonID) {
    		fetch("http://localhost:8080/api/load", {
    			headers: { "content-type": "application/json" },
    			method: "POST",
    			body: JSON.stringify({ lessonID: externalData })
    		}).then(res => {
    			return res.json();
    		}).then(res => {
    			console.log("Request complete! response:", res);

    			//Load the information into the components array
    			generateComponentsData(res.data);
    		});
    	} // .catch(error => {
    	//     alert("Network Error, returning to main site");

    	function save() {
    		//Make a post to the server with the json data to save
    		//Clean the data to be sent
    		//Remove all non essential information
    		let sendData = [];

    		for (var i = 0; i < components.length; i++) {
    			let entry = {
    				"id": components[i].id,
    				"in_w": components[i].in_widths,
    				"ou_w": components[i].out_widths,
    				"type": components[i].type,
    				"in": components[i].inputs,
    				"pos": components[i].position,
    				"isMov": components[i].removable
    			};

    			sendData = [...sendData, entry];
    		}

    		var sendDataWithOptions = { comps: sendData, nextGateID };
    		console.log("Sending data: ", sendDataWithOptions);
    		console.log("Base DATA: ", JSON.stringify(sendDataWithOptions));

    		fetch("http://localhost:8080/api/save", {
    			headers: { "content-type": "application/json" },
    			method: "POST",
    			body: JSON.stringify({
    				lessonID: externalData,
    				lessonData: sendDataWithOptions
    			})
    		}).then(res => {
    			console.log("Request complete! response:", res);
    		}).catch(err => {
    			alert("Error Saving");
    		});
    	}

    	function testLesson() {
    		runTest(externalData);
    	}

    	function runTest(lessonID, components) {
    		//TODO Store the simulation state before testing and restor it after testing
    		var testResults;

    		var success = true;
    		var passes;

    		switch (lessonID) {
    			case 10:
    				testResults = testLesson10();
    				passes = CompareTests(testResults, 10);
    				break;
    			case 11:
    				testResults = testLesson11();
    				passes = CompareTests(testResults, 11);
    				break;
    		}

    		$$invalidate(12, displayTestResults = true);
    		$$invalidate(13, finalTestResultsPasses = passes);
    		finalTestResults = testResults;

    		//Did the user pass the lesson, tell them and mark it complete
    		for (var i = 0; i < passes.length; i++) if (passes[i] === "fail") success = false;

    		if (!success) return;

    		//Alert user and return to main page and tell the server its complete
    		fetch("http://localhost:8080/updateLessonStatus", {
    			headers: { "content-type": "application/json" },
    			method: "POST",
    			body: JSON.stringify({
    				lessonID: externalData,
    				status: "Completed"
    			})
    		}).then(res => {
    			console.log("Request complete! response:", res);
    		});

    		// .catch(err => {
    		//     alert("Network Error, returning to main site");
    		//     window.location.replace("https://learnlogic.today");
    		// });
    		$$invalidate(14, islessonComplete = true);
    	} //Print the results
    	// console.log("Success?: ", success);

    	function turnOnOrOffSwitch(isOn, swID) {
    		for (var i = 0; i < components.length; i++) {
    			if (components[i].id === swID) {
    				if (isOn) $$invalidate(3, components[i].output_states[0] = 1, components); else $$invalidate(3, components[i].output_states[0] = 0, components);
    				return components[i].output_states[0];
    			}
    		}
    	}

    	function checkLight(lightID) {
    		for (var i = 0; i < components.length; i++) {
    			if (components[i].id === lightID) {
    				return getComponent(components[i].inputs[0].gate_id).output_states[0];
    			}
    		}
    	}

    	class Test {
    		constructor() {
    			this.inputs = [];
    			this.outputs = [];
    		}

    		addInput(input) {
    			this.inputs.push(input);
    		}

    		addOutput(output) {
    			this.outputs.push(output);
    		}
    	}

    	function testLesson10(components) {
    		//test if a not effect occurs
    		//2 tests
    		var results = [];

    		var test = new Test();

    		//SW1 on
    		test = new Test();

    		test.addInput(turnOnOrOffSwitch(1, "sw1")); //Turns on switch 1
    		simulatate();
    		test.addOutput(checkLight("out1"));
    		results.push(test);

    		//SW1 off
    		test = new Test();

    		test.addInput(turnOnOrOffSwitch(0, "sw1")); //Turns on switch 1
    		simulatate();
    		test.addOutput(checkLight("out1"));
    		results.push(test);
    		return results;
    	}

    	function testLesson11(components) {
    		//And gate test
    		//4 tests
    		var results = [];

    		var test = new Test();

    		//off off
    		test = new Test();

    		test.addInput(turnOnOrOffSwitch(0, "sw1")); //Turns off switch 1
    		test.addInput(turnOnOrOffSwitch(0, "sw2")); //Turns off switch 2
    		simulatate();
    		test.addOutput(checkLight("out1"));
    		results.push(test);

    		//off on
    		test = new Test();

    		test.addInput(turnOnOrOffSwitch(0, "sw1")); //Turns off switch 1
    		test.addInput(turnOnOrOffSwitch(1, "sw2")); //Turns off switch 2
    		simulatate();
    		test.addOutput(checkLight("out1"));
    		results.push(test);

    		//on off
    		test = new Test();

    		test.addInput(turnOnOrOffSwitch(1, "sw1")); //Turns off switch 1
    		test.addInput(turnOnOrOffSwitch(0, "sw2")); //Turns off switch 2
    		simulatate();
    		test.addOutput(checkLight("out1"));
    		results.push(test);

    		//on on
    		test = new Test();

    		test.addInput(turnOnOrOffSwitch(1, "sw1")); //Turns off switch 1
    		test.addInput(turnOnOrOffSwitch(1, "sw2")); //Turns off switch 2
    		simulatate();
    		test.addOutput(checkLight("out1"));
    		results.push(test);
    		return results;
    	}

    	const writable_props = ["externalData", "applicationState"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(14, islessonComplete = false);
    	const click_handler_1 = () => applicationState(0, 0, 0);

    	function gate_binding($$value, each_value, i) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			each_value[i].update = $$value;
    			$$invalidate(3, components);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			zoomLayerDom = $$value;
    			$$invalidate(6, zoomLayerDom);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			workspaceDom = $$value;
    			$$invalidate(5, workspaceDom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("externalData" in $$props) $$invalidate(27, externalData = $$props.externalData);
    		if ("applicationState" in $$props) $$invalidate(0, applicationState = $$props.applicationState);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Gate,
    		Switch,
    		Wire,
    		evaluate,
    		Light,
    		Selection: SelectionBox,
    		get: get_store_value,
    		Vector,
    		indexBy,
    		canInputOrOuputCountBeChanged,
    		components,
    		wires,
    		nextGateID,
    		mousePosition,
    		workspaceDom,
    		zoomLayerDom,
    		gridSpacing,
    		isPlacing,
    		placingComponent,
    		scale,
    		screenPos,
    		isGrabbing,
    		begGrabPos,
    		endGrabPos,
    		isGateSelected,
    		isGrabbingGate,
    		gateGrabbedId,
    		didGateMove,
    		selectedGatesIds,
    		isSelecting,
    		isSelecting_Draw,
    		canSelect,
    		selectionBegin,
    		selectionEnd,
    		displayTestResults,
    		finalTestResults,
    		finalTestResultsPasses,
    		islessonComplete,
    		externalData,
    		applicationState,
    		mouseDown,
    		mouseUp,
    		mouseMove,
    		keypressing,
    		getWiresById,
    		addGate,
    		removeGates,
    		getComponent,
    		isWire,
    		placingWire,
    		outputCallback,
    		inputCallback,
    		gateSelected,
    		gateGrabbed,
    		gateReleased,
    		checkIfWireIsValid,
    		increaseWidth,
    		decreaseWidth,
    		debugGates,
    		simulatate,
    		loadSetup,
    		selectComponentsInBox,
    		boxPointCollisionCheck,
    		clearSelection,
    		switchState,
    		offset,
    		typeToImg,
    		generateComponentsData,
    		load,
    		save,
    		testLesson,
    		runTest,
    		CompareTests,
    		turnOnOrOffSwitch,
    		checkLight,
    		Test,
    		testLesson10,
    		testLesson11
    	});

    	$$self.$inject_state = $$props => {
    		if ("components" in $$props) $$invalidate(3, components = $$props.components);
    		if ("wires" in $$props) $$invalidate(4, wires = $$props.wires);
    		if ("nextGateID" in $$props) nextGateID = $$props.nextGateID;
    		if ("mousePosition" in $$props) mousePosition = $$props.mousePosition;
    		if ("workspaceDom" in $$props) $$invalidate(5, workspaceDom = $$props.workspaceDom);
    		if ("zoomLayerDom" in $$props) $$invalidate(6, zoomLayerDom = $$props.zoomLayerDom);
    		if ("gridSpacing" in $$props) gridSpacing = $$props.gridSpacing;
    		if ("isPlacing" in $$props) $$invalidate(7, isPlacing = $$props.isPlacing);
    		if ("placingComponent" in $$props) $$invalidate(8, placingComponent = $$props.placingComponent);
    		if ("scale" in $$props) scale = $$props.scale;
    		if ("screenPos" in $$props) screenPos = $$props.screenPos;
    		if ("isGrabbing" in $$props) isGrabbing = $$props.isGrabbing;
    		if ("begGrabPos" in $$props) begGrabPos = $$props.begGrabPos;
    		if ("endGrabPos" in $$props) endGrabPos = $$props.endGrabPos;
    		if ("isGateSelected" in $$props) $$invalidate(18, isGateSelected = $$props.isGateSelected);
    		if ("isGrabbingGate" in $$props) isGrabbingGate = $$props.isGrabbingGate;
    		if ("gateGrabbedId" in $$props) gateGrabbedId = $$props.gateGrabbedId;
    		if ("didGateMove" in $$props) didGateMove = $$props.didGateMove;
    		if ("selectedGatesIds" in $$props) selectedGatesIds = $$props.selectedGatesIds;
    		if ("isSelecting" in $$props) isSelecting = $$props.isSelecting;
    		if ("isSelecting_Draw" in $$props) $$invalidate(9, isSelecting_Draw = $$props.isSelecting_Draw);
    		if ("canSelect" in $$props) canSelect = $$props.canSelect;
    		if ("selectionBegin" in $$props) $$invalidate(10, selectionBegin = $$props.selectionBegin);
    		if ("selectionEnd" in $$props) $$invalidate(11, selectionEnd = $$props.selectionEnd);
    		if ("displayTestResults" in $$props) $$invalidate(12, displayTestResults = $$props.displayTestResults);
    		if ("finalTestResults" in $$props) finalTestResults = $$props.finalTestResults;
    		if ("finalTestResultsPasses" in $$props) $$invalidate(13, finalTestResultsPasses = $$props.finalTestResultsPasses);
    		if ("islessonComplete" in $$props) $$invalidate(14, islessonComplete = $$props.islessonComplete);
    		if ("externalData" in $$props) $$invalidate(27, externalData = $$props.externalData);
    		if ("applicationState" in $$props) $$invalidate(0, applicationState = $$props.applicationState);
    		if ("isWire" in $$props) $$invalidate(15, isWire = $$props.isWire);
    		if ("placingWire" in $$props) $$invalidate(16, placingWire = $$props.placingWire);
    		if ("gateSelected" in $$props) $$invalidate(17, gateSelected = $$props.gateSelected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		applicationState,
    		outputCallback,
    		inputCallback,
    		components,
    		wires,
    		workspaceDom,
    		zoomLayerDom,
    		isPlacing,
    		placingComponent,
    		isSelecting_Draw,
    		selectionBegin,
    		selectionEnd,
    		displayTestResults,
    		finalTestResultsPasses,
    		islessonComplete,
    		isWire,
    		placingWire,
    		gateSelected,
    		isGateSelected,
    		mouseDown,
    		mouseUp,
    		mouseMove,
    		keypressing,
    		gateGrabbed,
    		gateReleased,
    		increaseWidth,
    		decreaseWidth,
    		externalData,
    		addGate,
    		removeGates,
    		debugGates,
    		simulatate,
    		loadSetup,
    		load,
    		save,
    		testLesson,
    		click_handler,
    		click_handler_1,
    		gate_binding,
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
    				externalData: 27,
    				applicationState: 0,
    				addGate: 28,
    				removeGates: 29,
    				outputCallback: 1,
    				inputCallback: 2,
    				debugGates: 30,
    				simulatate: 31,
    				loadSetup: 32,
    				load: 33,
    				save: 34,
    				testLesson: 35
    			},
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*externalData*/ ctx[27] === undefined && !("externalData" in props)) {
    			console_1$2.warn("<Canvas> was created without expected prop 'externalData'");
    		}

    		if (/*applicationState*/ ctx[0] === undefined && !("applicationState" in props)) {
    			console_1$2.warn("<Canvas> was created without expected prop 'applicationState'");
    		}
    	}

    	get externalData() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set externalData(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get applicationState() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set applicationState(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addGate() {
    		return this.$$.ctx[28];
    	}

    	set addGate(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeGates() {
    		return this.$$.ctx[29];
    	}

    	set removeGates(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputCallback() {
    		return this.$$.ctx[1];
    	}

    	set outputCallback(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputCallback() {
    		return this.$$.ctx[2];
    	}

    	set inputCallback(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debugGates() {
    		return this.$$.ctx[30];
    	}

    	set debugGates(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get simulatate() {
    		return this.$$.ctx[31];
    	}

    	set simulatate(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loadSetup() {
    		return loadSetup;
    	}

    	set loadSetup(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get load() {
    		return this.$$.ctx[33];
    	}

    	set load(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get save() {
    		return this.$$.ctx[34];
    	}

    	set save(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get testLesson() {
    		return this.$$.ctx[35];
    	}

    	set testLesson(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\logicSim\logicSim.svelte generated by Svelte v3.35.0 */

    const { console: console_1$1 } = globals;
    const file$4 = "src\\logicSim\\logicSim.svelte";

    // (302:0) {:else}
    function create_else_block$2(ctx) {
    	let iframe;
    	let iframe_src_value;
    	let t0;
    	let button;
    	let h2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			t0 = space();
    			button = element("button");
    			h2 = element("h2");
    			h2.textContent = "Play";
    			attr_dev(iframe, "class", "FULLframe svelte-1caa9te");
    			if (iframe.src !== (iframe_src_value = "./build/lessons/lesson" + /*externalData*/ ctx[1] + "/lesson" + /*externalData*/ ctx[1] + ".html")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "lesson");
    			attr_dev(iframe, "frameborder", "0");
    			set_style(iframe, "overflow", "hidden");
    			set_style(iframe, "display", "block");
    			set_style(iframe, "position", "absolute");
    			set_style(iframe, "height", "100%");
    			set_style(iframe, "width", "100%");
    			add_location(iframe, file$4, 302, 0, 6851);
    			attr_dev(h2, "class", "svelte-1caa9te");
    			add_location(h2, file$4, 306, 1, 7138);
    			attr_dev(button, "class", "playButton svelte-1caa9te");
    			add_location(button, file$4, 305, 0, 7078);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, h2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_12*/ ctx[20], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*externalData*/ 2 && iframe.src !== (iframe_src_value = "./build/lessons/lesson" + /*externalData*/ ctx[1] + "/lesson" + /*externalData*/ ctx[1] + ".html")) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(302:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if !LessonFullScreen}
    function create_if_block$3(ctx) {
    	let div8;
    	let div5;
    	let div3;
    	let div0;
    	let button0;
    	let h20;
    	let t1;
    	let div1;
    	let button1;
    	let h21;
    	let t3;
    	let button2;
    	let h22;
    	let t5;
    	let button3;
    	let h23;
    	let t7;
    	let button4;
    	let h24;
    	let t9;
    	let button5;
    	let h25;
    	let t11;
    	let button6;
    	let h26;
    	let t13;
    	let button7;
    	let h27;
    	let t15;
    	let button8;
    	let h28;
    	let t17;
    	let button9;
    	let h29;
    	let t19;
    	let button10;
    	let h210;
    	let t21;
    	let div2;
    	let button11;
    	let h211;
    	let t23;
    	let div4;
    	let canvas_1;
    	let t24;
    	let div6;
    	let t25;
    	let div7;
    	let iframe;
    	let iframe_src_value;
    	let current;
    	let mounted;
    	let dispose;

    	let canvas_1_props = {
    		externalData: /*externalData*/ ctx[1],
    		applicationState: /*applicationState*/ ctx[0]
    	};

    	canvas_1 = new Canvas({ props: canvas_1_props, $$inline: true });
    	/*canvas_1_binding*/ ctx[19](canvas_1);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			h20 = element("h2");
    			h20.textContent = "Back";
    			t1 = space();
    			div1 = element("div");
    			button1 = element("button");
    			h21 = element("h2");
    			h21.textContent = "AND";
    			t3 = space();
    			button2 = element("button");
    			h22 = element("h2");
    			h22.textContent = "NAND";
    			t5 = space();
    			button3 = element("button");
    			h23 = element("h2");
    			h23.textContent = "OR";
    			t7 = space();
    			button4 = element("button");
    			h24 = element("h2");
    			h24.textContent = "NOR";
    			t9 = space();
    			button5 = element("button");
    			h25 = element("h2");
    			h25.textContent = "XOR";
    			t11 = space();
    			button6 = element("button");
    			h26 = element("h2");
    			h26.textContent = "NOT";
    			t13 = space();
    			button7 = element("button");
    			h27 = element("h2");
    			h27.textContent = "SWITCH";
    			t15 = space();
    			button8 = element("button");
    			h28 = element("h2");
    			h28.textContent = "LIGHT";
    			t17 = space();
    			button9 = element("button");
    			h29 = element("h2");
    			h29.textContent = "LOAD";
    			t19 = space();
    			button10 = element("button");
    			h210 = element("h2");
    			h210.textContent = "SAVE";
    			t21 = space();
    			div2 = element("div");
    			button11 = element("button");
    			h211 = element("h2");
    			h211.textContent = "TEST";
    			t23 = space();
    			div4 = element("div");
    			create_component(canvas_1.$$.fragment);
    			t24 = space();
    			div6 = element("div");
    			t25 = space();
    			div7 = element("div");
    			iframe = element("iframe");
    			attr_dev(h20, "class", "svelte-1caa9te");
    			add_location(h20, file$4, 209, 4, 4226);
    			attr_dev(button0, "class", "backButton svelte-1caa9te");
    			add_location(button0, file$4, 208, 3, 4153);
    			attr_dev(div0, "class", "menuBack svelte-1caa9te");
    			add_location(div0, file$4, 207, 2, 4126);
    			attr_dev(h21, "class", "svelte-1caa9te");
    			add_location(h21, file$4, 215, 4, 4406);
    			attr_dev(button1, "class", "svelte-1caa9te");
    			add_location(button1, file$4, 213, 3, 4295);
    			attr_dev(h22, "class", "svelte-1caa9te");
    			add_location(h22, file$4, 219, 4, 4550);
    			attr_dev(button2, "class", "svelte-1caa9te");
    			add_location(button2, file$4, 217, 3, 4437);
    			attr_dev(h23, "class", "svelte-1caa9te");
    			add_location(h23, file$4, 223, 4, 4691);
    			attr_dev(button3, "class", "svelte-1caa9te");
    			add_location(button3, file$4, 221, 3, 4582);
    			attr_dev(h24, "class", "svelte-1caa9te");
    			add_location(h24, file$4, 227, 4, 4832);
    			attr_dev(button4, "class", "svelte-1caa9te");
    			add_location(button4, file$4, 225, 3, 4721);
    			attr_dev(h25, "class", "svelte-1caa9te");
    			add_location(h25, file$4, 231, 4, 4974);
    			attr_dev(button5, "class", "svelte-1caa9te");
    			add_location(button5, file$4, 229, 3, 4863);
    			attr_dev(h26, "class", "svelte-1caa9te");
    			add_location(h26, file$4, 235, 4, 5116);
    			attr_dev(button6, "class", "svelte-1caa9te");
    			add_location(button6, file$4, 233, 3, 5005);
    			attr_dev(h27, "class", "svelte-1caa9te");
    			add_location(h27, file$4, 240, 4, 5341);
    			attr_dev(button7, "class", "svelte-1caa9te");
    			add_location(button7, file$4, 239, 3, 5285);
    			attr_dev(h28, "class", "svelte-1caa9te");
    			add_location(h28, file$4, 243, 4, 5430);
    			attr_dev(button8, "class", "svelte-1caa9te");
    			add_location(button8, file$4, 242, 3, 5375);
    			attr_dev(h29, "class", "svelte-1caa9te");
    			add_location(h29, file$4, 248, 4, 5512);
    			attr_dev(button9, "class", "svelte-1caa9te");
    			add_location(button9, file$4, 247, 3, 5467);
    			attr_dev(h210, "class", "svelte-1caa9te");
    			add_location(h210, file$4, 251, 4, 5589);
    			attr_dev(button10, "class", "svelte-1caa9te");
    			add_location(button10, file$4, 250, 3, 5544);
    			attr_dev(div1, "class", "menuGates");
    			add_location(div1, file$4, 212, 2, 4267);
    			attr_dev(h211, "class", "svelte-1caa9te");
    			add_location(h211, file$4, 257, 4, 5730);
    			attr_dev(button11, "class", "testButton svelte-1caa9te");
    			add_location(button11, file$4, 256, 3, 5660);
    			attr_dev(div2, "class", "menuTest svelte-1caa9te");
    			add_location(div2, file$4, 255, 2, 5633);
    			attr_dev(div3, "class", "menu svelte-1caa9te");
    			add_location(div3, file$4, 206, 1, 4104);
    			attr_dev(div4, "class", "canvas svelte-1caa9te");
    			add_location(div4, file$4, 285, 1, 6452);
    			attr_dev(div5, "class", "main svelte-1caa9te");
    			add_location(div5, file$4, 205, 0, 4083);
    			attr_dev(div6, "class", "resizer svelte-1caa9te");
    			attr_dev(div6, "id", "dragMe");
    			add_location(div6, file$4, 292, 0, 6613);
    			attr_dev(iframe, "class", "frame svelte-1caa9te");
    			if (iframe.src !== (iframe_src_value = "./build/lessons/lesson" + /*externalData*/ ctx[1] + "/lesson" + /*externalData*/ ctx[1] + ".html")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "lesson");
    			add_location(iframe, file$4, 296, 4, 6705);
    			attr_dev(div7, "class", "right svelte-1caa9te");
    			add_location(div7, file$4, 295, 0, 6680);
    			attr_dev(div8, "class", "split svelte-1caa9te");
    			set_style(div8, "display", "flex");
    			add_location(div8, file$4, 203, 0, 4017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(button0, h20);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, button1);
    			append_dev(button1, h21);
    			append_dev(div1, t3);
    			append_dev(div1, button2);
    			append_dev(button2, h22);
    			append_dev(div1, t5);
    			append_dev(div1, button3);
    			append_dev(button3, h23);
    			append_dev(div1, t7);
    			append_dev(div1, button4);
    			append_dev(button4, h24);
    			append_dev(div1, t9);
    			append_dev(div1, button5);
    			append_dev(button5, h25);
    			append_dev(div1, t11);
    			append_dev(div1, button6);
    			append_dev(button6, h26);
    			append_dev(div1, t13);
    			append_dev(div1, button7);
    			append_dev(button7, h27);
    			append_dev(div1, t15);
    			append_dev(div1, button8);
    			append_dev(button8, h28);
    			append_dev(div1, t17);
    			append_dev(div1, button9);
    			append_dev(button9, h29);
    			append_dev(div1, t19);
    			append_dev(div1, button10);
    			append_dev(button10, h210);
    			append_dev(div3, t21);
    			append_dev(div3, div2);
    			append_dev(div2, button11);
    			append_dev(button11, h211);
    			append_dev(div5, t23);
    			append_dev(div5, div4);
    			mount_component(canvas_1, div4, null);
    			append_dev(div8, t24);
    			append_dev(div8, div6);
    			append_dev(div8, t25);
    			append_dev(div8, div7);
    			append_dev(div7, iframe);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[9], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[10], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[11], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[12], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[13], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[14], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[15], false, false, false),
    					listen_dev(button9, "click", /*click_handler_9*/ ctx[16], false, false, false),
    					listen_dev(button10, "click", /*click_handler_10*/ ctx[17], false, false, false),
    					listen_dev(button11, "click", /*click_handler_11*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const canvas_1_changes = {};
    			if (dirty & /*externalData*/ 2) canvas_1_changes.externalData = /*externalData*/ ctx[1];
    			if (dirty & /*applicationState*/ 1) canvas_1_changes.applicationState = /*applicationState*/ ctx[0];
    			canvas_1.$set(canvas_1_changes);

    			if (!current || dirty & /*externalData*/ 2 && iframe.src !== (iframe_src_value = "./build/lessons/lesson" + /*externalData*/ ctx[1] + "/lesson" + /*externalData*/ ctx[1] + ".html")) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
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
    			if (detaching) detach_dev(div8);
    			/*canvas_1_binding*/ ctx[19](null);
    			destroy_component(canvas_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(202:0) {#if !LessonFullScreen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*LessonFullScreen*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				} else {
    					if_block.p(ctx, dirty);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleClick() {
    	alert("pressed");
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LogicSim", slots, []);
    	let canvas;
    	let LessonFullScreen = true;
    	let { applicationState } = $$props;
    	let { externalData } = $$props;
    	let { inProgress } = $$props;

    	onMount(async () => {
    		
    	}); //document.addEventListener('contextmenu', event => event.preventDefault());
    	// Query the element
    	// const resizer = document.getElementById('dragMe');
    	// const leftSide = resizer.previousElementSibling;

    	function returnToLessonSelect() {
    		//Save the lesson
    		//Return to lesson select
    		applicationState(0, 0);
    	}

    	function playButton() {
    		//Remove full screen
    		$$invalidate(3, LessonFullScreen = false);

    		//Tell the server that the lesson is started
    		fetch("http://localhost:8080/updateLessonStatus", {
    			headers: { "content-type": "application/json" },
    			method: "POST",
    			body: JSON.stringify({
    				lessonID: externalData,
    				status: "Progress"
    			})
    		}).then(res => {
    			console.log("Request complete! response:", res);
    		});
    	} // .catch(err => {
    	//     alert("Network Error, returning to main site");

    	const writable_props = ["applicationState", "externalData", "inProgress"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<LogicSim> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => returnToLessonSelect();
    	const click_handler_1 = () => canvas.addGate("AND");
    	const click_handler_2 = () => canvas.addGate("NAND");
    	const click_handler_3 = () => canvas.addGate("OR");
    	const click_handler_4 = () => canvas.addGate("NOR");
    	const click_handler_5 = () => canvas.addGate("XOR");
    	const click_handler_6 = () => canvas.addGate("NOT");
    	const click_handler_7 = () => canvas.addGate("Switch");
    	const click_handler_8 = () => canvas.addGate("Light");
    	const click_handler_9 = () => canvas.load();
    	const click_handler_10 = () => canvas.save();
    	const click_handler_11 = () => canvas.testLesson();

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(2, canvas);
    		});
    	}

    	const click_handler_12 = () => playButton();

    	$$self.$$set = $$props => {
    		if ("applicationState" in $$props) $$invalidate(0, applicationState = $$props.applicationState);
    		if ("externalData" in $$props) $$invalidate(1, externalData = $$props.externalData);
    		if ("inProgress" in $$props) $$invalidate(6, inProgress = $$props.inProgress);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Canvas,
    		canvas,
    		LessonFullScreen,
    		applicationState,
    		externalData,
    		inProgress,
    		handleClick,
    		returnToLessonSelect,
    		playButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(2, canvas = $$props.canvas);
    		if ("LessonFullScreen" in $$props) $$invalidate(3, LessonFullScreen = $$props.LessonFullScreen);
    		if ("applicationState" in $$props) $$invalidate(0, applicationState = $$props.applicationState);
    		if ("externalData" in $$props) $$invalidate(1, externalData = $$props.externalData);
    		if ("inProgress" in $$props) $$invalidate(6, inProgress = $$props.inProgress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		applicationState,
    		externalData,
    		canvas,
    		LessonFullScreen,
    		returnToLessonSelect,
    		playButton,
    		inProgress,
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
    		canvas_1_binding,
    		click_handler_12
    	];
    }

    class LogicSim extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			applicationState: 0,
    			externalData: 1,
    			inProgress: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LogicSim",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*applicationState*/ ctx[0] === undefined && !("applicationState" in props)) {
    			console_1$1.warn("<LogicSim> was created without expected prop 'applicationState'");
    		}

    		if (/*externalData*/ ctx[1] === undefined && !("externalData" in props)) {
    			console_1$1.warn("<LogicSim> was created without expected prop 'externalData'");
    		}

    		if (/*inProgress*/ ctx[6] === undefined && !("inProgress" in props)) {
    			console_1$1.warn("<LogicSim> was created without expected prop 'inProgress'");
    		}
    	}

    	get applicationState() {
    		throw new Error("<LogicSim>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set applicationState(value) {
    		throw new Error("<LogicSim>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get externalData() {
    		throw new Error("<LogicSim>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set externalData(value) {
    		throw new Error("<LogicSim>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inProgress() {
    		throw new Error("<LogicSim>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inProgress(value) {
    		throw new Error("<LogicSim>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ChapterPage\header.svelte generated by Svelte v3.35.0 */
    const file$3 = "src\\ChapterPage\\header.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;
    	let t1;
    	let t2;
    	let div1;
    	let form;
    	let button;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*userName*/ ctx[0]);
    			t2 = space();
    			div1 = element("div");
    			form = element("form");
    			button = element("button");
    			button.textContent = "Logout";
    			attr_dev(img, "class", "picture svelte-hfucbs");
    			attr_dev(img, "alt", "Profile");
    			if (img.src !== (img_src_value = "build/prof_icon_fix.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$3, 70, 8, 1501);
    			attr_dev(p, "class", "name svelte-hfucbs");
    			add_location(p, file$3, 71, 8, 1576);
    			attr_dev(div0, "class", "profile svelte-hfucbs");
    			add_location(div0, file$3, 69, 4, 1470);
    			attr_dev(button, "class", "logout_button svelte-hfucbs");
    			add_location(button, file$3, 75, 12, 1691);
    			attr_dev(form, "action", "/logout");
    			attr_dev(form, "class", "svelte-hfucbs");
    			add_location(form, file$3, 74, 8, 1654);
    			attr_dev(div1, "class", "logout svelte-hfucbs");
    			add_location(div1, file$3, 73, 4, 1624);
    			attr_dev(div2, "class", "main svelte-hfucbs");
    			add_location(div2, file$3, 68, 0, 1446);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, form);
    			append_dev(form, button);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userName*/ 1) set_data_dev(t1, /*userName*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	validate_slots("Header", slots, []);

    	onMount(async () => {
    		
    	}); //document.addEventListener('contextmenu', event => event.preventDefault());    

    	let { userName } = $$props;
    	const writable_props = ["userName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("userName" in $$props) $$invalidate(0, userName = $$props.userName);
    	};

    	$$self.$capture_state = () => ({ onMount, userName });

    	$$self.$inject_state = $$props => {
    		if ("userName" in $$props) $$invalidate(0, userName = $$props.userName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userName];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { userName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*userName*/ ctx[0] === undefined && !("userName" in props)) {
    			console.warn("<Header> was created without expected prop 'userName'");
    		}
    	}

    	get userName() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ChapterPage\card.svelte generated by Svelte v3.35.0 */
    const file$2 = "src\\ChapterPage\\card.svelte";

    // (87:12) {:else}
    function create_else_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "no_check svelte-2firc5");
    			if (img.src !== (img_src_value = "build/red_x.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "no_check");
    			add_location(img, file$2, 87, 16, 2303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(87:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (85:62) 
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "middle_check svelte-2firc5");
    			if (img.src !== (img_src_value = "build/orange_middle.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "in_progress");
    			add_location(img, file$2, 85, 16, 2190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(85:62) ",
    		ctx
    	});

    	return block;
    }

    // (81:12) {#if checkForLesson(cardInfo.lessonID) === 2}
    function create_if_block$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "check svelte-2firc5");
    			if (img.src !== (img_src_value = "build/green_check.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "check");
    			add_location(img, file$2, 82, 16, 2006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(81:12) {#if checkForLesson(cardInfo.lessonID) === 2}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let h4;
    	let b;
    	let t0_value = /*cardInfo*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let show_if;
    	let show_if_1;
    	let t2;
    	let br;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*cardInfo*/ 1) show_if = !!(/*checkForLesson*/ ctx[2](/*cardInfo*/ ctx[0].lessonID) === 2);
    		if (show_if) return create_if_block$2;
    		if (show_if_1 == null || dirty & /*cardInfo*/ 1) show_if_1 = !!(/*checkForLesson*/ ctx[2](/*cardInfo*/ ctx[0].lessonID) === 1);
    		if (show_if_1) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			b = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			br = element("br");
    			add_location(b, file$2, 78, 16, 1713);
    			attr_dev(h4, "class", "svelte-2firc5");
    			add_location(h4, file$2, 78, 12, 1709);
    			add_location(br, file$2, 90, 12, 2439);
    			attr_dev(div0, "class", "container svelte-2firc5");
    			add_location(div0, file$2, 77, 8, 1672);
    			attr_dev(div1, "class", "slide-fwd-center");
    			add_location(div1, file$2, 76, 4, 1632);
    			attr_dev(div2, "class", "card svelte-2firc5");
    			add_location(div2, file$2, 75, 0, 1570);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(h4, b);
    			append_dev(b, t0);
    			append_dev(div0, t1);
    			if_block.m(div0, null);
    			append_dev(div0, t2);
    			append_dev(div0, br);

    			if (!mounted) {
    				dispose = listen_dev(
    					div2,
    					"click",
    					function () {
    						if (is_function(/*pressed*/ ctx[1](/*cardInfo*/ ctx[0].lessonID))) /*pressed*/ ctx[1](/*cardInfo*/ ctx[0].lessonID).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*cardInfo*/ 1 && t0_value !== (t0_value = /*cardInfo*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx, dirty))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, t2);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
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
    	validate_slots("Card", slots, []);

    	onMount(async () => {
    		
    	});

    	const checkForLesson = lessonID => {
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

    	let { cardInfo } = $$props;
    	let { lessons } = $$props;
    	let { pressed } = $$props;
    	const writable_props = ["cardInfo", "lessons", "pressed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("cardInfo" in $$props) $$invalidate(0, cardInfo = $$props.cardInfo);
    		if ("lessons" in $$props) $$invalidate(3, lessons = $$props.lessons);
    		if ("pressed" in $$props) $$invalidate(1, pressed = $$props.pressed);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		checkForLesson,
    		cardInfo,
    		lessons,
    		pressed
    	});

    	$$self.$inject_state = $$props => {
    		if ("cardInfo" in $$props) $$invalidate(0, cardInfo = $$props.cardInfo);
    		if ("lessons" in $$props) $$invalidate(3, lessons = $$props.lessons);
    		if ("pressed" in $$props) $$invalidate(1, pressed = $$props.pressed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cardInfo, pressed, checkForLesson, lessons];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { cardInfo: 0, lessons: 3, pressed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cardInfo*/ ctx[0] === undefined && !("cardInfo" in props)) {
    			console.warn("<Card> was created without expected prop 'cardInfo'");
    		}

    		if (/*lessons*/ ctx[3] === undefined && !("lessons" in props)) {
    			console.warn("<Card> was created without expected prop 'lessons'");
    		}

    		if (/*pressed*/ ctx[1] === undefined && !("pressed" in props)) {
    			console.warn("<Card> was created without expected prop 'pressed'");
    		}
    	}

    	get cardInfo() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardInfo(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lessons() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lessons(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pressed() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pressed(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ChapterPage\title.svelte generated by Svelte v3.35.0 */
    const file$1 = "src\\ChapterPage\\title.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h1;
    	let t_value = /*titleInfo*/ ctx[0].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t = text(t_value);
    			attr_dev(h1, "class", "svelte-qlrsv4");
    			add_location(h1, file$1, 21, 4, 354);
    			attr_dev(div, "class", "title svelte-qlrsv4");
    			add_location(div, file$1, 20, 0, 329);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*titleInfo*/ 1 && t_value !== (t_value = /*titleInfo*/ ctx[0].name + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots("Title", slots, []);

    	onMount(async () => {
    		
    	}); //document.addEventListener('contextmenu', event => event.preventDefault());       

    	let { titleInfo } = $$props;
    	const writable_props = ["titleInfo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("titleInfo" in $$props) $$invalidate(0, titleInfo = $$props.titleInfo);
    	};

    	$$self.$capture_state = () => ({ onMount, titleInfo });

    	$$self.$inject_state = $$props => {
    		if ("titleInfo" in $$props) $$invalidate(0, titleInfo = $$props.titleInfo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [titleInfo];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { titleInfo: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*titleInfo*/ ctx[0] === undefined && !("titleInfo" in props)) {
    			console.warn("<Title> was created without expected prop 'titleInfo'");
    		}
    	}

    	get titleInfo() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titleInfo(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ChapterPage\chapter.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file = "src\\ChapterPage\\chapter.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (97:0) {#if userData}
    function create_if_block$1(ctx) {
    	let div;
    	let header;
    	let t;
    	let current;

    	header = new Header({
    			props: { userName: /*userData*/ ctx[0].username },
    			$$inline: true
    		});

    	let if_block = /*userData*/ ctx[0] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "main svelte-g6bswr");
    			add_location(div, file, 97, 0, 2661);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const header_changes = {};
    			if (dirty & /*userData*/ 1) header_changes.userName = /*userData*/ ctx[0].username;
    			header.$set(header_changes);

    			if (/*userData*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*userData*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(97:0) {#if userData}",
    		ctx
    	});

    	return block;
    }

    // (100:4) {#if userData}
    function create_if_block_1(ctx) {
    	let div;
    	let current;
    	let each_value = /*titles*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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

    			attr_dev(div, "class", "chapters svelte-g6bswr");
    			add_location(div, file, 100, 8, 2761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*titles, userData, lesssonSelectionCallback*/ 7) {
    				each_value = /*titles*/ ctx[1];
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(100:4) {#if userData}",
    		ctx
    	});

    	return block;
    }

    // (105:20) {#each title.lessons as card, k}
    function create_each_block_1(ctx) {
    	let tile;
    	let current;

    	tile = new Card({
    			props: {
    				cardInfo: /*card*/ ctx[8],
    				lessons: /*userData*/ ctx[0].lessonStatus,
    				pressed: /*lesssonSelectionCallback*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tile, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tile_changes = {};
    			if (dirty & /*userData*/ 1) tile_changes.lessons = /*userData*/ ctx[0].lessonStatus;
    			tile.$set(tile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(105:20) {#each title.lessons as card, k}",
    		ctx
    	});

    	return block;
    }

    // (102:12) {#each titles as title, i}
    function create_each_block(ctx) {
    	let title;
    	let t0;
    	let div;
    	let t1;
    	let current;

    	title = new Title({
    			props: { titleInfo: /*title*/ ctx[5] },
    			$$inline: true
    		});

    	let each_value_1 = /*title*/ ctx[5].lessons;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr_dev(div, "class", "lessons svelte-g6bswr");
    			add_location(div, file, 103, 16, 2892);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*titles, userData, lesssonSelectionCallback*/ 7) {
    				each_value_1 = /*title*/ ctx[5].lessons;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(102:12) {#each titles as title, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*userData*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*userData*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*userData*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots("Chapter", slots, []);
    	let { applicationState } = $$props;
    	let { externalData } = $$props;
    	var userData;

    	onMount(async () => {
    		fetch("http://localhost:8080/userInfo").then(r => {
    			console.log(r);

    			r.json().then(res => {
    				console.log(res);
    				$$invalidate(0, userData = res);
    			});
    		}).catch(err => {
    			alert("Network Error, returning to main site");
    			window.location.replace("https://learnlogic.today");
    		});
    	});

    	let titles = [
    		{
    			name: "Chapter 1 - Basic Gates",
    			lessons: [
    				{ name: "NAND Gate", lessonID: 10 },
    				{ name: "AND Gate", lessonID: 11 },
    				{ name: "OR Gate", lessonID: 12 },
    				{ name: "NOR Gate", lessonID: 13 },
    				{ name: "XOR Gate", lessonID: 14 },
    				{ name: "NOT Gate", lessonID: 15 }
    			]
    		},
    		{
    			name: "Chapter 2 - Basic Circuits",
    			lessons: [{ name: "SR-Latch", lessonID: 16 }, { name: "D-Latch", lessonID: 17 }]
    		}
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

    	const writable_props = ["applicationState", "externalData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Chapter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("applicationState" in $$props) $$invalidate(3, applicationState = $$props.applicationState);
    		if ("externalData" in $$props) $$invalidate(4, externalData = $$props.externalData);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Header,
    		Tile: Card,
    		Title,
    		applicationState,
    		externalData,
    		userData,
    		titles,
    		lesssonSelectionCallback
    	});

    	$$self.$inject_state = $$props => {
    		if ("applicationState" in $$props) $$invalidate(3, applicationState = $$props.applicationState);
    		if ("externalData" in $$props) $$invalidate(4, externalData = $$props.externalData);
    		if ("userData" in $$props) $$invalidate(0, userData = $$props.userData);
    		if ("titles" in $$props) $$invalidate(1, titles = $$props.titles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userData, titles, lesssonSelectionCallback, applicationState, externalData];
    }

    class Chapter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { applicationState: 3, externalData: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chapter",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*applicationState*/ ctx[3] === undefined && !("applicationState" in props)) {
    			console_1.warn("<Chapter> was created without expected prop 'applicationState'");
    		}

    		if (/*externalData*/ ctx[4] === undefined && !("externalData" in props)) {
    			console_1.warn("<Chapter> was created without expected prop 'externalData'");
    		}
    	}

    	get applicationState() {
    		throw new Error("<Chapter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set applicationState(value) {
    		throw new Error("<Chapter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get externalData() {
    		throw new Error("<Chapter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set externalData(value) {
    		throw new Error("<Chapter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.35.0 */

    // (26:0) {:else}
    function create_else_block(ctx) {
    	let logicsim;
    	let current;

    	logicsim = new LogicSim({
    			props: {
    				applicationState: /*appState*/ ctx[3],
    				externalData: /*data*/ ctx[1],
    				inProgress: /*Progress*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(logicsim.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(logicsim, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const logicsim_changes = {};
    			if (dirty & /*data*/ 2) logicsim_changes.externalData = /*data*/ ctx[1];
    			if (dirty & /*Progress*/ 4) logicsim_changes.inProgress = /*Progress*/ ctx[2];
    			logicsim.$set(logicsim_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logicsim.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logicsim.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logicsim, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(26:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:0) {#if state === 0 }
    function create_if_block(ctx) {
    	let chapter;
    	let current;

    	chapter = new Chapter({
    			props: {
    				applicationState: /*appState*/ ctx[3],
    				externalData: /*data*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(chapter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(chapter, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const chapter_changes = {};
    			if (dirty & /*data*/ 2) chapter_changes.externalData = /*data*/ ctx[1];
    			chapter.$set(chapter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chapter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chapter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(chapter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(24:0) {#if state === 0 }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				} else {
    					if_block.p(ctx, dirty);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	function appState(NewState, NewData, inProgress) {
    		$$invalidate(0, state = NewState);
    		$$invalidate(1, data = NewData);
    		$$invalidate(2, Progress = inProgress);
    	}

    	var state = 0;
    	var data;
    	var Progress = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		LogicSim,
    		Chapter,
    		appState,
    		state,
    		data,
    		Progress
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("Progress" in $$props) $$invalidate(2, Progress = $$props.Progress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [state, data, Progress, appState];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
