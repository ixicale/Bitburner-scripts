export const SERV_PREFIX = "dmn.s-"
export const HOME = "home"

/**
 * Script to penetrate a server 
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	get_root_access(ns, "n00dles");
 *  ```
 * @returns {void} null
 **/
export function get_root_access(ns, server) {
	ns.print(`Penetrating ${server}`);

	if (ns.hasRootAccess(server)) return;
	var i = 0; // crack counter
	if (ns.fileExists('BruteSSH.exe')) ns.brutessh(server) && ++i;
	if (ns.fileExists('FTPCrack.exe')) ns.ftpcrack(server) && ++i;
	if (ns.fileExists('relaySMTP.exe')) ns.relaysmtp(server) && ++i;
	if (ns.fileExists('HTTPWorm.exe')) ns.httpworm(server) && ++i;
	if (ns.fileExists('SQLInject.exe')) ns.sqlinject(server) && ++i;
	
	var ports_reqs = ns.getServerNumPortsRequired(server);
	if (ports_reqs <= i) ns.nuke(server);
	else ns.tprint(`Server '${server}' has ${ports_reqs} ports to open, but we opened ${i}`);
}


/**
 * Function to list path to any server 
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	multiscan(ns, "n00dles");
 * 	multiscan(ns, "home");
 *  ```
 * @returns {string[]} serverList
 * @description
 * ```
 * Recursive function to find all available servers
 * ```
 **/
export function multiscan(ns, server = HOME) {
	let serverList = [];
	function scanning(hostname) {
		let currentScan = ns.scan(hostname);
		currentScan.forEach(child => {
			if (!serverList.includes(child)) {
				serverList.push(child);
				scanning(child);
			}
		})
	}
	scanning(server);
	return serverList;
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