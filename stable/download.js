/**
 * Script for downloading scripts by curl on home server.
 * @param {NS} ns The Netscript package
 * @example ```ps
 * 	> run download.js
 *  ```
 * @returns {void} null
 * **/
 export async function main(ns) {
    const origin = "https://raw.githubusercontent.com/ixicale/Bitburner-scripts/main/stable"
    const script_to_download = [
        "auto-purchase.js",
        "basic-money.js",
        "custom-status.js",
        "daemon.js",
        "download.js",
        "nuke.js",
        "scan-targets.js",
        "utils.js",
    ]
    for (const script_name of script_to_download) {
        var script_path = `${origin}/${script_name}`
        ns.tprint(`downloading ${script_name}`)
        await ns.wget(script_path,script_name,"home");
    }
}