function int_to_str(value) {
	value = Math.floor(value)
	var length = (value + '').length,
		index = Math.ceil((length - 3) / 3),
		suffix = ['K', 'M', 'B', 'T', 'Q'];

	if (length < 4) return value;
	return (value / Math.pow(1000, index))
		.toFixed(1)
		.replace(/\.0$/, '') + suffix[index - 1];

}

/** @param {NS} ns **/
export async function main(ns) {
	parseFloat
	const doc = document; // This is expensive! (25GB RAM) Perhaps there's a way around it? ;)
	const hook0 = doc.getElementById('overview-extra-hook-0'),
		hook1 = doc.getElementById('overview-extra-hook-1');
	while (true) {
		try {
			let headers = [],
				values = [];
			const income = ns.getScriptIncome()

			headers.push('scrpt $');
			values.push(int_to_str(income[1]) + '/s');
			headers.push('--');
			values.push('--');
			headers.push('total $');
			values.push(int_to_str(income[0]) + '/s');

			// Now drop it into the placeholder elements
			hook0.innerText = headers.join(' \n');
			hook1.innerText = values.join('\n');
		} catch (err) {
			// This might come in handy later
			ns.print('ERROR: Update Skipped: ' + String(err));
		}
		await ns.sleep(1000);
	}
}