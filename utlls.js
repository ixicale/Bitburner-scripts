export const SERV_PREFIX = "dmn.s-"
export const HOME = "home"

/**
 * Script to penetrate a server 
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	get_root_access(ns, "n00dles");
 *  ```
 * @returns {boolean} success
 **/
export function get_root_access(ns, server) {
	if (ns.hasRootAccess(server)) return true;
	
	ns.print(`Penetrating ${server}`);
	var i = 0; // crack counter
	if (ns.fileExists('BruteSSH.exe')) ns.brutessh(server) && ++i;
	if (ns.fileExists('FTPCrack.exe')) ns.ftpcrack(server) && ++i;
	if (ns.fileExists('relaySMTP.exe')) ns.relaysmtp(server) && ++i;
	if (ns.fileExists('HTTPWorm.exe')) ns.httpworm(server) && ++i;
	if (ns.fileExists('SQLInject.exe')) ns.sqlinject(server) && ++i;

	var ports_reqs = ns.getServerNumPortsRequired(server);
	const success = ports_reqs <= i
	if (success) ns.nuke(server);
	else ns.tprint(`Server '${server}' has ${ports_reqs} ports to open, but we opened ${i}`);
	return success
}


/**
 * Function to list path to any server. Recursive function to find all available servers
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	multiscan(ns, "n00dles");
 * 	multiscan(ns, "home");
 *  ```
 * @returns {string[]} serverList
 **/
export function multiscan(ns, server = HOME) {
	let server_list = [];
	function scanning(ns, hostname) {
		let current_scan = ns.scan(hostname);
		current_scan.forEach(child => {
			if (!server_list.includes(child)) {
				server_list.push(child);
				scanning(ns, child);
			}
		})
	}
	scanning(ns, server);
	server_list = server_list.filter(v=>get_root_access(ns, v))
	return server_list;
}
/**
 * Fuction to copy a script
 * @param {NS} ns 
 * @param {string} virus script file
 * @param {string} server hostname
 */
export async function copy_virus(ns, virus, server) {
	ns.print(`Copying ${virus} to server: ${server}`);
	await ns.scp(virus, server);
}

/**
 * Function to get details of any server 
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	get_server_details(ns, "n00dles");
 * 	get_server_details(ns, "home");
 *  ```
 * @returns {object} server_details
 **/
export function get_server_details(ns, hostname = HOME) {
	var current_money = ns.getServerMoneyAvailable(hostname);
	var has_root = ns.hasRootAccess(hostname);
	var max_money = ns.getServerMaxMoney(hostname);
	var max_ram = ns.getServerMaxRam(hostname);
	var min_security = ns.getServerMinSecurityLevel(hostname);
	var money_thresh = max_money * 0.75;
	var required_hack_level = ns.getServerRequiredHackingLevel(hostname);
	var required_ports = ns.getServerNumPortsRequired(hostname);
	var security = ns.getServerSecurityLevel(hostname);
	var security_thresh = min_security + 5;

	var hack_chance = ns.hackAnalyzeChance(hostname)
	var rev_yield = max_money * hack_chance;

	const server_details = {
		hostname,
		current_money,
		hack_chance,
		has_root,
		max_money,
		max_ram,
		min_security,
		money_thresh,
		required_hack_level,
		required_ports,
		rev_yield,
		security_thresh,
		security,
	};
	return server_details;
}