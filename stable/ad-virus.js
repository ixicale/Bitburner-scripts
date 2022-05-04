import { get_server_details, multiscan, HOME } from './utils.js';

/* 
## RAM Usage


RAM    | SOURCE
--     | --
1.60GB | baseCost (misc)
1.30GB | ns.exec (fn)
1.00GB | ns.growthAnalyze (fn)
1.00GB | ns.weakenAnalyze (fn)
1.00GB | ns.hackAnalyze (fn)
0.60GB | ns.scp (fn)
0.10GB | ns.getScriptRam (fn)
0.15GB | ns.grow (fn) // maybe some bug? i dont use it (.-.)
0.15GB | ns.weaken (fn) // maybe some bug? i dont use it (.-.)
0.10GB | ns.hack (fn) // maybe some bug? i dont use it (.-.)
0.10GB | ns.getServerMoneyAvailable (fn):::(get_server_details)
1.00GB | ns.hackAnalyzeChance (fn):::(get_server_details)
0.10GB | ns.getServerSecurityLevel (fn):::(get_server_details)
0.10GB | ns.getServerMaxMoney (fn):::(get_server_details)
0.10GB | ns.getServerMinSecurityLevel (fn):::(get_server_details)
0.10GB | ns.getServerRequiredHackingLevel (fn):::(get_server_details)
0.10GB | ns.getServerNumPortsRequired (fn):::(get_server_details)
0.50GB | ns.hasRootAccess (fn):::(get_server_details)
0.50GB | ns.getServerUsedRam (fn):::(get_server_details)
0.50GB | ns.getServerMaxRam (fn):::(get_server_details)
0.50GB | ns.getGrowTime (fn):::(get_server_details)
0.50GB | ns.getHackTime (fn):::(get_server_details)
0.50GB | ns.getWeakenTime (fn):::(get_server_details)
0.20GB | ns.scan (fn):::(multiscan)
0.50GB | ns.getHackingLevel (fn):::(multiscan.get_root_access)
0.10GB | ns.fileExists (fn):::(multiscan.get_root_access)
0.50GB | ns.brutessh (fn):::(multiscan.get_root_access)
0.50GB | ns.ftpcrack (fn):::(multiscan.get_root_access)
0.50GB | ns.relaysmtp (fn):::(multiscan.get_root_access)
0.50GB | ns.httpworm (fn):::(multiscan.get_root_access)
0.50GB | ns.sqlinject (fn):::(multiscan.get_root_access)
0.50GB | ns.nuke (fn):::(multiscan.get_root_access)
*/

// Default settings
const VIRUS = '.virus.js';
const EXCLUDE_HOME = true; // exclude home server to deploy viruss
const DELAY = 50; // sequence delay bewteen viruss
const TICK = 1000; // Accord documentation, is better use between 20-200 as lower tick

/**
 * Function to print message
 * @param {NS} ns The NetScript object
 * @param {string} log_type The type of log to print
 * @param  {...any} content List of content to print
 * @returns null
 */
function logger(ns, log_type = 'info', ...content) {
	if (log_type) log_type = log_type.padEnd(7, ':');
	const msg = `${log_type.toUpperCase()}${content.join(' ')}`;
	ns.print(msg);
}

/**
 * Function to get all available servers
 * @param {NS} ns The NetScript object
 * @param {string} sort_key The key to sort servers by
 * @param {bool} asc Sort ascending or descending
 * @returns List of servers available to deploy viruss sorted by params
 */
async function servers_to_use(ns, sort_key, asc) {
	// all servers
	const SERVERS = multiscan(ns).filter((x) => !EXCLUDE_HOME || !x.includes(HOME));

	// copy virus servers
	for (const hostname of SERVERS) if (hostname !== HOME) await ns.scp(VIRUS, hostname);
	// add server details by hostname.
	var ram_available_servers = SERVERS.map((host) => get_server_details(ns, host));
	// Sort by key, It does not sort when key is null or unavailable on object
	const SORT_ASC = (a, b) => (a[sort_key] > b[sort_key] ? 1 : -1);
	const SORT_DESC = (a, b) => (a[sort_key] > b[sort_key] ? -1 : 1);
	ram_available_servers = ram_available_servers.sort(asc ? SORT_ASC : SORT_DESC);

	return ram_available_servers;
}

