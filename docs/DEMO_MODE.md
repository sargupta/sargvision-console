# Demo mode — backend-less replay

The console is normally driven by the `sargvision-swarm` bridge over a
WebSocket. The public Cloudflare Pages deployment has no bridge, so the
console falls back to replaying a **recorded session** bundled as a static
asset. This document describes how that path works, how to re-record it, and
what it deliberately does not contain.

## How the fallback engages

`src/lib/ws.ts` opens the live WebSocket first. If no live frame arrives within
`DEMO_FALLBACK_MS` (3.5 s) — the socket refuses, hangs, or is blocked as
mixed content because the page is https and the bridge is http — the client
loads `/demo/session.<scenario>.json` and plays it on a loop at 10 Hz.

A live connection always wins: if the socket opens later, `stopDemo()` tears
the replay down mid-loop and the console switches to real frames. While the
replay is carrying the console, the reconnect interval backs off from 1.5 s to
a 30 s ceiling, so a dead backend does not produce a console error every
1.5 s for the lifetime of the page.

`TopBar` shows a `DEMO · REPLAY` badge whenever this path is active, and the
link indicator reads `REPLAY` rather than `LINK UP`.

## One recording per mission

There is **one file per scenario**, not one file overall:

```
public/demo/session.border_strike.json    # Critical-Infrastructure C-UAS Defence
public/demo/session.coverage.json         # Counter-Swarm Intercept
public/demo/session.formation_v.json      # Persistent ISR Patrol
public/demo/session.flock.json            # Maritime Perimeter Defence Mesh
public/demo/session.migration.json        # Governed Corridor Migration
public/demo/session.hover.json            # Hold Station
```

This is what makes the mission picker work with no backend. `switchMission()`
in `src/lib/missions.ts` tries the live bridge first (`POST /scenario/{id}`)
and falls back to swapping the replayed recording, returning which path served
the request:

| Result | Meaning |
|---|---|
| `live` | the bridge accepted the scenario change |
| `demo` | no bridge; the bundled recording for that mission is now playing |
| `unavailable` | no bridge **and** no recording — the picker shows an error |

Switching clears the replay buffer, intent history and engagement log, so one
mission's kill chain never appears underneath another mission's map.

### Regression this prevents

Before this existed there was a single `session.json` containing only
`border_strike`. Every mission other than the first appeared broken: the POST
to `127.0.0.1:8765` failed, the failure was swallowed by a `try/finally` with
no `catch`, the loop kept replaying `border_strike`, and because the picker
derives its label from `frame.scenario` the label snapped back to mission #1.
The scenarios themselves were never broken — five of the six had simply never
been recorded.

## Re-recording

From the `sargvision-swarm` repo (no running bridge required):

```bash
for s in border_strike coverage formation_v flock migration hover; do
  python scripts/record_demo.py --scenario "$s" --frames 300 \
    --out ../sargvision-console/public/demo/session."$s".json
done
```

Then civilianise every file (see below), and bump `DEMO_VERSION` in
`src/lib/ws.ts` so browsers do not serve a stale recording from cache.

`record_demo.py` rounds floats by default — 6 dp for degrees (~0.1 m), 3 dp
for everything else. Pass `--no-compact` to keep full precision, at roughly
double the file size.

### Size

~51 MB raw across the six files, but they are highly repetitive JSON: about
3.3 MB gzipped in total, and the browser fetches exactly one of them per
mission (0.4 MB for the default). Cloudflare Pages compresses on the fly.

## Civilianisation

`scripts/civilianise_demo.mjs` rewrites operationally-sensitive strings in a
recording into neutral civilian-infrastructure equivalents — place names,
platform names, doctrine names, operation names. Run it after every recording;
it is idempotent.

```bash
for f in public/demo/session.*.json; do node scripts/civilianise_demo.mjs "$f"; done
```

Two rules learned the hard way:

1. **Case matters.** The substitution map is a literal string replace. Zone
   ids and display names are UPPERCASE in the recordings, so mixed-case entries
   like `Khardung La` silently missed `KHARDUNG LA`. Add both cases.
2. **Lowercase doctrine names in key position are load-bearing.** `"trishul"`,
   `"vajra"`, `"prajna"` etc. appear as JSON *keys* that the console reads.
   Renaming them breaks the UI. Only string *values* should be rewritten.

### What civilianisation does NOT reach

The script only rewrites the recording. Anything baked into the console source
is out of its reach, and two such items remain:

- **`src/components/MissionBriefing.tsx`** hardcodes `LEH · LADAKH` as the
  theatre in the mission-brief overlay.
- **The coordinates themselves are real.** The recorded tracks sit over Leh,
  Ladakh, so the satellite basemap renders recognisable ground truth —
  "Leh Golf Course" is legible at default zoom. Neutralising this means
  geo-shifting the recorded tracks *and* the map camera together.

Neither is a bug; both are decisions about who the public URL is for. There is
currently no build-time civilian/defence switch, which is the real fix if the
public deployment and the defence demo need to diverge further.

## Deployment note

`.github/workflows/deploy.yml` deploys to Cloudflare Pages on every push to
`main`. It requires two repository secrets. As of this writing only
`CLOUDFLARE_ACCOUNT_ID` is set — `CLOUDFLARE_API_TOKEN` is missing, and every
deploy run since 2026-05-24 has failed at the wrangler step for that reason
while CI passed. Adding the secret fixes all future deploys.
