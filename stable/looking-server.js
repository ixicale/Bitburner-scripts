import { HOME, SERV_PREFIX } from './utils.js';

const CUSTOM_PHRASE = false;

/**
 * Function to find server target from HOME
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	multiscan(ns, "n00dles");
 * 	multiscan(ns, "home");
 *  ```
 * @returns {string[]} serverList
 **/
export function looking_for_server(ns, target = '') {
	let server_list = []; // to validate
	let stack = [];
	var path = []; // result
	function scanning(ns, parent) {
		for (const child of ns.scan(parent)) {
			if (!server_list.includes(child) && !child.includes(SERV_PREFIX)) {
				server_list.push(child);
				stack.push({ parent, child });
				scanning(ns, child);
			}
		}
	}
	scanning(ns, HOME);

	// make object like {parent:child}
	var node = stack.reduce((acc, node) => {
		acc[node.child] = node.parent;
		return acc;
	});

	var current = target;
	while (current !== HOME) {
		path.push(current);
		var parent = node[current];
		if (!parent) break;
		current = parent;
	}

	return path.reverse();
}

/** @param {NS} ns **/
export async function main(ns, target = ns.args[0] || 'n00dles') {
	ns.disableLog('ALL'); // disable all NS function logs
	var path = looking_for_server(ns, target);
	var ident = null;
	if (CUSTOM_PHRASE) {
		path = path.map((s) => 'connect ' + s);
		ident = 2;
	}

	ns.tprint(JSON.stringify(path, null, ident));
}
