/**
 * Script to penetrate a server 
 * @param {NS} ns The Netscript package
 * @param {string} server hostname
 * @example ```ps
 * 	> run nuke.js "n00dles"
 *  ```
 * @returns {void} null
 **/
 export async function main(ns, server = ns.args[0]) {
	ns.print(`Penetrating ${server}`);
	await ns.sleep(1000);

	if (ns.hasRootAccess(server)) return;
	var i = 0; // crack counter
	if (ns.fileExists('BruteSSH.exe')) ns.brutessh(server) && ++i;
	if (ns.fileExists('FTPCrack.exe')) ns.ftpcrack(server) && ++i;
	if (ns.fileExists('relaySMTP.exe')) ns.relaysmtp(server) && ++i;
	if (ns.fileExists('HTTPWorm.exe')) ns.httpworm(server) && ++i;
	if (ns.fileExists('SQLInject.exe')) ns.sqlinject(server) && ++i;

	var ports_reqs = ns.getServerNumPortsRequired(server)
	if (ports_reqs <= i) ns.nuke(server);
	else ns.tprint(`${ns.getScriptName()}: Server '${server}' has ${ports_reqs} ports to open and we opened ${i}`);
}