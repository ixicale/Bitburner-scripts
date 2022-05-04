import { HOME, SERV_PREFIX } from './utils.js';

/**
 * Function to find server target from HOME
 * @param {NS} ns The Netscript package
 * @param {string} target hostname
 * @example ```js
 * 	looking_for_server(ns, "n00dles");
 * 	looking_for_server(ns, "home");
 *  ```
 * @returns {string[]} serverList
 **/
export function looking_for_server(ns, target = '') {
	let server_list = []; // aux to validate
	let stack = [];
	var path = []; // result
	// recursive function to find server
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

	// find path until HOME (target->HOME)
	var current = target;
	while (current !== HOME) {
		path.push(current);
		var parent = node[current];
		if (!parent) break;
		current = parent;
	}

	// reverse path (HOME->target)
	return path.reverse();
}

/**
 * Function to find server from HOME
 * @param {NS} ns The Netscript package
 * @param {string} target, server hostname
 * @param {number} custom_text, default 0
 * @example ```ps
 * 	> run looking-server.js
 * 	> run looking-server.js "n00dles"
 * 	> alias whereis="run looking-server.js"
 * 	> whereis "n00dles"
 *  ```
 * @returns {void} null
 * */
export async function main(ns, target = ns.args[0] || 'n00dles') {
	ns.disableLog('ALL'); // disable all NS function logs
	var path = looking_for_server(ns, target);
	if (path) ns.tprint(path.map((s) => 'connect ' + s).join('; '));
}
