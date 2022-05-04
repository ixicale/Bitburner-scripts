import { HOME } from './utils.js';
const DELAY = 1000;

/**
 * Script to auto-purchase [upgrade|create] hacknet servers
 * @param {NS} ns The Netscript package
 * @example ```ps
 * 	> run ap-hacknets.js
 *  ```
 * @returns {void} null
 **/
export async function main(ns) {
	ns.disableLog('ALL');
	const wait_money = async (need) => {
		while (ns.getServerMoneyAvailable(HOME) < need) await ns.sleep(DELAY * 5);
	};

	function get_node_detail(id) {
		const stats = ns.hacknet.getNodeStats(id);
		const cores_cost = ns.hacknet.getCoreUpgradeCost(id, 1);
		const level_cost = ns.hacknet.getLevelUpgradeCost(id, 1);
		const ram_cost = ns.hacknet.getRamUpgradeCost(id, 1);
		if (isNaN(cores_cost) && isNaN(level_cost) && isNaN(ram_cost)) {
			ns.print(`NODE(${stats.name}::${id}), SERVER MAXED`);
			return null;
		}
		return {
			id,
			...stats,
			cores_cost,
			level_cost,
			ram_cost,
		};
	}

	function choose_option() {
		let _id = -1;
		let option = 'new';
		let cost_option = ns.hacknet.getPurchaseNodeCost();
		let _name = '';
		const _ = [...Array(ns.hacknet.numNodes())] // list of numbers
			.map((_, id) => get_node_detail(id)) // list of nodes to work
			.filter((x) => x) // all but null
			.forEach(({ name, cores_cost, id, level_cost, ram_cost }) => {
				if (cores_cost && cores_cost < cost_option) {
					option = 'cores_update';
					cost_option = cores_cost;
					_name = name;
					_id = id;
				} else if (level_cost && level_cost < cost_option) {
					option = 'level_update';
					cost_option = level_cost;
					_name = name;
					_id = id;
				} else if (ram_cost && ram_cost < cost_option) {
					option = 'ram_update';
					cost_option = ram_cost;
					_name = name;
					_id = id;
				}
			});
		return { id: _id, option, cost_option, name: _name };
	}

	let loop = 0;
	while (ns.hacknet.getPurchaseNodeCost()) {
		if (loop % 100 === 0) {
			await ns.sleep(DELAY);
			ns.print('loop: ', loop);
		}
		++loop;
		const { id, option, cost_option, name } = choose_option();
		await wait_money(cost_option);
		if (option === 'new') {
			const n = ns.hacknet.purchaseNode();
			ns.print(`WARN NODE(${n}), SERVER CREATED`);
		} else if (option === 'cores_update') {
			ns.hacknet.upgradeCore(id, 1);
			ns.print(`INFO NODE(${name}::${id}), cores updated`);
		} else if (option === 'level_update') {
			ns.hacknet.upgradeLevel(id, 1);
			ns.print(`INFO NODE(${name}::${id}), level updated`);
		} else if (option === 'ram_update') {
			ns.hacknet.upgradeRam(id, 1);
			ns.print(`INFO NODE(${name}::${id}), ram updated`);
		}
	}
}
