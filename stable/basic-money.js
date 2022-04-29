/** 
 * Script to get money from a server into infinite loop
 * @param {NS} ns The Netscript package
 * @param {string} target server to attack, default `'n00dles'`
 * 
 * */
 export async function main(ns, target = ns.args[0]) {
	var sec_thresh = ns.getServerMinSecurityLevel(target) + 5;
	var money_thresh = ns.getServerMaxMoney(target) * 0.75;

	while (true) {
		if (ns.getServerSecurityLevel(target) > sec_thresh) {
			await ns.weaken(target);
		} else if (ns.getServerSecurityLevel(target) > money_thresh) {
			await ns.grow(target);
		} else {
			await ns.hack(target);
		}
	}

}