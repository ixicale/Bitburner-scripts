import { HOME, SERV_PREFIX } from './utils.js';

const CUSTOM_PHRASE = false;

/**
 * Function to find server target from HOME
 * @param {NS} ns The Netscript package
 * @param {string} target hostname
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
	// returns empty if target is not found
	if (!server_list.includes(target)) return [];

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

/**
 * @param {NS} ns
 * @param {string} target, server hostname
 * @param {number} custom_text, default 0
 * @example ```ps
 * 	> run looking-server.js
 * 	> run looking-server.js "n00dles"
 * 	> run looking-server.js "n00dles" 0
 * 	> run looking-server.js "n00dles" 1
 *  ```
 * @returns {void} null
 * */
export async function main(ns, target = ns.args[0] || 'n00dles', custom_text = ns.args[1] || 0) {
	ns.disableLog('ALL'); // disable all NS function logs
	var path = looking_for_server(ns, target);
	var ident = null;
	if (CUSTOM_PHRASE || custom_text) {
		if (!isNaN(custom_text)) custom_text = 'connect';
		path = path.map((s) => `${custom_text} ` + s);
		ident = 2;
	}

	ns.tprint(JSON.stringify(path, null, ident));
}
