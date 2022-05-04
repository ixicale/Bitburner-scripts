const REPO = 'https://raw.githubusercontent.com/ixicale/Bitburner-scripts/main/stable';
const HOME = 'home';
/**
 * Script for downloading scripts by curl on home server.
 * @param {NS} ns
 * @example ```ps
 * 	> run download.js
 *  ```
 * @returns {void} null
 * **/
export async function main(ns) {
	ns.disableLog('ALL'); // disable all NS function logs
	const automates_to_exec = [
		'.basic-money.js',
		'ad-basic-money.js', // requires '.basic-money.js'
		'ad-virus.js', // requires '.virus.js'
		'ap-servers.js', // auto [buy|upgrade] servers
		'ap-hacknets.js', // auto [buy|upgrade] hacknets
	];
	const custom_design = ['cd-overview.js'];
	var list_of_scripts = [
		...new Set([// unique items
			'download.js',
			...automates_to_exec,
			...custom_design,
			'.virus.js',
			'looking-server.js',
			'scan-targets.js',
			'utils.js',
			'i-robot.js',
		]),
	].sort();
	const script = 'i-robot.js'
	if (ns.fileExists(script, HOME)) {
		let retry = 0
		while (ns.exec(script, HOME, retry) === 0) ++retry;
		ns.tprint(`Running ${script} (tried ${retry} times)`);
	}
	for (const script_name of list_of_scripts) {
		var script_path = `${REPO}/${script_name}`;
		ns.tprint(`Downloading ${script_name}`);
		await ns.wget(script_path, script_name, HOME);
	}
}