/**
 * Function to calculate the time to complete each virus
 * @param {object} SERVER the server info
 * @returns list of viruss to do with delay
 */
function delay_sequence(SERVER) {
	const { time_g, time_h, time_w, trigger_allocation_sequence } = SERVER;
	var timing = { grow: time_g, hack: time_h, weaken: time_w };

	// take base delay
	const base_time = trigger_allocation_sequence.map((_, i) => i + DELAY * i);
	// calc delay - action time
	const batch = trigger_allocation_sequence.map((v, i) => base_time[i] - timing[v.action]);
	// get min from last list results as the begins to execute all
	const starter_runtime = Math.min(...batch);
	// prepare sequence to start at same time
	const delay_seq = trigger_allocation_sequence.map((v, i) => ({
		...v,
		delay: Math.abs(starter_runtime - batch[i]),
	}));

	return delay_seq;
}

/**
 * Function to get max virus by server
 * @param {NS} ns the NetScript object
 * @param {object} SERVER the server object from get_server_details
 * @returns {object} the max threads to use for each action
 */
function max_threads_required(ns, SERVER) {
	const { hostname, current_money, security_thresh, money_thresh } = SERVER;

	// calc grow's threads
	var g_thread = 0;
	if (current_money < 1) ++g_thread; //set at least 1 when no money
	else {
		var n_grows = money_thresh / current_money;
		if (n_grows >= 1) {
			g_thread = Math.round(ns.growthAnalyze(hostname, n_grows));
		}
	}
	// calc weaken's threads
	var w_effect = ns.weakenAnalyze(1);
	var w_thread = w_effect > 0 ? Math.round(security_thresh / w_effect) : 0;

	// calc hack's threads
	var h_effect = ns.hackAnalyze(hostname);
	var h_taken = h_effect * current_money;
	var h_thread = Math.round(money_thresh / h_taken);

	// sometimes returns Infinity, so set defaults
	if (isNaN(g_thread)) g_thread = 1;
	if (isNaN(w_thread)) w_thread = 0;
	if (isNaN(h_thread)) h_thread = 0;

	return {
		grow: g_thread,
		weaken: w_thread,
		hack: h_thread,
		total: g_thread + w_thread + h_thread,
	};
}

/**
 * Function to get allocating viruss
 * @param {object} required_thread the object with the required threads
 * @param {object} target_settings the object with the target settings
 * @param {number} available_threads the number of available threads
 * @returns {object} the object with the allocated threads
 */
function portion_threads(required_thread, target_settings, available_threads) {
	var req_thread_grow = required_thread.grow;
	var req_thread_weaken = required_thread.weaken;
	var req_thread_hack = required_thread.hack;
	// calculate by portion. Check function 'get_server_details' for detailed 'allocation' values
	if (required_thread.total > available_threads)
		for (const { action, allocation } of target_settings)
			if (action === 'grow') req_thread_grow = Math.floor(available_threads * allocation);
			else if (action === 'weaken') req_thread_weaken = Math.floor(available_threads * allocation);
			else if (action === 'hack') req_thread_hack = Math.floor(available_threads * allocation);
	return {
		grow: req_thread_grow,
		weaken: req_thread_weaken,
		hack: req_thread_hack,
	};
}

/**
 * Function to do the allocation viruss and print the results
 * @param {NS} ns the NetScript object
 * @param {Object} virus the virus object from calc of server
 * @param {string} to_server the server to attack
 * @param {number} pid the pid of the virus (retry counter)
 * @returns {number} the pid of the script. 0 if failed
 */
