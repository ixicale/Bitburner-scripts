/**
 * Script for downloading scripts by curl on home server.
 * @param {NS} ns
 * @example ```ps
 * 	> run download.js
 *  ```
 * @returns {void} null
 * **/
export async function main(ns) {
    const origin = "https://raw.githubusercontent.com/ixicale/Bitburner-scripts/main/stable"
    var list_of_scripts = [
        "custom-status.js",
        "auto-money.js",
        "utils.js",
        "download.js",
        "basic-money.js",
        "looking-server.js",
        ".money.js",
        "auto-purchase-servers.js",
        "scan-targets.js",
    ]
    for (const script_name of list_of_scripts) {
        var script_path = `${origin}/${script_name}`
        ns.tprint(`downloading ${script_name}`)
        await ns.wget(script_path,script_name,"home");
    }
}