import { get_server_details, multiscan, HOME } from './utils.js';

// * get_server_details	- - - - - - -	 2.75 GB
// * multiscan         	- - - - - - -	 0.60 GB
//                     	- - - - - - -
// * ns.print          	- - - - - - -	 0.00 GB
// * ns.tail           	- - - - - - -	 0.00 GB
// * ns.sleep          	- - - - - - -	 0.00 GB
// * ns.write          	- - - - - - -	 0.00 GB
// * ns.disableLog     	- - - - - - -	 0.00 GB
// * ns.getHackingLevel	- - - - - - -	 0.05 GB
// * ns.isRunning      	- - - - - - -	 0.10 GB
// * ns.getScriptRam   	- - - - - - -	 0.10 GB
// * ns.growthAnalyze  	- - - - - - -	 1.00 GB
// * ns.weakenAnalyze  	- - - - - - -	 1.00 GB
// * ns.hackAnalyze    	- - - - - - -	 1.00 GB
// * ns.exec           	- - - - - - -	 1.30 GB

const VIRUS = '.money.js';
const DEBUG = true; // enables prints and log file's append
const LOG_FILE = VIRUS + '.logger.txt';
const EXCLUDE_HOME = true; // exclude home server to deploy tasks
const DELAY = 50; // sequence delay bewteen tasks
const TICK = 1000; // Accord documentation, is better use between 20-200 as lower tick

/** @param {NS} ns */
async function logger(ns, log_type = 'info', ...content) {
	if (!DEBUG) return;
	if (log_type) log_type += ':::';
	const msg = `${log_type.toUpperCase()}${content.join(' ')}`;
	ns.print(msg);
	await ns.write(LOG_FILE, `\n${msg}`, 'a');
}

/** @param {NS} ns */
function servers_to_use(ns, sort_key, asc) {
	// all servers
	const SERVERS = multiscan(ns).filter((x) => !EXCLUDE_HOME || !x.includes(HOME));
	// add server details by hostname, home has 50% limit of ram available
	var ram_available_servers = SERVERS.map((host) => get_server_details(ns, host)).map((itm) => {
		if (itm.hostname !== HOME) return itm;
		const max_available = Math.floor(itm.ram_max * 0.5);
		return {
			...itm,
			ram_available: Math.min(max_available, itm.ram_available),
		};
	});
	// Sort by key, It does not sort when key is null or unavailable on object
	const SORT_ASC = (a, b) => (a[sort_key] > b[sort_key] ? 1 : -1);
	const SORT_DESC = (a, b) => (a[sort_key] > b[sort_key] ? -1 : 1);
	ram_available_servers = ram_available_servers.sort(asc ? SORT_ASC : SORT_DESC);

	return ram_available_servers;
}

function delay_sequence(SERVER) {
	const { time_g, time_h, time_w, trigger_allocation_sequence } = SERVER;
	var timing = { grow: time_g, hack: time_h, weaken: time_w };

	// take base delay
	const base_time = trigger_allocation_sequence.map((_, i) => i + DELAY * i);
	// calc delay - hack time
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

/** @param {NS} ns */
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
		total: req_thread_grow + req_thread_weaken + req_thread_hack,
	};
}

/** @param {NS} ns */
async function do_task(ns, task, to_server, pid) {
	const { action, delay, hostname, threads } = task;
	var icon = action == 'hack' ? '💵' : action == 'grow' ? '🌱' : action == 'weaken' ? '🩸' : '';
	var type = action == 'hack' ? 'warn' : 'info';
	await logger(
		ns,
		type,
		`${hostname} ${icon} -> ${to_server} (threads: ${threads}, delay: ${delay}, pid:${pid}).`
	);
	return ns.exec(VIRUS, hostname, threads, to_server, action, delay, pid);
}

/** @param {NS} ns */
export async function main(ns, sort_key = ns.args[0] || 'revenue_yield', asc = ns.args[1] || 0) {
	ns.disableLog('ALL'); // disable all NS function logs
	ns.tail(); // popup script logs
	let numOr0 = (n) => (isNaN(n) ? 0 : n);
	var target_count = 0;
	let available_threads = 0;
	let target_thread_needed = {};
	let serv_to_deploy,
		target_settings,
		serv_sorted_by_ram = [];
	const VIRUS_RAM = ns.getScriptRam(VIRUS);

	while (true) {
		await ns.sleep(TICK);
		if (target_count % 400 === 0) {
			// reset logger file
			await ns.write(LOG_FILE, `STARTING SCRIPT`, 'w');
			await logger(ns, '', 'target_count', target_count);
		}
		// servers to be targets, sorted as param 'sort_key'
		serv_to_deploy = servers_to_use(ns, sort_key, asc);
		// servers to do tasks, sorted DESC by ram_available
		serv_sorted_by_ram = serv_to_deploy
			.filter(({ ram_available }) => Math.floor(ram_available / VIRUS_RAM) > 1)
			.sort((a, b) => (a.ram_available > b.ram_available ? -1 : 1));
		// sum all servers ram
		available_threads = serv_sorted_by_ram
			.map(({ ram_available }) => Math.floor(ram_available / VIRUS_RAM))
			.reduce((a, b) => numOr0(a) + numOr0(b), 0);
		for (const TARGET of serv_to_deploy) {
			if (TARGET.max_money < 1) continue; // skips darkweb, own servs, etc
			target_settings = delay_sequence(TARGET);
			target_thread_needed = portion_threads(
				max_threads_required(ns, TARGET),
				target_settings,
				available_threads
			);

			var worked = [];
			for (const { action, delay } of target_settings) {
				var used_threads = 0;
				const max_action_thread = target_thread_needed[action];
				let pid = 0;
				for (const { ram_available, hostname } of serv_sorted_by_ram) {
					// if target no needs more threads, done
					if (used_threads >= max_action_thread) break;
					// skips assigned
					if (worked.includes(hostname)) continue;
					worked.push(hostname);
					var max_threads = Math.floor(ram_available / VIRUS_RAM);

					var current_threads = used_threads + max_threads;
					var threads = max_threads;
					if (current_threads > max_action_thread) {
						threads = max_action_thread - used_threads; // set left threads
					}
					used_threads += threads;

					var task = {
						hostname: hostname,
						action,
						delay,
						threads,
						max_action_thread,
						current_threads,
					};
					await do_task(ns, task, TARGET.hostname, target_count + pid + pid * target_count);
					++pid;
				}
			}
			++target_count;
		}
	}
}