function exec_virus(ns, virus, to_server, pid) {
	const { action, delay, hostname, threads } = virus;
	var icon = action == 'hack' ? '💵' : action == 'grow' ? '🌱' : action == 'weaken' ? '🩸' : '';
	var type = action == 'hack' ? 'warn' : 'info';
	const _pid = ns.exec(VIRUS, hostname, threads, to_server, action, delay, pid);
	const h = hostname.padEnd(20, ' ');
	const h2 = to_server.padEnd(20, ' ');
	if (_pid) {
		logger(ns, type, `${h} ${icon}->${h2} (Th: ${threads}, Dl: ${delay}, pid:${pid}).`);
	}
	return _pid;
}

/**
 * Script to auto-deploy virus to all servers in the network
 * @param {NS} ns The Netscript package
 * @param {string} sort_key The key to sort servers by, default is 'revenue_yield' (keys from 'get_server_details' object returned)
 * @param {string} asc Sort ascending or descending, default is descending (0)
 * @example ```ps
 * 	> run ad-money.js
 * 	> run ad-money.js "revenue_yield"
 * 	> run ad-money.js "revenue_yield" 0
 * 	> run ad-money.js "revenue_yield" false
 * 	> run ad-money.js "revenue_yield" 1
 * 	> run ad-money.js "revenue_yield" true
 *  ```
 * @returns {void} null
 **/
export async function main(ns, sort_key = ns.args[0] || 'revenue_yield', asc = ns.args[1] || 0) {
	ns.disableLog('ALL'); // disable all NS function logs
	let numOr0 = (n) => (isNaN(n) ? 0 : n);
	// set default values by type
	let available_threads = 0,
		used_threads = 0,
		max_threads = 0,
		current_threads = 0,
		threads = 0,
		retry = 0,
		target_thread_needed = {},
		virus = {},
		serv_to_deploy = [],
		target_settings = [],
		serv_sorted_by_ram = [];

	const VIRUS_RAM = ns.getScriptRam(VIRUS);

	while (true) {
		await ns.sleep(TICK);
		// servers to be targets, sorted as param 'sort_key'
		serv_to_deploy = await servers_to_use(ns, sort_key, asc);
		// servers to do viruss, sorted DESC by ram_available. Skip servers with less than 2 thread available
		serv_sorted_by_ram = serv_to_deploy
			.filter(({ ram_available }) => numOr0(Math.floor(ram_available / VIRUS_RAM)) > 1)
			.sort((a, b) => (a.ram_available > b.ram_available ? -1 : 1));
		// sum max threads of servers to deploy
		available_threads = serv_sorted_by_ram
			.map(({ ram_available }) => Math.floor(ram_available / VIRUS_RAM))
			.reduce((a, b) => numOr0(a) + numOr0(b), 0);

		for (const TARGET of serv_to_deploy) {
			if (TARGET.max_money < 1) continue; // skips darkweb, own servs, etc
			// calculate sequence of viruss to do
			target_settings = delay_sequence(TARGET);
			// calculate max threads needed to deploy
			target_thread_needed = portion_threads(
				max_threads_required(ns, TARGET),
				target_settings,
				available_threads
			);

			for (const { action, delay } of target_settings) {
				used_threads = 0; // reset used threads for each virus
				const max_action_thread = target_thread_needed[action];
				for (const { hostname } of serv_sorted_by_ram) {
					const { ram_available } = get_server_details(ns, hostname);
					// if target no needs more threads, done
					if (used_threads >= max_action_thread) break;
					// skip servers with less required ram
					if (ram_available < VIRUS_RAM) {
						// remove from list
						serv_sorted_by_ram = serv_sorted_by_ram.filter((i) => i.hostname !== hostname);
						continue;
					}
					// calculate max threads available for this server
					max_threads = Math.floor(ram_available / VIRUS_RAM);

					current_threads = used_threads + max_threads;
					threads = max_threads; // max threads to use
					if (current_threads > max_action_thread) threads = max_action_thread - used_threads; // set left threads
					used_threads += threads; // append used threads

					// set virus to execute
					virus = {
						hostname,
						action,
						delay,
						threads,
					};

					retry = 0;
					// Try to exec virus until success
					while (exec_virus(ns, virus, TARGET.hostname, retry) === 0) ++retry;
				}
			}
		}
	}
}
