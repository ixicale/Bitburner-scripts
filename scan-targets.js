import { SERV_PREFIX, HOME, multiscan, get_server_details } from './utils.js';

/**
 * Script to get all servers in the network sorted by some property
 * @param {NS} ns
 * @param {string} sort_key, key to sort servers by, options are property keys of 'get_server_details' function results
 * @param {number} asc, default 0
 * @example ```ps
 * 	> run scan-targets.js
 * 	> run scan-targets.js "current_money"
 * 	> run scan-targets.js "current_money" 0
 * 	> run scan-targets.js "current_money" 1
 * 	> alias sort="run scan-targets.js"
 * 	> sort "current_money"
 *  ```
 * @returns {void} null
 * */
export async function main(ns, sort_key = ns.args[0], asc = ns.args[1] || 0) {
	// get server names but own servers
	var all_servers = multiscan(ns)
		.filter((x) => !x.includes(SERV_PREFIX) && !x.includes(HOME));
	var server_detail = [];
	for (const hostname of all_servers)
		server_detail.push({
			...get_server_details(ns, hostname),
			trigger_allocation_sequence: '[...]', // overwrite this property
		});

	// sort servers by sort_key and asc
	const SORT_ASC = (a, b) => (a[sort_key] > b[sort_key] ? 1 : -1);
	const SORT_DESC = (a, b) => (a[sort_key] > b[sort_key] ? -1 : 1);
	server_detail = server_detail.sort(asc ? SORT_ASC : SORT_DESC);
	const result = JSON.stringify(server_detail, null, 2);
	ns.alert(result);
}
