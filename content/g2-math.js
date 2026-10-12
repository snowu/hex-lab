/* Game dev section, track 2: the maths and physics every gameplay programmer uses. */
TRACKS.push({
  id: 'gdmath', domain: 'gamedev', icon: '📐', title: 'Game Math & Physics',
  blurb: 'Vectors, collision and response, interpolation and easing, and grids and pathfinding, with the bugs each one is famous for.',
  lessons: [
    {
      id: 'gd-vectors', title: 'Vectors, movement and steering', minutes: 25,
      summary: 'Position, direction, speed, and the two operations (dot and cross) that answer most gameplay questions.',
      checks: [
        { q: 'Holding right and up feeds input (1, 1) into movement, and diagonal runs feel faster than straight runs. What is the fix?',
          options: ['Scale speed down only on the x axis', 'Normalise or clamp the input length before scaling by speed, since (1, 1) has length 1.414', 'Multiply by dt twice on diagonals', 'Read the axes in separate frames'],
          answer: 1, explain: 'The diagonal input vector is 41 percent longer, so cap by length before applying speed.' },
        { q: 'Each frame an enemy compares its distance to the player against several ranges. Which comparison is cheapest and correct?',
          options: ['Compare length_squared against the squared ranges to skip the square root', 'Take the square root first because squared values overflow', 'Normalise both positions and compare the dot product', 'Use atan2 on the distance and compare angles'],
          answer: 0, explain: 'Squared distances order the same as distances, so length_squared answers nearer-or-farther with no square root.' },
      ],
      sections: [
        { type: 'text', html: `
<p>A <b>vector</b> is a pair (or triple) of numbers. It can mean a <i>position</i> (where), a <i>displacement</i> (from here to there) or a <i>velocity</i> (displacement per second). Most game maths is moving things with them.</p>
<h3>The operations you use every day</h3>
<table>
<tr><th>Operation</th><th>What it gives you</th></tr>
<tr><td><code>a + b</code>, <code>a - b</code></td><td>Combine movements. <code>target - self</code> is the vector pointing from you to the target.</td></tr>
<tr><td><code>v * s</code></td><td>Scale. <code>velocity * dt</code> is how far you move this frame.</td></tr>
<tr><td><code>length(v)</code></td><td>Distance or speed. Use <code>length_squared</code> to compare distances without a square root.</td></tr>
<tr><td><code>normalize(v)</code></td><td>Same direction, length 1. Guard against the zero vector.</td></tr>
<tr><td><code>dot(a, b)</code></td><td>How much two directions agree: 1 same, 0 perpendicular, -1 opposite (for unit vectors).</td></tr>
<tr><td><code>cross(a, b)</code> (2D)</td><td>Which side b is on relative to a (sign), and the area of the parallelogram.</td></tr>
<tr><td><code>lerp(a, b, t)</code></td><td>Point a fraction t of the way from a to b.</td></tr>
</table>
<h3>Questions the dot product answers</h3>
<ul><li><b>Is the player in front of the guard?</b> <code>dot(guard.facing, normalize(player - guard)) &gt; cos(half_fov)</code>. No angles or trig needed.</li><li><b>How fast am I moving toward the goal?</b> <code>dot(velocity, direction_to_goal)</code>.</li><li><b>Slide along a wall</b>: remove the part of the velocity that points into the wall: <code>v - n * dot(v, n)</code> for a unit normal <code>n</code>. That one line is how characters glide along walls instead of sticking.</li></ul>
<h3>The diagonal-speed bug</h3>
<p>Holding right and up gives input <code>(1, 1)</code> which has length <b>1.414</b>. If you multiply that by speed, diagonal movement is 41% faster. Normalise (or clamp the length), then scale. In the drill you cap a velocity vector by its <i>length</i>, not per axis.</p>
<h3>Angles</h3>
<p>Use <code>atan2(y, x)</code> (never <code>atan(y/x)</code>, which loses the quadrant and divides by zero) to get a heading, and avoid storing angles when a direction vector works. Interpolating angles needs wrap-around care (350° to 10° is a 20° turn, not 340°). Godot's <code>lerp_angle</code> handles it.</p>
<div class="callout warn"><b>Screen versus maths axes.</b> In 2D engines y usually grows <i>downward</i>. Rotation sign, "up" and cross-product signs all flip. Write a comment the first time you rely on it.</div>` },
        { pid: 'drill-accel', type: 'drill', ref: 'accel_clamp' },
        { pid: 'q-vec-1', type: 'quiz', q: 'A guard faces <code>f</code> (unit length) and the player is at relative position <code>d</code>. The guard has a 90° field of view. Which test says the player is inside the cone?',
          options: ['dot(f, normalize(d)) > cos(45°)', 'dot(f, d) < 0', 'cross(f, d) == 0', 'length(d) < 90'], answer: 0, explain: 'Half of 90° is 45°. A unit-vector dot product equals the cosine of the angle between them, so compare with cos(45°) (about 0.707). Add a distance check for range.' },
        { pid: 'q-vec-2', type: 'quiz', q: 'A ball with velocity <code>v</code> hits a wall with unit normal <code>n</code> and should bounce perfectly. Which formula?',
          options: ['v - n', 'v - 2 * n * dot(v, n)', 'n * dot(v, n)', '-v'], answer: 1, explain: 'Reflection: subtract twice the component of v along the normal. <code>-v</code> only works for a head-on hit. Subtracting just once (<code>v - n * dot(v, n)</code>) is the “slide along the wall” projection instead.' },
      ],
    },
    {
      id: 'gd-collision', title: 'Collision detection and response', minutes: 35,
      summary: 'AABB and circle tests, push-out, broad and narrow phase, and why fast things tunnel through walls.',
      checks: [
        { q: 'Two boxes overlap on the x axis but their y intervals do not touch. Do they collide, and why?',
          options: ['No, an AABB overlap needs the intervals to overlap on both axes', 'Yes, one overlapping axis is enough for an AABB hit', 'Yes, unless both are tiles', 'No, boxes only collide on the y axis'],
          answer: 0, explain: 'AABB collision requires overlap on every axis; a gap on any one axis means no contact.' },
        { q: 'A fast bullet tunnels through thin walls at 60 Hz. The team cannot slow the bullet or thicken every wall. Which fix addresses the root cause?',
          options: ['Increase the wall shape margin until ghosts overlap it', 'Test the whole path from old to new position with a swept test or raycast, or substep the physics', 'Move collision into the render callback so it runs more often', 'Check collision every other frame to halve the cost'],
          answer: 1, explain: 'Tunneling happens because discrete steps jump over the wall; continuous tests find the time of first impact along the path.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Two phases</h3>
<p>Testing every pair is O(n²). So collision is split in two:</p>
<ol><li><b>Broad phase</b>: cheaply find pairs that <i>might</i> touch, using a grid, spatial hash or tree (see the performance lesson).</li><li><b>Narrow phase</b>: precise tests on those pairs, then <b>response</b>: separate them, bounce, apply damage.</li></ol>
<h3>Shapes, cheapest first</h3>
<ul><li><b>Circle vs circle</b>: <code>distance² &lt; (r1 + r2)²</code>. No square root. Characters often use a capsule or circle for smooth sliding.</li><li><b>AABB</b> (axis-aligned bounding box): overlap if the intervals overlap on <i>both</i> axes. Tiles and platformer characters live here.</li><li><b>OBB / convex polygons</b>: the <b>separating axis theorem</b> (SAT). If you can find any axis along which the shapes' projections do not overlap, they do not collide. Test the edge normals.</li></ul>
<h3>Response: the minimum translation</h3>
<p>When two boxes overlap, push one out along the axis with the <b>smallest penetration</b>. That is why a character landing on a floor is pushed up rather than sideways. For tile maps the robust trick is to move on one axis, resolve, then move on the other axis. That gives clean wall sliding and no corner snagging.</p>
<h3>Tunneling</h3>
<p>Collision tests happen once per step, on positions. If something moves further in one step than the thickness of what it should hit, no step ever sees them overlapping, and it passes straight through. The fixes, cheapest first:</p>
<ol><li>Limit the maximum speed, or make walls thicker.</li><li><b>Substep</b>: run the physics several times per frame.</li><li><b>Swept (continuous) collision</b>: test the whole path from old to new position and find the time of first impact (you implement 1-D version in the drill). Engines call this CCD.</li><li>Ray/shape casts for bullets: do not simulate a bullet as a moving body at all.</li></ol>` },
        { pid: 'sim-collide', type: 'sim', id: 'gdcollide', title: 'A bullet and a thin wall',
          intro: '<p>A bullet flies at a wall that is only a few pixels thick. Each ghost is where the bullet is at the end of a 60 Hz physics step. The check either tests only those positions (discrete) or the full path between them (swept).</p>',
          try: ['At low speed the discrete test hits the wall.', 'Raise the speed until the bullet <b>tunnels</b>: the ghosts jump over the wall without ever overlapping it.', 'Tick <b>swept test</b> at the same speed: the hit is found exactly, the bullet stops at the wall face.', 'Find the speed at which discrete tunnelling starts and compare with (wall width + bullet width) × 60.'] },
        { pid: 'drill-aabb', type: 'drill', ref: 'aabb' },
        { pid: 'drill-sweep', type: 'drill', ref: 'sweep_hit' },
        { type: 'text', html: `
<h3>In Godot</h3>
<ul><li><code>CharacterBody2D</code> + <code>move_and_slide()</code> for player-controlled things: you set <code>velocity</code>, the engine handles sweeps, slopes and sliding.</li><li><code>RigidBody2D</code> for things the physics engine drives (crates, balls). Turn on continuous CD for fast ones.</li><li><code>Area2D</code> for triggers (pickups, damage zones, hitboxes): overlap events, no response.</li><li><b>Collision layers and masks</b>: <i>layer</i> is "what I am", <i>mask</i> is "what I look for". Player bullets should be on a layer enemies' hurtboxes scan, and not hit the player. Set this up before you have thirty object types.</li></ul>` },
        { pid: 'q-col-1', type: 'quiz', q: 'Two boxes overlap by 3 px horizontally and 20 px vertically. Which push-out is correct?',
          options: ['Push 20 px vertically', 'Push 3 px horizontally, away from the other box', 'Push both 3 and 20', 'Push diagonally by 20'], answer: 1, explain: 'Resolve along the axis of least penetration: the smallest move that separates them.' },
        { pid: 'q-col-2', type: 'quiz', q: 'A projectile moving at 3000 px/s ignores a 4 px wall at 60 Hz. What is the root cause?',
          options: ['The wall is not on the right collision layer', 'It moves 50 px per step, more than the wall is thick, so no step ever overlaps it (tunneling)', 'Floating point error', 'The wall needs a bigger shape margin'], answer: 1, explain: '3000 / 60 = 50 px per step. Use swept/continuous collision, a raycast for the bullet, or substeps.' },
      ],
    },
    {
      id: 'gd-smoothing', title: 'Interpolation, easing and smoothing', minutes: 25,
      summary: 'Lerp, easing curves, and the classic “lerp smoothing is broken” bug that makes cameras feel different at every frame rate.',
      checks: [
        { q: 'A menu panel should slide in quickly and then settle gently into place. Which easing fits, and why?',
          options: ['Ease-out, because it starts fast for immediate feedback then decelerates into the final value', 'Ease-in, because arrivals should accelerate', 'Linear, because menus must move at constant speed', 'Bounce, because every UI element should bounce'],
          answer: 0, explain: 'Ease-out matches arriving motion: fast response up front, gentle landing at the target.' },
        { q: 'A pickup needs to overshoot its scale and wobble back (a pop). Lerp toward the target never overshoots. What should you use instead?',
          options: ['A larger fixed lerp factor such as 0.5', 'A damped spring that accelerates toward the target with stiffness minus damping, integrated in the fixed step', 'A longer linear lerp duration', 'Two lerps chained in the same frame'],
          answer: 1, explain: 'Springs carry velocity through the target so they overshoot and settle; plain lerp can only approach monotonically.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Lerp, and what it is not</h3>
<p><code>lerp(a, b, t) = a + (b - a) * t</code>. For a fixed <code>t</code> from 0 to 1 it is a straight blend, and that is how you animate over a fixed duration: advance <code>t = elapsed / duration</code> and apply an <b>easing function</b> to change how it feels.</p>
<h3>Easing</h3>
<ul><li><b>Ease-out</b> (fast then slow) feels natural for things that arrive (UI sliding in, a card landing).</li><li><b>Ease-in</b> (slow then fast) for things leaving or accelerating.</li><li><b>Ease-in-out</b> for movement between two rest points.</li><li><b>Back/overshoot</b> and <b>bounce</b> for playful feedback, <b>elastic</b> sparingly.</li><li><b>Smoothstep</b> <code>3t² - 2t³</code> is the cheap polynomial ease you will see in shaders.</li></ul>
<h3>The classic smoothing bug</h3>
<p>Camera follow is often written <code>pos = lerp(pos, target, 0.1)</code> every frame. It looks fine and is wrong: the fraction closed per <i>second</i> depends on the frame rate. At 144 fps the camera is far snappier than at 30. The fix treats it as exponential decay:</p>
<pre><code>pos = lerp(pos, target, 1.0 - exp(-k * delta))     # k is the "stiffness", 1/seconds</code></pre>
<p>Splitting a second into 30 or 144 steps now gives the same result, because decay composes: exp(-k·a) · exp(-k·b) = exp(-k·(a+b)). The simulation below shows the naive version needing different times at different frame rates.</p>
<h3>Springs</h3>
<p>For motion that should overshoot and settle (camera shake recovery, UI bounce, a hanging sign), use a damped spring: accelerate toward the target with <code>a = stiffness * (target - x) - damping * v</code>. Integrate it in your fixed step, or use an analytic solution so large steps stay stable.</p>
<h3>Other places this shows up</h3>
<ul><li><b>Render interpolation</b>: draw between the previous and current physics state using the fixed-timestep remainder.</li><li><b>Animation blending</b> and <b>colour transitions</b>.</li><li><b>Audio</b>: fade volumes with a ramp, never snap (it clicks).</li></ul>` },
        { pid: 'sim-ease', type: 'sim', id: 'gdease', title: 'Easing curves and smoothing',
          intro: '<p>Pick a curve and watch the cyan block follow it. The table below the canvas shows how long naive and exponential smoothing take to cover 90% of the distance at different frame rates.</p>',
          try: ['Compare <b>linear</b> and <b>ease-out cubic</b>: same duration, very different feel.', '<b>ease-out back</b> overshoots past 1 and settles: that is the “pop” in many UI animations.', 'In the table, the <i>naive</i> column changes with frame rate, the <i>damped</i> column does not.'] },
        { pid: 'drill-damp', type: 'drill', ref: 'damp' },
        { pid: 'q-ease-1', type: 'quiz', q: 'A health bar should quickly drop to the new value and then settle gently. Which easing?',
          options: ['Ease-in', 'Ease-out', 'Linear', 'Bounce'], answer: 1, explain: 'Ease-out starts fast (immediate feedback) and decelerates into the final value.' },
        { pid: 'q-ease-2', type: 'quiz', q: 'Why is <code>pos = lerp(pos, target, 0.1)</code> in <code>_process</code> a bug?',
          options: ['lerp is slow', 'The speed of convergence depends on the frame rate', 'It never reaches the target', 'It only works in 3D'], answer: 1, explain: 'Every frame closes 10%, so more frames per second means closing more per second. Use 1 - exp(-k * delta).' },
      ],
    },
    {
      id: 'gd-pathing', title: 'Grids, pathfinding and simple AI', minutes: 30,
      summary: 'Tile maps as graphs, BFS, Dijkstra and A*, plus the steering and state-based AI that makes enemies look alive.',
      checks: [
        { q: 'Every tile on your map costs the same to cross. Which search finds the shortest path, and why not reach for A* immediately?',
          options: ['BFS: it finds the shortest path on uniform costs without needing a heuristic', 'Dijkstra with random weights: it looks smarter', 'Depth-first search: it uses the least memory', 'Greedy search on raw distance: it is always optimal'],
          answer: 0, explain: 'BFS is the right tool for uniform costs; Dijkstra and A-star pay off once costs differ or a heuristic can guide the search.' },
        { q: 'A teammate proposes an A* heuristic that sometimes estimates more than the true remaining distance because it explores fewer tiles. What is the trade-off?',
          options: ['It will never terminate on a grid', 'It may return a non-shortest path: overestimating heuristics break admissibility and optimality', 'It turns A* back into exact BFS with no downside', 'It only affects memory, never the path returned'],
          answer: 1, explain: 'An admissible heuristic never overestimates. Inflating it (weighted A-star) speeds up search but sacrifices the shortest-path guarantee.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>A map is a graph</h3>
<p>A tile map is a graph: each walkable tile is a node, neighbours are edges. Pathfinding asks for the cheapest route between two nodes.</p>
<ul><li><b>BFS</b> (breadth-first): finds the shortest path when every step costs the same. Spreads like a flood.</li><li><b>Dijkstra</b>: handles different costs (mud costs 3, road costs 1). Uses a priority queue.</li><li><b>A*</b>: Dijkstra plus a <b>heuristic</b> that estimates the remaining distance, so it heads toward the goal instead of flooding in all directions. The heuristic must never <i>overestimate</i> (be admissible) to stay optimal. Manhattan distance on a 4-way grid, octile or Euclidean on 8-way.</li></ul>
<h3>When one path is not enough</h3>
<ul><li><b>Many units, one goal</b>: compute one <b>flow field</b> (a BFS/Dijkstra from the goal, storing direction per tile) and every unit just reads its tile.</li><li><b>Open worlds</b>: grids get huge. Use a <b>navmesh</b> (walkable polygons) or a coarse waypoint graph, then steer locally.</li><li><b>Moving obstacles</b>: replan only when blocked, not every frame. Path requests can be queued and spread over several frames.</li></ul>
<h3>Steering behaviours</h3>
<p>The path says where; <i>steering</i> says how to move so it looks natural: <b>seek</b> (toward a point), <b>arrive</b> (slow down near it), <b>flee</b>, <b>avoid</b> obstacles, <b>separate</b> from neighbours to avoid stacking. Add up the weighted vectors, clamp the result (the same accelerate-and-cap function from the first drill), and you have boids and crowds.</p>
<h3>Decision making</h3>
<p>Most game AI is far simpler than people expect: a <b>state machine</b> (patrol → chase → attack → return), sometimes a <b>behaviour tree</b> or utility scoring. Believable beats smart: add reaction delay, limited vision and mistakes. Players read intent, so telegraph attacks before they land.</p>` },
        { pid: 'drill-path', type: 'drill', ref: 'grid_path' },
        { pid: 'q-path-1', type: 'quiz', q: 'You use A* on a 4-way grid with the heuristic <code>2 * manhattan_distance</code>. What goes wrong?',
          options: ['Nothing, it is just faster', 'The heuristic can overestimate, so A* may return a path that is not the shortest', 'It will never terminate', 'It turns into BFS'], answer: 1, explain: 'An inadmissible heuristic trades optimality for speed (“weighted A*”). That is sometimes a good deal in games, but know that you are making it.' },
        { pid: 'q-path-2', type: 'quiz', q: '500 zombies all chase the player across the same map. What is the best approach?',
          options: ['500 A* searches every frame', 'One BFS/flow field from the player each time the player moves tile, and each zombie follows its tile\'s direction', 'Teleport them', 'Give each zombie its own navmesh'], answer: 1, explain: 'A flow field is computed once for the goal and shared. Per-unit cost is a single array lookup.' },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
