import { HOME, SERV_PREFIX } from './utils.js';

const VIRUS = '.money.js';
const DELAY = 10000;

/** @param {NS} ns */
async function auto_upgrade_servers(ns, ram_to_purchase, max_servers) {
	ns.print(' ----------------------------- ');
	ns.print(`Ram to purchase: ${ram_to_purchase} on ${max_servers} servers`);
	for (let i = 0; i < max_servers; i++) {
		var server = SERV_PREFIX + i;
		await wait_for_money(ns, ram_to_purchase);
		if (ns.serverExists(server)) upgrade_server(ns, server, ram_to_purchase);
		else purchase_server(ns, server, ram_to_purchase);
	}
}

function upgrade_server(ns, server, ram_to_purchase) {
	const current_ram = ns.getServerMaxRam(server);
	if (current_ram < ram_to_purchase) {
		ns.print(`WARN Upgrading server ${server} to ${ram_to_purchase} GB'`);
		// needs to stop scripts before delete
		if (ns.scriptRunning(VIRUS, server)) ns.scriptKill(VIRUS, server);
		ns.deleteServer(server);
		ns.purchaseServer(server, ram_to_purchase);
	}
}

function purchase_server(ns, server, ram_to_purchase) {
	ns.print(`INFO Purchasing server ${server} at ${ram_to_purchase} GB'`);
	ns.purchaseServer(server, ram_to_purchase);
}

/**
 * loop until player has enough money
 * @param {NS} ns
 * @param {number} ram_to_purchase
 */
async function wait_for_money(ns, ram_to_purchase) {
	while (ns.getServerMoneyAvailable(HOME) < ns.getPurchasedServerCost(ram_to_purchase))
		await ns.sleep(DELAY);
}

/**
 * Script to weaken a server
 * @param {NS} ns The Netscript package
 * @param {string} target hostname to attack
 * @example ```ps
 * 	> run auto-purchase-servers.js
 * 	> run auto-purchase-servers.js 8
 *  ```
 * @returns {void} null
 **/
export async function main(ns, ram_to_purchase = ns.args[1] || 8) {
	ns.disableLog('ALL'); // disable all NS function logs
	var max_ram = ns.getPurchasedServerMaxRam();
	var max_servers = ns.getPurchasedServerLimit();

	while (true) {
		await auto_upgrade_servers(ns, ram_to_purchase, max_servers);
		// move up to next tier
		ram_to_purchase = ram_to_purchase * 2;
		if (ram_to_purchase > max_ram) break;
	}
}
