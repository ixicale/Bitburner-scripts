import { HOME, SERV_PREFIX, copy_virus } from './utils.js';

const VIRUS = '.money.js';
const DAEMON = 'daemon.js';
/** @param {NS} ns */
async function autoUpgradeServers(ns, target, pRam, maxServers) {
	for (let i = 0; i < maxServers; i++) {
		var server = SERV_PREFIX + i;
		await waitForMoney(ns, pRam);
		if (ns.serverExists(server)) {
			ns.print(`Upgrading server ${server} to ${pRam} GB'`);
			await upgradeServer(ns, server, pRam);
		} else {
			ns.print(`Purchasing server ${server} at ${pRam} GB'`);
			await purchaseServer(ns, server, pRam);
		}
		if (!ns.isRunning(DAEMON, HOME, target, server)) ns.exec(DAEMON, HOME, 1, target, server);
	}
}

async function upgradeServer(ns, server, pRam) {
	var sRam = ns.getServerMaxRam(server);
	if (sRam < pRam) {
		// needs to stop scripts before delete
		if (ns.scriptRunning(VIRUS, server)) ns.scriptKill(VIRUS, server);
		ns.deleteServer(server);
		ns.purchaseServer(server, pRam);
	}
	await copy_virus(ns, VIRUS, server);
}

async function purchaseServer(ns, server, pRam) {
	ns.purchaseServer(server, pRam);
	await copy_virus(ns, VIRUS, server);
}

/**
 * loop 10s until player has enough money
 * @param {NS} ns
 * @param {number} pRam
 */
async function waitForMoney(ns, pRam) {
	while (ns.getServerMoneyAvailable(HOME) < ns.getPurchasedServerCost(pRam)) await ns.sleep(10000);
}

/**
 * Script to weaken a server
 * @param {NS} ns The Netscript package
 * @param {string} target hostname to attack
 * @example ```ps
 * 	> run .weaken.js "n00dles"
 *  ```
 * @returns {void} null
 **/
export async function main(ns, target = ns.args[0] || 'n00dles', pRam = ns.args[1] || 8) {
	var maxRam = ns.getPurchasedServerMaxRam();
	var maxServers = ns.getPurchasedServerLimit();

	while (true) {
		await autoUpgradeServers(ns, target, pRam, maxServers);
		if (pRam === maxRam) {
			break;
		}
		// move up to next tier
		var newRam = pRam * 2;
		if (newRam > maxRam) {
			pRam = maxRam;
		} else {
			pRam = newRam;
		}
	}
}