/* Game dev section: game AI concepts. Code blocks marked data-check are compiled by scripts/validate-snippets.mjs. */
TRACKS.push({
  id: 'gdai', domain: 'gamedev', icon: '🧠', title: 'Game AI',
  blurb: 'Making characters decide and move believably: behaviour trees, utility and planners, perception and steering, pathfinding in depth, and AI that is fun rather than perfect.',
  lessons: [
    {
      id: 'ai-bt', title: 'From state machines to behaviour trees', minutes: 35,
      summary: 'Why hand-wired state machines stop scaling, and how a tree of small reusable nodes decides what to do every tick.',
      sections: [
        { type: 'text', html: `
<h3>Game AI is not machine learning</h3>
<p>In games "AI" almost always means <b>decision making and movement for non-player characters</b>: the enemy that flanks, the shopkeeper that walks home at night, the ally that follows you. The goal is not to be intelligent but to be <b>believable and fun</b>: readable, fair, interesting to fight, and cheap enough to run for hundreds of characters. Techniques are old, well understood and mostly simple. This track covers the ones you will meet.</p>
<h3>The limits of the state machine</h3>
<p>A state machine (patterns track) is great to manage <i>what an agent is doing</i>. As an AI brain it scales badly: every state needs explicit transitions to others, and 30 states have up to 870 possible arrows. Adding "if low health, flee" means adding a transition from <b>every</b> state. Reusing "attack" in a different enemy means copying its wiring.</p>
<h3>Behaviour trees</h3>
<p>A <b>behaviour tree</b> (BT) makes the brain a tree of small nodes. Every tick the root is evaluated and each node returns one of three results: <code>success</code>, <code>failure</code> or <code>running</code> (still doing it, ask me again next tick). Because it is re-evaluated from the top, high-priority behaviour naturally interrupts low-priority behaviour.</p>
<ul><li><b>Leaf nodes</b>: <i>conditions</i> ("can I see the player?", "is health below 30%?") and <i>actions</i> ("move to the target", "play the attack animation"). Actions that take time return <code>running</code>.</li><li><b>Sequence</b> (a logical AND): run children in order; stop at the first one that is not success. "Can see player AND in range AND attack."</li><li><b>Selector</b> or fallback (a logical OR): run children in order; stop at the first one that is not failure. "Attack, otherwise chase, otherwise patrol": a priority list.</li><li><b>Decorators</b> wrap one child and change its result or behaviour: <i>inverter</i> (swap success and failure), <i>cooldown</i> (fail for a while after success), <i>repeat</i>, <i>until success</i>, <i>timeout</i>, a <i>condition guard</i>.</li><li><b>Parallel</b>: run several children at once (move <i>and</i> shoot).</li></ul>
<pre><code>Selector
├── Sequence                 # 1. flee when hurt
│   ├── Condition: health below 30%
│   └── Action: run to cover
├── Sequence                 # 2. fight when the player is near
│   ├── Condition: can see player
│   ├── Selector
│   │   ├── Sequence [in range, Cooldown(1.5 s, Action: shoot)]
│   │   └── Action: move toward player
└── Action: patrol           # 3. otherwise do the idle thing</code></pre>
<p>Notice the order is the <b>priority</b>: fleeing outranks fighting outranks patrolling, and there is no wiring between behaviours. To make another enemy that never flees, delete the first branch. In the drill you implement the tick for these nodes.</p>
<h3>The running state and memory</h3>
<p>A walking action returns <code>running</code> over many ticks. A plain sequence would restart from its first child each tick (re-checking conditions every time, which keeps the AI reactive). That is the default and usually what you want. When a sequence must <b>resume at the running child</b> (do step 1, 2 and 3 in order without re-running step 1) use a sequence <b>with memory</b>, at the cost of being less reactive. Know which one your library uses.</p>
<h3>Blackboard</h3>
<p>Nodes need shared facts: the current target, last known player position, ammo. A <b>blackboard</b> is a small key-value store that the tree reads and writes. Sensors write to it ("target = player"), conditions read it. It keeps nodes independent of each other and of the game's types.</p>
<h3>Why BTs caught on (and when they do not fit)</h3>
<ul><li>Modular and reusable: a "shoot at target" subtree is shared by all enemies.</li><li>Priorities and interruptions are structural.</li><li>Designers can edit them visually; programmers write the leaves.</li><li>Debuggable: highlight the path that succeeded this tick.</li></ul>
<p>Drawbacks: state is implicit (hard to express "I have already done X"), they can be awkward for tasks where goals must be <i>planned</i> (the next lesson), and big trees need discipline (subtrees, naming). Many games combine: a state machine for animation/movement modes and a BT for decisions.</p>
<h3>Implementation notes</h3>
<ul><li>Tick at a lower rate than rendering (4 to 10 times a second is plenty) and stagger agents across frames.</li><li>Keep leaf actions short and let the tree compose them.</li><li>Godot has community addons (LimboAI, Beehave); Unreal has built-in behaviour trees; the idea is simple enough to write in a day.</li><li>Always build the <b>debug view</b> first: a way to see each agent's current path through the tree and its blackboard values.</li></ul>` },
        { pid: 'drill-bt', type: 'drill', ref: 'behavior_tree' },
        { pid: 'q-ai1-1', type: 'quiz', q: 'You want an enemy to flee when its health is low, no matter what else it is doing. In a behaviour tree, where do you put that behaviour?',
          options: ['At the end of the root selector', 'As the first (highest priority) child of the root selector, guarded by a health condition', 'Inside the patrol action', 'In the animation controller'], answer: 1, explain: 'A selector tries children in order, so earlier children outrank later ones. Putting the flee branch first interrupts anything below it each tick.' },
        { pid: 'q-ai1-2', type: 'quiz', q: 'What does a <code>cooldown</code> decorator on the "shoot" action do?',
          options: ['Makes it faster', 'Fails (or skips) the action for a set time after it succeeds, so the enemy cannot fire every tick', 'Delays the whole tree', 'Removes the action'], answer: 1, explain: 'It is the standard way to rate-limit an action without a timer variable in the action itself.' },
        { pid: 'q-ai1-3', type: 'quiz', q: 'Why is it normally fine to tick AI at 5 to 10 Hz instead of every frame?',
          options: ['Players do not notice, and human reaction time is much slower; it saves CPU and can be staggered across agents', 'Behaviour trees cannot run faster', 'It makes the AI smarter', 'The renderer needs the time'], answer: 0, explain: 'A decision delay of 100 to 200 ms looks like human reaction time. Movement and animation still update every frame; only the decision rate is low.' },
      ],
    },
    {
      id: 'ai-planning', title: 'Utility AI and planners', minutes: 40,
      summary: 'Choosing by scores, and planning a sequence of actions toward a goal: two alternatives to hand-written priorities.',
      sections: [
        { type: 'text', html: `
<h3>Utility AI: choose by scoring</h3>
<p>A behaviour tree encodes <i>priorities</i> you decided in advance. <b>Utility AI</b> instead gives every possible action a <b>score</b> from 0 to 1 computed from the current situation, and runs the highest. "Drink a potion" scores high when health is low and potions remain; "attack" scores high when an enemy is close; "take cover" when under fire and the weapon is empty. No explicit priorities: the right behaviour <b>emerges</b> from the numbers.</p>
<ul><li>Each action has several <b>considerations</b>: an input (health 0.3) mapped through a <b>response curve</b> (linear, quadratic, logistic or any custom shape) to a 0 to 1 value. Designers shape behaviour by editing curves.</li><li>Multiply the considerations (any 0 vetoes) or average them with a compensation factor to avoid the score collapsing as considerations are added.</li><li><b>Inertia</b>: add a bonus to the action currently running so the agent does not flip-flop when two scores hover around each other (a drill exercise). Other fixes: a minimum action duration, cooldowns.</li><li>Good for: many competing options (a life simulation: eat, sleep, socialise, work), behaviour that should adapt smoothly, ambient NPCs. The Sims is the classic reference. Dave Mark's talks on "infinite axis utility systems" are the standard source.</li><li>Weaknesses: scores are hard to tune and debug when there are many actions ("why did it prefer that?") so log the scores, and it expresses <i>sequences</i> poorly.</li></ul>
<h3>Planners: let the AI work out the steps</h3>
<p>Both trees and utility systems choose among actions you wired up. A <b>planner</b> instead takes a <b>goal</b> and a set of <b>actions</b> described by what they need and what they change, and <b>searches</b> for a sequence that gets from the current state to the goal.</p>
<h3>GOAP: goal-oriented action planning</h3>
<p>Made famous by <i>F.E.A.R.</i> (Jeff Orkin). The world is a set of boolean facts (<code>hasWeapon</code>, <code>weaponLoaded</code>, <code>enemyDead</code>). Each action has <b>preconditions</b> (facts that must hold), <b>effects</b> (facts it sets or clears) and a <b>cost</b>. The planner runs a search (A* or breadth-first) over world states from the current state to one that satisfies the goal and returns the cheapest action list. The point is <b>emergence and flexibility</b>: if the weapon is already loaded the plan is shorter; if the door is locked the planner may route through the window; designers add an action and the AI finds new ways to use it.</p>
<pre><code data-check="zig">const std = @import("std");

// World facts as bits in a byte.
const HAS_WEAPON: u8 = 1 &lt;&lt; 0;
const LOADED: u8 = 1 &lt;&lt; 1;
const ENEMY_VISIBLE: u8 = 1 &lt;&lt; 2;
const ENEMY_DEAD: u8 = 1 &lt;&lt; 3;

const Action = struct {
    name: []const u8,
    needs: u8, // facts that must be true
    sets: u8, // facts made true
    clears: u8 = 0, // facts made false
    cost: u32 = 1,
};

const actions = [_]Action{
    .{ .name = "pick up weapon", .needs = 0, .sets = HAS_WEAPON },
    .{ .name = "load weapon", .needs = HAS_WEAPON, .sets = LOADED },
    .{ .name = "approach enemy", .needs = 0, .sets = ENEMY_VISIBLE, .cost = 3 },
    .{ .name = "shoot", .needs = HAS_WEAPON | LOADED | ENEMY_VISIBLE, .sets = ENEMY_DEAD, .clears = LOADED },
};

/// Cheapest plan as a list of action indices (Dijkstra over the 256 possible states), or null if the goal is unreachable.
fn plan(start: u8, goal: u8, out: []usize) ?usize {
    var dist: [256]u32 = @splat(std.math.maxInt(u32));
    var prev_state: [256]u8 = undefined;
    var prev_action: [256]usize = undefined;
    var done: [256]bool = @splat(false);
    dist[start] = 0;
    while (true) {
        // pick the unfinished state with the smallest distance
        var best: ?usize = null;
        for (0..256) |s| {
            if (!done[s] and dist[s] != std.math.maxInt(u32) and (best == null or dist[s] &lt; dist[best.?])) best = s;
        }
        const cur = best orelse return null;
        if (cur &amp; goal == goal) { // goal facts all true: rebuild the plan backwards
            var n: usize = 0;
            var s: usize = cur;
            while (s != start) : (s = prev_state[s]) n += 1;
            if (n &gt; out.len) return null;
            var i = n;
            s = cur;
            while (s != start) : (s = prev_state[s]) {
                i -= 1;
                out[i] = prev_action[s];
            }
            return n;
        }
        done[cur] = true;
        const cur_state: u8 = @intCast(cur);
        for (actions, 0..) |a, ai| {
            if (cur_state &amp; a.needs != a.needs) continue;
            const next: u8 = (cur_state | a.sets) &amp; ~a.clears;
            const nd = dist[cur] + a.cost;
            if (nd &lt; dist[next]) {
                dist[next] = nd;
                prev_state[next] = cur_state;
                prev_action[next] = ai;
            }
        }
    }
}

test "the planner finds the cheapest sequence and adapts to the starting state" {
    var out: [8]usize = undefined;
    const n = plan(0, ENEMY_DEAD, &amp;out).?;
    try std.testing.expectEqual(@as(usize, 4), n);
    try std.testing.expectEqualStrings("shoot", actions[out[n - 1]].name);
    // already armed and loaded: only approach and shoot are needed
    const short = plan(HAS_WEAPON | LOADED, ENEMY_DEAD, &amp;out).?;
    try std.testing.expectEqual(@as(usize, 2), short);
    // impossible goal
    try std.testing.expect(plan(0, 1 &lt;&lt; 7, &amp;out) == null);
}</code></pre>
<h3>HTN planners</h3>
<p><b>Hierarchical task networks</b> plan top-down: a goal ("kill the player") decomposes through authored <b>methods</b> into subtasks ("get in range", "attack") until primitive actions remain. Designers keep more control than with GOAP (the structure is authored), and planning is cheaper. Guerrilla's <i>Killzone 2</i> is the best-known example of an HTN planner in a shipped shooter.</p>
<h3>Choosing</h3>
<table><tr><th>Technique</th><th>Strength</th><th>Cost</th></tr>
<tr><td>State machine</td><td>Simple, predictable, great for modes and animation</td><td>Wiring explosion</td></tr>
<tr><td>Behaviour tree</td><td>Modular priorities, designer-friendly, debuggable</td><td>Implicit state, no planning</td></tr>
<tr><td>Utility AI</td><td>Smooth adaptive choices among many options</td><td>Tuning and debugging scores</td></tr>
<tr><td>GOAP / HTN</td><td>Emergent sequences, flexible with new actions</td><td>Search cost, harder to guarantee designed behaviour</td></tr></table>
<p>They combine well: a utility layer picks a <i>goal</i>, a planner builds the steps, a behaviour tree or state machine executes them. Start with the simplest that works. Most shipped enemies are a behaviour tree or a plain state machine.</p>` },
        { pid: 'drill-utility', type: 'drill', ref: 'utility_pick' },
        { pid: 'q-ai2-1', type: 'quiz', q: 'Two actions score 0.61 and 0.60, and the agent keeps switching between them every tick. What is the usual fix?',
          options: ['Add random noise', 'Add inertia: give the current action a bonus (or a minimum duration) so small score changes do not cause switches', 'Raise all scores', 'Tick faster'], answer: 1, explain: 'Hysteresis prevents flip-flopping. Without it any utility system twitches around ties.' },
        { pid: 'q-ai2-2', type: 'quiz', q: 'In GOAP, the planner returns a 5-step plan but the player destroys the door at step 3. What should the agent do?',
          options: ['Continue blindly', 'Notice the precondition of the next action no longer holds, abandon the plan and replan from the current world state', 'Crash', 'Restart the level'], answer: 1, explain: 'Plans are valid only while their assumptions hold. Check preconditions as you execute and replan when they fail.' },
        { pid: 'q-ai2-3', type: 'quiz', q: 'Which situation favours a behaviour tree over GOAP?',
          options: ['You want designers to author exact, predictable fights with clear priorities and reuse', 'You want enemies to invent new ways of reaching the goal', 'You have no designers', 'You want zero authoring'], answer: 0, explain: 'Trees give authored control and readability; planners trade some control for flexibility.' },
      ],
    },
    {
      id: 'ai-perception', title: 'Perception and steering', minutes: 35,
      summary: 'What an agent knows (sight, sound, memory) and how it moves (seek, arrive, avoid, flock): the other half of believable AI.',
      sections: [
        { type: 'text', html: `
<h3>Do not let the AI cheat by default</h3>
<p>The easiest AI reads the player's position straight from the game state: it always knows where you are. That feels unfair and robotic. <b>Perception</b> is the layer that decides what an agent is <i>allowed</i> to know, and most "smart" behaviour is really good perception plus memory.</p>
<h3>Sight</h3>
<p>Three checks, cheapest first:</p>
<ol><li><b>Distance</b>: closer than the sight range? (compare squared distances).</li><li><b>Field of view</b>: <code>dot(facing, direction_to_target) &gt; cos(half_fov)</code> (no trigonometry in the loop).</li><li><b>Line of sight</b>: a raycast to the target that must not hit a wall (physics queries lesson). Stagger these across frames.</li></ol>
<p>Refinements: visibility depends on <b>light</b> and <b>stance</b> (crouching or standing in shadow shortens range), <b>peripheral vision</b> (a narrow high-acuity cone and a wider low-acuity one), and a <b>reaction delay</b> before the AI acts on what it saw: awareness grows while you are visible and decays when you are not.</p>
<h3>Hearing and other senses</h3>
<p>Model sound as <b>events</b>, not audio: when the player runs, fires or breaks a bottle, post a noise event with a position and a loudness (radius). Agents within that radius, with walls attenuating it, are alerted to the noise <i>position</i> (not to the player). The same event system carries damage, allies calling for help and smells.</p>
<h3>Memory and alert levels</h3>
<ul><li>Keep a <b>last known position</b> and a timestamp for each threat. When sight is lost, the agent goes to that point, searches, then gives up: this single behaviour makes AI feel intelligent.</li><li>A small number of <b>alert states</b> (unaware, suspicious, searching, combat) with clear <b>telegraphs</b> (a "?" and a "!", a change of colour or animation, a spoken line) lets the player read the AI and plan around it. Stealth games live on this.</li><li><b>Share information</b> deliberately: an agent that spots you alerts nearby allies (with a delay and a range), not the whole level instantly.</li></ul>
<h3>Steering behaviours</h3>
<p>Decision-making says <i>where</i> to go; <b>steering</b> says <i>how</i> to move so it looks natural. Craig Reynolds' steering behaviours return a desired acceleration for each frame:</p>
<ul><li><b>Seek</b>: accelerate toward the target. <b>Flee</b>: the opposite.</li><li><b>Arrive</b>: seek, but slow down inside a radius around the target so the agent stops instead of overshooting and orbiting.</li><li><b>Pursue / evade</b>: seek or flee the target's <i>predicted</i> position (position + velocity × time to reach).</li><li><b>Wander</b>: steer toward a point on a small circle in front, nudged randomly each frame: aimless but smooth.</li><li><b>Obstacle avoidance</b>: cast short feelers ahead and add a sideways push away from what they hit.</li><li><b>Separation, alignment, cohesion</b>: avoid crowding neighbours, match their heading, move toward their centre. Together they produce <b>flocking</b> (boids), try the simulation.</li><li><b>Path following</b>: seek the next waypoint on a path, switching when close.</li></ul>
<p>Each behaviour first computes a <b>desired velocity</b> (toward the target at full speed, or scaled down when arriving). The steering acceleration is the difference between that and the current velocity, divided by a short <b>time to target</b> (0.1 to 0.25 s: how quickly the agent reacts; too large and it lags and overshoots, as the sample below shows).</p>
<p>Combine behaviours by a <b>weighted sum</b> or by <b>priority</b> (obstacle avoidance overrides everything), then clamp the total acceleration and speed (the drill from the vectors lesson). Weighted sums need tuning; priority systems are more predictable.</p>
<pre><code data-check="zig">const std = @import("std");

const V = struct { x: f32, y: f32 };

fn len(v: V) f32 {
    return @sqrt(v.x * v.x + v.y * v.y);
}

fn limit(v: V, max: f32) V {
    const l = len(v);
    if (l &lt;= max or l == 0) return v;
    return .{ .x = v.x / l * max, .y = v.y / l * max };
}

/// How quickly the agent tries to reach its desired velocity (seconds). Small = snappy, large = sluggish and overshoots.
const TIME_TO_TARGET: f32 = 0.1;

/// Desired velocity toward the target at full speed; the steering acceleration closes the gap to it over TIME_TO_TARGET.
fn seek(pos: V, vel: V, target: V, max_speed: f32) V {
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const d = @sqrt(dx * dx + dy * dy);
    if (d == 0) return .{ .x = -vel.x / TIME_TO_TARGET, .y = -vel.y / TIME_TO_TARGET };
    return .{ .x = (dx / d * max_speed - vel.x) / TIME_TO_TARGET, .y = (dy / d * max_speed - vel.y) / TIME_TO_TARGET };
}

/// Like seek, but the desired speed shrinks to zero inside slow_radius, so the agent stops at the target.
fn arrive(pos: V, vel: V, target: V, max_speed: f32, slow_radius: f32) V {
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const d = @sqrt(dx * dx + dy * dy);
    if (d == 0) return .{ .x = -vel.x / TIME_TO_TARGET, .y = -vel.y / TIME_TO_TARGET };
    const speed = if (d &lt; slow_radius) max_speed * d / slow_radius else max_speed;
    return .{ .x = (dx / d * speed - vel.x) / TIME_TO_TARGET, .y = (dy / d * speed - vel.y) / TIME_TO_TARGET };
}

fn simulate(use_arrive: bool) f32 {
    var pos = V{ .x = 0, .y = 0 };
    var vel = V{ .x = 0, .y = 0 };
    const target = V{ .x = 100, .y = 0 };
    const dt: f32 = 1.0 / 60.0;
    var farthest: f32 = 0;
    for (0..60 * 20) |_| {
        const steer = limit(if (use_arrive) arrive(pos, vel, target, 80, 40) else seek(pos, vel, target, 80), 600);
        vel = limit(.{ .x = vel.x + steer.x * dt, .y = vel.y + steer.y * dt }, 80);
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        farthest = @max(farthest, pos.x);
    }
    return farthest;
}

test "arrive stops at the target, plain seek overshoots and circles back" {
    const arriving = simulate(true);
    const seeking = simulate(false);
    try std.testing.expect(arriving &lt; 100.5); // never overshoots
    try std.testing.expect(seeking &gt; arriving + 3.0); // seek sails past
}</code></pre>
<h3>Crowds and avoidance</h3>
<p>For many agents add <b>local avoidance</b> that predicts collisions with neighbours: <b>velocity obstacles</b> (RVO, ORCA) choose a velocity that avoids all predicted collisions within a short horizon. Most engines ship it (Godot's NavigationAgent avoidance, Unity's NavMeshAgent). Use <b>flow fields</b> for large groups heading to one goal (pathfinding lesson).</p>
<h3>Debugging movement</h3>
<p>Draw it: the desired velocity, the steering force, the target, the feelers, perception cones, last-known positions. Most steering bugs (orbiting a target, jitter at the destination, getting stuck on corners) are obvious once visible.</p>` },
        { pid: 'sim-boids', type: 'sim', id: 'gdboids', title: 'Flocking from three simple rules',
          intro: '<p>Each boid only reacts to neighbours inside its sight radius. Move the pointer over the canvas to attract them.</p>',
          try: ['Set <b>separation</b> to 0: the flock collapses into overlapping blobs.', 'Set <b>alignment</b> to 0: boids still cluster but move in all directions.', 'Set <b>cohesion</b> to 0: they stay aligned but drift apart.', 'Shrink the <b>sight radius</b>: separate small flocks form instead of one large group.', 'Move the pointer: the attraction is just one more weighted steering force added to the sum.'] },
        { pid: 'q-ai3-1', type: 'quiz', q: 'A guard sees the player, the player ducks behind a crate for a second, and the guard instantly loses all interest. How do you make it feel smarter?',
          options: ['Give the guard x-ray vision', 'Store the last known position and make the guard go there and search for a few seconds before giving up', 'Make the guard faster', 'Remove the crate'], answer: 1, explain: 'Memory plus a search behaviour reads as intelligence for almost no code.' },
        { pid: 'q-ai3-2', type: 'quiz', q: 'An enemy using plain "seek" overshoots its target and orbits around it. Which behaviour fixes this?',
          options: ['Flee', 'Arrive: reduce the desired speed inside a radius around the target', 'Wander', 'Alignment'], answer: 1, explain: 'Arrive matches speed to distance so the agent decelerates and stops.' },
        { pid: 'q-ai3-3', type: 'quiz', q: 'Where should noise (footsteps, gunshots) be handled in the AI architecture?',
          options: ['As raw audio analysed by the AI', 'As noise events with a position and loudness posted to nearby agents, which then react to the noise position', 'In the renderer', 'Not at all'], answer: 1, explain: 'Events are cheap, controllable and testable. The AI reacts to where the noise happened, not to the player directly.' },
      ],
    },
    {
      id: 'ai-pathing', title: 'Pathfinding in depth', minutes: 40,
      summary: 'A* properly: open and closed sets, heuristics, grids vs navmeshes, smoothing, hierarchies and budgeting path requests.',
      sections: [
        { type: 'text', html: `
<h3>A* in one paragraph</h3>
<p>A* explores the map starting from the start node, always expanding the node with the smallest <code>f = g + h</code>, where <b>g</b> is the cost already paid to get there and <b>h</b> is a <b>heuristic</b> estimate of the cost still to go. Dijkstra is the same with <code>h = 0</code> (it spreads out evenly), breadth-first search is Dijkstra with unit costs. A good heuristic makes A* head toward the goal and expand far fewer nodes.</p>
<h3>The data structures</h3>
<ul><li><b>Open set</b>: nodes discovered but not expanded, ordered by <code>f</code>. A binary heap (priority queue) makes "take the best" O(log n). For tiny maps an array scan is fine.</li><li><b>Closed set</b> (or a per-node state): nodes already expanded. Use arrays indexed by node id, not hash sets, for speed on grids.</li><li><b>Parent links</b>: each node remembers where it was reached from, so the path is rebuilt backwards from the goal.</li><li><b>g scores</b>: if a cheaper route to a node is found later, update its g and parent (and its position in the heap).</li></ul>
<h3>Heuristics</h3>
<table><tr><th>Movement</th><th>Admissible heuristic</th></tr>
<tr><td>4 directions, cost 1</td><td>Manhattan distance <code>|dx| + |dy|</code></td></tr>
<tr><td>8 directions, diagonal cost √2</td><td>Octile distance: <code>max(dx,dy) + (√2 − 1)·min(dx,dy)</code></td></tr>
<tr><td>Any direction (a navmesh)</td><td>Euclidean distance</td></tr></table>
<p>The heuristic must <b>never overestimate</b> (be <i>admissible</i>) for the result to be the shortest path. Multiplying it by a weight above 1 ("weighted A*") finds paths faster that are at most that much longer, a very common game trade. A perfect-looking tie-break: prefer larger g among equal f to avoid expanding a plateau of equal-cost nodes.</p>
<pre><code data-check="zig">const std = @import("std");

const W = 8;
const H = 6;
const INF = std.math.maxInt(u32);

/// A* on a 4-connected grid with Manhattan distance. '#' is a wall. Returns the length of the shortest path, or null.
/// (The open set is scanned linearly to keep the code short; a real implementation uses a binary heap.)
fn astar(grid: []const []const u8, start: [2]usize, goal: [2]usize, expanded: *usize) ?u32 {
    var g: [W * H]u32 = @splat(INF);
    var closed: [W * H]bool = @splat(false);
    var open: [W * H]bool = @splat(false);
    const s = start[1] * W + start[0];
    const t = goal[1] * W + goal[0];
    g[s] = 0;
    open[s] = true;
    expanded.* = 0;
    while (true) {
        var cur: ?usize = null;
        var best: u32 = INF;
        for (0..W * H) |i| {
            if (!open[i]) continue;
            const x = i % W;
            const y = i / W;
            const h: u32 = @intCast(@abs(@as(i32, @intCast(x)) - @as(i32, @intCast(goal[0]))) + @abs(@as(i32, @intCast(y)) - @as(i32, @intCast(goal[1]))));
            const f = g[i] + h;
            if (f &lt; best or (f == best and g[i] &gt; g[cur.?])) {
                best = f;
                cur = i;
            }
        }
        const c = cur orelse return null;
        if (c == t) return g[c];
        open[c] = false;
        closed[c] = true;
        expanded.* += 1;
        const cx: i32 = @intCast(c % W);
        const cy: i32 = @intCast(c / W);
        for ([_][2]i32{ .{ 1, 0 }, .{ -1, 0 }, .{ 0, 1 }, .{ 0, -1 } }) |d| {
            const nx = cx + d[0];
            const ny = cy + d[1];
            if (nx &lt; 0 or ny &lt; 0 or nx &gt;= W or ny &gt;= H) continue;
            if (grid[@intCast(ny)][@intCast(nx)] == '#') continue;
            const n: usize = @intCast(ny * W + nx);
            if (closed[n]) continue;
            if (g[c] + 1 &lt; g[n]) {
                g[n] = g[c] + 1;
                open[n] = true;
            }
        }
    }
}

const map = [_][]const u8{
    "........",
    ".######.",
    ".#....#.",
    ".#.##.#.",
    ".#....#.",
    "........",
};

test "A* finds the same shortest length as exhaustive search, expanding few nodes on open ground" {
    var n: usize = 0;
    try std.testing.expectEqual(@as(?u32, 7), astar(&amp;map, .{ 0, 0 }, .{ 7, 0 }, &amp;n));
    try std.testing.expect(n &lt;= 10); // goes almost straight there
    try std.testing.expectEqual(@as(?u32, 11), astar(&amp;map, .{ 0, 0 }, .{ 3, 2 }, &amp;n)); // down the left side, along the bottom and up into the room
    const blocked = [_][]const u8{ "..#.....", "..#.....", "..#.....", "..#.....", "..#.....", "..#....." };
    try std.testing.expectEqual(@as(?u32, null), astar(&amp;blocked, .{ 0, 0 }, .{ 7, 5 }, &amp;n));
}</code></pre>
<h3>Grids vs navigation meshes</h3>
<ul><li><b>Grid</b>: simple, great for tile games and strategy. Paths follow cell centres and look blocky: smooth them. Large open worlds produce huge grids (memory, search cost).</li><li><b>Navigation mesh (navmesh)</b>: the walkable area as a set of convex polygons with adjacency. Far fewer nodes than a grid, supports any shape and angle. Search runs over the polygons, then the <b>funnel algorithm</b> ("string pulling") pulls the path tight around corners to give a straight, natural route. This is what Godot, Unity and Unreal use for 3D and for non-grid 2D.</li><li><b>Waypoint graphs</b>: hand-placed nodes and links; cheap and controllable (racing lines, patrol routes), and tedious to cover large areas.</li></ul>
<h3>Making paths look good</h3>
<ul><li><b>Smoothing</b>: remove waypoints that a straight line of sight can skip (raycast between non-adjacent waypoints), then optionally round corners.</li><li><b>Agent radius</b>: inflate obstacles by the agent's size so wide characters do not clip corners (navmeshes bake this).</li><li><b>Costs</b>: different terrains cost different amounts (mud 3, road 1); danger zones cost more so AI avoids them without forbidding them.</li><li><b>Tie-breaking</b>: many equal-length paths exist on a grid; add a tiny bias (prefer straight lines) to avoid zig-zags.</li></ul>
<h3>Scaling up</h3>
<ul><li><b>Hierarchical pathfinding</b>: precompute connectivity between regions (rooms, chunks) and search the coarse graph first, then refine locally.</li><li><b>Jump point search</b>: on uniform-cost grids, skips over symmetric paths and is often an order of magnitude faster than A*.</li><li><b>Flow fields</b> (integration field plus direction field) for many agents sharing a goal.</li><li><b>Time-sliced search</b>: give pathfinding a per-frame budget (a few milliseconds), keep searches resumable, and queue requests. Agents move toward the best partial path in the meantime. Cancel requests whose agent died or changed its mind.</li><li><b>Cache and share</b>: agents in the same region heading to the same place can reuse paths.</li></ul>
<h3>Dynamic worlds</h3>
<p>Doors open, bridges collapse, crates move. Options: mark nodes blocked and re-run affected searches, use <b>D* Lite</b> (incremental replanning for changing maps), or let local avoidance handle small obstacles and replan only when the path is truly blocked. Never replan every frame.</p>
<h3>Common bugs</h3>
<ul><li>The goal is inside an obstacle or off the navmesh: snap it to the nearest valid point first.</li><li>Paths that cut corners through walls: obstacle inflation missing.</li><li>Agents vibrating at the goal: use arrive and an acceptance radius, not exact equality.</li><li>Stuck on a door: the door's collision is in the navmesh but the agent cannot open it; model it as a node with a cost or an "action" link.</li></ul>` },
        { pid: 'q-ai4-1', type: 'quiz', q: 'On an 8-way grid with diagonal cost √2, which heuristic keeps A* optimal and tight?',
          options: ['Manhattan distance', 'Octile distance', 'Zero', 'Twice the Euclidean distance'], answer: 1, explain: 'Manhattan overestimates when diagonals are allowed (inadmissible). Octile is exact for an empty 8-way grid. Twice anything may overestimate too.' },
        { pid: 'q-ai4-2', type: 'quiz', q: 'A level is a huge open 3D space with irregular walkable areas. Which representation fits best?',
          options: ['A one-metre grid', 'A navigation mesh of convex polygons with funnel smoothing', 'Breadth-first search on pixels', 'A single waypoint'], answer: 1, explain: 'Navmeshes cover large areas with few nodes and give natural, smooth routes.' },
        { pid: 'q-ai4-3', type: 'quiz', q: 'Fifty agents ask for paths in the same frame and the game hitches. What is the best change?',
          options: ['Remove the agents', 'Queue the requests and time-slice searches with a per-frame budget, serving the nearest or most urgent first', 'Use a bigger grid', 'Search from the goal'], answer: 1, explain: 'Spread the work over frames. Agents can move on a partial or old path while they wait.' },
      ],
    },
    {
      id: 'ai-fun', title: 'AI that is fun: fairness, directors and testing', minutes: 30,
      summary: 'Believable beats smart: telegraphing, attack tokens, directors and dynamic difficulty, cheating, and how to test AI.',
      sections: [
        { type: 'text', html: `
<h3>The goal is fun, not intelligence</h3>
<p>A perfect enemy that headshots you instantly is not good AI, it is a bad game. Players enjoy enemies that are <b>readable</b> (I can see what it is about to do), <b>fair</b> (I could have avoided it) and <b>expressive</b> (it reacts to what I did). Design for those three, and let the technique follow.</p>
<h3>Telegraph before acting</h3>
<p>A wind-up animation, a sound, a laser sight, a spoken line, a short pause before the strike: these give the player time to react and are what makes a fight feel like a conversation instead of dice. The cheaper the attack to dodge, the shorter the telegraph can be; the stronger the attack, the longer it must be. Likewise, tell the player what the AI knows (the "!" above the guard's head).</p>
<h3>Make small mistakes on purpose</h3>
<ul><li><b>Reaction time</b>: delay responses by 150 to 400 ms.</li><li><b>Imperfect aim</b>: bullets miss the first shots, tighten when the player stands still, and never hit the player on the opening shot of an encounter if that feels unfair (missing deliberately but visibly "near" is a classic trick).</li><li><b>Hesitation and variety</b>: do not always pick the optimal action. Random choice weighted by score avoids the "always the same" feeling.</li></ul>
<h3>Group AI: attack tokens</h3>
<p>Five enemies all rushing the player at once feels cheap and unreadable. A common fix is a <b>token system</b>: the group has a small number of "attack tokens" (say 2). An enemy must hold a token to attack; the rest circle, taunt or flank. When an attack ends the token returns. The player always faces a manageable number of threats, and the encounter looks coordinated. Related ideas: assign <b>roles</b> (a tank, a flanker, a ranged support), keep a minimum spacing, and use <b>barks</b> (spoken lines) so the player hears the AI's plan.</p>
<h3>Directors and pacing</h3>
<p>An <b>AI director</b> watches the player's state (health, recent stress, time since the last fight) and controls <i>what happens</i> rather than any single agent: when to spawn more enemies, what items to drop, when to give a quiet moment. <i>Left 4 Dead</i> popularised it: intensity builds, peaks, then relaxes, so the pacing varies by itself and each run differs. A minimal director is a number (<code>intensity</code>) that rises with combat and falls with calm, and a table of "if intensity is low and time since a fight is high, spawn a wave".</p>
<h3>Dynamic difficulty and rubber banding</h3>
<ul><li>Quiet adjustment (slightly fewer enemies after several deaths, more health drops) can help struggling players. Be careful: when players notice a game cheating <i>against</i> them (racing rubber banding), trust is lost, and when it helps them too obviously, wins feel hollow.</li><li>Prefer <b>visible choices</b> (difficulty levels, assist options) and keep adjustments modest, symmetric and explainable.</li><li>Always allow the player to turn adaptation off.</li></ul>
<h3>Cheating AI, honestly</h3>
<p>Many shipped AIs cheat: strategy AIs ignore fog of war or gain resources, racing AIs get speed boosts, shooters spawn enemies outside the camera view. It is often the right trade (cheaper than simulating everything). Rules: cheat <b>in the player's favour of fun</b>, never in a way the player would catch and resent, and keep the cheat <b>invisible when it removes challenge and visible when it adds fairness</b>.</p>
<h3>Testing and debugging AI</h3>
<ul><li><b>Visualise</b>: draw state names, current target, perception cones, paths, scores, token holders above or around each agent, and show the active branch of the tree. Make it a toggle.</li><li><b>Reproduce</b>: a fixed random seed and a recorded input stream turn "the guard got stuck once" into a repeatable test.</li><li><b>Bots</b>: automated players that run thousands of encounters headless, measure win rates, time to kill and deaths per room, and catch broken balance overnight (the same idea as the balance benchmarks in your own game).</li><li><b>Scenario tests</b>: small hand-built rooms ("guard, wall, player behind it") with assertions: the guard must find the player within N seconds.</li><li><b>Metrics from playtests</b>: where players die, how long fights last, how often the AI loses track.</li></ul>
<h3>A checklist for each enemy type</h3>
<ol><li>What does the player see before it attacks (telegraph)?</li><li>How can the player beat it (the counter)? Is the counter learnable?</li><li>What does it do when it loses the player?</li><li>What does it do with two or ten of its friends around?</li><li>What is its worst failure mode (stuck, jitter, suicide off a ledge) and how would you detect it?</li></ol>` },
        { pid: 'q-ai5-1', type: 'quiz', q: 'Six enemies all attack the player together and the fight feels chaotic and unfair. Which technique addresses it directly?',
          options: ['Make them weaker', 'An attack-token system: only a few enemies may attack at once while others circle or flank', 'Remove perception', 'Lower the frame rate'], answer: 1, explain: 'Tokens cap simultaneous threats, keeping fights readable while still looking coordinated.' },
        { pid: 'q-ai5-2', type: 'quiz', q: 'Which statement about dynamic difficulty is the best practice?',
          options: ['Hide it completely and make it aggressive', 'Keep adjustments modest and explainable, prefer visible player options, and allow turning it off', 'Never adjust anything', 'Only make the game harder'], answer: 1, explain: 'Hidden strong adaptation breaks trust either way. Visible, modest, optional is the safest.' },
        { pid: 'q-ai5-3', type: 'quiz', q: 'You can\'t reproduce a bug where an enemy sometimes gets stuck. Which investment helps most?',
          options: ['More enemies', 'A seeded, deterministic simulation with recordable input, plus a debug view of the enemy\'s state and path', 'A faster computer', 'Printing a log line per frame'], answer: 1, explain: 'Determinism converts a once-in-a-while bug into a replay. A debug overlay shows why it decided what it did.' },
        { type: 'reveal', title: 'Design exercise: a boss that teaches', html: `<p>Design a boss with three attacks. For each one write: the telegraph (what the player sees or hears, and how long), the counter (what the player does), and the punish window (when the player may attack safely).</p><ul><li>How does the boss change when the player is at low health? (Longer telegraphs, never a new unreadable attack.)</li><li>What does the director do if the player dies five times in a row? (Offer a health pickup, or a longer punish window, or a visible assist option.)</li><li>Which information must stay on screen at all times?</li></ul>` },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
