import { HOME, multiscan } from './utils.js';


const VIRUS = ".money.js"
const DAEMON = "daemon.js"

/**
 * Script to weaken a server
 * @param {NS} ns The Netscript package
 * @param {string} target hostname to attack
 * @example ```ps
 * 	> run daemon-deploy.js "n00dles"
 *  ```
 * @returns {void} null
 **/
export async function main(ns, target = ns.args[0] || 'n00dles') {
	while (true) {
		ns.toast(`${ns.getScriptName()}: Deploy new deamons to ${target}`, "info", 3000)
		var server_list = multiscan(ns, HOME).filter(i => i != HOME)
		ns.tprint(server_list)
		// kill all deamons
		if (ns.scriptRunning(DAEMON, HOME)) ns.scriptKill(DAEMON, HOME);
		await ns.sleep(10000)

		for (const server of server_list) {
			// kill all active script from server
			if (ns.scriptRunning(VIRUS, server)) ns.scriptKill(VIRUS, server);
			await ns.sleep(500)

			// restart deamon to deploy new virus
			ns.exec(DAEMON, HOME, 1, target, server);
		}
		await ns.sleep(1800 * 1000) //30 min = 1800 sec = 1800000 millis
	}
}