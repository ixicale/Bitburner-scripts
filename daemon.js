/**
 * Script to tracking a server to deploy grow, weaken and hack scripts
 * @param {NS} ns The Netscript package
 * @param {string} target hostname to attack
 * @param {number} origin_ server wheres the scripts are deployed, default {target}
 * @example ```ps
 * 	> run deamon.js "n00dles" "pserv-0"
 * 	> run deamon.js "n00dles" "n00dles"
 * 	> run deamon.js "n00dles"           # script deploys over the target
 *  ```
 * @returns {void} null
 **/
 export async function main(ns, target = ns.args[0], origin_ = ns.args[1] || target) {
	// For single argument calls - server will hack itself
	var file = ".money.js"
	const HOME_ = "home"

	var script_ram = ns.getScriptRam(file);
	var server_max_money = ns.getServerMaxMoney(target);
	var server_max_ram = ns.getServerMaxRam(origin_);;
	var money_thresh = server_max_money * 0.9; // 0.90 to maintain near 100% server money.  You can use 0.75 when starting out/using low thread counts
	var security_thresh = ns.getServerMinSecurityLevel(target) + 5;
	var current_server_money, current_server_security;
	var use_threads_hack, use_threads_weaken1, use_threads_weaken2, use_threads_grow, possible_threads;
	var max_hack_factor = 0.01;
	var grow_weaken_ratio = 0.9; // How many threads are used for growing vs. weaking (90:10).
	var sleep_time, sleep_time_hack, sleep_time_grow, sleep_time_weaken;
	var sleep_delay = 200; // Sleep delay should range between 20ms and 200ms as per the documentation. I'll keep the default at 200, adjust as needed. 
	var i, batches, batch_size;

	// while script is running, wait 10 sec to prevent the script crash after re-open the game
	while (ns.isRunning(file, origin_, target)) await ns.sleep(10000)

	// penetrate server to hack
	ns.exec('nuke.js', HOME_, 1, target);

	// Use max of 4 batches up to 4 TB server size. Min batch_size is 256 GB.
	if (server_max_ram < 4096) {
		batch_size = Math.max(server_max_ram / 4, 256);
	} else {
		batch_size = 512;
	}
	// copy and override all files
	await ns.scp(file, HOME_, origin_);

	// truly code - will terminate if no RAM available
	while (3 < (possible_threads = Math.floor((server_max_ram - ns.getServerUsedRam(origin_)) / script_ram))) {
		current_server_security = ns.getServerSecurityLevel(target);
		current_server_money = ns.getServerMoneyAvailable(target);
		sleep_time_hack = ns.getHackTime(target);
		sleep_time_grow = ns.getGrowTime(target);
		sleep_time_weaken = ns.getWeakenTime(target);
		// The first to cases are for new servers with high SECURITY LEVELS and to quickly grow the server to above the threshold
		if (current_server_security > security_thresh) {
			ns.exec(file, origin_, Math.ceil(possible_threads / 2), target, "grow", 0);
			ns.exec(file, origin_, Math.floor(possible_threads / 2), target, "weaken", 0);
			await ns.sleep(sleep_time_weaken + sleep_delay); // wait for the weaken command to finish
		} else if (current_server_money < money_thresh) {
			ns.exec(file, origin_, Math.floor(possible_threads * grow_weaken_ratio), target, "grow", 0);
			ns.exec(file, origin_, Math.ceil(possible_threads * (1 - grow_weaken_ratio)), target, "weaken", 0);
			await ns.sleep(sleep_time_weaken + sleep_delay); // wait for the weaken command to finish
		} else {
			// Define max amount that can be restored with one grow and therefore will be used to define hack threads.
			// The max grow threads are considering the weaken threads needed to weaken hack security and the weaken threads needed to weaken grow security.
			// I didn't bother optimizing the 'grow_weaken_ratio' further, as 90% is good enough already. It will be just a few more hack threads, if any at all - even with large RAM sizes.
			batches = Math.max(Math.floor((sleep_time_hack) / (3 * sleep_delay)), 1); // This way at least 1 batch will run
			batches = Math.min(batches, Math.ceil(server_max_ram / batch_size)); // Use just as many batches as batch_size allows
			possible_threads = Math.floor(possible_threads / batches);
			while (max_hack_factor < 0.999 &&
				Math.floor((possible_threads - (use_threads_hack = Math.max(Math.floor(ns.hackAnalyzeThreads(target, current_server_money * max_hack_factor)), 1)) - Math.ceil(use_threads_hack / 25)) * grow_weaken_ratio)
				> Math.ceil(ns.growthAnalyze(target, server_max_money / (server_max_money * (1 - max_hack_factor))))) {
				max_hack_factor += 0.001; // increase by 0.1% with each iteration
			}
			max_hack_factor -= 0.001; // Since it's more than 'possible_threads' can handle now, we need to dial it back once.
			use_threads_weaken1 = Math.ceil(use_threads_hack / 25); // You can weaken the security of 25 hack threads with 1 weaken thread
			use_threads_grow = Math.floor((possible_threads - use_threads_weaken1 - use_threads_hack) * grow_weaken_ratio);
			use_threads_weaken2 = possible_threads - use_threads_hack - use_threads_grow - use_threads_weaken1;
			if (use_threads_weaken2 > 0)
				for (i = 0; i < batches; i++) {
					ns.exec(file, origin_, use_threads_weaken1, target, "weaken", 0, 0 + 2 * i);
					sleep_time = 2 * sleep_delay;
					ns.exec(file, origin_, use_threads_weaken2, target, "weaken", sleep_time, 1 + 2 * i);
					// Second weaken script runs after the first
					sleep_time = sleep_time_weaken - sleep_time_grow + sleep_delay;
					// Grow script ends before second weaken script
					ns.exec(file, origin_, use_threads_grow, target, "grow", sleep_time, i);
					sleep_time = sleep_time_weaken - sleep_time_hack - sleep_delay;
					// Hack script ends before first weaken script
					ns.exec(file, origin_, use_threads_hack, target, "hack", sleep_time, i);
					await ns.sleep(3 * sleep_delay);
				}
			await ns.sleep(sleep_time_weaken);
			max_hack_factor = 0.01;
		}
	}
	ns.tprint(`Script was terminated. Not enough RAM available on ${origin_} .`)
}