/**
 * Script to run auto-deployment scripts.
 * @param {NS} ns
 * @example ```ps
 * 	> run i-robot.js
 *  ```
 * @returns {void} null
 * **/
export async function main(ns) {
	ns.disableLog('ALL');
	const HOME = 'home';
	var local_scripts = [
		'.basic-money.js',
		'ap-servers.js',
		'ad-virus.js',
		'ap-hacknets.js',
		'ad-basic-money.js',
	];
	// wait for home server to be ready
	while (ns.isRunning('download.js', HOME)) await ns.sleep(1000);
	// run scripts
	for (const sc of local_scripts)
		if (!ns.fileExists(sc, HOME)) continue;
		else {
			// kill current script
			if (ns.isRunning(sc, HOME)) ns.scriptKill(sc, HOME);
			// if enough ram available, run script
			if (ns.getScriptRam(sc) < ns.getServerMaxRam(HOME) - ns.getServerUsedRam(HOME)) ns.exec(sc, HOME);
		}
}
