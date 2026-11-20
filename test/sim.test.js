import test from "node:test";
import assert from "node:assert/strict";
import { createGame, newPlayer, startRound, step, snapshot, COLORS } from "../js/sim.js";
import { isSolid, TILE } from "../js/map.js";
import { Bot } from "../js/bots.js";

function botGame(n, rounds) {
  const players = Array.from({ length: n }, (_, i) => newPlayer(`b${i}`, `Bot ${i}`, COLORS[i], true));
  const s = createGame(players, rounds);
  const bots = Object.fromEntries(players.map((p) => [p.id, new Bot(p.id)]));
  startRound(s);
  return { s, bots };
}

test("a bot-only game plays through every round and ends", () => {
  const { s, bots } = botGame(4, 4);
  const dt = 1 / 60;
  let catches = 0, teleports = 0, wolves = new Set();
  for (let i = 0; i < 60 * 60 * 8 && s.phase !== "gameEnd"; i++) {
    const inputs = {};
    for (const p of s.players) inputs[p.id] = bots[p.id].input(s, p, dt);
    step(s, dt, inputs);
    for (const e of s.events) {
      if (e.e === "catch") catches++;
      if (e.e === "vent" || e.e === "tube" || e.e === "slide") teleports++;
      if (e.e === "round") wolves.add(e.wolf);
    }
    s.events.length = 0;
    for (const p of s.players) {
      if (!p.alive) continue;
      assert.ok(!isSolid(Math.floor(p.x / TILE), Math.floor(p.y / TILE)), `${p.id} inside a wall at ${p.x},${p.y}`);
    }
  }
  assert.equal(s.phase, "gameEnd");
  assert.equal(wolves.size, 4, "each player is the werewolf once");
  console.log({ catches, teleports, results: s.results.map((r) => `${r.name}:${r.score}`) });
  assert.ok(catches > 0, "the werewolf bot should catch someone");
  assert.ok(JSON.stringify(snapshot(s)).length < 8000);
});

import { completeTask, CFG as C2 } from "../js/sim.js";
import { doors, center } from "../js/map.js";

test("finishing a task scores, shortens the clock and pings the werewolf", () => {
  const players = [newPlayer("w", "W", COLORS[0]), newPlayer("s", "S", COLORS[1])];
  const s = createGame(players, 2);
  startRound(s);
  const surv = s.players.find((p) => p.role === "surv");
  const st = s.stations[0];
  surv.x = st.x; surv.y = st.y;
  const before = { score: surv.score, timer: s.timer };
  assert.ok(completeTask(s, surv, st.id));
  assert.equal(surv.score, before.score + 10);
  assert.equal(s.timer, before.timer - C2.taskClock);
  assert.equal(s.pings.length, 1);
  assert.ok(!completeTask(s, surv, st.id), "station is on cooldown");
});

test("a survivor who slams a swinging door on the werewolf gets points", () => {
  const players = [newPlayer("a", "A", COLORS[0]), newPlayer("b", "B", COLORS[1])];
  const s = createGame(players, 2);
  startRound(s);
  const wolf = s.players.find((p) => p.role === "wolf");
  const surv = s.players.find((p) => p.role === "surv");
  wolf.fx.hold = 0;
  const d = doors.find((x) => x.horizontalWall);
  const [tx, ty] = d.tiles[0];
  const c = center(tx, ty);
  // survivor runs down through the door, werewolf follows right behind
  surv.x = c.x; surv.y = c.y - 50; wolf.x = c.x; wolf.y = c.y - 160;
  const inputs = { [surv.id]: { mx: 0, my: 1 }, [wolf.id]: { mx: 0, my: 1 } };
  let slam = false;
  for (let i = 0; i < 90 && !slam; i++) {
    step(s, 1 / 60, inputs);
    slam = s.events.some((e) => e.e === "points" && e.why === "DOOR SLAM" && e.who === surv.id);
    s.events.length = 0;
  }
  assert.ok(slam);
});
