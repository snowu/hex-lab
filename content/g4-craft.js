/* Game dev section, track 4: techniques and practice, including Zig and C++ for games. */
TRACKS.push({
  id: 'gdcraft', domain: 'gamedev', icon: '🛠️', title: 'Techniques & Practice',
  blurb: 'Procedural generation, cameras, data and saves, a Godot field guide, Zig and C++ for games, and a ladder of small projects to build.',
  lessons: [
    {
      id: 'gd-procgen', title: 'Procedural generation', minutes: 35,
      summary: 'Seeds, deterministic randomness, noise, cellular automata caves and the validation step everyone forgets.',
      checks: [
        { q: 'You want shareable seeds and reproducible bug reports for generated levels. What must be true of the random numbers?',
          options: ['They must come from explicit per-concern generator state created from the seed, so cosmetics cannot advance gameplay numbers', 'They must come from the fastest global generator available', 'They must be reseeded from the wall clock every room', 'They must never be reused across seeds'],
          answer: 0, explain: 'Determinism needs owned streams: one stream per concern keeps a particle effect from shifting every later level number.' },
        { q: 'Cellular automata produced great-looking caves, but some runs trap the player away from the exit. What is the required next step?',
          options: ['Run more smoothing steps until every map connects', 'Flood-fill between start, exit and key areas, then repair with a tunnel or reject and retry the next seed', 'Ship it: unreachable pockets add mystery', 'Convert the map to an image to inspect it visually'],
          answer: 1, explain: 'The smoothing rule makes caves, not guarantees, so validation plus repair turns content into a fair level.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Seeds and determinism</h3>
<p>Procedural content is a function of a <b>seed</b>: same seed, same world. That gives you shareable seeds, daily challenges, replays, and bugs you can reproduce. It only works if your random numbers are <b>yours</b>: a generator with explicit state that you create from the seed, not a global one that any system can advance. If a particle effect calls <code>random()</code> in the middle of level generation, every level after it changes. Keep one stream per concern (layout, loot, cosmetics). Implement a small LCG in the first drill to see exactly what state means.</p>
<h3>Common techniques</h3>
<ul><li><b>Random walk / drunkard\'s walk</b>: a digger wanders and carves floor. Cheap, organic caves and corridors.</li><li><b>Cellular automata</b>: random noise, then repeatedly apply a neighbour-counting rule. Creates cave-like blobs (second drill and the simulation).</li><li><b>Room and corridor / BSP</b>: split space into rooms recursively and connect them. Classic dungeons.</li><li><b>Noise</b> (Perlin, simplex, value noise): smooth randomness for terrain heights, biomes, clouds. Layer several scales (<i>octaves</i>) for detail.</li><li><b>Wave Function Collapse</b>: choose tiles so every neighbour pair is compatible, propagate constraints, collapse the lowest-entropy cell. Great for consistent local style.</li><li><b>Grammars and templates</b>: assemble hand-made chunks (Spelunky\'s level chunks) so quality stays high.</li></ul>
<h3>The part that makes it playable</h3>
<p>Randomness makes <i>content</i>; design makes it <i>fair</i>. Always add a validation and repair step:</p>
<ul><li>Is the start connected to the exit? (Flood-fill. The simulation highlights disconnected pockets in amber.)</li><li>Are there enough resources, and not too many enemies at the spawn?</li><li>Reject-and-retry with the next seed, or repair by carving a tunnel.</li><li>Constrain the randomness. Pure noise is boring; <i>authored rules plus randomness</i> is what produces memorable levels.</li></ul>` },
        { pid: 'drill-rng', type: 'drill', ref: 'rng_lcg' },
        { pid: 'sim-cave', type: 'sim', id: 'gdcave', title: 'Cellular automata caves',
          intro: '<p>Random noise is smoothed with the rule “become a wall if 5 or more of the 8 neighbours are walls”. Press <b>smooth</b> a few times.</p>',
          try: ['Start with ~45% walls and press smooth 4 to 5 times: caves emerge from static.', 'Raise the fill to 55%: more solid, more disconnected pockets (amber).', 'Lower it to 35%: huge open areas, almost no structure.', 'Press <b>keep largest cave</b> to apply the usual repair: delete everything unreachable.', 'Press <b>new seed</b> and compare; same parameters, different map.'] },
        { pid: 'drill-ca', type: 'drill', ref: 'ca_smooth' },
        { pid: 'q-proc-1', type: 'quiz', q: 'A seeded dungeon changes after you add a particle effect that calls the global <code>random()</code>. Why?',
          options: ['Particles use too much memory', 'The effect advances the shared random stream, shifting every later number used by generation', 'Seeds expire', 'The GPU interferes'], answer: 1, explain: 'Use separate RNG instances per system so cosmetic randomness cannot disturb gameplay randomness.' },
        { pid: 'q-proc-2', type: 'quiz', q: 'Which step is essential after cellular-automata generation before shipping the level?',
          options: ['Increase the number of smoothing steps', 'Check connectivity (flood fill) between start, exit and key areas, and repair or reject', 'Convert to a PNG', 'Nothing'], answer: 1, explain: 'The rule makes caves, not guarantees. Validate reachability and difficulty.' },
        { pid: 'go-deeper', type: 'text', html: `<div class="callout tip"><b>Go deeper:</b><ul><li><a href="#/lesson/gd-noise">Noise, terrain and Wave Function Collapse</a>: coherent noise, octaves, domain warping and Wave Function Collapse.</li></ul></div>` },
      ],
    },
    {
      id: 'gd-noise', title: 'Noise, terrain and Wave Function Collapse', minutes: 35,
      summary: 'Smooth randomness for terrain and textures: value noise, octaves, domain warping, thresholds for caves and biomes, and constraint-based generation.',
      checks: [
        { q: 'Your value-noise terrain shows visible creases along the grid. The corners blend with plain linear interpolation. What is the fix?',
          options: ['Shape the blend fraction with a smoothstep curve such as t times t times (3 minus 2t)', 'Sample fewer points so the grid is coarser', 'Round every sample to 0 or 1', 'Add more octaves at the same frequency'],
          answer: 0, explain: 'Linear blends kink at lattice points; easing the fraction smooths the derivative across cell boundaries.' },
        { q: 'Straight noise bands look too regular for marble and rivers. You try noise(p + k times noise2(p)). What does this do?',
          options: ['It tiles the noise so textures repeat seamlessly', 'It warps the sampling domain with another noise, turning regular features into flowing organic ones', 'It doubles the octave count for extra detail', 'It converts value noise into white noise'],
          answer: 1, explain: 'Domain warping distorts the input coordinates, so straight features inherit the organic flow of the warping field.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Why not just random numbers?</h3>
<p>Plain random values are <b>white noise</b>: every sample independent, like TV static. Terrain, clouds, water and wood grain are <b>smooth but irregular</b>: nearby points have similar values, far points do not. <b>Coherent noise</b> gives you that: a deterministic function of position (and a seed) that varies smoothly, so you can ask for the value at any <code>(x, y)</code> without generating the rest, and the same seed always gives the same world.</p>
<h3>Value noise</h3>
<p>The simplest construction: put a pseudo-random value at every integer grid point (a <b>hash</b> of the coordinates and the seed, so no storage), and <b>interpolate</b> between the four surrounding corners. Linear interpolation shows the grid as creases; a <b>smoothstep</b> curve <code>t*t*(3-2t)</code> on the fraction makes it smooth. Lowering the frequency stretches the blobs, raising it makes them smaller.</p>
<pre><code data-check="zig">const std = @import("std");

/// A hash of an integer grid point and a seed, mapped to [0, 1). No tables, no storage: any point can be asked for at any time.
fn hash1(x: i32, seed: u32) f32 {
    var h: u32 = @bitCast(x);
    h = h *% 374761393 +% seed *% 668265263;
    h = (h ^ (h &gt;&gt; 13)) *% 1274126177;
    h ^= h &gt;&gt; 16;
    return @as(f32, @floatFromInt(h &amp; 0xFFFFFF)) / 16777216.0;
}

fn smooth(t: f32) f32 {
    return t * t * (3 - 2 * t);
}

/// 1-D value noise: random values at integers, smoothly blended in between.
fn valueNoise(x: f32, seed: u32) f32 {
    const xi: i32 = @intFromFloat(@floor(x));
    const t = smooth(x - @floor(x));
    const a = hash1(xi, seed);
    const b = hash1(xi + 1, seed);
    return a + (b - a) * t;
}

/// Fractal noise: several octaves, each at double the frequency and a fraction (persistence) of the amplitude, normalised to [0, 1].
fn fbm(x: f32, octaves: u32, persistence: f32, seed: u32) f32 {
    var sum: f32 = 0;
    var amp: f32 = 1;
    var norm: f32 = 0;
    var freq: f32 = 1;
    for (0..octaves) |o| {
        sum += valueNoise(x * freq, seed + @as(u32, @intCast(o))) * amp;
        norm += amp;
        amp *= persistence;
        freq *= 2;
    }
    return sum / norm;
}

test "noise is deterministic, in range and continuous" {
    try std.testing.expectEqual(valueNoise(3.7, 1), valueNoise(3.7, 1));
    try std.testing.expect(valueNoise(3.7, 1) != valueNoise(3.7, 2)); // a different seed gives a different world
    var x: f32 = -20;
    var prev = valueNoise(x, 5);
    while (x &lt; 20) : (x += 0.01) {
        const v = valueNoise(x, 5);
        try std.testing.expect(v &gt;= 0 and v &lt;= 1);
        try std.testing.expect(@abs(v - prev) &lt; 0.02); // no jumps: nearby samples are close
        prev = v;
    }
}

test "adding octaves adds detail but keeps the range" {
    var x: f32 = 0;
    while (x &lt; 50) : (x += 0.37) {
        const v = fbm(x, 5, 0.5, 9);
        try std.testing.expect(v &gt;= 0 and v &lt;= 1);
    }
    // the same position differs between 1 and 5 octaves (the extra octaves contribute)
    try std.testing.expect(fbm(7.3, 1, 0.5, 9) != fbm(7.3, 5, 0.5, 9));
}</code></pre>
<h3>Octaves: fractal Brownian motion (fBm)</h3>
<p>One octave is smooth blobs. Real terrain has big mountains, then hills, then rocks, then pebbles. Sum several octaves: each has <b>double the frequency</b> (<i>lacunarity</i> 2) and a <b>fraction of the amplitude</b> (<i>persistence</i>, about 0.5), and divide by the total amplitude. The simulation below lets you add octaves and see detail appear; low persistence is smoother, high is rougher.</p>
<h3>Perlin and simplex noise</h3>
<p><b>Gradient noise</b> (Perlin, 1983, and the faster, less grid-aligned <b>simplex</b>) puts a random <i>direction</i> at each lattice point instead of a value and blends their influence. It has fewer blocky artefacts than value noise and a more even look. Most engines ship it: Godot's <code>FastNoiseLite</code> (Perlin, simplex, cellular, value) and <code>NoiseTexture2D</code>. Value noise is perfectly good for prototypes and it is what the simulation below uses.</p>
<h3>Turning numbers into worlds</h3>
<ul><li><b>Height to terrain</b>: bands of the noise value map to water, sand, grass, forest, rock, snow (try the colour option in the simulation). Thresholds are the whole art.</li><li><b>Biomes</b>: use two or three independent noises (height, moisture, temperature) and pick the biome from a table of combinations.</li><li><b>Caves</b>: threshold a noise field: below 0.45 is rock, above is open. Combine with the cellular-automata smoothing from the procgen lesson for cleaner shapes.</li><li><b>Islands</b>: multiply the noise by a falloff that is 1 in the centre and 0 at the edges.</li><li><b>Resources and decoration</b>: scatter by a separate noise, so ore appears in clusters rather than uniformly.</li><li><b>Textures and effects</b>: clouds, fire, dissolve masks, water flow (the shader lesson).</li></ul>
<h3>Domain warping</h3>
<p>Distort the <b>input</b> by another noise before sampling: <code>noise(p + k * noise2(p))</code>. Straight, regular features become flowing, organic ones: marble, rivers, alien landscapes. Tick the checkbox in the simulation.</p>
<h3>Practicalities</h3>
<ul><li><b>Seeds</b>: a seed is just another input to the hash. Derive per-layer seeds from the world seed so layers are independent.</li><li><b>Tileable noise</b>: for repeating textures wrap the lattice coordinates (modulo the period).</li><li><b>Chunking</b>: because noise is a function of position, an infinite world is generated chunk by chunk as the player moves, with neighbouring chunks matching perfectly.</li><li><b>Cost</b>: hash and interpolation per octave per sample. For large maps use a precomputed texture, a compute shader or the engine's native implementation; do not evaluate 10 octaves for every tile every frame.</li><li><b>Looks matter more than maths</b>: tune frequency, octaves and the thresholds by eye on screen, and pin the seed while you tune.</li></ul>
<h3>Wave Function Collapse</h3>
<p>Noise makes organic shapes but cannot guarantee that a river tile connects to another river tile. <b>Wave Function Collapse</b> (WFC) generates grids where <b>local rules</b> always hold, from an example or a tile set with adjacency constraints (which tile edges match):</p>
<ol><li>Every cell starts as a <b>superposition</b>: any tile possible.</li><li>Pick the cell with the <b>lowest entropy</b> (fewest remaining possibilities) and <b>collapse</b> it to one tile (random, weighted).</li><li><b>Propagate</b>: remove from its neighbours the tiles that no longer fit, and keep propagating until nothing changes.</li><li>Repeat until every cell is decided. If some cell has no options left (a <b>contradiction</b>), backtrack or restart.</li></ol>
<p>It is excellent for towns, dungeons, textures and decorative layers, because the output obeys the tile rules <i>and</i> looks varied. Its weakness is <b>global structure</b>: it knows nothing about reachability or pacing, so combine it with the validation step (flood fill, constraints on start and exit) or use it to dress up a layout made by another method.</p>
<h3>Choosing a generator</h3>
<table><tr><th>Need</th><th>Reach for</th></tr>
<tr><td>Natural terrain, clouds, resource distribution</td><td>Noise (fBm, thresholds, domain warp)</td></tr>
<tr><td>Cave-like open spaces</td><td>Cellular automata (or thresholded noise)</td></tr>
<tr><td>Rooms and corridors with guaranteed connectivity</td><td>BSP or room placement + corridors</td></tr>
<tr><td>Tile-consistent towns, interiors, textures</td><td>Wave Function Collapse</td></tr>
<tr><td>Hand-feel with variety</td><td>Authored chunks assembled randomly (Spelunky style)</td></tr></table>` },
        { pid: 'sim-noise', type: 'sim', id: 'gdnoise', title: 'Value noise, octaves and domain warping',
          intro: '<p>A 160×100 field of fractal value noise. Terrain colours are just thresholds on the value; untick them to see the raw greyscale.</p>',
          try: ['Set <b>octaves</b> to 1: smooth blobs. Raise it to 6: coastlines and mountains gain detail.', 'Raise <b>persistence</b>: higher octaves matter more and the map gets rougher; lower it for smooth hills.', 'Change <b>frequency</b>: the same shape zoomed in or out.', 'Change the <b>seed</b>: a completely different world from the same code.', 'Tick <b>domain warp</b>: straight blobs turn into flowing, organic forms.'] },
        { pid: 'q-noise-1', type: 'quiz', q: 'You add more octaves to a terrain function. What changes?',
          options: ['The map gets bigger', 'Finer detail is added at smaller scales (each octave doubles the frequency and shrinks the amplitude)', 'The seed changes', 'The values go outside 0 to 1 unless you normalise'], answer: 1, explain: 'Octaves add detail at ever smaller scales. You divide by the total amplitude to keep the range stable.' },
        { pid: 'q-noise-2', type: 'quiz', q: 'Why is noise better than a stored random map for an infinite world?',
          options: ['It is prettier', 'It is a function of position and seed, so any chunk can be generated on demand and neighbouring chunks line up with no storage', 'It uses more memory', 'It cannot be seeded'], answer: 1, explain: 'No state is needed: the same inputs always give the same value anywhere.' },
        { pid: 'q-noise-3', type: 'quiz', q: 'Which generator guarantees that adjacent tiles obey edge-matching rules (road meets road)?',
          options: ['Plain value noise', 'Wave Function Collapse with adjacency constraints', 'A random walk', 'Perlin noise'], answer: 1, explain: 'WFC propagates adjacency constraints as it decides cells, so the result satisfies the local rules by construction.' },
      ],
    },
    {
      id: 'gd-camera', title: 'Cameras, screen shake and parallax', minutes: 20,
      summary: 'A 2D camera that follows well, shakes with “trauma”, and does not make pixel art shimmer.',
      checks: [
        { q: 'A camera locked exactly to the player jitters the whole screen on every micro-movement. Which follow technique calms it?',
          options: ['A higher fixed lerp factor so it snaps harder', 'A larger look-ahead in every direction at once', 'A dead zone: the camera only moves once the player leaves a central box', 'Removing the map limits so the camera never clamps'],
          answer: 2, explain: 'A dead zone absorbs small motion so idle shuffling does not swing the entire view.' },
        { q: 'Distant mountains currently scroll at the same speed as the player layer, which looks flat. How should the parallax offsets work?',
          options: ['Move every layer by the full camera offset so nothing drifts', 'Scale each layer by camera position times (1 minus depth), keeping far layers nearly stationary and snapping to whole pixels', 'Move far layers faster than the foreground for drama', 'Parent all layers to the player node directly'],
          answer: 1, explain: 'Parallax sells depth by slowing far layers with depth; whole-pixel placement keeps pixel art from swimming.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Follow cameras</h3>
<ul><li><b>Locked</b> to the player: simple, but every micro-movement jitters the whole screen.</li><li><b>Dead zone</b>: the camera only moves when the player leaves a box in the middle.</li><li><b>Look-ahead</b>: shift the target in the direction of motion so the player sees more of where they are going.</li><li><b>Smoothing</b>: use the frame-rate independent exponential from the interpolation lesson, not a fixed lerp factor.</li><li><b>Room cameras</b> (Celeste, Zelda): snap or slide between fixed rooms; the design controls what the player sees.</li><li><b>Limits</b>: clamp to the map bounds so the camera never shows outside the level.</li></ul>
<h3>Screen shake with trauma</h3>
<p>A good model (from Squirrel Eiserloh\'s GDC talk on juicing cameras): keep a <b>trauma</b> value from 0 to 1. Events add to it, it decays linearly over time, and the shake amount is <code>trauma²</code> or <code>trauma³</code>, so small hits barely register and big ones hit hard. Drive offset (and a little rotation) with smooth noise rather than pure random to avoid a harsh buzz. Add a setting to scale or disable it.</p>
<h3>Parallax</h3>
<p>Layers further away move slower than the camera. Move each by <code>camera_x * (1 - depth)</code> (depth 0 is foreground, 1 is infinitely far, stationary). Keep layers on whole pixels for pixel art.</p>
<h3>Pixel art cameras</h3>
<p>If the game renders at a small base resolution and is scaled up (see the pixel art lessons), keep the camera on integer coordinates or sprites will “swim” as they cross sub-pixel boundaries. Smooth in float, then <b>round for rendering</b>. Godot: enable pixel snapping for 2D transforms and the nearest texture filter.</p>` },
        { pid: 'q-cam-1', type: 'quiz', q: 'Why use trauma squared (or cubed) for the shake magnitude instead of trauma itself?',
          options: ['It is cheaper to compute', 'Small values give almost no shake and large values ramp up quickly, so a series of small hits does not rattle the screen but a big one does', 'It avoids division by zero', 'It makes the shake slower'], answer: 1, explain: 'The nonlinearity gives a wide dynamic range from one number.' },
        { pid: 'q-cam-2', type: 'quiz', q: 'Your pixel art sprites flicker when the camera follows the player slowly. A likely fix?',
          options: ['Increase texture size', 'Round the camera and sprite positions to whole pixels at render time and use nearest-neighbour filtering', 'Add anti-aliasing', 'Use a bigger window'], answer: 1, explain: 'Sub-pixel positions sample different texels each frame. Snap to the pixel grid.' },
        { pid: 'go-deeper', type: 'text', html: `<div class="callout tip"><b>Go deeper:</b><ul><li><a href="#/lesson/gfx-transforms">Transforms, matrices and hierarchies</a>: the camera as a view transform, and zoom and rotation done with matrices.</li><li><a href="#/lesson/gd-smoothing">Interpolation, easing and smoothing</a>: the easing and damping maths behind smooth follow.</li></ul></div>` },
      ],
    },
    {
      id: 'gd-data-saves', title: 'Data-driven design and save files', minutes: 30,
      summary: 'Keep tuning numbers out of code, and write saves that survive updates and corruption.',
      checks: [
        { q: 'Version 3 of your game must still load saves from versions 1 and 2. How should migrations be organised?',
          options: ['Keep a version number from the first release plus one migration function per version step, never editing an old step', 'Edit the old migration steps so they jump straight to the newest format', 'Delete old saves on update and start fresh', 'Store the game code version inside each entity instead'],
          answer: 0, explain: 'Immutable per-step migrations chain any old save forward without breaking saves that already migrated.' },
        { q: 'Your simulation uses a fixed step and seeded RNG with no wall-clock reads. What is the cheapest correct replay format?',
          options: ['A video capture of each session', 'The seed plus the inputs per frame, re-simulated deterministically', 'A full snapshot of every object every frame', 'The wall-clock timestamps of each frame'],
          answer: 1, explain: 'Determinism makes seed plus inputs sufficient to rebuild the run, powering demos, bug reports and rollback.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Data-driven design</h3>
<p>Enemy HP, weapon damage, loot tables and level layouts are <i>data</i>. Put them in files (Godot <code>Resource</code> files, JSON, CSV) and load them, instead of hard-coding constants across scripts. Benefits: designers (or you at 2 am) tweak without recompiling, hot reload speeds iteration, mod support gets easier, and the numbers can be balanced in a spreadsheet. The rule: <b>code defines behaviour, data defines instances</b>.</p>
<ul><li>Validate data on load and fail loudly, with the file and field name in the error.</li><li>Reference things by stable string ids (<code>"iron_sword"</code>), never by array index, or reordering breaks saves.</li><li>Keep derived values (DPS, total cost) computed, not stored.</li></ul>
<h3>Save files</h3>
<ul><li><b>Version everything</b> with a number from the first release, and keep one migration function per version step. Never edit an old step.</li><li><b>Save the state, not the objects</b>: ids, positions, counters, so the format is independent from your class layout.</li><li><b>Atomic writes</b>: write to a temp file, flush, then rename over the real save. A crash mid-write then leaves the previous save intact. Keep one backup.</li><li><b>Never trust the file</b>: validate lengths, ranges and checksums. A corrupt or hand-edited file must produce a friendly error, not a crash or an out-of-bounds read.</li><li>Text (JSON) saves are debuggable and easy to migrate; binary saves are compact and fast but need explicit layout, endianness and versioning, as in the drill.</li><li><b>Cloud saves</b> add conflict handling: compare timestamps or play time, or ask the player when both changed.</li></ul>
<h3>Determinism and replays</h3>
<p>If simulation is deterministic (fixed step, seeded RNG, no wall-clock reads), a replay is just <i>seed + inputs per frame</i>. That powers demos, bug reports (“attach the replay”), speedrun verification and rollback netcode.</p>` },
        { pid: 'drill-save', type: 'drill', ref: 'save_codec' },
        { pid: 'q-save-1', type: 'quiz', q: 'Your game crashes while writing the save file and the player\'s progress is gone. What should you have done?',
          options: ['Write more often', 'Write to a temporary file and atomically rename it over the old save (keeping a backup)', 'Compress the save', 'Encrypt the save'], answer: 1, explain: 'Write-then-rename means the old file is never half-overwritten.' },
        { pid: 'q-save-2', type: 'quiz', q: 'Why reference items in saves by a string id such as <code>"iron_sword"</code> instead of their index in the item list?',
          options: ['Strings are faster', 'Reordering or inserting items in the data would silently change what every saved index means', 'It saves space', 'Indices cannot be saved'], answer: 1, explain: 'Stable ids survive content changes. Indices turn a harmless data edit into corrupted saves.' },
        { pid: 'go-deeper', type: 'text', html: `<div class="callout tip"><b>Go deeper:</b><ul><li><a href="#/lesson/pat-type-object">Type object, prototype and data-driven design</a>: type objects and data-driven design: monsters and items defined in data.</li><li><a href="#/lesson/prod-release">Shipping and operating a game</a>: save versioning and migrations once real players have saves.</li></ul></div>` },
      ],
    },
    {
      id: 'gd-godot', title: 'Godot field guide', minutes: 30,
      summary: 'The mental model: scenes, nodes, signals, resources, autoloads, physics layers and exporting.',
      checks: [
        { q: 'Where does a global audio manager or save system belong in a Godot project, and what is the caution?',
          options: ['In a thin autoload singleton, kept few in number so global state stays manageable', 'Duplicated in every scene so each level owns its copy', 'Inside the player script, since the player is always present', 'In the export preset, so it only exists in release builds'],
          answer: 0, explain: 'Autoloads suit truly global services, but each one is shared mutable state, so they stay few and thin.' },
        { q: 'A newcomer puts player movement in _process and tunes speeds there, then reports different handling on high-refresh monitors. What is the fix?',
          options: ['Multiply by a bigger constant in _process', 'Do movement in _physics_process at its fixed rate, reserving _process for visuals and UI', 'Cap the monitor refresh rate to 60 Hz', 'Move the tuning numbers into the export preset'],
          answer: 1, explain: 'Gameplay movement belongs in the fixed-rate callback for stable simulation; per-frame visuals belong in _process.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The mental model</h3>
<ul><li><b>Everything is a node.</b> Nodes form a tree; a <b>scene</b> is a saved tree you can instance inside other scenes. A level is a scene that contains player, enemy and tile-map scenes.</li><li><b>Call down, signal up.</b> A parent calls methods on children it owns. A child announces events with <b>signals</b> and has no idea who listens.</li><li><b>Resources</b> (<code>.tres</code>) are data objects shared between scenes: stats, items, themes. Create custom ones with <code>class_name</code> and <code>@export</code> fields, edit in the inspector.</li><li><b>Autoloads</b> (singletons) for truly global services: audio manager, save system, event bus. Keep them few and thin.</li><li><b>Groups</b> tag nodes (“enemies”) so you can call or query them without references.</li></ul>
<h3>GDScript in five lines that matter</h3>
<pre><code>class_name Player extends CharacterBody2D
@export var speed := 220.0               # editable in the inspector
@onready var sprite := $Sprite2D         # resolved when the node enters the tree
signal died
func _physics_process(delta):
    velocity.x = Input.get_axis("left", "right") * speed
    move_and_slide()</code></pre>
<p>Use static types (<code>var hp: int</code>) for speed and earlier errors. Use <code>await</code> for timers and animations. When GDScript becomes the bottleneck you have options: C# (typed, fast, .NET), or <b>GDExtension</b> to write hot paths in C++ (godot-cpp), which is also the door through which Zig and Rust bindings exist.</p>
<h3>Physics setup checklist</h3>
<ol><li>Name your collision layers (player, world, enemy, player_bullet, pickup, hurtbox).</li><li>For every object decide <b>layer</b> (what I am) and <b>mask</b> (what I detect).</li><li>Use <code>Area2D</code> for hitboxes and hurtboxes, <code>CharacterBody2D</code> for the player.</li><li>Do movement in <code>_physics_process</code>.</li></ol>
<h3>Project structure that stays sane</h3>
<pre><code>res://
  scenes/     player/  enemies/  levels/  ui/
  scripts/    (only shared code; per-scene scripts live next to the scene)
  assets/     art/  audio/  fonts/
  data/       items/  enemies/  (resources and JSON)</code></pre>
<h3>Exporting</h3>
<ul><li>Install export templates (Editor → Manage Export Templates), then add a preset per platform.</li><li><b>Web</b> export works well for jams and portfolios. It needs cross-origin isolation headers for threads and has size and audio quirks. Host on itch.io or a static host that sets the headers.</li><li>Test an exported build early. Many problems (paths, missing resources, performance) only appear in release builds.</li></ul>
<div class="callout tip">For pixel art: Project Settings → Rendering → Textures → default filter <b>Nearest</b>; Display → Window → Stretch mode <b>canvas_items</b> with an integer scale mode; enable <b>Snap 2D Transforms to Pixel</b>.</div>` },
        { pid: 'q-godot-1', type: 'quiz', q: 'A <code>Coin</code> scene needs to tell the HUD to add score. What is the idiomatic design?',
          options: ['Coin calls get_node("/root/Main/HUD").add_score(1)', 'Coin emits a signal (or an autoload event bus emits one), and the HUD or a game-state node connects to it', 'The HUD polls all coins', 'Store score inside the coin'], answer: 1, explain: 'The Coin should not know the HUD exists. Signals (or an event bus) keep scenes reusable and testable alone.' },
        { pid: 'q-godot-2', type: 'quiz', q: 'Player bullets should hit enemies but never the player. Which setup?',
          options: ['Put them on the same layer and check names in code', 'Bullet on a “player_bullet” layer with mask = enemy (+ world); enemies detect that layer; the player\'s mask does not include it', 'Disable physics on bullets', 'Use groups only'], answer: 1, explain: 'Layers and masks are filtered by the engine\'s broad phase, which is faster and cleaner than branching in scripts.' },
      ],
    },
    {
      id: 'gd-zig', title: 'Zig for game programming', minutes: 40,
      summary: 'A fast tour of the Zig features games care about (explicit allocators, comptime, optionals, errors, packed data) and how to build a game with it.',
      checks: [
        { q: 'A Zig system needs scratch buffers every frame with zero per-frame leaks and one cheap reset. Which allocator pattern fits?',
          options: ['Hand the system an arena for per-frame scratch and reset it once per frame', 'Call the page allocator for each buffer and free them one by one', 'Store scratch data in globals so nothing allocates', 'Leak the scratch buffers and restart the game hourly'],
          answer: 0, explain: 'Arenas match frame lifetimes: many quick allocations, one reset, and the test allocator still catches real leaks.' },
        { q: 'A function may or may not return a target entity. How should that be typed in Zig, and how does the caller unwrap it?',
          options: ['As a raw nullable pointer checked against null with pointer casts', 'As an optional ?T, unwrapped with if (x) |v| or orelse, so absence is explicit in the type', 'As an error union, since missing data is always an error', 'As a global sentinel entity that means none'],
          answer: 1, explain: 'Optionals make absence visible to the compiler with no null pointers by default, unlike hidden sentinel conventions.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Why Zig for games</h3>
<ul><li><b>No hidden allocation or control flow.</b> If it allocates, it takes an allocator parameter. If it can fail, the type says so. Perfect for frame-budget thinking and for arena allocators (one per frame or per level, freed in one go).</li><li><b>comptime</b>: generic code and tables built at compile time, without a separate template language. Containers like <code>ArrayList</code> are ordinary functions that return types.</li><li><b>C interop</b> is first class: <code>@cImport</code> and a build system that compiles C and C++ too. SDL, raylib, sokol and stb are one dependency away.</li><li><b>Safety in Debug, speed in Release</b>: bounds checks, overflow checks and use of undefined memory are caught in Debug and Safe builds; <code>ReleaseFast</code> removes them.</li><li><b>Tests are part of the language</b>: <code>test "name" { ... }</code> blocks in the same file, run with <code>zig test</code>. That is what the drills use.</li></ul>
<div class="callout warn"><b>Zig is pre-1.0.</b> The language and standard library still change between releases (this lab is written and compiled against 0.17.0). When an online example does not compile, check its Zig version first. Pin a version per project in your README or build tooling.</div>
<h3>Structs, methods and optionals</h3>
<pre><code>const std = @import("std");

const Enemy = struct {
    hp: i32,
    pos: [2]f32,

    fn hit(self: *Enemy, dmg: i32) bool {   // *Enemy: may modify
        self.hp -= dmg;
        return self.hp &lt;= 0;
    }
};

pub fn main() !void {
    var e = Enemy{ .hp = 10, .pos = .{ 0, 0 } };
    std.debug.print("dead? {}\\n", .{e.hit(12)});
}</code></pre>
<p>Values that may be absent are <b>optionals</b> (<code>?T</code>), unwrapped with <code>if (x) |v| ...</code> or <code>x orelse default</code>. There are no null pointers by default, so a whole class of crashes is a compile error.</p>
<h3>Tagged unions: state and shapes in one type</h3>
<pre><code>const Shape = union(enum) {
    circle: f32,
    rect: struct { w: f32, h: f32 },

    fn area(self: Shape) f32 {
        return switch (self) {            // the compiler checks every case is handled
            .circle =&gt; |r| std.math.pi * r * r,
            .rect =&gt; |r| r.w * r.h,
        };
    }
};</code></pre>
<p>This is the natural way to model game states, AI actions, events and commands: each variant carries only its own data.</p>
<h3>Errors are values</h3>
<pre><code>const LoadError = error{ NotFound, Corrupt };

fn loadLevel(name: []const u8) LoadError!u32 { ... }

const lvl = loadLevel("forest") catch |err| {
    std.debug.print("failed: {}\\n", .{err});
    return;
};
// or propagate: const lvl = try loadLevel("forest");</code></pre>
<h3>Allocators and defer</h3>
<pre><code>fn sumFrames(allocator: std.mem.Allocator, count: usize) !u64 {
    const frames = try allocator.alloc(u64, count);
    defer allocator.free(frames);              // runs when the scope ends, on every path
    for (frames, 0..) |*f, i| f.* = i * i;
    var total: u64 = 0;
    for (frames) |f| total += f;
    return total;
}</code></pre>
<p>In tests pass <code>std.testing.allocator</code>: it fails the test when you leak. In a game, hand your systems an <b>arena</b> for per-frame scratch memory and reset it every frame, or use fixed-capacity types (like the pools and sparse sets in the drills) so nothing allocates after startup.</p>
<h3>comptime generics</h3>
<pre><code>fn Pool(comptime T: type, comptime n: usize) type {
    return struct {
        items: [n]T = undefined,
        used: [n]bool = @splat(false),
        fn acquire(self: *@This()) ?*T { ... }
    };
}
var bullets = Pool(Bullet, 256){};</code></pre>
<h3>Building a game</h3>
<p>You do not need an engine to learn the fundamentals: open a window, run the fixed-timestep loop from the first lesson, draw rectangles, read input. Libraries that fit Zig well (check each one\'s README for the Zig version it targets):</p>
<ul><li><b>raylib</b> (simple C library, great for learning; raylib\'s own repo ships a <code>build.zig</code> and there are community Zig bindings),</li><li><b>SDL3</b> (windowing, input, audio, GPU; build integrations exist for Zig),</li><li><b>sokol</b> (small cross-platform headers with Zig bindings, nice for web via WASM),</li><li><b>Mach</b> (a game engine and toolkit written in Zig).</li></ul>
<p>Plan: do the Zig drills, then recreate Pong with the fixed timestep and AABB overlap code you wrote, then Breakout using the swept test.</p>` },
        { pid: 'q-zig-1', type: 'quiz', q: 'A Zig function you call has the signature <code>fn load(allocator: std.mem.Allocator, path: []const u8) ![]u8</code>. What can you conclude without reading the body?',
          options: ['It never fails', 'It may allocate (through the allocator you pass) and may return an error, and the caller owns and must free the returned bytes', 'It uses global memory', 'It only reads from memory'], answer: 1, explain: 'No hidden allocation: allocation needs an allocator parameter. The <code>!</code> means it can fail. Ownership of the returned buffer is by convention the caller\'s; read the doc comment to confirm.' },
        { pid: 'q-zig-2', type: 'quiz', q: 'What is <code>defer allocator.free(buf)</code> good for?',
          options: ['It runs the free later on another thread', 'It schedules the free to run at the end of the enclosing scope on every exit path, including early returns and errors', 'It makes the free faster', 'It is only a comment'], answer: 1, explain: 'defer keeps acquire and release next to each other, which avoids the classic early-return leak. <code>errdefer</code> runs only when the function exits with an error.' },
        { pid: 'q-zig-3', type: 'quiz', q: 'What do you get from <code>switch (shape)</code> over a tagged union that you do not get from a chain of <code>if</code> statements?',
          options: ['Nothing', 'Exhaustiveness: forgetting a variant is a compile error, and each branch can capture only its own payload', 'Faster execution', 'Dynamic dispatch'], answer: 1, explain: 'Add a variant and every switch that does not handle it stops compiling, so state machines and event handlers cannot silently ignore a new case.' },
        { type: 'reveal', title: 'Extra exercise: a free-list pool in Zig', html: `<p>The Pool in this lesson scans for a free slot (O(n)). Rewrite it with a free list: keep <code>next_free: [n]u32</code> and a <code>head</code>, so <code>acquire</code> and <code>release(ptr)</code> are both O(1). Write tests: acquiring more than <code>n</code> returns <code>null</code>; releasing then acquiring reuses the slot; double release is detected in Debug builds (<code>std.debug.assert</code>).</p>` },
      ],
    },
    {
      id: 'gd-cpp', title: 'C++ for games', minutes: 35,
      summary: 'The modern-C++ subset game programmers actually use, and the habits that keep it safe and fast.',
      checks: [
        { q: 'A loop erases dead enemies from a vector inside a range-for and intermittently crashes. What is the cause and the fix?',
          options: ['Erasing invalidates the iterators being looped over; mark the dead and remove them after the loop, or use erase-remove or swap-remove by index', 'The vector is too small; reserve more capacity up front', 'Range-for is too slow; use a while loop instead', 'The enemies need virtual destructors'],
          answer: 0, explain: 'Iterator invalidation makes in-loop erase undefined behaviour; separating marking from removal keeps iteration valid.' },
        { q: 'A bullet manager needs exclusive ownership of a GPU buffer that must be released exactly once. Which smart pointer fits?',
          options: ['std::shared_ptr, so every system can co-own the buffer', 'std::unique_ptr with RAII, avoiding raw new and delete in game code', 'A raw owning pointer with manual delete at shutdown', 'A global static object with a constructor'],
          answer: 1, explain: 'Single ownership maps to unique_ptr: the destructor releases the resource on every path with no sharing overhead.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Why C++ is still everywhere in games</h3>
<p>Unreal, most console SDKs, physics libraries (Box2D, Jolt, PhysX), Godot itself and decades of engine code are C++. You will read it even if you write something else. The goal is to write the small, boring subset that gives control without foot-guns.</p>
<h3>Habits that matter</h3>
<ul><li><b>Value semantics, contiguous data.</b> Prefer <code>std::vector&lt;Particle&gt;</code> to a <code>vector</code> of pointers. Contiguous memory is what makes loops fast.</li><li><b>RAII</b>: resources (memory, files, GPU buffers) are owned by objects whose destructors release them. Use <code>std::unique_ptr</code> for single ownership; avoid raw <code>new</code>/<code>delete</code> in game code. <code>shared_ptr</code> only when ownership is truly shared (and it is rarely).</li><li><b>No allocation in the frame loop.</b> <code>reserve()</code> up front, reuse buffers, use pools or arenas.</li><li><b>Avoid virtual calls per entity per frame</b> in hot loops: group by type (struct of arrays) or use a <code>std::variant</code> and <code>std::visit</code>. A virtual call is cheap, the cache miss it hides is not.</li><li><b>Use <code>enum class</code></b> and exhaustive <code>switch</code> (with <code>-Wswitch</code>) for state machines.</li><li><b>Prefer <code>std::span</code>, <code>std::string_view</code></b> for non-owning views; they carry a length and avoid copies.</li><li><b>const everything</b> you can. Use <code>[[nodiscard]]</code> on functions whose result must be checked.</li></ul>
<h3>Foot-guns to know by name</h3>
<ul><li><b>Iterator invalidation</b>: <code>push_back</code> or <code>erase</code> on a vector invalidates iterators, references and pointers into it. Erasing in a range-for is the classic crash (see the bug hunt in the performance lesson). Use the erase-remove idiom (<code>std::erase_if</code> in C++20) or swap-remove by index.</li><li><b>Dangling references</b>: holding a pointer to an element and then growing the container.</li><li><b>Integer pitfalls</b>: unsigned underflow (<code>size() - 1</code> on an empty vector), signed overflow is undefined, integer division truncates toward zero (the drill on integer scaling).</li><li><b>Uninitialised members</b>: always default-initialise (<code>int hp = 0;</code>).</li><li><b>Float comparison</b>: compare with a tolerance, never <code>==</code>.</li><li><b>Static initialisation order</b> across translation units. Avoid global objects with constructors.</li></ul>
<h3>Tooling you should turn on</h3>
<pre><code>g++ -std=c++20 -Wall -Wextra -O1 -g -fsanitize=address,undefined main.cpp -o game</code></pre>
<ul><li><b>AddressSanitizer</b> finds out-of-bounds and use-after-free; <b>UBSan</b> finds undefined behaviour such as signed overflow. The lab\'s validator compiles every C++ drill with them on.</li><li>A debugger (gdb, lldb, or the IDE) and a profiler (perf, Tracy). Learn to read a crash backtrace.</li><li>CMake is the lingua franca for building; for a first project a single <code>CMakeLists.txt</code> with SDL3 or raylib via <code>FetchContent</code> is enough.</li></ul>
<h3>Zig versus C++, honestly</h3>
<table>
<tr><th></th><th>C++</th><th>Zig</th></tr>
<tr><td>Ecosystem</td><td>Enormous: engines, libraries, tools, jobs</td><td>Small and young, but can use any C library directly</td></tr>
<tr><td>Memory</td><td>RAII, smart pointers, implicit allocation possible</td><td>Explicit allocators and <code>defer</code>, no hidden allocation</td></tr>
<tr><td>Generics</td><td>Templates (powerful, hard error messages)</td><td><code>comptime</code> (ordinary code, clear errors)</td></tr>
<tr><td>Build</td><td>CMake, Make, Meson... pick one</td><td>Built in (<code>build.zig</code>), cross-compiles easily</td></tr>
<tr><td>Stability</td><td>Standardised, decades old</td><td>Pre-1.0, expect breaking changes</td></tr>
</table>
<p>Learning both with the same drills is deliberate: you will see that the ideas (fixed step, pools, spatial hash, state machines) are language-independent, and the differences are in who guards you from mistakes.</p>` },
        { pid: 'bug-cpp-ownership', type: 'bug', title: 'Spot the C++ lifetime bugs',
          prompt: '<p>This is a bullet manager. Click the <b>3</b> lines that cause undefined behaviour or a leak.</p>',
          code: String.raw`struct Bullet { float x, y, vx, vy; };

class Bullets {
    std::vector<Bullet> items_;
public:
    Bullet* spawn(float x, float y) {
        items_.push_back({x, y, 0, 0});
        return &items_.back();
    }
    void fire_pair(float x, float y) {
        Bullet* a = spawn(x, y);
        Bullet* b = spawn(x + 8, y);
        a->vx = 300; b->vx = -300;
    }
    Bullet* make_special() {
        Bullet* p = new Bullet{0, 0, 0, 0};
        items_.push_back(*p);
        return &items_.back();
    }
};`,
          bugs: [{ line: 8, why: 'Returning a pointer into a <code>vector</code> that can grow: the next <code>push_back</code> may reallocate and move every element, leaving earlier pointers dangling. Return an index or handle instead.' },
                 { line: 13, why: '<code>a</code> was obtained before the second <code>spawn</code>, which may reallocate the vector. Writing through <code>a</code> afterwards is a use-after-free. This is the consequence of line 8.' },
                 { line: 16, why: '<code>new Bullet</code> is copied into the vector and the original is never deleted: a leak on every call. There is no reason to heap-allocate here (<code>items_.push_back({0,0,0,0})</code>).' }],
          ok: [7, 17], hint: 'Two bugs are the same root cause seen at two places (pointers into a growing vector), one is a plain leak.' },
        { pid: 'q-cpp-1', type: 'quiz', q: 'You loop <code>for (size_t i = v.size() - 1; i &gt;= 0; --i)</code> over a vector. What happens when <code>v</code> is empty?',
          options: ['The loop is skipped', 'size() - 1 wraps to a huge number and the loop reads out of bounds (and i >= 0 is always true for unsigned)', 'A compiler error', 'It returns early'], answer: 1, explain: 'Unsigned arithmetic wraps. Loop with signed indices, use reverse iterators, or check empty() first.' },
        { pid: 'q-cpp-2', type: 'quiz', q: 'Which choice usually makes iterating 100,000 particles faster in C++?',
          options: ['std::vector&lt;std::unique_ptr&lt;Particle&gt;&gt; with virtual update()', 'A contiguous std::vector&lt;Particle&gt; of plain data updated in one loop', 'std::list&lt;Particle&gt;', 'std::map&lt;int, Particle&gt;'], answer: 1, explain: 'Contiguous plain data is cache friendly. Node-based containers and pointer-per-object designs mean a cache miss per element.' },
      ],
    },
    {
      id: 'gd-practice', title: 'The practice ladder', minutes: 15,
      summary: 'A sequence of small, finishable projects that each add one skill, and how to practise deliberately.',
      checks: [
        { q: 'You just cloned Pong to practise implementation. What is the recommended next design step?',
          options: ['Start an original epic with all the ideas at once', 'Change one rule of the clone, so design risk stays low while the changed rule is the exercise', 'Rewrite the clone in three more engines first', 'Add online multiplayer before finishing'],
          answer: 1, explain: 'Clone-then-change-one-rule removes design risk from the known game and isolates the new design decision.' },
        { q: 'A friend claims their game is finished because the core loop is fun. Which checklist item most clearly shows it is not yet shippable?',
          options: ['It has no pause, no restart under two seconds, and was never run as an export on a machine without the editor', 'It has placeholder art in one level', 'It was built in under a weekend', 'It only has three enemy types'],
          answer: 0, explain: 'Finished means shippable: title screen, win or lose with fast restart, pause with settings, crash-free play, and a tested exported build.' },
      ],
      sections: [
        { type: 'text', html: `
<p>The way to get good is to finish many small games. Each rung below is a weekend or less and adds one new idea. Do them in your engine of choice (Godot) <i>and</i> at least the first few from scratch in Zig or C++ with raylib or SDL so you feel the loop you normally never see.</p>
<ol>
<li><b>Pong</b>: the game loop, input, AABB vs circle, scoring, a simple AI paddle. Add: ball speeds up per hit.</li>
<li><b>Breakout</b>: many entities, swept collision (no tunneling), levels from data.</li>
<li><b>Flappy-style one-button game</b>: gravity, a fixed step, procedural obstacles with a seeded RNG, restart in under a second.</li>
<li><b>Snake</b>: grid movement, input buffering, game states (menu, play, game over), save a high score (versioned file).</li>
<li><b>Platformer room</b>: tile collision per axis, coyote time, jump buffering, variable jump height, camera.</li>
<li><b>Top-down shooter</b>: spawn pools, spatial hash, steering enemies, juice (shake, hit stop, particles).</li>
<li><b>Tower defence</b>: pathfinding on a grid, waves from data, an economy with sinks and faucets.</li>
<li><b>Roguelike room generator</b>: cellular automata or BSP rooms, connectivity check, seeds shown on screen.</li>
<li><b>A deckbuilder or puzzle game</b>: state machines, undo (command pattern), data-driven content.</li>
<li><b>Your own idea</b>, scoped to one week, with a cut list and a vertical slice.</li>
</ol>
<h3>Deliberate practice</h3>
<ul><li>Set a <b>timebox</b> (a weekend, a jam) and ship, even if rough. Put it on itch.io.</li><li>After each project write three lines: what was slow, what you would change, what you learned.</li><li><b>Clone, then change one rule.</b> Copying a known game removes design risk so you can focus on implementation, then the changed rule is your design exercise.</li><li>Read other people\'s source (open-source games, engine examples). Reading is half the craft.</li><li>Alternate: one project for <i>code</i> skills (from scratch), one for <i>design/art</i> skills (in the engine), one for <i>finishing</i> (a jam).</li><li>Pair every project with a pixel art task: draw its sprites yourself, even badly. See the pixel art track and the editor.</li></ul>` },
        { type: 'reveal', title: 'Checklist: “is it a finished game?”', html: `<ul><li>Starts from a title screen and can be quit.</li><li>Has a win or lose condition and a restart that takes under 2 seconds.</li><li>Pause works. Volume and (if relevant) screen shake settings exist.</li><li>No crash for 30 minutes of random play (try mashing every button).</li><li>Exports and runs on a machine that does not have the editor installed.</li><li>One page: controls, credits, license for any assets.</li></ul>` },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
