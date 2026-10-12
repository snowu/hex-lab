/* Game dev section: multiplayer networking concepts. Code blocks marked data-check are compiled by scripts/validate-snippets.mjs. */
TRACKS.push({
  id: 'gdnet', domain: 'gamedev', icon: '🌐', title: 'Multiplayer & Networking',
  blurb: 'What the network does to a real-time game, and the techniques that hide it: authority, prediction, interpolation, lockstep and rollback, bandwidth, and not trusting clients.',
  lessons: [
    {
      id: 'net-models', title: 'The network and your game', minutes: 35,
      summary: 'Latency, jitter and loss; client-server versus peer-to-peer; what to send and how small you can make it.',
      checks: [
        { q: 'Two players are 10,000 km apart on fibre and see at least ~50 ms one-way delay before any router adds more. What follows?',
          options: ['Use TCP to remove the delay', 'You cannot code below the physics of light in fibre: the techniques must hide latency, not eliminate it', 'Increase the tick rate to remove it', 'Send larger packets'],
          answer: 1, explain: 'Distance sets a floor on latency, so networking is about hiding delay and tolerating loss.' },
        { q: 'A server sends every entity to every player at full rate, and bandwidth explodes as entities grow. What is the highest-payoff cut?',
          options: ['Compress the chat text', 'Raise the snapshot rate', 'Add more entities', 'Interest management: send only nearby or visible entities, at lower rates for far ones, plus deltas'],
          answer: 3, explain: 'Not sending irrelevant state beats shrinking it; deltas and quantisation cut what remains.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>What the network really is</h3>
<p>A multiplayer game is a distributed system where the parts must agree about a fast-changing world, over a connection that is <b>slow, unreliable and out of order</b>. Four numbers describe a link:</p>
<table><tr><th>Quantity</th><th>Meaning</th><th>Typical</th></tr>
<tr><td><b>Latency</b> (ping, RTT)</td><td>Time for a message to go there and back</td><td>10 to 30 ms same city, 80 to 150 ms across a continent, 200+ ms across oceans or on mobile</td></tr>
<tr><td><b>Jitter</b></td><td>Variation of latency from packet to packet</td><td>Wi-Fi and mobile often ±20 to 50 ms</td></tr>
<tr><td><b>Packet loss</b></td><td>Fraction of packets that never arrive</td><td>0 to 2% normally, bursts much higher</td></tr>
<tr><td><b>Bandwidth</b></td><td>Bytes per second the link carries</td><td>Plenty on average, but limited and metered on mobile; your budget is usually tens of KB/s per player</td></tr></table>
<p>Light in fibre moves ~200,000 km/s, so 10,000 km costs 50 ms one way before any router adds a thing: <b>you cannot code your way below the physics</b>. Everything in this track is about <i>hiding</i> latency, tolerating loss and keeping everyone's picture consistent.</p>
<h3>TCP, UDP and what games use</h3>
<ul><li><b>TCP</b> gives a reliable, ordered byte stream. If one packet is lost, everything behind it waits for the retransmission (<b>head-of-line blocking</b>): a lost position update from half a second ago delays the fresh ones. Fine for chat, login, downloads, turn-based games.</li><li><b>UDP</b> sends independent datagrams: no ordering, no delivery guarantee, no delay from old packets. Real-time games use UDP and build only the reliability they need on top: <i>unreliable</i> channel for positions (the next update replaces a lost one), <i>reliable ordered</i> for events like "player died" and chat. Libraries: ENet (used by Godot's high-level multiplayer), Steam Networking Sockets, Valve's GameNetworkingSockets, Yojimbo, QUIC.</li><li><b>In a browser</b> you get WebSockets (TCP) or WebRTC data channels (UDP-like, unordered/unreliable mode) and WebTransport. A web game on WebSockets suffers head-of-line blocking: keep messages small and design for it.</li></ul>
<h3>Topologies</h3>
<table><tr><th>Model</th><th>How</th><th>Pros</th><th>Cons</th></tr>
<tr><td><b>Dedicated server</b> (client-server, authoritative)</td><td>Clients send inputs; one program decides what is true</td><td>Cheat resistant, consistent, scales to many players</td><td>You run servers; every player pays latency to the server</td></tr>
<tr><td><b>Listen server</b></td><td>One player's game is also the server</td><td>No server cost</td><td>That player has zero latency (an advantage), host leaving ends the match, host can cheat</td></tr>
<tr><td><b>Peer-to-peer</b> (lockstep or rollback)</td><td>Every player simulates, exchanging inputs</td><td>Minimal bandwidth, no server for the game</td><td>Needs determinism, NAT traversal, cheating is hard to prevent, scales poorly beyond a few players</td></tr>
<tr><td><b>Relay</b></td><td>Traffic goes via a relay server</td><td>Works through any NAT, hides IPs</td><td>Adds a hop</td></tr></table>
<h3>Ticks and rates</h3>
<p>A server simulates in fixed <b>ticks</b> (20, 30, 60, 128 per second). It sends <b>snapshots</b> of the world at a possibly lower rate (10 to 30 Hz is typical). Clients send inputs at their frame rate or the tick rate. Higher rates cost bandwidth and CPU for diminishing returns: choose them from the genre (a turn-based card game needs almost nothing; a competitive shooter needs 60+).</p>
<h3>State or inputs?</h3>
<ul><li><b>Send state</b> (positions, health): simple, robust, bandwidth grows with the number of things.</li><li><b>Send inputs</b> and let everyone simulate: tiny messages, but requires <b>determinism</b> (lockstep lesson).</li><li>Most real-time games combine them: clients send inputs, the server sends state.</li></ul>
<h3>Making it small</h3>
<p>Bandwidth is the budget you can plan. Example: 16 players × 20 snapshots/s × 16 entities per snapshot × 12 bytes ≈ 61 KB/s outgoing from the server per client if you send everything to everyone. Tricks, in order of payoff:</p>
<ol><li><b>Send only what changed</b> (<b>delta compression</b>): against the last snapshot the client acknowledged.</li><li><b>Interest management</b>: only entities near or visible to this player, and at lower rates for far ones.</li><li><b>Quantisation</b>: positions do not need 32-bit floats. If the map is 200 units wide and 1 cm accuracy is enough, a 16-bit integer suffices (below).</li><li><b>Bit packing</b>: a boolean costs 1 bit, not a byte; an enum of 5 values costs 3 bits.</li><li><b>Avoid sending derived data</b> (the client can compute it) and avoid strings (send ids).</li><li><b>Compression</b> (LZ4, zstd) helps larger, less regular messages.</li></ol>
<pre><code data-check="zig">const std = @import("std");

/// Map a float in [lo, hi] onto 0..65535 and back. The error is at most half a step: (hi - lo) / 65535 / 2.
fn quantize(v: f32, lo: f32, hi: f32) u16 {
    const clamped = std.math.clamp(v, lo, hi);
    const t = (clamped - lo) / (hi - lo);
    return @intFromFloat(@round(t * 65535.0));
}

fn dequantize(q: u16, lo: f32, hi: f32) f32 {
    return lo + (@as(f32, @floatFromInt(q)) / 65535.0) * (hi - lo);
}

/// Write a quantised position into 4 bytes (little-endian), the way a snapshot packet would.
fn writePos(buf: *[4]u8, x: f32, y: f32) void {
    std.mem.writeInt(u16, buf[0..2], quantize(x, -100, 100), .little);
    std.mem.writeInt(u16, buf[2..4], quantize(y, -100, 100), .little);
}

fn readPos(buf: *const [4]u8) [2]f32 {
    return .{
        dequantize(std.mem.readInt(u16, buf[0..2], .little), -100, 100),
        dequantize(std.mem.readInt(u16, buf[2..4], .little), -100, 100),
    };
}

test "a position fits in 4 bytes with millimetre-level error on a 200-unit map" {
    var buf: [4]u8 = undefined;
    writePos(&amp;buf, 12.3456, -78.9012);
    const p = readPos(&amp;buf);
    const max_err: f32 = 200.0 / 65535.0 / 2.0 + 1e-4;
    try std.testing.expect(@abs(p[0] - 12.3456) &lt;= max_err);
    try std.testing.expect(@abs(p[1] - -78.9012) &lt;= max_err);
    try std.testing.expectEqual(@as(usize, 4), buf.len); // versus 8 bytes for two f32
}

test "values outside the range are clamped, never wrapped" {
    try std.testing.expectEqual(@as(u16, 65535), quantize(500, -100, 100));
    try std.testing.expectEqual(@as(u16, 0), quantize(-500, -100, 100));
}</code></pre>
<h3>Getting started in Godot</h3>
<p>Godot 4's high-level multiplayer API sits on ENet (also WebSocket and WebRTC peers). You choose one peer to be the <b>server</b> (id 1), others connect as clients. <code>@rpc</code> functions are remote procedure calls (specify who may call, who runs, and whether it is reliable). The <code>MultiplayerSpawner</code> and <code>MultiplayerSynchronizer</code> nodes replicate scenes and properties for you. They are a good start for turn-based and casual games; for fast-paced games you will want your own snapshot and prediction logic on top (next lessons).</p>
<h3>Test with a bad network</h3>
<p>Your LAN is a lie. Test with simulated <b>latency, jitter and loss</b>: Linux <code>tc netem</code>, <code>clumsy</code> on Windows, Network Link Conditioner on macOS, browser dev tools throttling, or a built-in toggle in your own game (the simulation in the next lesson has these sliders). If it only works at 0 ms it does not work.</p>` },
        { pid: 'q-net1-1', type: 'quiz', q: 'Why do real-time games prefer UDP-style delivery for position updates?',
          options: ['UDP is encrypted', 'A lost old position is useless anyway; TCP would hold back fresh updates until the lost one is retransmitted (head-of-line blocking)', 'UDP uses less memory', 'UDP guarantees order'], answer: 1, explain: 'The next snapshot supersedes the lost one, so retransmitting it wastes time and delays newer data.' },
        { pid: 'q-net1-2', type: 'quiz', q: 'A 12-player game sends each client the position of all 12 players at 30 Hz at 20 bytes each. About how much is that per client (server → one client)?',
          options: ['About 7 KB/s (12 × 20 × 30)', 'About 70 KB/s', 'About 700 bytes/s', 'About 7 MB/s'], answer: 0, explain: '12 × 20 bytes = 240 bytes per snapshot, × 30 = 7,200 bytes/s. Delta compression, interest management and quantisation can cut that several times.' },
        { pid: 'q-net1-3', type: 'quiz', q: 'Which topology is the most resistant to cheating for a competitive shooter?',
          options: ['Listen server hosted by a player', 'Dedicated authoritative server run by you', 'Peer-to-peer with trust between clients', 'Each client simulates its own hits'], answer: 1, explain: 'If a program you control decides what is true, a hacked client can only send inputs, not facts.' },
      ],
    },
    {
      id: 'net-prediction', title: 'Prediction, interpolation and lag compensation', minutes: 40,
      summary: 'How a game feels instant at 100 ms: predict yourself, show others in the past, and let the server rewind time for fairness.',
      checks: [
        { q: 'With prediction on, the client is corrected almost every snapshot even when nothing special happens. What is the likely bug?',
          options: ['Prediction drift: the client movement code differs from the server, so sharing the code and stepping with the same fixed dt is required', 'The interpolation delay is too large', 'The tick rate is too high', 'Lag compensation is missing'],
          answer: 0, explain: 'Frequent corrections signal divergence between the two simulations, not normal network noise.' },
        { q: 'Corrections of one pixel visibly snap the character every snapshot. How should small versus large errors be handled?',
          options: ['Snap on every difference', 'Ignore the server', 'Correct small errors by blending and reserve snapping for large ones, using a tolerance', 'Extrapolate for a full second'],
          answer: 2, explain: 'A tolerance with blend-for-small and snap-for-large hides noise without letting real divergence linger.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The problem</h3>
<p>With an authoritative server, pressing "move right" means: send the input (50 ms), the server processes it, sends the result back (50 ms), then you see yourself move. A 100 ms delay on every action is unplayable. Three techniques make a networked game feel as if the delay is not there. They are the standard of every modern action game (Quake, Counter-Strike, Overwatch, Rocket League all use variations). Gaffer On Games and Valve's "Source Multiplayer Networking" page explain them in depth.</p>
<h3>1. Client-side prediction (your own character)</h3>
<p>The client <b>applies your input immediately</b> using the same movement code as the server, and also sends it with a <b>sequence number</b>. You see yourself move at once. The server later confirms the real result.</p>
<h3>2. Server reconciliation</h3>
<p>When a snapshot arrives it says "after processing your input number N, you are at P". The client has already moved on past N with inputs the server has not seen. So it <b>rewinds to P and replays the inputs after N</b> to compute the corrected present (the first drill). If the prediction was right, the replay lands on the same position and nothing visible happens. If the server disagreed (you were pushed, or hit a wall you did not know about), the replay produces a different position and you are corrected. Hide the snap with a short smoothing of the visual position.</p>
<p>Requirements: movement must be <b>deterministic</b> given (state, input, dt) so client and server compute the same thing; inputs must be tagged and buffered; everything the server can change (knockback, teleport) must come back in snapshots.</p>
<h3>3. Entity interpolation (everyone else)</h3>
<p>You cannot predict other players: you do not know their inputs. They arrive as snapshots 10 to 30 times a second, so drawing the latest one makes them jump. Instead draw them <b>slightly in the past</b>, blended between the two snapshots around the render time (the second drill). The delay (typically 100 ms, about two snapshot intervals) guarantees you almost always hold a snapshot on each side. You trade a small, constant visual delay of others for perfectly smooth motion.</p>
<p><b>Extrapolation</b> (dead reckoning) guesses forward from the last velocity when snapshots run out. Brief extrapolation hides a lost packet; long extrapolation produces rubber-banding corrections. Cap it (about 100 to 250 ms) and hold or fade after that.</p>
<h3>4. Lag compensation (shooting fairly)</h3>
<p>Because you see others in the past, when you click on a target you are aiming at where it <i>was</i>. The server, receiving your shot later, would find it already moved. <b>Lag compensation</b>: the server keeps a short history of positions and, when processing your shot, <b>rewinds</b> the world by your latency plus interpolation delay and tests the hit against that past state. "What you see is what you hit" for the shooter, at the cost that a player behind cover can be hit slightly "after" reaching it. Limit the maximum rewind (200 ms or so) so high-ping players do not dominate.</p>
<h3>Putting it together</h3>
<table><tr><th>Thing</th><th>Technique</th></tr>
<tr><td>My own movement</td><td>Prediction + reconciliation</td></tr>
<tr><td>Other players</td><td>Snapshot interpolation (render in the past)</td></tr>
<tr><td>Projectiles you fired</td><td>Predict locally (spawn immediately), server owns the truth</td></tr>
<tr><td>Hit detection</td><td>Server-side with lag compensation</td></tr>
<tr><td>Physics objects</td><td>Server simulates; clients interpolate (or predict if you interact)</td></tr></table>
<h3>Things that go wrong</h3>
<ul><li><b>Prediction drift</b>: the client's code differs from the server's (different float order, missing a rule). Share the movement code, step with the same fixed dt, and log corrections: frequent ones are a bug.</li><li><b>Over-correction jitter</b>: snapping every time a snapshot differs by a pixel. Use a tolerance; correct small errors by blending, large ones by snapping.</li><li><b>Interpolation delay too small</b>: you run out of snapshots and objects freeze or extrapolate. Add jitter margin.</li><li><b>Visual vs simulation position</b>: keep a separate smoothed render position so corrections do not teleport the camera.</li><li><b>Sequence number wrap-around</b>: compare with wrap-aware arithmetic if you use small integers.</li></ul>` },
        { pid: 'sim-net', type: 'sim', id: 'gdnet', title: 'Latency, prediction and interpolation',
          intro: '<p>Row 1 is your character: grey is the server\'s truth, the coloured box is what you see. Row 2 is another player as you see them. Everything moves by itself so you can concentrate on the settings.</p>',
          try: ['Raise the <b>round trip</b> to 300 ms with <b>prediction off</b>: your box trails the grey truth. Turn <b>prediction on</b>: your box sits on top of it.', 'Press <b>server pushes me</b> with prediction on: after a round trip the client learns it was wrong and shows a correction.', 'In the lower row set <b>interpolation delay</b> to 0 and <b>snapshots/s</b> to 5: the other player moves in jerky steps. Raise the delay to 100 to 200 ms: smooth again.', 'Add <b>packet loss</b> and <b>jitter</b> with a small delay: motion stutters when the snapshots you need have not arrived.', 'Find the smallest delay that stays smooth at your chosen snapshot rate: it is about two snapshot intervals plus the jitter.'] },
        { pid: 'drill-reconcile', type: 'drill', ref: 'net_reconcile' },
        { pid: 'drill-interp', type: 'drill', ref: 'snapshot_interp' },
        { pid: 'q-net2-1', type: 'quiz', q: 'The server says "after input 40 you are at x = 100". The client has applied inputs up to 47 and has them stored. What does reconciliation do?',
          options: ['Teleports to 100 and discards the rest', 'Starts from 100 and re-applies inputs 41 to 47 to get the corrected present', 'Ignores the server', 'Asks the server for inputs 41 to 47'], answer: 1, explain: 'The server only knows inputs up to 40. Replaying 41 to 47 on top of its answer restores the client\'s lead without losing correctness.' },
        { pid: 'q-net2-2', type: 'quiz', q: 'Why are other players drawn about 100 ms in the past?',
          options: ['To save bandwidth', 'So there are normally two snapshots to blend between, producing smooth motion instead of jumps', 'Because their ping is high', 'To make them harder to hit'], answer: 1, explain: 'Interpolation needs data on both sides of the render time; the delay buys it.' },
        { pid: 'q-net2-3', type: 'quiz', q: 'You shoot a moving player on your screen and the server says miss. Which technique is designed to fix that?',
          options: ['More prediction', 'Lag compensation: the server rewinds other players to what you saw when you fired and tests the hit there', 'Higher tick rate only', 'A bigger hitbox for everyone always'], answer: 1, explain: 'It evaluates the shot against the world as the shooter saw it (within a cap).' },
      ],
    },
    {
      id: 'net-lockstep', title: 'Deterministic lockstep and rollback', minutes: 35,
      summary: 'Send only inputs and make every machine compute the same world: how RTS games and fighting games work, and what determinism demands.',
      checks: [
        { q: 'In a 4-player lockstep RTS, one player on a slow link stalls and the whole match freezes for everyone. Why?',
          options: ['The renderer is too slow', 'The simulation advances to a tick only when every input for that tick has arrived, so the slowest connection sets the pace', 'The checksum failed', 'The map is too large'],
          answer: 1, explain: 'Lockstep trades bandwidth for synchrony: no machine may run ahead of the slowest input.' },
        { q: 'The same float simulation runs on a phone and a PC and the two games desync. What is the safe fix the lesson names?',
          options: ['Tick faster', 'Use larger floats', 'Send state instead of inputs always', 'Use fixed-point integers for the simulation, or identical binaries and strict flags on identical architectures'],
          answer: 3, explain: 'Floating-point results can differ across CPUs and compilers, so deterministic games avoid relying on them.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The idea</h3>
<p>If two machines start from the same state and apply the same inputs in the same order with a <b>deterministic</b> simulation, they end in the same state, with no need to send the state. A game with 1,000 units sends only a few bytes of commands per player per tick. This is why real-time strategy games (Age of Empires, StarCraft) with thousands of units are networked this way, and why replays are tiny.</p>
<h3>Lockstep</h3>
<p>Every tick, each player's input is sent to all others. The simulation advances to tick <i>t</i> only when it has the inputs of <b>every</b> player for tick <i>t</i>. Commands are scheduled to execute a few ticks in the future (<b>input delay</b>) so there is time for them to arrive. Consequences: the whole game runs at the speed of the slowest connection, one stalled player pauses everyone, and the delay between clicking and the action happening is the input delay (RTS players accept 100 to 200 ms; a fighting game cannot).</p>
<h3>Rollback netcode</h3>
<p>Fighting games need zero perceived input delay. <b>Rollback</b> (GGPO, popularised for fighting games; used by Street Fighter, Skullgirls and many others) predicts instead of waiting:</p>
<ol><li>Each frame, run the simulation immediately with <b>your</b> input and a <b>guess</b> for the opponent's (usually "same as their last input").</li><li>Save the game state every frame in a ring buffer.</li><li>When the real input for a past frame arrives and it differs from the guess: <b>roll back</b> to the saved state of that frame, apply the correct input, and <b>re-simulate</b> all frames up to the present, fast and invisibly.</li><li>Corrections are usually tiny (a character shifts a pixel); with low latency they are rare.</li></ol>
<p>It feels like playing offline, at the cost of: the game being able to re-simulate several frames in one frame's time (so the simulation must be cheap), cheap state save/load, and effects (sounds, particles) that must not fire twice when frames are replayed.</p>
<pre><code data-check="zig">const std = @import("std");

/// A tiny deterministic game: two players push a counter around. The state is small and plain data, so saving it is a copy.
const State = struct {
    frame: u32 = 0,
    x: [2]i32 = .{ 0, 0 },
    score: u32 = 0,

    fn step(self: *State, inputs: [2]i8) void {
        for (0..2) |p| self.x[p] += inputs[p];
        if (self.x[0] == self.x[1]) self.score += 1; // an "event" that depends on both players
        self.frame += 1;
    }
};

const MAX_ROLLBACK = 8;

const Rollback = struct {
    state: State = .{},
    saved: [MAX_ROLLBACK]State = undefined, // saved[f % MAX] is the state at the START of frame f
    used: [MAX_ROLLBACK][2]i8 = undefined, // the inputs we actually simulated that frame (with guesses)
    resimulated: u32 = 0,

    fn advance(self: *Rollback, local: i8, remote_guess: i8) void {
        const f = self.state.frame;
        self.saved[f % MAX_ROLLBACK] = self.state;
        self.used[f % MAX_ROLLBACK] = .{ local, remote_guess };
        self.state.step(.{ local, remote_guess });
    }

    /// The real remote input for an old frame arrived. If it differs from our guess, rewind and replay.
    fn correct(self: *Rollback, frame: u32, real_remote: i8) void {
        const slot = frame % MAX_ROLLBACK;
        if (self.used[slot][1] == real_remote) return; // guessed right: nothing to do
        const now = self.state.frame;
        self.used[slot][1] = real_remote;
        self.state = self.saved[slot]; // roll back
        var f = frame;
        while (f &lt; now) : (f += 1) {
            self.saved[f % MAX_ROLLBACK] = self.state;
            self.state.step(self.used[f % MAX_ROLLBACK]); // replay with the corrected input
            self.resimulated += 1;
        }
    }
};

test "rolling back and replaying gives exactly the state of a game that had the real input all along" {
    const local = [_]i8{ 1, 1, 0, 1, 1, 0, 0, 1 };
    const remote = [_]i8{ 0, 1, 1, 1, 0, 1, 1, 0 }; // what the remote player really pressed

    // the "ground truth": a simulation that knew every input in time
    var truth = State{};
    for (0..8) |i| truth.step(.{ local[i], remote[i] });

    // the rollback client: guesses "remote repeats its last input" (starting from 0), corrected as real inputs arrive late
    var rb = Rollback{};
    var last_real: i8 = 0;
    for (0..8) |i| {
        rb.advance(local[i], last_real);
        if (i &gt;= 2) { // the real input for frame i-2 arrives two frames late
            rb.correct(@intCast(i - 2), remote[i - 2]);
            last_real = remote[i - 2];
        }
    }
    rb.correct(6, remote[6]);
    rb.correct(7, remote[7]);

    try std.testing.expectEqual(truth, rb.state);
    try std.testing.expect(rb.resimulated &gt; 0); // it really did rewind at least once
}</code></pre>
<h3>What determinism demands</h3>
<ul><li><b>Same inputs, same order, same step</b>: fixed timestep, inputs applied by tick number, never by wall-clock arrival.</li><li><b>Seeded random numbers</b>: one RNG in the simulation, advanced only by simulation code (the procgen lesson). A particle effect that draws from it desyncs the game.</li><li><b>No uninitialised memory, no pointer addresses, no hash-map iteration order</b> in anything that affects state; iterate in a defined order (sort by id).</li><li><b>Floating point</b>: results can differ between CPUs, compilers and optimisation flags (fused multiply-add, x87 vs SSE, different libm). Safe options: <b>fixed-point integers</b> for the simulation (most RTS and fighting games), or the same binary and strict flags on identical architectures. Never assume that a float simulation on a phone matches a PC.</li><li><b>No dependence on frame rate, locale, thread timing or filesystem order.</b></li><li><b>Everything that influences the simulation is part of the state</b> that gets saved and checksummed.</li></ul>
<h3>Desyncs</h3>
<p>When two machines drift apart (a "desync"), everything after is garbage and it is silent. Detect it by exchanging a <b>checksum of the state</b> every few frames; when they differ, log the frame and dump the state to find the first divergent value. Replays that diverge on playback are the same bug.</p>
<h3>Choosing a model</h3>
<table><tr><th>Game</th><th>Fits</th><th>Why</th></tr>
<tr><td>RTS with thousands of units</td><td>Lockstep</td><td>State is huge, inputs are tiny; delay tolerated</td></tr>
<tr><td>Fighting game, 2 players</td><td>Rollback</td><td>Zero input delay matters; state is small</td></tr>
<tr><td>Shooter with many players, cheating a concern</td><td>Authoritative server + prediction</td><td>Server owns the truth; clients cannot be trusted</td></tr>
<tr><td>Turn-based or card game</td><td>Simple request/response to a server</td><td>Latency hardly matters</td></tr>
<tr><td>Co-op physics game</td><td>Host authority + interpolation</td><td>Floating-point physics is not deterministic across machines</td></tr></table>` },
        { pid: 'q-net3-1', type: 'quiz', q: 'Two machines running a lockstep RTS slowly drift apart without any error message. What is the most likely cause?',
          options: ['Packet loss', 'A source of non-determinism: floating point differences, a shared RNG advanced by non-simulation code, or hash-map ordering', 'Too many units', 'A slow monitor'], answer: 1, explain: 'Lockstep only sends inputs. Any difference in how the simulation computes the result makes the states diverge, and nothing in the network layer will notice.' },
        { pid: 'q-net3-2', type: 'quiz', q: 'In rollback netcode, a remote input for frame 100 arrives while you are at frame 103 and it differs from your guess. What happens?',
          options: ['The input is ignored', 'The game restores the saved state of frame 100, applies the real input and re-simulates frames 100 to 103 immediately', 'The game pauses until frame 100 is replayed in real time', 'A desync is declared'], answer: 1, explain: 'That is the rollback: load the state, correct the input, fast-forward back to the present within one frame\'s time.' },
        { pid: 'q-net3-3', type: 'quiz', q: 'Why must sounds and particles be handled carefully in a rollback game?',
          options: ['They use too much bandwidth', 'Re-simulated frames would trigger them again; effects must be tied to confirmed events or de-duplicated', 'They are not deterministic', 'They cannot be saved'], answer: 1, explain: 'Replaying frames re-runs game logic, which would re-emit effects. Cosmetic output must be decoupled from the replayed simulation.' },
      ],
    },
    {
      id: 'net-security', title: 'Cheating, trust and hostile input', minutes: 30,
      summary: 'The client is in the player\'s hands: validate everything on the server, leak nothing you do not need to, and treat every packet as an attack.',
      checks: [
        { q: 'Clients report positions and a hacked client teleports across the map. What server-side check stops it?',
          options: ['Trust the newest position', 'Encrypt the position', 'Accept a position only if it is within max speed times dt of the last accepted one, with fresh sequence numbers and in-bounds finite values', 'Send positions more often'],
          answer: 2, explain: 'The server owns movement rules and rejects impossible moves instead of applying whatever the client claims.' },
        { q: 'A packet carries a count field and the parser allocates that many objects before checking the real length. What is the fix?',
          options: ['Check the length before reading, never trust an embedded count or index, and cap allocations with fail-safe parsing', 'Allocate faster', 'Trust counts from authenticated users', 'Use a bigger server'],
          answer: 0, explain: 'Every packet is hostile bytes: validate, bound, and fuzz the parser rather than believing its contents.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The golden rule</h3>
<p><b>The client is controlled by the player.</b> Anything the client does or reports can be faked: memory can be edited, packets forged, the program replaced. So a networked game must be designed so that a hacked client <b>can only ask</b>, never <b>tell</b>. The server decides what is true.</p>
<h3>Typical cheats and the design that stops them</h3>
<table><tr><th>Cheat</th><th>Design response</th></tr>
<tr><td>Speed hack / teleport (send a position)</td><td>Clients send <i>inputs</i>, the server simulates movement. Or, if clients send positions, the server validates against the maximum speed and rejects impossible moves (snippet below).</td></tr>
<tr><td>Aimbot, auto-fire</td><td>Cannot be fully prevented client-side. Server-side statistics and behavioural detection, rate limits on fire, review tools. Be honest about the limits.</td></tr>
<tr><td>Wallhack / map hack</td><td>Do not send information the player should not have (enemies behind walls, hidden cards, the other team's resources). Fog-of-war on the <b>server</b>.</td></tr>
<tr><td>Item or currency duplication, impossible purchases</td><td>The server owns inventory and balances and checks every transaction (idempotent operations, transactions with ids).</td></tr>
<tr><td>Replay or forged packets</td><td>Sequence numbers, session tokens, authenticated and encrypted transport; reject out-of-window sequences.</td></tr>
<tr><td>Modified game files / values</td><td>Never trust a stat the client sends (damage, health, cooldown). The server holds the numbers.</td></tr>
<tr><td>Random outcomes chosen by the client</td><td>Roll on the server (loot, crits). A client that picks its own roll always gets the best one.</td></tr></table>
<h3>Validate on the server</h3>
<p>For each request ask: is the sender who they claim to be? Is the action <b>allowed in the current state</b> (is it their turn, do they have the item, is the cooldown over)? Is the argument in <b>range</b> (position within the map, speed under the maximum, count between 1 and 99)? How <b>often</b> may they do this (rate limit per player and per action)? Reject and (rarely) log, never crash and never "try to make sense of it".</p>
<pre><code data-check="zig">const std = @import("std");

const Move = struct { seq: u32, x: f32, y: f32 };

const Player = struct {
    x: f32 = 0,
    y: f32 = 0,
    last_seq: u32 = 0,
    rejected: u32 = 0,
};

const MAX_SPEED: f32 = 300; // units per second, from the game rules: the server's number, not the client's
const MAP: f32 = 1000;

/// Accept a client-reported position only if it is physically possible since the last accepted one.
fn acceptMove(p: *Player, m: Move, dt: f32) bool {
    if (m.seq &lt;= p.last_seq) return reject(p); // replayed or reordered packet
    if (std.math.isNan(m.x) or std.math.isNan(m.y) or std.math.isInf(m.x) or std.math.isInf(m.y)) return reject(p); // hostile floats
    if (m.x &lt; 0 or m.y &lt; 0 or m.x &gt; MAP or m.y &gt; MAP) return reject(p); // outside the world
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const max_step = MAX_SPEED * dt * 1.1; // a little slack for timing jitter
    if (dx * dx + dy * dy &gt; max_step * max_step) return reject(p); // teleport or speed hack
    p.x = m.x;
    p.y = m.y;
    p.last_seq = m.seq;
    return true;
}

fn reject(p: *Player) bool {
    p.rejected += 1;
    return false;
}

test "plausible moves are accepted, impossible ones are not, and hostile numbers are survived" {
    var p = Player{ .x = 100, .y = 100 };
    try std.testing.expect(acceptMove(&amp;p, .{ .seq = 1, .x = 104, .y = 100 }, 1.0 / 60.0)); // 4 units in 1/60 s is 240 u/s
    try std.testing.expect(!acceptMove(&amp;p, .{ .seq = 2, .x = 400, .y = 100 }, 1.0 / 60.0)); // teleport
    try std.testing.expect(!acceptMove(&amp;p, .{ .seq = 1, .x = 105, .y = 100 }, 1.0 / 60.0)); // replayed sequence
    try std.testing.expect(!acceptMove(&amp;p, .{ .seq = 3, .x = std.math.nan(f32), .y = 0 }, 1.0 / 60.0));
    try std.testing.expect(!acceptMove(&amp;p, .{ .seq = 4, .x = -5, .y = 100 }, 1.0 / 60.0));
    try std.testing.expectEqual(@as(f32, 104), p.x); // state only moved for the accepted move
    try std.testing.expectEqual(@as(u32, 4), p.rejected);
}</code></pre>
<h3>Hostile bytes</h3>
<p>Treat every incoming packet like a file from a stranger (the same rule as the save-file lesson): check the length before reading, never trust a count or index inside it, cap allocations, and parse with code that fails safely. Memory-unsafe parsers (C and C++) are where most real remote-code-execution bugs come from; bounds-checked code and fuzzing the parser with random and mutated packets finds them early.</p>
<h3>Denial of service</h3>
<ul><li>Rate limit by connection and by action; drop clients that flood.</li><li>Make the handshake <b>cheap for the server and expensive for the attacker</b> (stateless cookies so spoofed connection requests allocate nothing).</li><li>Cap per-connection memory and message size. Bound everything that grows with player input.</li><li>Do not let a small request trigger a large response (amplification).</li></ul>
<h3>Accounts, privacy and safety</h3>
<ul><li>Use established authentication (platform tokens, OAuth), never roll your own password storage; send secrets only over encrypted channels (TLS, DTLS).</li><li>Collect the minimum personal data, and know the rules that apply to you (GDPR, children's privacy laws). Chat and names need moderation tools: reporting, mutes, filters.</li><li>Log enough to investigate abuse, without logging secrets.</li></ul>
<h3>Anti-cheat: be realistic</h3>
<p>Client-side anti-cheat is an arms race and invasive; server authority and good design remove entire classes of cheating cheaply. Decide per game: a co-op game with friends needs little; a ranked competitive game needs authoritative servers, statistical detection, report tools and a ban process. Never put a secret in the client and assume it stays secret.</p>` },
        { pid: 'q-net4-1', type: 'quiz', q: 'In your card game the client sends "I played the Ace of Spades" and the server just applies it. What is wrong?',
          options: ['Nothing, it is efficient', 'The server must verify the player actually holds that card and that it is legal now; otherwise a modified client can play any card', 'The card name is too long', 'Cards should be sent as strings'], answer: 1, explain: 'The server owns the hands and the rules. Requests must be checked against the authoritative state.' },
        { pid: 'q-net4-2', type: 'quiz', q: 'Which design choice prevents wallhacks most completely?',
          options: ['Encrypt the packets', 'Do not send the positions of enemies the player cannot currently see (or could not know about); the server decides visibility', 'Hide the wallhack process', 'Make walls thicker'], answer: 1, explain: 'If the data is on the client, the client can read it, encrypted or not. Only data that is never sent is safe.' },
        { pid: 'q-net4-3', type: 'quiz', q: 'A loot box result is decided by a random number generated on the client and reported to the server. Why is that a problem?',
          options: ['It is slow', 'A modified client can always report the best result; randomness that matters must be rolled on the server', 'Random numbers cannot be sent', 'It uses too much bandwidth'], answer: 1, explain: 'Authority over outcomes must live where the player cannot change it.' },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
