export const SERV_PREFIX = 'dmn.s-';
export const HOME = 'home';

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

	let n_crack = 0; // crack counter
	if (ns.fileExists('BruteSSH.exe')) ns.brutessh(server) && ++n_crack;
	if (ns.fileExists('FTPCrack.exe')) ns.ftpcrack(server) && ++n_crack;
	if (ns.fileExists('relaySMTP.exe')) ns.relaysmtp(server) && ++n_crack;
	if (ns.fileExists('HTTPWorm.exe')) ns.httpworm(server) && ++n_crack;
	if (ns.fileExists('SQLInject.exe')) ns.sqlinject(server) && ++n_crack;

	const ports_reqs = ns.getServerNumPortsRequired(server);
	const success = ports_reqs <= n_crack;
	if (success) {
		ns.print(`Successfully penetrated ${server}`);
		ns.nuke(server);
	}

	return success;
}

/**
 * Function to list path to any server. Recursive function to find all available servers
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```js
 * 	multiscan(ns);
 * 	multiscan(ns, "n00dles");
 * 	multiscan(ns, "home");
 *  ```
 * @returns {string[]} serverList
 **/
export function multiscan(ns, server = HOME) {
	let server_list = [];
	function scanning(ns, hostname) {
		let current_scan = ns.scan(hostname);
		current_scan.forEach((child) => {
			if (!server_list.includes(child)) {
				server_list.push(child);
				scanning(ns, child);
			}
		});
	}
	scanning(ns, server);
	server_list = server_list.filter((v) => get_root_access(ns, v));
	return server_list;
}

/**
 * Function to get details of any server
 * @param {NS} ns The Netscript package
 * @param {string} server Server to get details
 * @example ```js
 * 	get_server_details(ns, "n00dles");
 * 	get_server_details(ns, "home");
 *  ```
 * @returns {object} server_details
 **/
export function get_server_details(ns, hostname = HOME) {
	var current_money = ns.getServerMoneyAvailable(hostname);
	var current_security = ns.getServerSecurityLevel(hostname);
	var has_root = ns.hasRootAccess(hostname);
	var max_money = ns.getServerMaxMoney(hostname);
	var min_security = ns.getServerMinSecurityLevel(hostname);
	var ram_current = ns.getServerUsedRam(hostname);
	var ram_max = ns.getServerMaxRam(hostname);
	var required_hack_level = ns.getServerRequiredHackingLevel(hostname);
	var required_ports = ns.getServerNumPortsRequired(hostname);
	var time_g = ns.getGrowTime(hostname);
	var time_h = ns.getHackTime(hostname);
	var time_w = ns.getWeakenTime(hostname);

	var hack_chance = ns.hackAnalyzeChance(hostname);
	var money_thresh = max_money * 0.75;
	var security_thresh = min_security + 5;
	var revenue_yield = max_money * hack_chance;
	var ram_available = ram_max - ram_current;

	var trigger_allocation_action = 'nibble';
	var trigger_allocation_sequence = [
		{ action: 'hack', allocation: 0.25 },
		{ action: 'weaken', allocation: 0.25 },
		{ action: 'grow', allocation: 0.25 },
		{ action: 'weaken', allocation: 0.25 },
	];

	if (current_security > security_thresh) {
		trigger_allocation_action = 'rust';
		trigger_allocation_sequence = [
			{ action: 'grow', allocation: 0.3 },
			{ action: 'weaken', allocation: 0.7 },
		];
	} else if (current_money < money_thresh) {
		trigger_allocation_action = 'train';
		trigger_allocation_sequence = [
			{ action: 'grow', allocation: 0.6 },
			{ action: 'weaken', allocation: 0.4 },
		];
	}

	const server_details = {
		hostname,
		current_money,
		current_security,
		hack_chance,
		has_root,
		max_money,
		min_security,
		money_thresh,
		ram_available,
		ram_current,
		ram_max,
		required_hack_level,
		required_ports,
		revenue_yield,
		security_thresh,
		time_g,
		time_h,
		time_w,
		trigger_allocation_action,
		trigger_allocation_sequence,
	};
	return server_details;
}

/**
 * Script iterate an infinity loop using
 * @param {NS} ns The Netscript package
 * @param {function} callback no return, if returns 'true', iteration ends
 * @param {number} sleep_millis time to wait each iteration
 * @example ```js
 * 	infinite_loop(ns, async ()=>{your code here}));
 * 	infinite_loop(ns, async ()=>{your code here}, 200));
 *  ```
 **/
export async function infinite_loop(ns, callback = async () => null, sleep_millis = 200) {
	const t_sleep = isNaN(sleep_millis) ? 0: sleep_millis
	while (true) {
		if (await callback()) break;
		await ns.sleep(Math.max(t_sleep, 200));
	}
}