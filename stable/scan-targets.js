import { SERV_PREFIX, HOME, multiscan, get_server_details } from './utils.js'

/** 
 * @param {NS} ns 
 * @param {string} sort_key, key to order host list
 * @param {number} asc, default 0
 * @example ```ps
 * 	> run scan-targets.js "current_money"
 *  ```
 * @returns {void} null
 * */
export async function main(ns, sort_key = ns.args[0], asc = ns.args[1] || 0) {
	var all_servers = multiscan(ns)
	const SORT_ASC = (a, b) => a[sort_key] > b[sort_key] ? 1 : -1
	const SORT_DESC = (a, b) => a[sort_key] > b[sort_key] ? -1 : 1

	all_servers = all_servers.filter(x => !x.includes(SERV_PREFIX) && !x.includes(HOME))
	var server_detail = []
	for (const hostname of all_servers)
		server_detail.push(get_server_details(ns, hostname))

	server_detail = server_detail.sort(asc ? SORT_ASC : SORT_DESC)
	var str = JSON.stringify(server_detail, null, 2); // spacing level = 2
	ns.alert(str)
}