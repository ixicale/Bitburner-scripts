import { infinite_loop, multiscan, HOME } from './utils.js';

/**
 * Script to run '.basic.money.js' at "home" server to get money from a all servers in the network
 * @param {NS} ns The Netscript package
 * @example ```ps
 * 	> run ad-basic-money.js
 *  ```
 * @returns {void} null
 **/
export async function main(ns) {
	ns.disableLog('ALL');
	const VIRUS = '.basic-money.js';
	await infinite_loop(
		ns,
		async () => {
			const server_to_attemps = multiscan(ns); //.map(h => get_server_details(ns, h))
			ns.scriptKill(VIRUS, HOME);
			for (const hostname of server_to_attemps) {
				if (ns.getServerMaxMoney(hostname) < 1) continue; // no money, skips
				if (ns.getServerRequiredHackingLevel(hostname) > ns.getHackingLevel()) continue; // skips servers with higher required hack level

				var ram_current = ns.getServerUsedRam(HOME);
				var ram_max = ns.getServerMaxRam(HOME);
				var ram_available = ram_max - ram_current; // calculate by iteration
				var script_ram = ns.getScriptRam(VIRUS);
				if (ram_available <= script_ram) break; // out of ram, done

				if (!ns.isRunning(VIRUS, HOME, hostname)) {
					ns.exec(VIRUS, HOME, 1, hostname);
					ns.print(JSON.stringify({ VIRUS, HOME, hostname }));
				}
			}
		},
		3600000
	);
}
