/* Game dev section, track 1: the game loop and how a game is put together. Examples use GDScript (Godot), Zig and C++. */
TRACKS.push({
  id: 'gdloop', domain: 'gamedev', icon: '🔁', title: 'Game Loop & Architecture',
  blurb: 'Frames, delta time and fixed timesteps, input handling, state machines, entities and components, and keeping a frame under 16 ms.',
  lessons: [
    {
      id: 'gd-loop', title: 'The game loop and delta time', minutes: 25,
      summary: 'Why a game is a loop, what a frame budget is, and why frame-rate dependent code is the first bug everyone ships.',
      sections: [
        { type: 'text', html: `
<p>A game is one loop that runs until you quit. Each trip around it is a <b>frame</b>:</p>
<pre><code>while (running) {
    poll_input();        // what did the player press since last frame?
    update(dt);          // advance the world by dt seconds
    render();            // draw the result
}</code></pre>
<p>At 60 frames per second one frame has <b>16.6 ms</b> to do all of that (8.3 ms at 120 Hz, 33 ms at 30). That is the <i>frame budget</i>. Miss it and the player sees stutter. Everything else in this track is about spending that budget wisely or making the game behave when you overspend it.</p>
<h3>Delta time</h3>
<p>If you move a character by 5 pixels each frame, it moves 300 px/s on a 60 Hz monitor and 720 px/s on a 144 Hz one. The game plays at different speeds on different machines. The fix is to move by <b>speed × dt</b>, where <code>dt</code> is the real time the last frame took:</p>
<pre><code># GDScript (Godot 4)
func _process(delta):
    position.x += speed * delta         # speed in px/s, correct at any frame rate</code></pre>
<p>That handles movement, but not everything. Physics integration, collision and anything that must be <b>reproducible</b> still depends on how big dt is (try the simulation below).</p>
<h3>Fixed timestep</h3>
<p>The standard answer is to run the <i>simulation</i> in fixed slices (say 1/60 s) and let the <i>rendering</i> run as fast as it likes:</p>
<pre><code>acc += frame_time;
while (acc >= STEP) {        // catch up in whole steps
    simulate(STEP);
    acc -= STEP;
}
draw(interpolate(acc / STEP)); // blend previous and current state</code></pre>
<p>Now the physics of a jump is identical on every machine and on every replay. You get determinism (replays, rollback netcode, reproducible bugs) for free. Godot does exactly this: <code>_physics_process</code> runs at a fixed rate (60 by default), <code>_process</code> runs every rendered frame.</p>
<div class="callout warn"><b>The spiral of death:</b> if one frame takes 200 ms (alt-tab, a long load, a breakpoint), the loop wants to run twelve physics steps to catch up. Those take longer than a frame, so the next frame is even further behind. Always <b>cap the number of steps per frame</b> and throw the excess away. You will write exactly that in the drill below.</div>` },
        { pid: 'sim-loop', type: 'sim', id: 'gdloop', title: 'The same jump at different frame rates',
          intro: '<p>The jump uses gravity and an initial velocity. Amber integrates with the real frame time, green with a fixed 60 Hz step. The dashed line is the ideal curve. Drag the frame rate.</p>',
          try: ['Set <b>30 fps</b>: the variable-dt jump is noticeably higher than ideal. The same code makes some players jump higher than others.', 'Move to <b>10 fps</b>: the error becomes huge.', 'The green line is the same at every frame rate. That is the whole point of a fixed step.', 'Go to <b>144 fps</b>: the error almost disappears, which is why this bug survives on dev machines.'] },
        { pid: 'q-loop-1', type: 'quiz', q: 'A character moves with <code>position.x += 5</code> inside <code>_process</code>. What happens on a 144 Hz monitor compared with 60 Hz?',
          options: ['Nothing, Godot normalises it', 'It moves 2.4 times faster, because the function runs 2.4 times as often', 'It moves slower, because frames are shorter', 'It moves the same, but looks smoother'],
          answer: 1, explain: 'The update is per frame, not per second. Multiply by delta (<code>5 * 60 * delta</code> if you think in px/s) so distance depends on time, not on how many frames happened.' },
        { pid: 'q-loop-2', type: 'quiz', q: 'Why does Godot offer both <code>_process(delta)</code> and <code>_physics_process(delta)</code>?',
          options: ['One is for 2D, one for 3D', '_physics_process runs at a fixed rate for stable simulation, _process runs every rendered frame for visuals and UI', '_process is deprecated', 'They are identical, the name is a convention'],
          answer: 1, explain: 'Physics and gameplay that must be deterministic go in the fixed-rate callback; per-frame visuals (animation blending, UI, camera smoothing) go in _process.' },
        { pid: 'drill-fixed', type: 'drill', ref: 'fixed_steps' },
        { pid: 'bug-delta', type: 'bug', title: 'Spot the frame-rate bugs',
          prompt: '<p>A teammate wrote this player controller in GDScript. It feels fine on their 60 Hz laptop. Click the <b>3</b> lines that will behave differently at other frame rates or waste the frame budget.</p>',
          code: String.raw`extends CharacterBody2D

var speed = 300.0
var gravity = 20.0
var health = 100

func _process(delta):
    velocity.x = Input.get_axis("left", "right") * speed
    velocity.y += gravity
    var label = get_node("/root/Main/UI/HealthLabel")
    label.text = str(health)
    move_and_slide()`,
          bugs: [{ line: 7, why: 'Physics movement (<code>velocity</code>, gravity, <code>move_and_slide</code>) belongs in <code>_physics_process</code>. In <code>_process</code> the collision step runs at the display rate, so tunnelling and tuning vary between machines.' },
                 { line: 9, why: '<code>velocity.y += gravity</code> adds a fixed amount every <i>frame</i>, so gravity is three times stronger at 180 fps than at 60. Use <code>gravity * delta</code> (with gravity in px/s²).' },
                 { line: 10, why: '<code>get_node</code> with an absolute path every frame walks the scene tree each time. Cache it once (<code>@onready</code>) or better, have the UI listen to a signal when health changes.' }],
          ok: [8, 11], hint: 'One mistake is about which callback this is in, one is about time, one is about doing the same lookup 60 times a second.' },
        { type: 'reveal', title: 'Interview-style question: “How would you make a game run the same on every machine?”', html: `<ul><li>Separate <b>simulation</b> (fixed step, deterministic) from <b>rendering</b> (as fast as possible, interpolated).</li><li>Never use frame count as time. Use <code>dt</code> or the fixed step.</li><li>Cap catch-up steps (spiral of death) and decide what to drop: time, not state.</li><li>Seed all gameplay randomness, keep it out of rendering (see the procgen lesson).</li><li>Floating point is deterministic on one machine and compiler but can differ across platforms. For lockstep multiplayer use fixed-point or integers.</li></ul>` },
      ],
    },
    {
      id: 'gd-input-fsm', title: 'Input, buffering and state machines', minutes: 25,
      summary: 'How games read input, why they forgive players, and how to stop booleans multiplying into bugs.',
      sections: [
        { type: 'text', html: `
<h3>Input is a sampled signal</h3>
<p>The game does not receive "a press", it samples the keyboard or pad once per frame. Two models:</p>
<ul><li><b>Polling</b>: ask "is jump held right now?" every frame. Simple, perfect for continuous things (moving left, holding a charge).</li><li><b>Events</b>: the engine tells you "jump was pressed" or "released". Better for one-shot actions (the press itself matters, not the state).</li></ul>
<p>Most engines give you both (<code>Input.is_action_pressed</code> versus <code>Input.is_action_just_pressed</code>, or the <code>_input(event)</code> callback). Always bind <b>actions</b> ("jump", "attack") rather than physical keys so rebinding and gamepads are free.</p>
<h3>Forgive the player</h3>
<p>Humans press buttons a few frames early or late and a game that checks the exact frame feels broken. Cheap, invisible tricks fix that:</p>
<ul><li><b>Coyote time</b>: keep allowing the jump for ~100 ms after leaving a ledge.</li><li><b>Jump buffering</b>: remember a jump pressed ~100 ms before landing and fire it on touchdown.</li><li><b>Input buffering</b> in action games: queue the next attack during the current animation.</li><li><b>Corner correction</b>: nudge the player around a block's corner instead of bonking the head.</li></ul>
<p>Implement the first two in the drill: it is a classic interview-size problem and the code is small.</p>` },
        { pid: 'drill-jumper', type: 'drill', ref: 'jumper' },
        { type: 'text', html: `
<h3>State machines</h3>
<p>A player can idle, run, jump, fall, dash, attack, take damage and die. The tempting implementation is a pile of booleans: <code>is_jumping</code>, <code>is_attacking</code>, <code>is_hurt</code>... With 6 booleans there are 64 combinations and most are nonsense ("hurt and dashing and dead"). Each new feature multiplies the bug surface.</p>
<p>A <b>finite state machine</b> allows exactly one state at a time, and only listed transitions. Impossible combinations are unrepresentable. The usual shapes:</p>
<ul><li><b>Enum + match</b>: the smallest thing that works. Good for 3 to 8 states.</li><li><b>State objects</b> (or child nodes in Godot): each state owns its <code>enter</code>, <code>update</code>, <code>exit</code>. Scales to big characters and keeps code per state together.</li><li><b>Hierarchical</b>: "airborne" contains "jumping" and "falling" and shares their gravity logic.</li><li><b>Pushdown (stack)</b>: hit-stun pushes on top of running, and popping returns to what you were doing. Menus and dialogue use the same idea.</li></ul>
<pre><code>enum State { IDLE, RUN, AIR }
var state = State.IDLE

func _physics_process(delta):
    match state:
        State.IDLE: if Input.get_axis("left", "right") != 0: state = State.RUN
        State.RUN:  if not is_on_floor(): state = State.AIR
        State.AIR:  if is_on_floor(): state = State.IDLE</code></pre>
<p>In Zig or C++ an exhaustive <code>switch</code> over an enum is checked by the compiler: add a state and every switch that forgets it stops compiling. That is the real win over a pile of <code>if</code> statements.</p>` },
        { pid: 'drill-fsm', type: 'drill', ref: 'fsm' },
        { pid: 'q-fsm-1', type: 'quiz', q: 'Your boss fight has phases (idle, charge, slam, stunned) and a new "enraged" mode that changes how every one of them behaves. What is the cleanest way to model it?',
          options: ['Add an is_enraged boolean and check it inside every state', 'Make a second copy of the state machine for enraged mode', 'Use a hierarchical or parameterised machine: the enraged flag selects a different set of timings and transitions, while the states stay the same', 'Use a deeper if/else chain in the update function'],
          answer: 2, explain: 'Keep the state set small and put the variation in data (timings, damage) or a parent state. A boolean sprinkled through every state is exactly the pile-of-flags problem again, only one level up.' },
        { pid: 'q-fsm-2', type: 'quiz', q: 'The player presses jump 60 ms before touching the ground and nothing happens. Which technique fixes it?',
          options: ['Coyote time', 'Jump buffering', 'Corner correction', 'A higher jump'], answer: 1, explain: 'Buffering stores the press and fires it on landing. Coyote time is the mirror image: jumping shortly <i>after</i> leaving the ground.' },
      ],
    },
    {
      id: 'gd-entities', title: 'Entities, components and scenes', minutes: 25,
      summary: 'Inheritance versus composition, Godot\'s node tree, and the data-oriented ECS idea behind sparse sets.',
      sections: [
        { type: 'text', html: `
<h3>The inheritance trap</h3>
<p>The first instinct is a class hierarchy: <code>Enemy → FlyingEnemy → ShootingFlyingEnemy</code>. It breaks the day you want a walking enemy that shoots, a flying one that does not, and a boss that is both. You end up with diamond inheritance or copy-paste. The standard fix is <b>composition</b>: build things out of small parts that each do one job (Health, Mover, Shooter, Collider).</p>
<h3>Three ways to compose</h3>
<ol><li><b>Scene tree (Godot, Unity prefabs)</b>: an object is a tree of nodes. A goblin is a <code>CharacterBody2D</code> with children for the sprite, collision shape, hurtbox and a script. Reuse comes from saving that tree as a scene and instancing it. Communication: <b>call down, signal up</b>. A parent may call methods on its children, but children emit signals and never reach for their parents.</li><li><b>Component objects</b>: an entity is a bag of component objects with behaviour. Easy to read, but each component carries its own update and memory layout is scattered.</li><li><b>ECS (entity-component-system)</b>: entities are just ids, components are plain data, and <i>systems</i> are functions that run over all entities with a given set of components. Behaviour lives in systems, data in packed arrays.</li></ol>
<h3>Why ECS is fast: data-oriented design</h3>
<p>CPUs are fast at walking arrays in order and slow at chasing pointers. A movement system that needs <code>Position</code> and <code>Velocity</code> for 50,000 entities should read two tight arrays, not 50,000 scattered objects. The data structure underneath is usually a <b>sparse set</b>: a dense array of the component values (cheap to iterate) plus a sparse array mapping entity id to its dense slot (cheap lookup). Removal uses swap-remove to keep the dense array gap-free. Build one in the drill.</p>
<div class="callout tip"><b>When is ECS worth it?</b> When you have thousands of similar things (bullets, particles, units, tiles) or need to serialise and rewind the world. For a platformer with fifty entities, Godot's node tree is simpler and fast enough. Pick the tool for the scale you actually have.</div>` },
        { pid: 'drill-sparse', type: 'drill', ref: 'sparse_set' },
        { pid: 'q-ecs-1', type: 'quiz', q: 'In a sparse set, why does <code>remove</code> copy the <i>last</i> element into the freed slot instead of shifting everything down?',
          options: ['Shifting would break the sparse array', 'It keeps removal O(1) and the dense array gap-free, at the cost of not preserving order', 'It preserves insertion order', 'The last element is always the oldest'], answer: 1, explain: 'Swap-remove is O(1) and leaves no holes to skip while iterating. The price is that iteration order changes, so never rely on it.' },
        { pid: 'q-ecs-2', type: 'quiz', q: 'In Godot, a Health node needs to tell the UI that health changed. What is the idiomatic way?',
          options: ['Health calls get_node("/root/Main/UI/Bar") and sets the value', 'Health emits a signal like health_changed(value) and the UI connects to it', 'The UI polls Health every frame', 'Both are stored in a global singleton'], answer: 1, explain: '“Call down, signal up”: the Health node should not know the UI exists. A signal keeps both reusable (you can put the same Health on an enemy with no UI).' },
        { type: 'reveal', title: 'Design question: “How would you structure bullets in a bullet-hell with 20,000 on screen?”', html: `<ul><li>No node per bullet. Store positions and velocities in flat arrays (struct of arrays) and update them in one tight loop.</li><li>Render them with one batched draw call (a MultiMesh or a single custom draw) instead of 20,000 sprites.</li><li>Use a pool/free-list to recycle slots (see the performance lesson), no allocation in the hot path.</li><li>Collision against the player only: test bullets against a handful of player hitboxes, using a spatial hash if there are many targets.</li><li>Cull off-screen bullets as you iterate and recycle them.</li></ul>` },
      ],
    },
    {
      id: 'gd-perf', title: 'Performance, memory and the frame budget', minutes: 30,
      summary: 'Profile first, then kill per-frame allocations, pool objects and stop doing O(n²) neighbour checks.',
      sections: [
        { type: 'text', html: `
<h3>Rule zero: measure</h3>
<p>Guessing where time goes is wrong most of the time. Use the profiler (Godot's Debugger → Profiler / Monitors, Tracy, or <code>perf</code> on native builds) and look at the <i>slowest frame</i>, not the average: players notice the hitch, not the mean. Also decide which side is the bottleneck: <b>CPU</b> (game logic, physics), <b>GPU</b> (fill rate, shaders, overdraw), or <b>draw calls</b> (too many separate things submitted).</p>
<h3>The usual suspects</h3>
<ul><li><b>Allocation in the hot loop.</b> Creating objects/strings/arrays every frame causes GC pauses (GDScript, C#) or allocator pressure (C++, Zig). Preallocate and reuse.</li><li><b>O(n²) neighbour checks.</b> Every enemy checking every other enemy. Use a spatial hash or grid (drill below).</li><li><b>Pointer chasing.</b> Arrays of pointers to objects scattered in memory. Prefer flat arrays of plain data.</li><li><b>Doing unneeded work.</b> Update only what is on or near the screen. Skip animation for off-screen enemies. Lower the AI tick rate (think every 4 frames, staggered).</li><li><b>Too many draw calls.</b> Batch by texture/material, use atlases and tile maps, instance repeated meshes.</li><li><b>Overdraw and big shaders</b> on mobile and integrated GPUs.</li></ul>
<h3>Object pooling</h3>
<p>Spawning and freeing a bullet 50 times a second churns memory. A <b>pool</b> allocates N bullets once and hands them out and takes them back. Acquire returns null (or recycles the oldest) when empty, which is a <i>design decision</i>: dropping a bullet is nearly always better than a hitch.</p>
<h4>Zig, with the capacity in the type</h4>
<pre><code>fn Pool(comptime T: type, comptime n: usize) type {
    return struct {
        items: [n]T = undefined,
        used: [n]bool = @splat(false),

        fn acquire(self: *@This()) ?*T {
            for (&amp;self.used, 0..) |*u, i| {
                if (!u.*) { u.* = true; return &amp;self.items[i]; }
            }
            return null;   // full: the caller decides what to do
        }
    };
}</code></pre>
<h4>The same idea in C++</h4>
<pre><code>template &lt;class T, std::size_t N&gt;
class Pool {
    std::array&lt;T, N&gt; items_{};
    std::array&lt;bool, N&gt; used_{};
public:
    T* acquire() {
        for (std::size_t i = 0; i &lt; N; ++i)
            if (!used_[i]) { used_[i] = true; return &amp;items_[i]; }
        return nullptr;
    }
};</code></pre>
<p>These linear scans are O(n); a real pool keeps a free list so acquire is O(1). Try improving it as an extra exercise.</p>` },
        { pid: 'drill-hash', type: 'drill', ref: 'spatial_hash' },
        { pid: 'bug-cpp-update', type: 'bug', title: 'Spot the update-loop bugs (C++)',
          prompt: '<p>This C++ enemy update runs every frame. Click the <b>3</b> lines that hurt performance or can crash.</p>',
          code: String.raw`void World::update(float dt) {
    for (Enemy* e : enemies) {
        std::string label = "enemy_" + std::to_string(e->id);
        e->think(dt, label);
        for (Enemy* other : enemies) {
            if (distance(e->pos, other->pos) < 32.0f) e->avoid(other);
        }
        if (e->hp <= 0) enemies.erase(std::find(enemies.begin(), enemies.end(), e));
    }
}`,
          bugs: [{ line: 3, why: 'A <code>std::string</code> is built (and allocated) for every enemy every frame, just to pass as a label. Build it once at spawn or pass the id.' },
                 { line: 5, why: 'Every enemy tests every other enemy: O(n²). With 2,000 enemies that is four million distance checks per frame. Use a spatial hash or grid and query only the neighbours.' },
                 { line: 8, why: 'Erasing from the vector while iterating it with a range-for invalidates the iterator: undefined behaviour or a crash. Mark dead enemies and remove them after the loop (or swap-remove with an index loop).' }],
          ok: [2, 4], hint: 'One is an allocation, one is quadratic, one is an iterator invalidation.' },
        { pid: 'q-perf-1', type: 'quiz', q: 'Your game averages 60 fps but players report stutter. What should you look at first?',
          options: ['The average frame time', 'The worst-case frames (99th percentile or spikes), usually caused by allocation, GC, loading or a periodic task', 'The GPU temperature', 'The resolution'], answer: 1, explain: 'Averages hide hitches. Capture a frame-time graph and investigate the spikes: collection pauses, asset loads on the main thread, or one system doing a big batch every N frames (spread it out).' },
        { pid: 'q-perf-2', type: 'quiz', q: 'Which change most reduces cost for 3,000 enemies each looking for nearby allies?',
          options: ['Check only every other enemy', 'Bucket enemies into a grid/spatial hash and query neighbouring cells', 'Sort the enemy list each frame', 'Use floats instead of doubles'], answer: 1, explain: 'Spatial partitioning turns the all-pairs O(n²) into roughly O(n × neighbours). It is the biggest single win for crowds.' },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
