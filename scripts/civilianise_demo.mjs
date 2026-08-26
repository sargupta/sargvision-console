// Civilianise the recorded demo session for the public deployment.
// Replaces operationally-sensitive doctrine / place / RFP / offensive terms
// with neutral civilian-context labels. Operates on string VALUES in the JSON.
//
// Usage: node scripts/civilianise_demo.mjs public/demo/session.json
//
// Run AFTER recording from the sim. Idempotent (safe to re-run).

import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2] ?? "public/demo/session.json";

// Ordered longest-first so multi-word phrases match before their substrings.
const MAP = [
  // Real place / asset / RFP references → civilian critical-infrastructure
  ["LEH AIRBASE", "PRIMARY SUBSTATION"],
  ["KARU POWER STN", "METRO DATA CENTRE"],
  ["DBO FWD POST", "CITY WATER PLANT"],
  ["Karu power station", "Metro Data Centre"],
  ["DBO forward post", "City Water Plant"],
  ["LEH_AB", "ASSET-01"],
  ["KARU_PS", "ASSET-02"],
  ["DBO_FWD", "ASSET-03"],
  // Zone ids + display names are UPPERCASE in the recordings; the mixed-case
  // entries below never matched them.
  ["NUBRA FWD POST", "FORWARD NODE"],
  ["KHARDUNG LA", "CORRIDOR-A"],
  ["TANGLANG LA", "CORRIDOR-C"],
  ["ZOJI LA", "CORRIDOR-B"],
  ["KHARDUNG", "CORRIDOR-A"],
  ["TANGLANG", "CORRIDOR-C"],
  ["NUBRA", "FORWARD NODE"],
  ["ZOJI", "CORRIDOR-B"],
  ["Leh sector", "defended sector"],
  ["Leh airbase", "primary site"],
  ["Cross-LoC", "Inbound"],
  ["LoC", "perimeter"],
  ["LAC", "frontier"],
  ["Leh", "Sector"],
  ["Nubra", "Forward Node"],
  ["Khardung La", "Corridor-A"],
  ["Zoji La", "Corridor-B"],
  ["Tanglang La", "Corridor-C"],
  // Platform + formation
  ["Sheshnaag-150 (Command)", "Sentinel-150 (Command)"],
  ["Sheshnaag-150", "Sentinel-150"],
  ["Tapas-BH Relay", "Sentinel Relay"],
  ["Sheshnaag", "Sentinel"],
  ["ALFA-S Scout", "Sentinel Scout"],
  ["ALFA-S", "Sentinel"],
  ["vyuha", "formation"],
  // Doctrine algorithm names (Sanskrit) → functional English
  ["VAJRA load-balancing", "interceptor load-balancing"],
  ["DRISHTI", "DETECTION"],
  ["Drishti", "Detection"],
  ["drishti", "detection"],
  ["PRAJNA", "CLASSIFICATION"],
  ["Prajna", "Classification"],
  ["prajna", "classification"],
  ["YAJNA", "AUCTION"],
  ["Yajna", "Auction"],
  ["YUKTI", "TRUST-GATE"],
  ["yukti", "trust-gate"],
  ["SABHA", "ROE-GATE"],
  ["Sabha", "ROE-Gate"],
  ["VYUHA", "FORMATION"],
  // Offensive / operation references
  ["Operation Trishul", "Counter-UAS Defence"],
  ["OPERATION TRISHUL", "COUNTER-UAS DEFENCE"],
  ["Op Trishul", "C-UAS Defence"],
  ["TRISHUL", "C-UAS DEFENCE"],
  ["Trishul", "C-UAS Defence"],
  // Phase names
  ["PEACETIME", "STANDBY"],
  ["POLARIZED", "DISPERSED"],
  // RFP references
  ["ADITI 2.0 PS-11", "C-UAS DEMO"],
  ["ADITI 2.0", "C-UAS DEMO"],
];

let raw = readFileSync(path, "utf8");
let total = 0;
for (const [from, to] of MAP) {
  const before = raw.length;
  raw = raw.split(from).join(to);
  // crude change counter
  if (before !== raw.length) total += 1;
}
writeFileSync(path, raw);
console.error(`Civilianised ${path} — applied ${total}/${MAP.length} substitution groups.`);
