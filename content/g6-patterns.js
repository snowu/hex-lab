/* Game dev section: game programming patterns. The catalogue follows Robert Nystrom's "Game Programming Patterns" (free at
   gameprogrammingpatterns.com), the best book on the subject. The explanations, code and exercises here are original.
   Code blocks marked data-check are complete and are compiled by scripts/validate-snippets.mjs. */
TRACKS.push({
  id: 'gdpatterns', domain: 'gamedev', icon: '🧩', title: 'Game Programming Patterns',
  blurb: 'The recurring solutions of game code: commands, events, state machines, pools, type objects, dirty flags, components, spatial partitions, bytecode, and when each one is the wrong tool.',
  lessons: [
    {
      id: 'pat-thinking', title: 'Thinking in patterns: sequencing', minutes: 30,
      summary: 'What a pattern is and costs, then the three that organise time in every game: the game loop, update methods and double buffering.',
      sections: [
        { type: 'text', html: `
<h3>What a pattern is (and is not)</h3>
<p>A <b>pattern</b> is a named solution to a problem that keeps coming back, written down with its trade-offs. The name matters as much as the code: saying "this is an event queue" lets a teammate understand the design in one sentence. It is not a template to stamp on everything. Every pattern has a <b>cost</b> (more indirection, more memory, harder debugging), and the cost is only worth paying when the problem is real.</p>
<p>Before applying any pattern ask three questions:</p>
<ol><li><b>What exact problem do I have?</b> "The code feels messy" is not one. "Adding a new enemy needs edits in six files" is.</li><li><b>What does the pattern cost here?</b> Indirection makes code harder to follow; caches go stale; queues add latency.</li><li><b>What is the simplest thing that works?</b> A function and a <code>switch</code> beats a framework for three cases. Wait for the third repetition before abstracting ("rule of three").</li></ol>
<p>Patterns in this track are grouped like the book that made them famous: <b>sequencing</b> (this lesson), <b>behaviour</b> (command, state, bytecode, type object), <b>decoupling</b> (observer, event queue, component, service locator) and <b>optimisation</b> (pool, flyweight, dirty flag, spatial partition, data locality). Each lesson ends with a coding drill in Zig and C++ so you build the data structure yourself.</p>
<h3>Game loop (recap)</h3>
<p>The first lesson of the game loop track covered it: input, update, render, with a fixed timestep for the simulation. The important property for patterns: <b>the loop is the only place that decides when things happen</b>. Everything else is a callback from it. When two systems fight over order, the answer is almost always in how the loop is organised.</p>
<h3>Update method</h3>
<p>Give every entity an <code>update(dt)</code> and let the loop call it. This is the pattern behind Godot's <code>_process</code> and <code>_physics_process</code>, Unity's <code>Update</code> and Unreal's <code>Tick</code>.</p>
<pre><code># GDScript: each node has its own update; the engine walks the tree
func _physics_process(delta):
    position += velocity * delta</code></pre>
<p>What it buys you: each object describes its own behaviour in isolation, and the loop does not need to know what objects exist. What to watch for:</p>
<ul><li><b>Order dependence.</b> If A updates before B, A sees B's <i>old</i> state and B sees A's <i>new</i> state. Bugs from this look like "the left enemy is always one frame ahead of the right one".</li><li><b>Adding and removing during the loop.</b> An object that spawns a bullet or kills itself while the list is being walked can skip, repeat or crash. Queue spawns and removals and apply them after the pass (Godot: <code>queue_free()</code> and <code>call_deferred</code> exist for this).</li><li><b>Too many tiny updates.</b> Ten thousand objects each doing a virtual call and touching different memory is slow. Systems that update arrays of plain data (see the data-locality lesson) fix that.</li><li><b>Time.</b> Pass <code>dt</code>, never count frames.</li></ul>
<h3>Double buffer</h3>
<p>Order dependence has a clean fix when the objects <i>read each other</i> during the update: keep <b>two copies</b> of the state. Everyone reads from the <b>current</b> copy and writes into the <b>next</b> one; when the pass ends, swap them. Now the result does not depend on the update order at all. Conway's Game of Life is the classic example: updating in place corrupts the neighbours that have not been processed yet.</p>
<pre><code data-check="zig">const std = @import("std");

const W = 8;
const H = 8;

/// One Game of Life generation. Reads only from \`cur\`, writes only to \`next\`.
fn step(cur: *const [W * H]bool, next: *[W * H]bool) void {
    for (0..H) |y| {
        for (0..W) |x| {
            var n: u8 = 0;
            for ([_]i32{ -1, 0, 1 }) |dy| {
                for ([_]i32{ -1, 0, 1 }) |dx| {
                    if (dx == 0 and dy == 0) continue;
                    const nx = @as(i32, @intCast(x)) + dx;
                    const ny = @as(i32, @intCast(y)) + dy;
                    if (nx &lt; 0 or ny &lt; 0 or nx &gt;= W or ny &gt;= H) continue;
                    if (cur[@as(usize, @intCast(ny)) * W + @as(usize, @intCast(nx))]) n += 1;
                }
            }
            const alive = cur[y * W + x];
            next[y * W + x] = n == 3 or (alive and n == 2);
        }
    }
}

test "a blinker flips between horizontal and vertical, whatever the update order" {
    var a: [W * H]bool = @splat(false);
    var b: [W * H]bool = @splat(false);
    a[3 * W + 2] = true;
    a[3 * W + 3] = true;
    a[3 * W + 4] = true;
    step(&amp;a, &amp;b);
    try std.testing.expect(b[2 * W + 3] and b[3 * W + 3] and b[4 * W + 3]);
    try std.testing.expect(!b[3 * W + 2] and !b[3 * W + 4]);
    step(&amp;b, &amp;a); // swap the roles of the two buffers
    try std.testing.expect(a[3 * W + 2] and a[3 * W + 3] and a[3 * W + 4]);
}</code></pre>
<p>Swapping is just exchanging which buffer plays which role (two pointers, no copying). The same idea is how graphics work: the GPU shows the <b>front buffer</b> while you draw into the <b>back buffer</b>, then they swap, so the player never sees a half-drawn frame. The cost is double the memory and, if the data is large, the time to copy or clear.</p>` },
        { pid: 'q-pat1-1', type: 'quiz', q: 'Enemy A and enemy B each move toward the other\'s position, updated in a loop. B always seems to react one frame later than A. What is the cause and the cleanest fix?',
          options: ['A floating point error; use doubles', 'Update order: A reads B\'s old position, B reads A\'s new one. Read from the previous state and write into a new one (double buffering), or compute all decisions first and move afterwards', 'The frame rate is too low', 'B has a bug in its AI'],
          answer: 1, explain: 'In-place updates make results depend on iteration order. Separating "decide from the old state" from "apply the new state" removes the asymmetry.' },
        { pid: 'q-pat1-2', type: 'quiz', q: 'Which statement about patterns is the most useful guideline?',
          options: ['Use as many as possible, they are best practice', 'Name the problem first, weigh the cost, and prefer the simplest solution until it hurts (about the third repetition)', 'Patterns only matter in object-oriented languages', 'A pattern is correct if it appears in a book'],
          answer: 1, explain: 'A pattern is a trade-off, not a virtue. Indirection and caches have real costs; unnecessary ones are the typical beginner mistake.' },
        { pid: 'bug-pat-update', type: 'bug', title: 'Spot the update-method bugs',
          prompt: '<p>An enemy manager in GDScript. Click the <b>3</b> lines that cause skipped updates, crashes or frame-rate dependence.</p>',
          code: String.raw`func _physics_process(delta):
    for e in enemies:
        e.position += e.velocity
        if e.hp <= 0:
            enemies.erase(e)
        elif e.wants_to_shoot():
            enemies.append(spawn_bullet(e))`,
          bugs: [{ line: 3, why: '<code>e.velocity</code> is added per frame, not per second. Multiply by <code>delta</code> so movement does not depend on the frame rate.' },
                 { line: 5, why: 'Erasing from the array being iterated skips the element that slides into the freed slot (or crashes in other languages). Mark the enemy dead and remove it after the loop, or iterate over a copy or backwards.' },
                 { line: 7, why: 'Appending to the array being iterated: the new bullet may or may not be visited this frame depending on the engine, and it is a different kind of object stored in the enemy list. Queue spawns and add them after the loop, into the right collection.' }],
          ok: [2, 4], hint: 'One is about time, two are about changing a list while walking it.' },
      ],
    },
    {
      id: 'pat-command', title: 'Command: actions as data', minutes: 30,
      summary: 'Turn "do this" into an object you can store, send, undo and replay. Input mapping, undo/redo and replays.',
      sections: [
        { type: 'text', html: `
<h3>The problem</h3>
<p>The straightforward input code is a pile of <code>if</code>s inside the player: <code>if Input.is_pressed("jump"): jump()</code>. It works until you want to <b>rebind keys</b>, let an <b>AI</b> drive the same character, <b>replay</b> a run, add <b>undo</b>, or send the player's actions over the <b>network</b>. All of those need the same thing: the action must exist as a <i>value</i>, separate from who decides it and when it runs.</p>
<h3>The pattern</h3>
<p>A <b>command</b> is an object (or just a piece of data) that represents "do this action". The code that produces commands (keyboard, gamepad, AI, network, replay file) is decoupled from the code that executes them.</p>
<pre><code># GDScript: input becomes commands, the actor executes them
class_name MoveCommand extends RefCounted
var dir: Vector2
func execute(actor): actor.move(dir)

# the player controller only produces commands
func _unhandled_input(event):
    if event.is_action_pressed("jump"):
        queue.push_back(JumpCommand.new())</code></pre>
<p>Because the AI now emits the same commands, an enemy and a player can drive the very same character class, and a "possess this unit" feature is a one-line change of who produces the commands.</p>
<h3>Undo and redo</h3>
<p>Add an <code>undo()</code> to each command. The cheap and robust way is to store what the command <i>changed</i> (the previous value) rather than computing the reverse action: moving a unit back by "-1 tile" fails if the move was blocked, but restoring the saved old position always works. Keep a stack of executed commands; <b>undo</b> pops and reverses, <b>redo</b> re-applies, and executing a <b>new</b> command clears the redo stack (the old future no longer exists). You write exactly this in the drill below.</p>
<h3>Replay and networking</h3>
<p>If commands are plain data and the simulation is <b>deterministic</b> (fixed timestep, seeded RNG, see the game loop and procgen lessons), then a replay is just <b>(seed, list of (frame, command))</b>: a few kilobytes for a whole match. Deterministic lockstep networking sends only the commands too. Both rely on the same rule: <i>the only way to change the world is through commands.</i> One direct write that bypasses them silently breaks every replay.</p>
<h3>Commands as data in Zig</h3>
<p>In a language with tagged unions a command is naturally a union and executing it is one <code>switch</code> (no virtual calls, trivially serialisable):</p>
<pre><code data-check="zig">const std = @import("std");

const Command = union(enum) {
    move: struct { dx: i32, dy: i32 },
    set_hp: i32,
    heal: i32,
};

const Actor = struct {
    x: i32 = 0,
    y: i32 = 0,
    hp: i32 = 10,

    fn execute(self: *Actor, c: Command) void {
        switch (c) {
            .move =&gt; |m| {
                self.x += m.dx;
                self.y += m.dy;
            },
            .set_hp =&gt; |v| self.hp = v,
            .heal =&gt; |v| self.hp = @min(self.hp + v, 10),
        }
    }
};

test "a recorded list of commands replays to the same state" {
    const log = [_]Command{ .{ .move = .{ .dx = 2, .dy = 0 } }, .{ .set_hp = 4 }, .{ .heal = 3 }, .{ .move = .{ .dx = 0, .dy = -1 } } };
    var a = Actor{};
    var b = Actor{};
    for (log) |c| a.execute(c);
    for (log) |c| b.execute(c);
    try std.testing.expectEqual(a, b);
    try std.testing.expectEqual(@as(i32, 7), a.hp);
}</code></pre>
<h3>Costs and variants</h3>
<ul><li><b>Memory</b> for history: cap the stack (the drill keeps the last 4) or store compact deltas.</li><li><b>Closures</b> can replace command classes (<code>func(): actor.move(dir)</code>) when you do not need to inspect or serialise them. Data commands (unions) can be saved to disk and sent over a network; closures cannot.</li><li><b>Compound commands</b>: one user gesture (drag-select and move 20 units) should be <b>one</b> undo step, so a command can hold a list of sub-commands.</li><li>The pattern is overkill for a game with one input mapping and no undo. Add it when the first of the needs above appears.</li></ul>` },
        { pid: 'drill-cmd', type: 'drill', ref: 'command_undo' },
        { pid: 'q-pat2-1', type: 'quiz', q: 'Why does a command usually store the <i>previous value</i> for undo instead of computing the reverse action?',
          options: ['It uses less memory', 'The reverse of an action is not always well defined (a blocked move, a clamped heal), restoring the saved value always is', 'It is faster', 'Undo is not possible otherwise'],
          answer: 1, explain: '"Heal by 3" at full health changed nothing, so "damage by 3" would be wrong. Restoring the old value is exact.' },
        { pid: 'q-pat2-2', type: 'quiz', q: 'A replay system records the player\'s commands and plays them back, but the replay diverges after 20 seconds. Which is the most likely cause?',
          options: ['Commands are too large', 'The simulation is not deterministic: wall-clock time, unseeded or shared RNG, a variable timestep, or a direct state change that bypasses commands', 'Replays only work for 20 seconds', 'The renderer is too slow'],
          answer: 1, explain: 'Replays assume the same inputs give the same results. Any hidden input (time, random, uninitialised memory) or hidden writer breaks that.' },
        { type: 'reveal', title: 'Design exercise: turn-based strategy undo', html: `<p>Units move, attack, and a unit can be killed by an attack. Players want to undo their <b>whole turn</b>, step by step.</p><ul><li>What does the <code>AttackCommand</code> need to store so undo can bring a dead unit back? (HP before, the unit itself kept in a graveyard list rather than freed, its tile.)</li><li>How do you make "move 5 units, then attack" undo as one step or as six? (compound command vs one per action: decide with the player\'s mental model.)</li><li>What if the attack rolled a random number? (Store the <i>result</i> in the command, or the RNG state, so redo gives the same outcome.)</li><li>What must <b>not</b> be in the history? (animations, sounds, UI state: derive those from state changes.)</li></ul>` },
      ],
    },
    {
      id: 'pat-observer', title: 'Observer and event queue', minutes: 35,
      summary: 'Let things react to each other without knowing each other: signals, callbacks, and queues that decouple in time.',
      sections: [
        { type: 'text', html: `
<h3>The problem</h3>
<p>The player picks up a coin. The score must go up, a sound must play, an achievement may unlock, the HUD must flash, analytics logs it. If the coin code calls all of those directly, the coin knows about the whole game, and removing the HUD breaks it. We want the coin to say <i>"I was collected"</i> and let whoever cares react.</p>
<h3>Observer</h3>
<p>The <b>subject</b> keeps a list of <b>observers</b> and calls each one when something happens. Godot's <b>signals</b>, C#'s <code>event</code>, JavaScript's <code>addEventListener</code> are all this.</p>
<pre><code># GDScript
signal collected(value)            # in coin.gd
func _on_body_entered(body):
    collected.emit(5)              # coin knows nothing about who listens

# somewhere else
coin.collected.connect(hud.add_score)</code></pre>
<p>In C++ an observer list is a vector of callbacks; in Zig a slice of function pointers plus a context pointer. The shape is always the same: <b>register, notify, unregister</b>.</p>
<h3>What goes wrong</h3>
<ul><li><b>Lifetime.</b> If a subscriber is destroyed but still registered, the next notification calls freed memory (C++/Zig crash) or a dead object (GDScript error). Always unregister in the destructor/<code>_exit_tree</code>, or use an engine that cleans up connections for you (Godot disconnects signals when either node is freed).</li><li><b>Re-entrancy.</b> A handler may add or remove observers, or trigger the same event again, <i>while the list is being walked</i>. Iterate over a copy, or defer the changes.</li><li><b>Order.</b> The order handlers run in is usually unspecified. If two handlers depend on each other's work, you have hidden coupling: make it explicit.</li><li><b>Invisible control flow.</b> "Who reacts to this event?" is not answered by reading the code that emits it. Keep events few and meaningful, name them in the past tense (<code>collected</code>, <code>died</code>), and avoid chains where handlers emit events that trigger handlers.</li><li><b>Leaks.</b> Connecting every time an object is respawned without disconnecting stacks up duplicate handlers (the "I get double score" bug).</li></ul>
<h3>Event queue: decoupling in time</h3>
<p>Observer still runs the handlers <i>right now</i>, inside the sender. That is a problem when a handler is slow (loading a sound) or when it is unsafe to run at that moment (you cannot delete an object in the middle of the physics step). An <b>event queue</b> stores the events and processes them later, at a point you choose in the frame. The sender fires and forgets; the receiver pulls when ready.</p>
<ul><li>Typical use: audio requests ("play explosion"), input events, game-wide messages, network messages, deferred UI updates.</li><li>Implementation: a <b>ring buffer</b> (you build one in the drill): fixed memory, O(1) push and pop, no allocation during play.</li><li><b>The design decision is the full-queue policy.</b> Drop the new event, drop the oldest, grow, block, or treat it as a bug. Use the simulation below to feel the difference. Audio can usually drop; a "level complete" event must never be lost.</li><li>Costs: events run later (latency, and the world may have changed since: carry the data you need in the event, not a pointer to something that may be gone), and debugging is harder because the stack trace no longer shows who sent it. Log or tag events with a sender id.</li></ul>
<h3>Observer, queue or direct call?</h3>
<table><tr><th>Use</th><th>When</th></tr>
<tr><td>Direct call</td><td>Two things that always go together. Do not decouple what is not independent.</td></tr>
<tr><td>Observer / signal</td><td>One source, several unrelated reactions, handled immediately and cheaply.</td></tr>
<tr><td>Event queue</td><td>Handling must wait for a safe point, can be slow, crosses threads, or the order and rate need control.</td></tr></table>` },
        { pid: 'sim-queue', type: 'sim', id: 'gdqueue', title: 'A ring-buffer event queue under load',
          intro: '<p>Events are produced at one rate and handled at another through a fixed-size queue. Change the rates and the "when full" policy.</p>',
          try: ['Set <b>produced</b> below <b>handled</b>: the queue stays nearly empty and nothing is dropped.', 'Press <b>burst ×10</b>: a short spike is absorbed by a bigger capacity, and dropped by a smaller one.', 'Raise <b>produced</b> above <b>handled</b> and watch it fill: no capacity solves a permanent overload, only a policy does.', 'Compare <b>drop the new event</b> and <b>drop the oldest</b>: which events would you rather lose in a game, the stale ones or the fresh ones?'] },
        { pid: 'drill-queue', type: 'drill', ref: 'event_queue' },
        { pid: 'bug-pat-observer', type: 'bug', title: 'Spot the observer bugs (C++)',
          prompt: '<p>A simple event hub. Click the <b>3</b> lines that cause crashes or missed notifications.</p>',
          code: String.raw`class Hub {
    std::vector<std::function<void(int)>> listeners_;
public:
    void subscribe(std::function<void(int)> f) { listeners_.push_back(f); }
    void emit(int v) {
        for (auto& f : listeners_) f(v);
    }
};
// somewhere in a Player class:
Player(Hub& h) { h.subscribe([this](int v) { on_event(v); }); }
~Player() {}`,
          bugs: [{ line: 4, why: 'There is no way to unsubscribe, so listeners can never be removed. Return a handle/id from subscribe and provide unsubscribe.' },
                 { line: 6, why: 'A listener may call <code>subscribe</code> (or unsubscribe) while this loop runs, which can reallocate the vector and invalidate the iteration (undefined behaviour). Iterate over a copy, or defer changes until emit finishes.' },
                 { line: 11, why: 'The lambda captures <code>this</code>, but the destructor never unsubscribes, so after a Player is destroyed the hub still calls a dangling pointer. Unsubscribe in the destructor (RAII handle).' }],
          ok: [5, 10], hint: 'One is missing API, one is mutation during iteration, one is a lifetime problem.' },
        { pid: 'q-pat3-1', type: 'quiz', q: 'A sound-effect request is sent every time any of 300 bullets hits something. On a busy frame the audio system stalls. Which design change helps most?',
          options: ['Call the audio function directly from each bullet for lowest latency', 'Push requests onto an event queue, merge or drop duplicates, and let the audio system pull a limited number per frame', 'Make the audio system a singleton', 'Run the bullets at a lower frame rate'],
          answer: 1, explain: 'A queue lets the receiver control the rate and policy (cap voices, merge identical sounds), instead of the senders overwhelming it.' },
        { pid: 'q-pat3-2', type: 'quiz', q: 'You connect a signal in <code>_ready()</code> of an enemy that is recycled from a pool, and never disconnect. After 50 respawns the player gets 50x score per kill. Why?',
          options: ['Godot signals are buggy', 'Each respawn ran the connection again without disconnecting, so the handler is registered many times', 'The score variable overflowed', 'Pools do not support signals'],
          answer: 1, explain: 'Connect once, or disconnect when returning the object to the pool. Duplicate registration is the classic "lapsed" and "duplicate listener" bug.' },
      ],
    },
    {
      id: 'pat-state', title: 'State, hierarchies and stacks', minutes: 30,
      summary: 'From a switch statement to state objects, hierarchical machines and the pushdown automaton that remembers where you came from.',
      sections: [
        { type: 'text', html: `
<h3>Where state machines come from</h3>
<p>Behaviour that depends on <i>what the character is currently doing</i> is a state machine, whether you call it that or not. The first version is booleans (<code>is_jumping</code>, <code>is_ducking</code>), which breed impossible combinations ("jumping and ducking and dead"). The <b>input, buffering and state machines</b> lesson showed the enum-and-switch version. This lesson goes further.</p>
<h3>Step 1: enum and switch</h3>
<p>One variable holds the state; one <code>match</code>/<code>switch</code> handles it. Good up to a handful of states. The compiler can check you handled every state (an exhaustive switch). It starts to hurt when each state needs its own data (how long have I been stunned?) and the function grows to hundreds of lines.</p>
<h3>Step 2: state objects (the State pattern)</h3>
<p>Each state becomes its own object or node with <code>enter()</code>, <code>exit()</code> and <code>update(dt)</code>. The actor holds a pointer to the current state and delegates to it. State-specific data lives inside the state, and adding a state is adding a file.</p>
<pre><code># GDScript: states as child nodes
class_name State extends Node
func enter(actor): pass
func exit(actor): pass
func update(actor, delta): pass            # return the next State, or null to stay

class_name Stunned extends State
var time_left := 0.6
func update(actor, delta):
    time_left -= delta
    return actor.get_node("States/Idle") if time_left &lt;= 0.0 else null</code></pre>
<p>Rules that keep it clean: <b>transitions happen in one place</b> (the machine, not scattered <code>state = X</code> assignments), <code>exit</code> of the old state always runs before <code>enter</code> of the new one, and a state that is re-entered starts fresh.</p>
<h3>Step 3: hierarchical state machines (HFSM)</h3>
<p>Many states share behaviour. "Walking", "running" and "idle" are all <i>grounded</i>: they all let you jump and they all fall off ledges the same way. Put the shared behaviour in a parent state (<code>Grounded</code>) and let children inherit it, so you write "if not on floor, go to Falling" once. A child handles an event first; if it ignores it, the parent gets it. This is how you stop the combinatorial explosion of "(every state) × (every shared reaction)".</p>
<h3>Step 4: concurrent machines</h3>
<p>A character has independent concerns: movement (idle, run, jump) and weapon (holstered, aiming, reloading). One machine for both needs 3 × 3 = 9 states and grows multiplicatively. Two <b>separate</b> machines that run side by side need 3 + 3, and only interact where they must (cannot sprint while reloading).</p>
<h3>Step 5: the pushdown automaton</h3>
<p>A plain machine has no memory: when "stunned" ends, how does it know to go back to "running" rather than "idle"? Keep a <b>stack</b> of states. <code>push</code> a new state on top (the old one pauses), <code>pop</code> to resume exactly what was underneath. This is how game <b>flow</b> works: main menu, in game, pause menu, options, confirm dialog. Each push/pop runs the lifecycle callbacks <code>enter</code>, <code>pause</code>, <code>unpause</code>, <code>exit</code>, which is where you stop music, freeze physics and release held keys. You build it in the drill.</p>
<h3>Behaviour trees: when states get too many</h3>
<p>For complex AI, hand-written transitions between 30 states become a web. Behaviour trees (AI track) make the decision logic a hierarchy that is re-evaluated each tick, and are often a better fit than a state machine for deciding <i>what to do</i>, while state machines remain good for managing <i>what you are currently doing</i> (animation, movement modes).</p>` },
        { pid: 'drill-statestack', type: 'drill', ref: 'state_stack' },
        { pid: 'q-pat4-1', type: 'quiz', q: 'A character can be walking, running, crouching or swimming, and also holding a bow, a sword or nothing. A single state machine now needs 12 states and keeps growing. What is the standard fix?',
          options: ['Add more booleans', 'Use two concurrent state machines (movement and equipment) that interact only where needed', 'Use inheritance with a class per combination', 'Remove features'], answer: 1, explain: 'Independent concerns multiply when forced into one machine (3 × 4 = 12) but only add when separated (3 + 4 = 7).' },
        { pid: 'q-pat4-2', type: 'quiz', q: 'Opening the pause menu from gameplay and closing it must return to <i>exactly</i> the gameplay state, including a half-finished jump. Which structure fits?',
          options: ['A plain enum state machine with a "previous_state" variable', 'A pushdown automaton: push the pause state on top, pop to resume the one below', 'A behaviour tree', 'A singleton'], answer: 1, explain: 'The stack keeps the paused states intact (with their data), and pop resumes them. A single previous_state breaks as soon as menus nest (pause then options then confirm).' },
        { type: 'reveal', title: 'Exercise: model the screens of a game as a pushdown stack', html: `<p>Draw the stack for this sequence and write the lifecycle events (enter/pause/unpause/exit) that fire: <i>title screen → press start (replace with gameplay) → open pause (push) → open options (push) → back (pop) → back (pop) → quit to title (replace).</i></p><ul><li>Which transitions are <b>push/pop</b> and which are <b>replace</b>? (Pause and options remember where you came from; start and quit do not.)</li><li>Where do you stop the music, and where do you resume it? (<code>pause</code>/<code>unpause</code> of gameplay, not <code>exit</code>.)</li><li>What happens to input held down while a screen is pushed? (Release it in <code>pause</code>, or the character keeps running after the menu closes.)</li></ul>` },
      ],
    },
    {
      id: 'pat-pool', title: 'Object pool, flyweight and data locality', minutes: 35,
      summary: 'Three optimisation patterns that all come from the same fact: memory access, not arithmetic, is the bottleneck.',
      sections: [
        { type: 'text', html: `
<h3>Why memory layout matters</h3>
<p>A modern CPU can do a few billion operations a second, but fetching a value from main memory takes the time of hundreds of operations. To hide that, it loads memory in <b>cache lines</b> (typically 64 bytes) and keeps recent ones in fast caches. Code that walks memory <b>in order</b> is fast; code that jumps around (following pointers to scattered objects) pays the full delay on every step. Many game optimisations are about keeping the data the loop needs <b>together</b>.</p>
<h3>Data locality: array of structs vs struct of arrays</h3>
<p>Suppose each particle has position, velocity, colour, lifetime and a few flags (64 bytes) and the update loop only needs position and velocity (16 bytes). With an <b>array of structs</b> (AoS) each cache line contains a quarter of one useful particle's data and the rest is dead weight. With a <b>struct of arrays</b> (SoA) the positions are contiguous and the loop reads only what it needs. ECS (see the architecture lessons) is this idea applied to the whole game.</p>
<pre><code data-check="zig">const std = @import("std");

// AoS: one record per particle. Convenient, but the update drags colour and flags through the cache.
const ParticleAos = struct { x: f32, y: f32, vx: f32, vy: f32, r: u8, g: u8, b: u8, alive: bool, life: f32 };

// SoA: one array per field. The movement loop touches only x, y, vx, vy.
const Particles = struct {
    x: [256]f32 = undefined,
    y: [256]f32 = undefined,
    vx: [256]f32 = undefined,
    vy: [256]f32 = undefined,
    count: usize = 0,

    fn update(self: *Particles, dt: f32) void {
        for (0..self.count) |i| {
            self.x[i] += self.vx[i] * dt;
            self.y[i] += self.vy[i] * dt;
        }
    }
};

test "the SoA update touches contiguous arrays" {
    var p = Particles{};
    p.count = 2;
    p.x[0] = 0;
    p.y[0] = 0;
    p.vx[0] = 10;
    p.vy[0] = -4;
    p.x[1] = 5;
    p.y[1] = 5;
    p.vx[1] = 0;
    p.vy[1] = 0;
    p.update(0.5);
    try std.testing.expectEqual(@as(f32, 5), p.x[0]);
    try std.testing.expectEqual(@as(f32, -2), p.y[0]);
    try std.testing.expectEqual(@as(f32, 5), p.x[1]);
    _ = ParticleAos;
}</code></pre>
<p>Rules of thumb: measure first. SoA wins when loops touch few fields of many objects; AoS wins when you usually touch all the fields of one object (a single character). Hot/cold splitting (keep rarely used data in a separate structure) is a middle path.</p>
<h3>Object pool</h3>
<p>Creating and destroying objects constantly (bullets, particles, enemies) costs allocator time, fragments memory and, in garbage-collected languages, causes pauses. A <b>pool</b> allocates all instances up front, hands them out and takes them back. A <b>free list</b> threaded through the unused slots makes both operations O(1) (you build it in the drill). Decisions to make explicitly:</p>
<ul><li><b>Exhausted:</b> refuse the request (a skipped bullet is nearly always better than a hitch), recycle the oldest, or grow in chunks.</li><li><b>Reset:</b> a recycled object must be fully re-initialised, or it keeps old state ("zombie bullet with the last owner's damage"). Have one <code>reset</code> function and call it on acquire.</li><li><b>Stale references:</b> if something still holds a pointer to a recycled object, it now points at a different bullet. Hand out <b>handles</b> (index plus a generation counter incremented on release) instead of raw pointers; a stale handle is detected because its generation no longer matches.</li></ul>
<p>In Godot, pools matter mostly for scenes that are expensive to instantiate; for plain data, arrays of structs (SoA) are the more effective way.</p>
<h3>Flyweight</h3>
<p>If 10,000 trees each store their own copy of the mesh, the texture and the species stats, memory explodes. A <b>flyweight</b> splits an object into <b>shared, immutable</b> data (the tree type: one copy) and <b>per-instance</b> data (position, age: tiny). Every instance holds a reference or index to the shared part. Tile maps are the everyday example: the map stores a small integer per cell, and the integer indexes a table of tile definitions (texture, solidity, cost). The related <b>type object</b> pattern is the next lesson.</p>` },
        { pid: 'drill-pool', type: 'drill', ref: 'free_list_pool' },
        { pid: 'q-pat5-1', type: 'quiz', q: 'A loop updates positions of 50,000 particles that each also store colour, name and AI data. Updating is slow even though the maths is trivial. What is the most effective change?',
          options: ['Use faster maths functions', 'Store positions and velocities in their own contiguous arrays (struct of arrays) so the loop reads only what it needs', 'Use virtual functions per particle', 'Sort the particles by name'], answer: 1, explain: 'The cost is cache misses from moving unneeded bytes. Contiguous hot data fixes it.' },
        { pid: 'q-pat5-2', type: 'quiz', q: 'A pooled bullet is released and reused for a different shooter. An old turret still holds its index and keeps "tracking" the bullet. What prevents this class of bug?',
          options: ['A bigger pool', 'Handles that carry a generation counter, so a stale handle no longer matches', 'Making the bullet const', 'Disabling the turret'], answer: 1, explain: 'Index + generation: when a slot is recycled its generation changes, and any old handle fails validation instead of silently pointing at the new object.' },
        { pid: 'bug-pat-pool', type: 'bug', title: 'Spot the object pool bugs (C++)',
          prompt: '<p>A bullet pool. Click the <b>3</b> lines that cause stale state, leaks or crashes.</p>',
          code: String.raw`struct Bullet { float x, y, vx, vy; int damage; bool alive; };

Bullet* BulletPool::spawn(float x, float y) {
    for (auto& b : bullets_) {
        if (!b.alive) {
            b.x = x; b.y = y;
            b.alive = true;
            return &b;
        }
    }
    bullets_.push_back(Bullet{x, y, 0, 0, 1, true});
    return &bullets_.back();
}`,
          bugs: [{ line: 6, why: 'A recycled bullet only gets x and y reset: <code>vx</code>, <code>vy</code> and <code>damage</code> keep the previous bullet\'s values. Re-initialise the whole object (a <code>reset()</code> or assigning a fresh <code>Bullet{}</code>).' },
                 { line: 11, why: 'The pool is supposed to be fixed-size, but when full it quietly grows with <code>push_back</code>, defeating the purpose and (on a vector) reallocating, which invalidates every pointer handed out earlier. Return nothing when exhausted.' },
                 { line: 12, why: 'Returning a pointer to the vector\'s back element: any later growth moves all elements, leaving earlier pointers dangling. Use stable storage (fixed array) or hand out indices/handles.' }],
          ok: [4, 5], hint: 'One is incomplete reset, two are about the vector growing.' },
      ],
    },
    {
      id: 'pat-type-object', title: 'Type object, prototype and data-driven design', minutes: 30,
      summary: 'Make "kinds of thing" into data, let designers add content without code, and resolve inheritance once.',
      sections: [
        { type: 'text', html: `
<h3>The class explosion</h3>
<p>The first instinct for a game with many monsters is a class per monster: <code>Goblin</code>, <code>Orc</code>, <code>GoblinChief</code>, <code>FireGoblin</code>... Every new variant needs code, a recompile, and a programmer. Most of those classes differ only in <b>numbers and references</b> (hp 10 vs 25, which sprite, which attack). That is data, not behaviour.</p>
<h3>Type object</h3>
<p>Create <b>one</b> <code>Monster</code> class and a separate <code>MonsterType</code> object that holds the shared definition. Each monster instance has a reference to its type. "Goblin" and "Orc" become <b>rows of data</b> that designers can add without touching code.</p>
<pre><code># GDScript: a type is a Resource, edited in the inspector, saved as a .tres file
class_name EnemyType extends Resource
@export var display_name := "Goblin"
@export var max_hp := 10
@export var speed := 3.0
@export var sprite: Texture2D
@export var parent: EnemyType            # inherit anything not set here

# the one Monster class
class_name Enemy extends CharacterBody2D
var type: EnemyType
func setup(t: EnemyType): type = t; hp = t.max_hp</code></pre>
<p>This is also how you separate <b>engine code</b> from <b>game content</b>. The same pattern drives weapons, items, spells, tiles, quests and levels. Godot <code>Resource</code> files and Unity <code>ScriptableObject</code> assets are this pattern with an editor.</p>
<h3>Prototype and inheritance between types</h3>
<p>"Elite goblin chief" is the goblin with a few overrides. Let a type name a <b>parent</b> and only store what differs. To read a stat, walk up the chain until a type sets it (you implement exactly this in the drill). The older name for the idea is <b>prototype</b> (JavaScript's prototype chain is the same mechanism). Two design points:</p>
<ul><li><b>Resolve once, not per frame.</b> Flatten the chain into a final table at load time. Looking up the chain inside the update loop wastes time.</li><li><b>Make the source visible.</b> When a goblin has 25 hp, designers must be able to see <i>which ancestor said so</i>. Tooling that shows the inherited value in a different colour prevents hours of confusion.</li><li><b>Reject cycles and missing parents</b> at load time with a clear error that names the file.</li></ul>
<h3>Data-driven design: how far to go</h3>
<p>You can push more and more into data: stats, then spawn tables and wave definitions, then ability <i>parameters</i>, then whole behaviours expressed as data (a list of effects, or bytecode, see the bytecode lesson). The trade-off is that the more behaviour lives in data, the more you need a data language, validation and tooling, and the harder debugging gets. A good boundary: <b>if a designer will want to change it weekly, it is data; if it changes how the engine works, it is code.</b></p>
<p>Practical rules: reference other things by <b>stable string ids</b> ("iron_sword"), never by array index; validate data on load and report the file and field; keep derived values (damage per second) computed, not stored; version your data files (see the save-file lesson).</p>` },
        { pid: 'drill-typeobj', type: 'drill', ref: 'type_object' },
        { pid: 'q-pat6-1', type: 'quiz', q: 'You have 40 enemy kinds, and designers want to add new ones weekly. Which structure fits?',
          options: ['A subclass per enemy kind', 'One Enemy class that references an EnemyType data object (a type object), with kinds defined in data files', 'A giant switch statement on an enemy id inside Enemy', 'Copy-pasting the Goblin class'], answer: 1, explain: 'Type objects let non-programmers add kinds and keep the code small. Subclasses and switches need a programmer and a rebuild for every new kind.' },
        { pid: 'q-pat6-2', type: 'quiz', q: 'Where should you resolve "an elite goblin inherits hp from goblin and speed from elite" for the best performance?',
          options: ['Every frame, when the stat is read', 'Once at load time, flattening each type into a final table', 'Only when the enemy dies', 'In the shader'], answer: 1, explain: 'Walking a parent chain in the hot loop is wasted work; flatten at load and keep the original definitions for tooling.' },
        { type: 'reveal', title: 'Exercise: design the data for weapons', html: `<p>You want swords, axes, bows and staffs; each can be upgraded, some shoot projectiles, some apply fire damage.</p><ul><li>List the <b>stats</b> (damage, speed, range) and the <b>references</b> (sprite, sound, projectile type) a <code>WeaponType</code> needs.</li><li>Which weapons use <b>inheritance</b>? ("Flame sword" = sword + fire damage.)</li><li>Where does a behaviour that does not fit a number go ("chain lightning jumps to 3 nearby enemies")? Options: a small set of named effect types with parameters (data), or a script reference. Which would you choose for 10 weapons? For 500?</li><li>What validation would you run at load time?</li></ul>` },
      ],
    },
    {
      id: 'pat-dirty', title: 'Dirty flag and caching', minutes: 25,
      summary: 'Do expensive work only when its inputs changed, and the cache-invalidation bugs that come with it.',
      sections: [
        { type: 'text', html: `
<h3>The problem</h3>
<p>Some values are expensive to compute from other values: a node's world transform from its parents, a bounding box from its children, the shortest path from the map, the layout of a UI panel, the total weight of an inventory. Recomputing them every frame is wasteful when almost nothing changed. Computing them only when something <i>did</i> change is a cache, and the hard part of any cache is knowing when it is stale.</p>
<h3>The pattern</h3>
<p>Keep a boolean next to the cached value. <b>Every code path that changes an input sets the flag.</b> When someone reads the value: if the flag is clear, return the cache; otherwise recompute, store, clear the flag.</p>
<pre><code># GDScript
var _dirty := true
var _cached_weight := 0.0

func add_item(item):
    items.append(item)
    _dirty = true                     # the invariant: any change marks it dirty

func total_weight() -> float:
    if _dirty:
        _cached_weight = items.reduce(func(a, i): return a + i.weight, 0.0)
        _dirty = false
    return _cached_weight</code></pre>
<h3>Hierarchies: propagate the flag down</h3>
<p>In a transform tree, moving a node changes the world transform of <b>all its descendants</b>. So <code>set_local</code> marks the node and every descendant dirty; reading a world value cleans only the nodes you actually read, parent first. Siblings and ancestors are not touched. This is exactly the structure in the drill, and the reason Godot's <code>Node2D.global_position</code> is cheap to read repeatedly.</p>
<h3>When to clean: lazily or in a batch</h3>
<ul><li><b>Lazy (on read):</b> pay only for what is used, but a read might unexpectedly be slow (a hitch the first time something is read after a big change).</li><li><b>Batch (once per frame at a known point):</b> predictable cost, but you may compute things nobody reads, and reads before the clean see stale data.</li></ul>
<h3>The bugs</h3>
<ul><li><b>Forgetting to set the flag</b> on one path (a second setter, a method that changes the data directly, loading a save). The symptom is "the value is wrong until something unrelated triggers a refresh". Funnel all writes through one function, or make the data private so only code that sets the flag can modify it.</li><li><b>Stale reads in the same frame</b> when cleaning is batched.</li><li><b>Cleaning too eagerly</b>: marking dirty on every write and recomputing on every read can be slower than no cache if reads and writes alternate. Measure.</li><li>The related patterns: <b>double buffering</b> (sequencing lesson) and <b>memoization</b> with an explicit key. A <b>version number</b> instead of a boolean ("recompute if my inputs' versions changed") avoids one-dirty-flag-per-reader when many consumers cache the same source.</li></ul>
<h3>Where games use it</h3>
<p>Transform hierarchies, physics shape updates, navmesh rebuilds, text and UI layout, lighting rebuilds, "the save is out of date" prompts, and shader parameter uploads. Rule: <b>if a value is derived and read more often than it changes, give it a dirty flag.</b></p>` },
        { pid: 'drill-dirty', type: 'drill', ref: 'dirty_flag' },
        { pid: 'q-pat7-1', type: 'quiz', q: 'You moved a parent node, but a child\'s world position is still the old one until the next frame. Which is the most likely mistake?',
          options: ['The child needs a bigger hitbox', 'Moving the parent did not mark its descendants dirty, so their cached world transforms were reused', 'Floating point error', 'The GPU is late'], answer: 1, explain: 'A dirty flag only works if every change to an input invalidates every dependent cache, including the children.' },
        { pid: 'q-pat7-2', type: 'quiz', q: 'A dirty-flag cache sits next to a value that is written 1000 times a frame and read once a frame. Which is the better cleaning strategy?',
          options: ['Recompute on every write', 'Mark dirty on writes (cheap) and recompute lazily once, on the read', 'Never cache', 'Recompute on a timer'], answer: 1, explain: 'Writes only set a boolean; the expensive work happens once when the value is actually needed.' },
        { pid: 'bug-pat-dirty', type: 'bug', title: 'Spot the stale-cache bugs',
          prompt: '<p>A GDScript inventory with a cached total. Click the <b>2</b> lines that let the cache go stale.</p>',
          code: String.raw`var items := []
var _dirty := true
var _total := 0

func add(item):
    items.append(item)
    _dirty = true

func remove_at(i):
    items.remove_at(i)

func load_from(data):
    items = data.items
    _dirty = false

func total() -> int:
    if _dirty:
        _total = items.reduce(func(a, it): return a + it.weight, 0)
        _dirty = false
    return _total`,
          bugs: [{ line: 10, why: '<code>remove_at</code> changes the inputs but never sets <code>_dirty</code>, so the total keeps counting the removed item.' },
                 { line: 14, why: 'Loading new items must <b>invalidate</b> the cache (<code>_dirty = true</code>); setting it to false claims the old total is still valid for the new data.' }],
          ok: [6, 7], hint: 'Look for the writers of items. One forgets the flag, one clears it by mistake.' },
      ],
    },
    {
      id: 'pat-component', title: 'Component, subclass sandbox and service locator', minutes: 35,
      summary: 'Compose entities from parts, give subclasses a safe toolbox, and reach shared services without global state.',
      sections: [
        { type: 'text', html: `
<h3>Component: composition over inheritance</h3>
<p>The earlier entities lesson introduced the idea; here is the pattern in detail. Instead of one huge <code>GameObject</code> class that handles input, physics, rendering and AI (a "god object"), split it into <b>components</b>, each owning one concern: <code>Health</code>, <code>Mover</code>, <code>SpriteRenderer</code>, <code>PlayerInput</code>. An entity is a container of components. Reuse comes from <i>combining</i>: a crate is <code>Sprite + Collider + Health</code>; an enemy adds <code>AIBrain</code>; a trap is <code>Collider + DamageOnTouch</code>, with no inheritance tree.</p>
<p>The design question is <b>how components talk</b>:</p>
<ul><li><b>Direct reference</b>: <code>AIBrain</code> asks its entity for the <code>Mover</code> component and calls it. Simple; creates coupling between those two component types.</li><li><b>Messages/signals</b>: <code>Health</code> emits <code>died</code>, others react (observer lesson). Loosest coupling, hardest to follow.</li><li><b>Shared data</b>: components read and write a shared state object (a blackboard). Good when many systems need the same facts (position, target).</li></ul>
<p>A common mistake is a component that needs half the other components to function: that is one component pretending to be several.</p>
<h3>Subclass sandbox</h3>
<p>Sometimes inheritance <i>is</i> the right tool, if used carefully. In the <b>subclass sandbox</b> pattern a base class provides a protected toolbox of operations (<code>play_sound()</code>, <code>spawn_particles()</code>, <code>move_toward()</code>), and subclasses implement one <b>virtual method</b> (<code>activate()</code>) using only those operations. Superpowers are written as subclasses without ever touching the audio or particle systems directly.</p>
<pre><code># GDScript: Godot's own Node virtuals (_ready, _process) are this pattern
class_name Power extends Node
func activate(hero): pass                     # subclasses override
func _play(sound): Audio.play(sound)          # the toolbox
func _burst(pos): Particles.burst(pos)

class_name Fireball extends Power
func activate(hero):
    _play("whoosh"); _burst(hero.position)</code></pre>
<p>Benefits: the coupling between 100 powers and the engine is concentrated in the base class, so refactoring the engine changes one file. Costs: the base class tends to grow into a kitchen sink, and deep hierarchies are fragile ("fragile base class"). Keep the hierarchy one level deep, and prefer data (type objects) when subclasses differ only in numbers.</p>
<h3>Service locator, dependency injection and autoloads</h3>
<p>Code needs shared services (audio, save system, input, random). How does it get them?</p>
<ol><li><b>Global singleton</b>: <code>Audio.play()</code> from anywhere. Easy, and a trap (next lesson).</li><li><b>Service locator</b>: a small registry that holds the current implementations: <code>Services.audio().play(...)</code>. Callers depend on the <i>interface</i>, not a concrete class, and you can swap implementations: a <b>null service</b> that does nothing (tests, headless servers), a <b>logging decorator</b> that wraps the real one for debugging.</li><li><b>Dependency injection</b>: pass what you need into the constructor or <code>setup()</code>. Explicit and easy to test; some plumbing.</li></ol>
<pre><code data-check="zig">const std = @import("std");

/// The interface callers depend on: a pointer to some implementation plus a function.
const Audio = struct {
    ctx: *anyopaque,
    playFn: *const fn (ctx: *anyopaque, id: u32) void,

    fn play(self: Audio, id: u32) void {
        self.playFn(self.ctx, id);
    }
};

/// A real implementation would talk to the sound card; this one counts calls.
const CountingAudio = struct {
    plays: u32 = 0,

    fn playImpl(ctx: *anyopaque, id: u32) void {
        _ = id;
        const self: *CountingAudio = @ptrCast(@alignCast(ctx));
        self.plays += 1;
    }

    fn audio(self: *CountingAudio) Audio {
        return .{ .ctx = self, .playFn = playImpl };
    }
};

/// The null service: does nothing, so callers never check for "no audio".
fn nullPlay(ctx: *anyopaque, id: u32) void {
    _ = ctx;
    _ = id;
}

var null_ctx: u8 = 0; // lives for the whole program, so the null service never holds a dangling pointer

const Locator = struct {
    audio: Audio,

    fn provideNull() Locator {
        return .{ .audio = .{ .ctx = &amp;null_ctx, .playFn = nullPlay } };
    }
};

test "callers use the interface, tests plug in a counter" {
    var counting = CountingAudio{};
    const services = Locator{ .audio = counting.audio() };
    services.audio.play(1);
    services.audio.play(2);
    try std.testing.expectEqual(@as(u32, 2), counting.plays);
    const silent = Locator.provideNull();
    silent.audio.play(3); // no crash, no sound
}</code></pre>
<p>Locators hide dependencies (you cannot see from a function's signature that it needs audio) and must be set up before use. Prefer injection for core logic and a locator for cross-cutting services. In Godot an <b>autoload</b> is a global singleton node: fine for a few thin services (audio bus, settings), a liability for game state.</p>` },
        { pid: 'q-pat8-1', type: 'quiz', q: 'A <code>Health</code> component needs to tell the UI and the sound system when it reaches zero, without either being referenced by Health. What mechanism fits?',
          options: ['Health calls UI.update() and Sound.play() directly', 'Health emits a <code>died</code> signal/event and the others subscribe', 'Health becomes a singleton', 'UI polls Health every frame and Sound polls too'], answer: 1, explain: 'The component announces what happened and does not know who listens, so it stays reusable (the same Health on a crate with no UI).' },
        { pid: 'q-pat8-2', type: 'quiz', q: 'What is the practical benefit of a <i>null service</i> in a service locator?',
          options: ['It is faster than a real service', 'Callers never need to check whether the service exists, and tests or headless builds run with silent, harmless implementations', 'It saves memory', 'It replaces dependency injection'], answer: 1, explain: 'A null object removes "if audio is not None" branches everywhere and makes automated tests possible without a sound device.' },
        { pid: 'q-pat8-3', type: 'quiz', q: 'You have 60 enemy types that differ in stats and a few that have unique attack code. Which structure is best?',
          options: ['60 subclasses', 'A type object for the shared stats, and a small number of attack behaviours (components, scripts or a subclass sandbox) chosen by the type', 'One enormous switch in Enemy', 'Copy the Enemy scene 60 times'], answer: 1, explain: 'Data for what is data, code only for what really differs: that keeps the number of classes to the number of behaviours, not the number of stat sheets.' },
      ],
    },
    {
      id: 'pat-spatial', title: 'Spatial partitioning', minutes: 30,
      summary: 'Grids, quadtrees and bounding volume hierarchies: finding what is near without looking at everything.',
      sections: [
        { type: 'text', html: `
<h3>The problem</h3>
<p>"Which enemies are within 200 pixels of the player?", "what does this bullet collide with?", "which objects are visible?". The naive answer checks every object: O(n) per query, O(n²) for all pairs. With 5,000 objects that is 12 million pair checks per frame. <b>Spatial partitioning</b> stores objects in a structure organised by position so a query only visits the neighbourhood.</p>
<h3>Uniform grid (and spatial hash)</h3>
<p>Divide space into equal cells. Each cell holds a list of the objects inside it. A query looks at the cells the query region overlaps. Insertion is O(1), queries are proportional to the number of nearby objects. Variations: a fixed 2D array (fast; needs bounded space) or a <b>hash map</b> from cell coordinates to a list (unbounded space, no empty-cell memory). The drill in the performance lesson builds one.</p>
<ul><li><b>Cell size</b> is the knob: about the typical query radius or object size. Too small: a query touches many cells and objects span several. Too large: each cell holds too many objects.</li><li><b>Moving objects</b>: rebuild every frame (simple, often the fastest for dynamic crowds) or move an object between cells only when it crosses a boundary.</li><li><b>Big objects</b> (a huge boss) overlap many cells; insert it into all of them or into a separate "large objects" list.</li><li>Weak when density is very uneven (a crowd in one corner of a big empty map).</li></ul>
<h3>Quadtree (octree in 3D)</h3>
<p>A tree that <b>subdivides</b> a region into four quadrants only where there are many objects. Dense areas get deep, fine cells; empty areas stay one big cell. Queries descend only into quadrants that overlap the query. Good for uneven density and static or slowly moving objects; costlier to update than a grid when everything moves each frame. A <b>loose quadtree</b> lets nodes overlap by a margin so a moving object rarely needs to change nodes.</p>
<h3>Bounding volume hierarchy (BVH)</h3>
<p>A tree where each node stores a bounding box of everything below it, built from the objects rather than from fixed space. Queries skip a whole subtree when its box misses. This is what most physics engines use for their broadphase (Box2D's dynamic tree) and what ray tracers use. It handles objects of very different sizes well, and supports dynamic updates by refitting boxes.</p>
<h3>Sweep and prune</h3>
<p>Sort object bounds along one axis and only compare overlapping neighbours in the sorted list. When objects move a little each frame, the list is almost sorted already, so re-sorting is cheap. Used in physics engines for large scenes with mostly coherent motion.</p>
<h3>Choosing</h3>
<table><tr><th>Situation</th><th>Reach for</th></tr>
<tr><td>Many similar-sized moving objects (bullets, crowd)</td><td>Uniform grid / spatial hash, rebuilt each frame</td></tr>
<tr><td>Very uneven density, mostly static</td><td>Quadtree</td></tr>
<tr><td>Objects of very different sizes, raycasts, dynamic scenes</td><td>BVH / dynamic tree</td></tr>
<tr><td>A few hundred objects</td><td>Brute force. Do not add a structure you cannot justify with a measurement.</td></tr></table>
<p>Engines already include a broadphase (Godot, Box2D, Jolt). Build your own for <i>non-physics</i> queries: AI perception, crowd avoidance, pickups in range, "everything inside this explosion".</p>
<h3>A quadtree in Zig (insert and query)</h3>
<pre><code data-check="zig">const std = @import("std");

const Rect = struct { x: f32, y: f32, w: f32, h: f32 };

fn overlaps(a: Rect, b: Rect) bool {
    return a.x &lt; b.x + b.w and b.x &lt; a.x + a.w and a.y &lt; b.y + b.h and b.y &lt; a.y + a.h;
}

/// A tiny point quadtree with fixed capacity per leaf and a depth limit, no allocation (children live in a flat array).
const Quad = struct {
    const cap = 4;
    const max_nodes = 64;

    const Node = struct { bounds: Rect, pts: [cap][2]f32 = undefined, n: usize = 0, kids: ?usize = null };

    nodes: [max_nodes]Node = undefined,
    count: usize = 1,

    fn init(bounds: Rect) Quad {
        var q = Quad{};
        q.nodes[0] = .{ .bounds = bounds };
        return q;
    }

    fn insert(self: *Quad, node: usize, x: f32, y: f32, depth: u8) bool {
        const b = self.nodes[node].bounds;
        if (x &lt; b.x or y &lt; b.y or x &gt;= b.x + b.w or y &gt;= b.y + b.h) return false;
        if (self.nodes[node].kids == null) {
            if (self.nodes[node].n &lt; cap or depth &gt;= 3 or self.count + 4 &gt; max_nodes) {
                if (self.nodes[node].n == cap) return false; // full at max depth: a real tree would use an overflow list
                const n = self.nodes[node].n;
                self.nodes[node].pts[n] = .{ x, y };
                self.nodes[node].n += 1;
                return true;
            }
            self.split(node);
        }
        const k = self.nodes[node].kids.?;
        for (0..4) |i| if (self.insert(k + i, x, y, depth + 1)) return true;
        return false;
    }

    fn split(self: *Quad, node: usize) void {
        const b = self.nodes[node].bounds;
        const hw = b.w / 2;
        const hh = b.h / 2;
        const first = self.count;
        self.count += 4;
        self.nodes[first] = .{ .bounds = .{ .x = b.x, .y = b.y, .w = hw, .h = hh } };
        self.nodes[first + 1] = .{ .bounds = .{ .x = b.x + hw, .y = b.y, .w = hw, .h = hh } };
        self.nodes[first + 2] = .{ .bounds = .{ .x = b.x, .y = b.y + hh, .w = hw, .h = hh } };
        self.nodes[first + 3] = .{ .bounds = .{ .x = b.x + hw, .y = b.y + hh, .w = hw, .h = hh } };
        self.nodes[node].kids = first;
        const old = self.nodes[node];
        self.nodes[node].n = 0;
        for (old.pts[0..old.n]) |p| _ = self.insert(node, p[0], p[1], 99); // depth 99: reinsert into the children
    }

    /// How many points are inside the query rectangle. Subtrees whose bounds miss the query are skipped.
    fn countIn(self: *const Quad, node: usize, q: Rect) usize {
        if (!overlaps(self.nodes[node].bounds, q)) return 0;
        var total: usize = 0;
        for (self.nodes[node].pts[0..self.nodes[node].n]) |p| {
            if (p[0] &gt;= q.x and p[0] &lt; q.x + q.w and p[1] &gt;= q.y and p[1] &lt; q.y + q.h) total += 1;
        }
        if (self.nodes[node].kids) |k| for (0..4) |i| {
            total += self.countIn(k + i, q);
        };
        return total;
    }
};

test "a query only counts the points inside it" {
    var q = Quad.init(.{ .x = 0, .y = 0, .w = 100, .h = 100 });
    var i: u32 = 0;
    while (i &lt; 30) : (i += 1) {
        const x: f32 = @floatFromInt((i * 37) % 100);
        const y: f32 = @floatFromInt((i * 61) % 100);
        try std.testing.expect(q.insert(0, x, y, 0));
    }
    try std.testing.expectEqual(@as(usize, 30), q.countIn(0, .{ .x = 0, .y = 0, .w = 100, .h = 100 }));
    var brute: usize = 0;
    i = 0;
    while (i &lt; 30) : (i += 1) {
        const x: f32 = @floatFromInt((i * 37) % 100);
        const y: f32 = @floatFromInt((i * 61) % 100);
        if (x &gt;= 10 and x &lt; 40 and y &gt;= 20 and y &lt; 70) brute += 1;
    }
    try std.testing.expectEqual(brute, q.countIn(0, .{ .x = 10, .y = 20, .w = 30, .h = 50 }));
}</code></pre>` },
        { pid: 'q-pat9-1', type: 'quiz', q: '2,000 bullets of equal size move every frame and must find nearby enemies. Which structure is usually best?',
          options: ['A quadtree updated incrementally', 'A uniform grid or spatial hash rebuilt every frame', 'A sorted list by name', 'Brute force over all pairs'], answer: 1, explain: 'Rebuilding a grid is O(n) with tiny constants, and equal-sized movers suit a single cell size.' },
        { pid: 'q-pat9-2', type: 'quiz', q: 'A quadtree is slow because everything moves every frame and many objects keep changing nodes. Which change helps?',
          options: ['Make the tree deeper', 'Use a loose quadtree (nodes overlap by a margin) or switch to a rebuilt grid', 'Sort objects by id', 'Query less often than once a day'], answer: 1, explain: 'Loose nodes let small moves stay in the same node. For fully dynamic data a grid rebuild is often cheaper than maintaining a tree.' },
        { pid: 'q-pat9-3', type: 'quiz', q: 'You have 150 enemies and the AI perception check is fast. A teammate proposes adding a quadtree. What is the best response?',
          options: ['Add it, structures are always faster', 'Measure first: at that size brute force is probably fine, and a structure adds code and bugs for no gain', 'Use a BVH instead', 'Remove perception'], answer: 1, explain: 'Optimisation without a measurement is guessing. Small n does not need acceleration structures.' },
      ],
    },
    {
      id: 'pat-bytecode', title: 'Bytecode, scripting and data languages', minutes: 35,
      summary: 'Why games embed interpreters, how a stack machine works, and where to draw the line between code and scripts.',
      sections: [
        { type: 'text', html: `
<h3>Why not just write it in the engine language?</h3>
<p>Native code is fast, but it has costs that games feel sharply: <b>iteration time</b> (recompiling a C++ or Zig game to tweak a boss takes minutes), <b>safety</b> (a modder's or designer's bug must not crash the game or hang it in an infinite loop), <b>who can write it</b> (designers, modders), and <b>portability</b> (the same behaviour on every platform). The answer in most engines is a <b>scripting layer</b>: GDScript in Godot, C# in Unity, Blueprints in Unreal, Lua in many studio engines.</p>
<h3>Levels of "behaviour as data"</h3>
<ol><li><b>Numbers</b>: damage 12, cooldown 0.4 (type object, previous lessons).</li><li><b>Choices of built-in behaviour</b>: "effect: burn, duration 3, damage 2". A fixed menu of effects with parameters. The easiest to make safe and fast.</li><li><b>Expressions</b>: damage = <code>10 + level * 2</code>. A tiny expression language, usually parsed at load time.</li><li><b>Programs</b>: loops, variables, conditions. Now you have a real language, and the safety questions begin.</li></ol>
<p>Move down the list only when the level above cannot express what designers need. Each step multiplies the work of tooling, error messages and debugging.</p>
<h3>Bytecode: a virtual machine</h3>
<p>The <b>bytecode</b> pattern defines a tiny instruction set and an interpreter loop that runs it, so behaviour is stored as a flat array of instructions. A <b>stack machine</b> is the simplest design: instructions pop operands from a stack and push results. <code>(2 + 3) * 4</code> compiles to <code>push 2, push 3, add, push 4, mul</code>. Jumps give you loops and conditions. You write this interpreter in the drill.</p>
<pre><code># the interpreter is a loop and a switch
while true:
    op = program[pc]; pc += 1
    match op.kind:
        PUSH:  stack.push(op.arg)
        ADD:   b = stack.pop(); a = stack.pop(); stack.push(a + b)
        JZ:    if stack.pop() == 0: pc = op.arg
        HALT:  return stack.pop()</code></pre>
<h3>What the VM gives you</h3>
<ul><li><b>Sandboxing.</b> The script can only do what instructions allow. A <b>step limit</b> stops infinite loops, a stack limit stops runaway recursion, bounds-checked access stops memory errors. The host cannot be crashed by script bugs.</li><li><b>Determinism and serialisation.</b> A program is plain data: saveable, sendable over a network, diff-able, replayable.</li><li><b>Hot reload.</b> Swap the program array while the game runs.</li><li><b>Portability.</b> The same bytecode runs on every platform the VM runs on (WebAssembly is this idea taken to its conclusion).</li></ul>
<h3>Stack vs register machines, and compilers</h3>
<p>A <b>stack</b> VM has short instructions and a trivial compiler. A <b>register</b> VM (Lua 5, Dalvik) names its operands and needs fewer instructions to do the same work, which is often faster to interpret. Either way you usually do <b>not</b> write bytecode by hand: a compiler turns a friendly syntax (a visual graph, a text language) into it. Writing a compiler from expressions to a stack machine is a classic first compiler project (post-order traversal of the expression tree).</p>
<h3>The honest costs</h3>
<ul><li>You are building a language: syntax errors, line numbers in error messages, a debugger, documentation. Budget for it, or <b>use an existing one</b> (embed Lua, use GDScript) instead of inventing one.</li><li>Interpreted code is slower than native. Keep hot loops (physics, pathfinding) native, scripts for decisions and events.</li><li>The boundary between native and script (what functions the script may call) is the API of your game: design it deliberately and keep it small.</li></ul>` },
        { pid: 'drill-vm', type: 'drill', ref: 'stack_vm' },
        { pid: 'q-pat10-1', type: 'quiz', q: 'A designer\'s script accidentally contains <code>while true: pass</code>. The game must not hang. Which feature of a VM protects you?',
          options: ['A faster CPU', 'A per-run instruction (step) budget that aborts the script with an error', 'Garbage collection', 'Compiling the script to machine code'], answer: 1, explain: 'Because the host controls the interpreter loop, it can count steps and stop. Native code cannot be stopped this way.' },
        { pid: 'q-pat10-2', type: 'quiz', q: 'Which of these is the best candidate to stay in native code rather than move to scripts?',
          options: ['The boss phase transitions', 'Per-frame collision detection for thousands of objects', 'Dialogue branching', 'Quest conditions'], answer: 1, explain: 'Hot inner loops run every frame on lots of data; interpretation overhead hurts there. Decisions and events are rare and benefit from fast iteration.' },
        { pid: 'q-pat10-3', type: 'quiz', q: 'You need designers to define weapon effects like "burn for 3 seconds, 2 damage per tick". What is the simplest approach that works?',
          options: ['Add a general-purpose scripting language to the game', 'A fixed set of named effects with parameters in data (type object), and add new effect kinds in code when needed', 'A neural network', 'Hard-code every weapon'], answer: 1, explain: 'Climb the ladder only as far as necessary. Data with a menu of effects is the cheapest, safest and most debuggable option.' },
      ],
    },
    {
      id: 'pat-antipatterns', title: 'Singletons, globals and other traps', minutes: 30,
      summary: 'Why the easy pattern hurts, what to do instead, and the other design smells that kill game codebases.',
      sections: [
        { type: 'text', html: `
<h3>The singleton trap</h3>
<p>A <b>singleton</b> is a class with exactly one instance, reachable from anywhere (<code>Game.instance</code>, an autoload called <code>GameState</code>). It is the most overused pattern in games because it solves "how do I reach X from here?" in one line. The costs show up later:</p>
<ul><li><b>Hidden dependencies.</b> A function's signature no longer says what it touches; any code can read or change the singleton. Reading a function does not tell you what it depends on.</li><li><b>Global mutable state.</b> Anything can write to it at any time, so bugs appear far from their cause, and execution order starts to matter.</li><li><b>Testing.</b> You cannot test a function without setting up the whole global world, and tests leak state into each other.</li><li><b>"Only one" is rarely true.</b> Split screen means two players. Level editors preview a level inside a level. A replay viewer runs a second simulation. The day "there is only one" stops being true, every call site must change.</li><li><b>Lifetime and initialisation order.</b> Which singleton starts first? Who tears down last? Static initialisation order across files is a classic C++ bug.</li></ul>
<h3>Alternatives</h3>
<ol><li><b>Pass it in.</b> If a function needs the world, take the world as a parameter. Verbose for a week; clear forever.</li><li><b>Keep it in the owner.</b> Most "singletons" are really "the current level's X". Let the level own it and hand references down the tree (Godot: call down, signal up).</li><li><b>Service locator</b> for genuinely cross-cutting services (audio, settings, analytics), with an interface so tests can swap them (component lesson).</li><li><b>Scene-local instead of global</b>: an autoload with a small, stable job (an audio bus, a settings store) is fine. An autoload holding the player, the score, the inventory and the current level is a global state blob.</li></ol>
<h3>Other smells</h3>
<ul><li><b>God object / "Manager" classes.</b> <code>GameManager</code> that handles input, spawning, score, UI and save. Split by responsibility; a class name ending in Manager is often a missing concept.</li><li><b>Inheritance towers.</b> <code>Entity → Character → Enemy → FlyingEnemy → ShootingFlyingEnemy</code>. Prefer composition and type objects.</li><li><b>Premature generalisation.</b> A plugin system for the one weapon you have. Build the concrete thing twice, then abstract.</li><li><b>Stringly typed everything.</b> Passing <code>"enemy_goblin"</code> around and comparing strings in hot paths. Use enums or interned ids, keep strings at the data boundary.</li><li><b>Update order spaghetti.</b> Systems that depend on being updated in a specific order with no comment saying so. Make the order explicit in one place.</li><li><b>Deep coupling through signals.</b> Event chains where each handler emits the next: nobody can say what happens when you press jump.</li><li><b>Copy-paste scenes.</b> Fifty slightly different enemy scenes instead of one scene and fifty data files.</li></ul>
<h3>A refactoring recipe</h3>
<ol><li>Find the singleton's <b>callers</b> and group by what they use.</li><li>Split the singleton by responsibility into small things that each have one reason to change.</li><li>Give each piece an <b>owner</b> (the level, the player) and pass references down where needed.</li><li>For what remains global, define a small interface and a way to swap it.</li><li>Delete the global. If something breaks, you found a hidden dependency.</li></ol>` },
        { pid: 'bug-pat-singleton', type: 'bug', title: 'Spot the global-state bugs',
          prompt: '<p>GDScript with an autoload <code>Game</code>. Click the <b>3</b> lines that are bugs waiting to happen.</p>',
          code: String.raw`# game.gd (autoload)
var player
var score := 0
var current_level

# coin.gd
func _on_body_entered(body):
    Game.score += 10
    Game.player.hp = min(Game.player.hp + 1, 10)
    queue_free()

# enemy.gd
func _ready():
    target = Game.player`,
          bugs: [{ line: 8, why: 'Writing <code>Game.score</code> directly from the coin couples the coin to the global state, and anything can change score from anywhere. The coin should emit <code>collected</code> and the scoring code react (observer).' },
                 { line: 9, why: 'The coin also reaches through the global into the player\'s internals and edits hp. The player should expose <code>heal()</code>, or the coin should emit and a Health component react. With two players (split screen) this also heals the wrong one.' },
                 { line: 14, why: '<code>target = Game.player</code> assumes exactly one player that already exists when the enemy is ready (initialisation order) and is the same forever (respawn replaces it). Inject the target when the enemy is spawned.' }],
          ok: [2, 10], hint: 'All three are the same disease: reaching into global state instead of being given what you need.' },
        { pid: 'q-pat11-1', type: 'quiz', q: 'You add local co-op and the global <code>Game.player</code> is everywhere. What is the underlying design mistake?',
          options: ['Using too many players', 'Encoding "there is exactly one player" into the architecture through a global', 'Using GDScript', 'Not enough singletons'], answer: 1, explain: '"Only one" is an assumption that breaks. Pass the relevant player in or keep it with its owner.' },
        { pid: 'q-pat11-2', type: 'quiz', q: 'Which autoload is the least problematic?',
          options: ['GameState holding player, score, inventory and level', 'An Audio autoload that plays sounds through a small interface and holds no gameplay state', 'Everything Manager', 'A Player autoload'], answer: 1, explain: 'A thin service with a stable job and no gameplay state is easy to swap or silence. Autoloads holding game state become the global blob.' },
        { type: 'reveal', title: 'Refactoring exercise: break up a GameManager', html: `<p>A <code>GameManager</code> has these responsibilities: reads input, spawns enemies, tracks score, shows the HUD, saves and loads, plays music, handles pause.</p><ul><li>Group them into 4 to 6 cohesive pieces. (Input → controllers; spawning → a Spawner owned by the level; score → a ScoreKeeper that listens to events; HUD → UI node that listens; save/load → a SaveService behind an interface; audio → Audio service; pause → a state in a pushdown stack.)</li><li>Which of these needs to be global at all? (Probably only audio and settings.)</li><li>Draw who owns whom and which direction messages flow.</li><li>Pick one responsibility and write the test you could not write before.</li></ul>` },
      ],
    },
    {
      id: 'pat-case-study', title: 'Putting it together: architecture of a small game', minutes: 40,
      summary: 'Design the architecture of Breakout from scratch, choosing patterns for reasons, and learn to read a codebase you did not write.',
      sections: [
        { type: 'text', html: `
<p>Patterns are tools, and the skill is knowing which problem calls for which. We design a game small enough to hold in your head: <b>Breakout</b> (paddle, ball, bricks, lives, levels from files, a pause menu, high scores), and decide at each step whether a pattern pays for itself.</p>
<h3>1. The loop and the update order</h3>
<p>Fixed-timestep simulation, variable-rate rendering (game loop lesson). Per step, a <b>written order</b>: read input commands → move paddle → move ball → collisions → apply consequences (score, destroy bricks) → check win/lose. Comment the order in <b>one place</b>. Because the ball depends on the paddle's new position, order matters here; do not rely on node ordering by accident.</p>
<h3>2. Input: commands, but only as much as needed</h3>
<p>Keyboard, gamepad and touch all produce the same two intents: <code>MovePaddle(dir)</code> and <code>Launch</code>. Making these <b>commands</b> costs almost nothing and buys rebinding, an attract-mode AI that plays the game, and replays for bug reports. Undo is not needed in Breakout: skip it.</p>
<h3>3. States: the game flow</h3>
<p>Title → Playing → Paused → GameOver → HighScores. This is a <b>pushdown stack</b>: Pause pushes onto Playing and pop resumes. Ball-in-play vs ball-on-paddle is a small <b>enum state machine</b> inside the gameplay state. Do not make the ball a pushdown automaton; the pattern follows the problem.</p>
<h3>4. Entities: data, not classes</h3>
<p>The bricks (up to a few hundred) are plain data in arrays: position, hit points, type id. A <b>type object</b> defines brick kinds (normal, two-hit, indestructible, explosive) from a data file. The level is data too: a text grid where each character is a brick type id. Adding a new brick kind or level must not need a programmer. Because there are hundreds of bricks and the update touches few fields, <b>struct-of-arrays</b> is fine but unnecessary at this scale: write the clear version and measure before optimising.</p>
<h3>5. Collisions: do not build a broadphase</h3>
<p>One ball, a paddle and 200 bricks: brute force is trivial. The interesting part is <b>tunneling</b>: a fast ball can pass through a thin brick, so use a <b>swept</b> test (collision lesson) and resolve the first hit by time of impact. A grid would help only with thousands of objects: the "do I need this?" question again.</p>
<h3>6. Events: how consequences spread</h3>
<p>When the ball destroys a brick: add score, play a sound, spawn particles, maybe drop a power-up, check if the level is clear. The collision code emits <code>brick_destroyed(brick, position)</code> and the scoring, audio, particle and power-up systems each subscribe (<b>observer</b>). Audio requests go through a small <b>event queue</b> so ten bricks breaking in one frame play a limited number of sounds. The level-complete check reacts to the event instead of the collision code knowing about levels.</p>
<h3>7. Services and data</h3>
<p>Audio, settings, and save/high-score storage are <b>services</b> behind small interfaces, injected into the places that need them (audio into the event listener; the save service into the high-score screen). No <code>Game.instance</code>. The high-score file has a <b>version number</b> from the first release (data lesson).</p>
<h3>8. What you deliberately skip</h3>
<p>ECS, bytecode scripting, a scene graph with dirty-flag transforms, object pooling for particles (maybe later, after profiling shows allocation). Knowing what <i>not</i> to use is half of the design.</p>
<h3>How the pieces talk</h3>
<pre><code>Input (keyboard/gamepad/AI) --commands--> Gameplay state
Gameplay: paddle, ball, bricks (data) --swept collision--> hit results
hit results --events (brick_destroyed, ball_lost)--> Score, Audio queue, Particles, PowerUps, LevelFlow
LevelFlow --push/pop/replace--> State stack (Title / Playing / Paused / GameOver)
Services (Audio, Save, Settings) injected at construction</code></pre>
<h3>Reading a codebase you did not write</h3>
<ol><li><b>Find the loop.</b> Every game has one place that runs each frame. Start there and read down.</li><li><b>Find the data.</b> Where do kinds of things come from (resources, JSON, tables)? That tells you how content is made.</li><li><b>Follow one event end to end.</b> Pick "the player shoots" and trace input → command → spawn → collision → damage → UI. You will meet every system.</li><li><b>Draw the ownership tree</b>: who creates whom, who frees whom.</li><li><b>Look for the global state</b> (singletons, autoloads, statics): that is where the surprises live.</li><li><b>Run it with a profiler and a debugger</b> before forming opinions.</li></ol>` },
        { pid: 'q-pat12-1', type: 'quiz', q: 'In the Breakout design, why is the pause menu a good fit for a pushdown stack but "ball on paddle versus in play" is not?',
          options: ['Pause menus are more important', 'Pause must return to exactly what was underneath (and can nest with options), while the ball has two flat modes with no memory needed: an enum is enough', 'The ball is too fast for a stack', 'Stacks cannot hold enums'], answer: 1, explain: 'Match the structure to the problem: memory of what you came from means a stack; two plain modes mean an enum.' },
        { pid: 'q-pat12-2', type: 'quiz', q: 'Where should the check "all bricks destroyed, load next level" live?',
          options: ['Inside the collision code, right after a brick breaks', 'In a level-flow system that reacts to the brick_destroyed event and asks the level whether any bricks remain', 'In the ball', 'In the audio service'], answer: 1, explain: 'Collision code should not know about levels. An event keeps the responsibilities separate and testable.' },
        { type: 'reveal', title: 'Design challenge: apply this to your own game', html: `<p>Take a game you want to build (or one you love) and write, in one page:</p><ol><li>The loop and the written update order (6 to 10 steps).</li><li>The commands the input produces.</li><li>The game-flow stack and which transitions push, pop and replace.</li><li>What is <b>data</b> (type objects, level files) and what is <b>code</b>.</li><li>The 3 to 5 events that cross system boundaries.</li><li>The services, and who owns each.</li><li>Three patterns you <b>deliberately skipped</b>, with a one-line reason each.</li></ol><p>Then check it against the antipatterns lesson: is there any global the design cannot live without?</p>` },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
