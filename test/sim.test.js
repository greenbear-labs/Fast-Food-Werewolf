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
