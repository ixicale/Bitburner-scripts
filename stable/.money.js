/**
 * Script to get monay from a server
 * @param {NS} ns The Netscript package
 * @param {string} target server to attack, default `'n00dles'`
 * @param {string} action proccees to do, defaults `'weaken'`, options `[ 'weaken' | 'grow' | 'hack' ]`
 * @param {number} delay millis of sleep on threads, defaults `0`
 * @param {number} pid proccess ID, defaults `0`
 * @example ```ps
 * 	> run .money.js "n00dles"
 * 	> run .money.js "n00dles" "hack"
 * 	> run .money.js "n00dles" "grow" 0 
 * 	> run .money.js "n00dles" "weaken" 0 0
 *  ```
 * @returns {void} null
 **/
export async function main(
	ns,
	target = ns.args[0] || 'n00dles',
	action = ns.args[1] || 'weaken',
	delay = ns.args[2] || 0,
	pid = ns.args[3] || 0
) {
	ns.print(pid);
	await ns.sleep(delay);

	if (action === 'weaken') await ns.weaken(target);
	else if (action === 'grow') await ns.grow(target);
	else await ns.hack(target);
}