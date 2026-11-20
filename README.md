# Full Moon Drive-Thru

A werewolf is loose in the **Mega Moonburger**, the biggest, weirdest fast food restaurant ever built. One player is the werewolf. Everyone else works the late shift and has to survive until closing time. Roles rotate every round.

Top-down 2D, 2 to 6 players in the browser, peer-to-peer. No server to run, no build step.

## Play

Open `index.html` from any static host (it must be served over HTTP/HTTPS, not opened as a file, because it uses ES modules).

- **Host a game**: you get a room code like `BEAR42`. Everyone else types it in and presses **Join**. The host can add bots to fill out the group.
- **Practice with bots**: plays offline against computer players.

Controls: WASD / arrow keys to move, Space to use your pickup. On a tablet, drag on the left side of the screen to move and tap **USE**.

### The restaurant

Kitchen (grills), Freezer (slippery ice), Party Room, Hallway, Dining Hall, Playland, and the Drive-Thru lane wrapped around the outside.

- **Vents** (grey grates): survivor-only shortcuts between rooms and the parking lot.
- **Tubes** (orange holes) and **slides** in the Playland: anyone can use them. One slide drops you into the ball pit.
- **Ball pit**: slow, but survivors in it are hidden from the werewolf unless it gets very close.
- **Swinging doors**: they swing back after you pass. Anyone right behind you gets BONKED and dizzy.
- **Drive-thru conveyor**: a moving belt around the building.

### Pickups

| Pickup | Who | What it does |
| --- | --- | --- |
| Turbo Soda | everyone | Big speed boost for a few seconds |
| Grease Bucket | everyone | Drops a slick; the other team spins out |
| Garlic Fries | survivors | Shield: the werewolf bounces off and gets dizzy. A werewolf who steps on them sneezes |
| Onion Bomb | survivors | Stinky cloud: survivors inside are hidden, the werewolf is slowed |
| Moon Pie | werewolf | HOWL: see every survivor for 5 seconds |

### Scoring

Survivors get 1 point per second they stay free and +15 for lasting the round. The werewolf gets +20 per catch and +10 for catching everyone. Caught survivors become ghosts and can float around watching.

## How the networking works

- [PeerJS](https://peerjs.com/) (vendored in `vendor/`, MIT) talks to PeerJS's free public signaling server (`0.peerjs.com`) just to introduce players. The room code becomes the host's peer id.
- After that, game traffic goes directly between browsers over WebRTC data channels.
- The host's browser runs the whole game (host-authoritative, 60 ticks/s) and sends snapshots 20 times a second. Joiners send their input, predict their own movement locally, and smooth everyone else.
- **Known limit:** there is no TURN relay, only Google's public STUN servers. Most home networks connect fine, especially when everyone is on the same Wi-Fi, but some strict networks (some school, office or mobile carrier networks) will fail to connect. Adding a TURN server to `iceServers` in `js/net.js` would fix that.
- The host should keep the game tab in front: browsers slow down background tabs, which slows the game for everyone.

For local testing you can run your own signaling server (`npx peerjs --port 9000`) and open the page with `?peer=localhost:9000`.

## Code

| File | What |
| --- | --- |
| `js/map.js` | The restaurant layout, special tiles, spawn points |
| `js/sim.js` | Game rules; the host runs it, joiners use its movement code for prediction |
| `js/bots.js` | Computer players (grid path-finding) |
| `js/net.js` | PeerJS host/join wrapper |
| `js/render.js` | All drawing (canvas 2D, no image files) |
| `js/main.js` | Menus, lobby, host/client loops |

Tests: `npm test` plays a full bot-only game headlessly and checks that every round runs and nobody ends up inside a wall.

The Mega Moonburger brand, characters and map are all original to this game.
