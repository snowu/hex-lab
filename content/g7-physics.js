/* Game dev section: simulation and physics concepts. Code blocks marked data-check are compiled by scripts/validate-snippets.mjs. */
TRACKS.push({
  id: 'gdphysics', domain: 'gamedev', icon: '⚙️', title: 'Simulation & Physics',
  blurb: 'How games simulate the world: integrators and stability, impulses and friction, constraints and ropes, ray and shape queries, and how character controllers really work.',
  lessons: [
    {
      id: 'phy-integration', title: 'Integration and stability', minutes: 35,
      summary: 'How acceleration becomes motion, why the obvious method explodes, and which integrator to use.',
      checks: [
        { q: 'RK4 evaluates forces four times per step and is very accurate on smooth orbits. Why is it still not the default for most game bodies?',
          options: ['It costs four force evaluations per step and is not symplectic, so energy slowly drifts; semi-implicit Euler or Verlet with a fixed step is the better trade', 'It is less accurate than explicit Euler', 'It cannot handle gravity', 'It only works on Tuesdays'],
          answer: 0, explain: 'Accuracy per step is not the whole trade. Cost and bounded energy matter more for long game simulations.' },
        { q: 'You suspect your integrator is gaining energy. What is the prescribed test?',
          options: ['Ship it and watch player reviews', 'Simulate a frictionless spring or pendulum for 10,000 steps at a fixed timestep and check the motion stays bounded', 'Halve the gravity and see if it looks nicer', 'Count the frames per second'],
          answer: 1, explain: 'A conservative system must oscillate forever with constant energy. Growth proves a bad method or step.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Simulating motion</h3>
<p>Physics gives you <b>forces</b>, so accelerations: <code>a = F / m</code>. To get motion you must <b>integrate</b>: velocity is the integral of acceleration, position the integral of velocity. Computers do it in small steps of size <code>dt</code>, approximating the continuous curve with straight segments. How you take each step decides whether the simulation is accurate, stable, or blows up.</p>
<h3>Explicit (forward) Euler</h3>
<pre><code>position += velocity * dt
velocity += acceleration * dt</code></pre>
<p>The most natural code, and the worst. It uses the <i>old</i> velocity to move, so each step overshoots a little. For anything that oscillates (springs, orbits, pendulums, bouncing) the overshoot <b>adds energy every step</b>: the spring swings wider and wider until it explodes. The simulation below shows it.</p>
<h3>Semi-implicit (symplectic) Euler</h3>
<p>Swap the two lines: update the velocity first, then move with the <b>new</b> velocity.</p>
<pre><code>velocity += acceleration * dt
position += velocity * dt</code></pre>
<p>Same cost, one line moved, and the energy stays bounded: it wobbles around the true value instead of growing. This is the default in most game engines (Box2D, Bullet, Godot's physics) and the right first choice. Note that for a jump under constant gravity the answer is slightly different from explicit Euler: how high you jump depends on the integrator and the step size. That is one more reason to fix the step (game loop lesson).</p>
<h3>Velocity Verlet</h3>
<p>Uses the average of the old and new acceleration, and is <b>second-order</b>: halving the step cuts the error by four, not two. It is the integrator behind ropes and cloth (next lessons) and molecular simulations.</p>
<pre><code>position += velocity * dt + 0.5 * a_old * dt * dt
a_new = acceleration(position)
velocity += 0.5 * (a_old + a_new) * dt</code></pre>
<h3>RK4 and friends</h3>
<p><b>Runge-Kutta 4</b> evaluates the forces four times per step and is very accurate for smooth problems, but it is not symplectic (energy slowly drifts) and costs four force evaluations. It is used for orbits and vehicle simulations where accuracy per step matters more than cost. For most games, semi-implicit Euler or Verlet with a fixed step is the better trade.</p>
<h3>Stability: stiff springs and large steps</h3>
<p>Every integrator has a limit. A spring with stiffness <code>k</code> and unit mass oscillates with angular frequency <code>sqrt(k)</code>. Semi-implicit Euler is stable only while <code>dt * sqrt(k) &lt; 2</code>; beyond that it explodes whatever you do. That is why a very stiff spring (a character attached to a cursor, a hard suspension) needs a small step, <b>substeps</b> (run the physics 2 to 8 times per frame), or an <b>implicit</b> method that is unconditionally stable (it solves for the new state instead of extrapolating) at the price of a bit of artificial damping.</p>
<h3>Damping and friction</h3>
<p>Real systems lose energy. Simple damping: <code>velocity *= pow(damping_per_second, dt)</code> (not <code>velocity *= 0.99</code> per frame, which depends on the frame rate: see the smoothing lesson). Add it deliberately; do not rely on integration error to "calm things down", because then the behaviour changes with the step size.</p>
<h3>Practical recipe</h3>
<ol><li>Fixed timestep for the simulation (60 Hz is common).</li><li>Semi-implicit Euler by default; Verlet if you have constraints or want better accuracy.</li><li>Substep stiff parts instead of shrinking the global step.</li><li>Clamp or cap velocities to stay in the stable range and to prevent tunneling.</li><li>Test energy: simulate a frictionless spring or pendulum for 10,000 steps and see if it stays bounded. You will do exactly that in the drill.</li></ol>` },
        { pid: 'sim-integrate', type: 'sim', id: 'gdintegrate', title: 'Three integrators on the same spring',
          intro: '<p>A frictionless spring should oscillate forever with constant energy. Pink is explicit Euler, amber semi-implicit Euler, cyan velocity Verlet, the dashed line is the exact answer.</p>',
          try: ['At the default settings the pink curve grows without bound while the amber one stays near the exact curve: one swapped line of code.', 'Increase the <b>time step</b> to about 150 ms: even the stable methods now visibly drift in phase.', 'Raise <b>stiffness k</b> and the step together until amber also explodes: the stability limit <code>dt·√k &lt; 2</code>.', 'Compare how much more accurate cyan (Verlet) is at the same step as amber.'] },
        { pid: 'drill-spring', type: 'drill', ref: 'spring_integrator' },
        { pid: 'q-phy1-1', type: 'quiz', q: 'You replace <code>position += velocity*dt; velocity += a*dt</code> with the same two lines in the opposite order. What changes?',
          options: ['Nothing, it is the same maths', 'It becomes semi-implicit Euler: the energy of oscillating systems stays bounded instead of growing', 'It becomes slower', 'It becomes Verlet'], answer: 1, explain: 'Moving with the updated velocity makes the method symplectic. This tiny reorder is why most engines use it.' },
        { pid: 'q-phy1-2', type: 'quiz', q: 'A very stiff spring explodes even with semi-implicit Euler at 60 Hz. Which fix keeps the behaviour correct?',
          options: ['Add random damping until it stops', 'Run more physics substeps for that system (or use an implicit method) so dt·√k stays under the stability limit', 'Lower the frame rate', 'Clamp the position to zero'], answer: 1, explain: 'Instability is a step-size problem. Substeps or an unconditionally stable method address the cause.' },
        { pid: 'q-phy1-3', type: 'quiz', q: 'Why is <code>velocity *= 0.99</code> every frame a bad way to add drag?',
          options: ['It is too slow', 'The amount of drag per second depends on the frame rate; use velocity *= pow(d, dt) or an exponential form', 'It can make velocity negative', 'It breaks collisions'], answer: 1, explain: '0.99 per frame is 0.99^60 per second at 60 fps but 0.99^144 at 144 fps: different games on different machines.' },
      ],
    },
    {
      id: 'phy-impulses', title: 'Collision response with impulses', minutes: 35,
      summary: 'What happens after two bodies touch: impulses, restitution, friction, mass, and why stacks of boxes are hard.',
      checks: [
        { q: 'Two overlapping circles have a relative velocity along the contact normal pointing apart (v_n > 0). What should the solver do?',
          options: ['Apply the full bounce impulse anyway so something happens', 'Do nothing for this contact: they are already separating, so no impulse is needed', 'Double gravity to pull them back together', 'Delete the lighter body'],
          answer: 1, explain: 'Impulses only oppose approach. Separating contacts need no response, which also prevents jitter.' },
        { q: 'Boxes resting in a pile micro-bounce forever instead of settling. Which fix addresses the cause?',
          options: ['Raise restitution so they bounce higher', 'Remove friction from every material', 'Increase the render frame rate', 'Set restitution to zero below a small closing speed (a restitution threshold), and let sleeping bodies stop simulating until touched'],
          answer: 3, explain: 'Tiny impacts should be perfectly inelastic, and idle bodies should sleep so stacks stay still.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>From "they overlap" to "they bounce"</h3>
<p>Detection (collision lesson) tells you <i>that</i> two shapes touch and gives a <b>contact normal</b> <code>n</code> (the direction to push them apart) and a <b>penetration depth</b>. <b>Response</b> decides the new velocities. Modern engines use <b>impulses</b>: an instantaneous change of momentum <code>J</code>. Applying an impulse to a body changes its velocity by <code>J / mass</code>. The unknown is how big the impulse must be.</p>
<h3>The normal impulse</h3>
<p>Take the relative velocity of body 2 with respect to body 1 along the normal: <code>v_n = (v2 - v1) · n</code>. If <code>v_n &gt; 0</code> they are already separating: do nothing. Otherwise the impulse that reverses the approach, scaled by the <b>restitution</b> <code>e</code> (0 = no bounce, 1 = perfectly elastic), is</p>
<pre><code>j = -(1 + e) * v_n / (1/m1 + 1/m2)
v1 -= (j / m1) * n
v2 += (j / m2) * n</code></pre>
<p>That is the same formula as the 1-D drill, just along an arbitrary direction. Using <b>inverse mass</b> (<code>1/m</code>) makes immovable bodies trivial: give a wall inverse mass 0 and it never moves, and the formula still works. The complete function below resolves two circles; its test checks that momentum is conserved and the bodies separate.</p>
<pre><code data-check="zig">const std = @import("std");

const Body = struct { x: f32, y: f32, vx: f32, vy: f32, inv_mass: f32, r: f32 };

/// Resolve a collision between two circles: an impulse along the contact normal with restitution e.
fn resolve(a: *Body, b: *Body, e: f32) bool {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = @sqrt(dx * dx + dy * dy);
    if (dist == 0 or dist &gt;= a.r + b.r) return false; // not touching
    const nx = dx / dist;
    const ny = dy / dist;
    const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vn &gt; 0) return false; // already separating
    const j = -(1 + e) * vn / (a.inv_mass + b.inv_mass);
    a.vx -= j * a.inv_mass * nx;
    a.vy -= j * a.inv_mass * ny;
    b.vx += j * b.inv_mass * nx;
    b.vy += j * b.inv_mass * ny;
    return true;
}

test "equal masses along x swap velocities when e = 1" {
    var a = Body{ .x = 0, .y = 0, .vx = 3, .vy = 0, .inv_mass = 1, .r = 1 };
    var b = Body{ .x = 1.5, .y = 0, .vx = 0, .vy = 0, .inv_mass = 1, .r = 1 };
    try std.testing.expect(resolve(&amp;a, &amp;b, 1));
    try std.testing.expectApproxEqAbs(@as(f32, 0), a.vx, 1e-5);
    try std.testing.expectApproxEqAbs(@as(f32, 3), b.vx, 1e-5);
}

test "momentum is conserved in an off-centre hit, and a wall (inverse mass 0) does not move" {
    var a = Body{ .x = 0, .y = 0, .vx = 2, .vy = 1, .inv_mass = 1.0 / 2.0, .r = 1 };
    var b = Body{ .x = 1.2, .y = 1.0, .vx = -1, .vy = 0, .inv_mass = 1.0 / 3.0, .r = 1 };
    const px = 2.0 * a.vx + 3.0 * b.vx;
    const py = 2.0 * a.vy + 3.0 * b.vy;
    try std.testing.expect(resolve(&amp;a, &amp;b, 0.5));
    try std.testing.expectApproxEqAbs(px, 2.0 * a.vx + 3.0 * b.vx, 1e-5);
    try std.testing.expectApproxEqAbs(py, 2.0 * a.vy + 3.0 * b.vy, 1e-5);
    var ball = Body{ .x = 0, .y = 0, .vx = 5, .vy = 0, .inv_mass = 1, .r = 1 };
    var wall = Body{ .x = 1.9, .y = 0, .vx = 0, .vy = 0, .inv_mass = 0, .r = 1 };
    try std.testing.expect(resolve(&amp;ball, &amp;wall, 1));
    try std.testing.expectEqual(@as(f32, 0), wall.vx);
    try std.testing.expectApproxEqAbs(@as(f32, -5), ball.vx, 1e-5);
}</code></pre>
<h3>Friction</h3>
<p>Along the contact <b>tangent</b> <code>t</code> (perpendicular to <code>n</code>) apply a second impulse that opposes sliding: <code>jt = -(v_rel · t) / (1/m1 + 1/m2)</code>, but <b>clamped</b> by Coulomb's law: <code>|jt| &lt;= μ * j</code>. So friction can never exceed the friction coefficient times the normal impulse: heavy pressing means strong friction, and a surface can stop sliding completely (static friction) only up to that limit. Engines blend the two bodies' friction values (often by multiplying or taking the geometric mean).</p>
<h3>Positional correction</h3>
<p>Impulses fix velocities but not <b>overlap</b> that already exists (sinking into the floor, caused by large steps, or by solver error). Push the bodies apart along <code>n</code> a fraction (0.2 to 0.8) of the penetration beyond a small tolerance (the <b>slop</b>, say 0.01 units), split by inverse mass: <code>correction = max(depth - slop, 0) / (1/m1 + 1/m2) * percent</code>. Correcting fully every frame makes objects jitter; ignoring it makes them sink.</p>
<h3>Resting contact and stacking: why it is hard</h3>
<p>One body resting on another is a contact that must be resolved <i>every</i> step without bouncing. A stack of five boxes couples ten contacts: resolving one disturbs its neighbours. The standard answer is <b>sequential impulses</b> (Erin Catto's Box2D solver): loop over all contacts several times (4 to 10 iterations), each time applying the impulse that makes that contact's relative velocity zero, <b>accumulating</b> impulses and clamping the accumulated total (so a contact can never pull), and reusing last frame's impulses as a starting guess (<b>warm starting</b>). More iterations means stiffer, more stable stacks and more CPU.</p>
<h3>Other pieces you will hear about</h3>
<ul><li><b>Restitution threshold</b>: below a small closing speed set <code>e = 0</code>, or resting objects micro-bounce forever.</li><li><b>Sleeping</b>: bodies that have barely moved for half a second stop being simulated until something touches them. Huge saving, and the reason stacks stay still.</li><li><b>Rotation</b>: for shapes that spin, the impulse also changes angular velocity (torque from the contact point), and the denominator gains a term with the moment of inertia. The structure of the formula is identical.</li><li><b>Material combination</b>: pairs of materials (ice on metal) need a rule for friction and bounce; most engines combine per-body values.</li></ul>` },
        { pid: 'drill-impulse', type: 'drill', ref: 'impulse_1d' },
        { pid: 'q-phy2-1', type: 'quiz', q: 'Why do engines store <i>inverse</i> mass instead of mass?',
          options: ['It saves memory', 'Static bodies get inverse mass 0 and automatically never move, with no special cases in the solver', 'Division is slow', 'Mass is not needed'], answer: 1, explain: 'Infinite mass is not representable but zero inverse mass is, and all formulas just work.' },
        { pid: 'q-phy2-2', type: 'quiz', q: 'A box slides down a ramp and should stop when friction is high enough. Which limit applies to the friction impulse?',
          options: ['It is unlimited', 'It is clamped to μ times the normal impulse (Coulomb friction)', 'It equals the gravity impulse', 'It is always zero'], answer: 1, explain: 'Friction scales with how hard the surfaces press together. The clamp is what makes sliding start and stop correctly.' },
        { pid: 'q-phy2-3', type: 'quiz', q: 'A stack of boxes slowly sinks and wobbles. Which two changes most directly help?',
          options: ['Larger boxes and fewer frames', 'More solver iterations (and warm starting), plus positional correction with a small slop', 'Disable gravity', 'Increase restitution'], answer: 1, explain: 'Stacks need the coupled contacts solved to convergence, and leftover overlap corrected gently.' },
      ],
    },
    {
      id: 'phy-constraints', title: 'Constraints, ropes and cloth', minutes: 30,
      summary: 'Position-based dynamics: keep points at distance by relaxing constraints, the trick behind ropes, chains and cloth.',
      checks: [
        { q: 'In a distance constraint between a pinned point and a free point, how is the length error corrected?',
          options: ['Each point moves by half the error, including the pinned one', 'The pinned point does not move; the free point takes the whole correction along the line between them', 'Neither point moves and the error is ignored', 'Gravity is increased until the error disappears'],
          answer: 1, explain: 'Anchors are infinitely heavy. Moving only the free end keeps the pin exactly in place.' },
        { q: 'Your swinging grappling hook should go slack when the player moves toward the anchor but snap taut when they swing too far. Which constraint and setup fits?',
          options: ['A max-length rope constraint that only pulls when overstretched, ideally with one gameplay distance constraint plus a separate cosmetic Verlet chain for the visual', 'A rod constraint that pushes and pulls in both directions at all times', 'No constraint, just animate the rope by hand', 'A rigid hinge welded to the camera'],
          answer: 0, explain: 'Ropes constrain only over-length. Gameplay needs one reliable limit while looks can be a cheap visual chain.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>What a constraint is</h3>
<p>A <b>constraint</b> is a rule the simulation must keep true: "these two points stay 10 units apart" (a rope segment), "this point stays here" (a pin), "this angle stays between 10° and 90°" (an elbow), "this body stays on this line" (a slider). Hinges, ropes, chains, ragdolls, vehicles and cloth are collections of constraints.</p>
<h3>Position-based dynamics with Verlet</h3>
<p>Instead of computing constraint <i>forces</i> (hard and stiff), do this each step:</p>
<ol><li><b>Integrate</b> every point freely (Verlet, which stores the previous position instead of a velocity: <code>velocity = position - previous</code>).</li><li><b>Relax</b> the constraints: for each distance constraint between points A and B, measure the current distance, and move both points along the line between them by half of the error each (or all of it for the free one when the other is pinned).</li><li>Repeat step 2 several times (the <b>iterations</b>): fixing one constraint disturbs its neighbours, and a few passes converge towards a state that satisfies all of them.</li></ol>
<p>Because the velocity is <i>derived</i> from positions, correcting a position automatically corrects the motion. It is unconditionally stable (it cannot explode), simple to write and cheap, which is why it is everywhere in games (rope, hair, cloth, soft bodies, grappling hooks). The cost: the "stiffness" depends on the iteration count and the time step, so it is not physically exact, and long chains look stretchy unless you add iterations.</p>
<pre><code data-check="zig">const std = @import("std");

const N = 8;
const REST: f32 = 10;

/// A rope of N points hanging from a pin at the origin. y grows downward.
const Rope = struct {
    x: [N]f32 = undefined,
    y: [N]f32 = undefined,
    px: [N]f32 = undefined, // previous positions: velocity is x - px
    py: [N]f32 = undefined,

    fn init() Rope {
        var r = Rope{};
        for (0..N) |i| {
            r.x[i] = @as(f32, @floatFromInt(i)) * REST; // starts stretched out horizontally
            r.y[i] = 0;
            r.px[i] = r.x[i];
            r.py[i] = r.y[i];
        }
        return r;
    }

    fn step(self: *Rope, dt: f32, iterations: usize) void {
        // 1. Verlet integration with gravity (point 0 is pinned)
        for (1..N) |i| {
            const vx = (self.x[i] - self.px[i]) * 0.99; // a little damping
            const vy = (self.y[i] - self.py[i]) * 0.99;
            self.px[i] = self.x[i];
            self.py[i] = self.y[i];
            self.x[i] += vx;
            self.y[i] += vy + 400.0 * dt * dt;
        }
        // 2. relax the distance constraints several times
        for (0..iterations) |_| {
            for (0..N - 1) |i| {
                const dx = self.x[i + 1] - self.x[i];
                const dy = self.y[i + 1] - self.y[i];
                const dist = @sqrt(dx * dx + dy * dy);
                if (dist == 0) continue;
                const diff = (dist - REST) / dist;
                if (i == 0) { // the pinned point does not move: the other one takes the whole correction
                    self.x[1] -= dx * diff;
                    self.y[1] -= dy * diff;
                } else {
                    self.x[i] += dx * 0.5 * diff;
                    self.y[i] += dy * 0.5 * diff;
                    self.x[i + 1] -= dx * 0.5 * diff;
                    self.y[i + 1] -= dy * 0.5 * diff;
                }
            }
        }
    }
};

test "the rope hangs under gravity, stays pinned, and keeps its segment lengths" {
    var r = Rope.init();
    for (0..600) |_| r.step(1.0 / 60.0, 30);
    try std.testing.expectEqual(@as(f32, 0), r.x[0]);
    try std.testing.expectEqual(@as(f32, 0), r.y[0]);
    // it has swung down below the pin
    try std.testing.expect(r.y[N - 1] &gt; 40);
    // every segment is close to its rest length
    for (0..N - 1) |i| {
        const dx = r.x[i + 1] - r.x[i];
        const dy = r.y[i + 1] - r.y[i];
        const len = @sqrt(dx * dx + dy * dy);
        try std.testing.expect(@abs(len - REST) &lt; 0.5);
    }
}</code></pre>
<h3>Other constraints</h3>
<ul><li><b>Pin / anchor</b>: set the point's position each step (the first point above).</li><li><b>Max-length (rope) vs rod</b>: a rope only <i>pulls</i> (correct only if too long), a rod keeps both directions. Change the sign check.</li><li><b>Angle limits</b> and <b>bending</b> (for stiff cloth, constrain the point two apart).</li><li><b>Collisions</b> are just another constraint: if a point is inside a shape, project it to the surface after the distance constraints.</li><li><b>Joints in rigid-body engines</b> (hinge, slider, spring) use the same sequential impulse machinery as contacts, applied to velocities instead of positions.</li></ul>
<h3>Cloth, hair and soft bodies</h3>
<p>A cloth is a grid of points with <b>structural</b> constraints (neighbours), <b>shear</b> constraints (diagonals) and optionally <b>bend</b> constraints. Hair and tails are ropes. Soft bodies add a pressure or volume constraint. The expensive parts are the many iterations and collision, so games simulate the cloth at low resolution, only near the camera, and often only for decoration (capes, flags) that does not affect gameplay.</p>
<h3>Choosing: rigid body engine or hand-made?</h3>
<p>Use the engine's joints for gameplay-relevant physical objects (a swinging platform, a vehicle). Write a small Verlet system for cosmetic, high-count, or highly controllable things (a rope the player grapples, hair, tentacles, a chain of fish). It is a few dozen lines and you control the cost.</p>` },
        { pid: 'q-phy3-1', type: 'quiz', q: 'In position-based dynamics a long chain looks stretchy. What is the most direct way to make it stiffer?',
          options: ['Make the points heavier', 'Run more constraint-relaxation iterations per step (or use substeps)', 'Reduce gravity', 'Use explicit Euler'], answer: 1, explain: 'Each iteration passes the correction one link further. Few iterations cannot propagate a pin\'s influence down a long chain.' },
        { pid: 'q-phy3-2', type: 'quiz', q: 'Why is Verlet integration convenient for constraints?',
          options: ['It is the most accurate method', 'Velocity is derived from the positions, so moving a point to satisfy a constraint also corrects its velocity automatically', 'It needs no gravity', 'It is faster than Euler'], answer: 1, explain: 'There is no separate velocity to keep consistent: position is the state.' },
        { type: 'reveal', title: 'Exercise: design a grappling hook', html: `<p>The player fires a hook that sticks to a wall; a rope connects it to the player, who can swing and reel in.</p><ul><li>Is it a rope or a rod constraint while swinging? (Rope: only pulls when taut.)</li><li>Where does the constraint act: on the player's <b>position</b> (Verlet-style: clamp distance to the rope length) or on its <b>velocity</b> (remove the outward component along the rope)? Which feels more controllable?</li><li>How do you reel in? (Decrease the maximum length over time.)</li><li>Does the rope need to wrap around corners? (A list of anchor points updated when the line of sight is blocked: your raycast lesson.)</li><li>Should the rope be a visual Verlet chain while the gameplay uses one distance constraint? (Usually yes: cosmetic detail separate from gameplay.)</li></ul>` },
      ],
    },
    {
      id: 'phy-queries', title: 'Raycasts, shape casts and spatial queries', minutes: 35,
      summary: 'Asking the world questions: what is in front of me, can I see it, what is inside this area, did the bullet hit.',
      checks: [
        { q: 'In the slab method for ray versus axis-aligned box, when does the ray hit?',
          options: ['When the latest slab entry is before the earliest slab exit, with hits behind the origin ignored', 'When it enters any single slab on either axis', 'When the ray direction is normalised, regardless of geometry', 'Only when the ray starts inside the box'],
          answer: 0, explain: 'The box is the intersection of its slabs. Overlapping entry-exit intervals mean the ray passes through all of them.' },
        { q: 'You must choose between a hitscan rifle and a slow plasma projectile for a new weapon. What should drive the decision?',
          options: ['Cost: hitscan is always better because it is one raycast', 'The gameplay you want: instant exact shots versus travel time, drop and dodgeability, plus online lag compensation for hitscan', 'Whichever needs fewer art assets', 'The weapon name length'],
          answer: 1, explain: 'Both are cheap enough. Fairness, feel and networking decide, not performance alone.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Queries are different from simulation</h3>
<p>Simulation moves bodies and resolves contacts. A <b>query</b> asks a question about the current state without changing it: <i>is there a wall between the guard and the player? what is under the mouse? what is inside this explosion? can I step forward without falling?</i> Game code makes far more queries than people expect: AI line of sight, hitscan weapons, ground checks, interaction prompts, camera collision, placement previews.</p>
<table><tr><th>Query</th><th>Question</th><th>Typical use</th></tr>
<tr><td>Raycast</td><td>First thing hit by an infinitely thin ray, and where</td><td>hitscan, line of sight, ground check, mouse picking</td></tr>
<tr><td>Shape cast (sweep)</td><td>First thing hit by a moving shape (circle, box, capsule)</td><td>thick projectiles, character movement, camera boom</td></tr>
<tr><td>Overlap / area query</td><td>Everything inside a shape right now</td><td>explosions, pickups, auras, attack hitboxes</td></tr>
<tr><td>Point query</td><td>What is at this point</td><td>clicking, placing, "am I in water"</td></tr></table>
<h3>Rays</h3>
<p>A ray is an origin plus a direction. The result you almost always want is the <b>closest</b> hit: the distance along the ray (<code>t</code>), the point (<code>origin + dir * t</code>), the surface normal (for decals and bounce) and which object was hit. Always give a <b>maximum distance</b> and a <b>layer mask</b> so the query ignores things it should not see (your own body, triggers, other team).</p>
<h3>Ray against a box: the slab method</h3>
<p>An axis-aligned box is the intersection of two "slabs" (the space between two parallel lines on each axis). Find where the ray enters and leaves each slab; the ray hits the box if the <b>latest entry</b> is before the <b>earliest exit</b>.</p>
<pre><code data-check="zig">const std = @import("std");

const Box = struct { x: f32, y: f32, w: f32, h: f32 };

/// Distance along the ray where it first enters the box, or null. The direction does not have to be normalised (t is in units of the direction).
fn rayBox(ox: f32, oy: f32, dx: f32, dy: f32, b: Box) ?f32 {
    var t_min: f32 = 0; // ignore hits behind the origin
    var t_max: f32 = std.math.inf(f32);
    const axes = [2][4]f32{ .{ ox, dx, b.x, b.x + b.w }, .{ oy, dy, b.y, b.y + b.h } };
    for (axes) |a| {
        const o = a[0];
        const d = a[1];
        if (d == 0) {
            if (o &lt; a[2] or o &gt; a[3]) return null; // parallel to the slab and outside it
        } else {
            var t1 = (a[2] - o) / d;
            var t2 = (a[3] - o) / d;
            if (t1 &gt; t2) std.mem.swap(f32, &amp;t1, &amp;t2);
            t_min = @max(t_min, t1);
            t_max = @min(t_max, t2);
            if (t_min &gt; t_max) return null;
        }
    }
    return t_min;
}

test "ray against a box" {
    const box = Box{ .x = 4, .y = 2, .w = 2, .h = 2 };
    try std.testing.expectEqual(@as(?f32, 4), rayBox(0, 3, 1, 0, box)); // straight in from the left
    try std.testing.expectEqual(@as(?f32, null), rayBox(0, 0, 1, 0, box)); // passes below
    try std.testing.expectEqual(@as(?f32, null), rayBox(10, 3, 1, 0, box)); // box is behind the origin
    try std.testing.expectEqual(@as(?f32, 0), rayBox(5, 3, 1, 0, box)); // starting inside
    try std.testing.expectApproxEqAbs(@as(f32, 2), rayBox(0, 0, 2, 1, box).?, 1e-5); // diagonal: enters the left edge at (4, 2)
}</code></pre>
<h3>Rays on a grid: DDA</h3>
<p>On a tile map, step from cell border to cell border instead of testing shapes (the next drill and simulation). It visits exactly the cells the ray crosses: ideal for line of sight in tile games, shadow casting, and Wolfenstein-style rendering.</p>
<h3>Shape casts</h3>
<p>A ray is infinitely thin: it slips through a gap smaller than a character. For things with width (a thrown axe, a character about to walk) <b>sweep the shape</b> along the movement and find the first impact (time of impact). Engines implement it by inflating the obstacle by the shape's size (Minkowski sum) and raycasting against that. Use it for character movement, thick projectiles and camera collision.</p>
<h3>Layers and masks</h3>
<p>Every query takes a <b>mask</b> of layers to consider. Set a sensible default and name your layers (walls, enemies, player, projectiles, triggers, pickups). Most "my raycast hits itself" and "my bullet hits the pickup" bugs are mask bugs. Starting a ray <i>inside</i> the shooter's own collider is the classic: exclude the shooter or start just past its edge.</p>
<h3>Performance</h3>
<ul><li>Queries use the broadphase (a grid or tree), so cost is roughly logarithmic in the number of objects, but not free: hundreds per frame is fine, thousands needs care.</li><li><b>Share and cache</b>: if ten enemies ask "can I see the player" each frame, stagger checks across frames (enemy i checks on frame i mod 5).</li><li>Prefer cheap first: a distance check before a raycast; a field-of-view dot product before line of sight.</li></ul>
<h3>Hitscan, projectiles and fairness</h3>
<p>A hitscan weapon is one raycast in the frame you shoot: instant, cheap, exact. Projectiles are bodies that move and collide over several frames (travel time, drop, dodgeable). Online, hitscan needs lag compensation (networking track). Choose by the gameplay you want, not by cost.</p>` },
        { pid: 'sim-raycast', type: 'sim', id: 'gdraycast', title: 'A DDA raycast on a tile grid',
          intro: '<p>The ray goes from the green dot toward your pointer. Shaded cells are the ones the DDA visits; the amber outline is the wall it hits. Tick <b>paint walls</b> to edit the map, or <b>drag the origin</b>.</p>',
          try: ['Move the pointer: the visited cells form exactly the line of tiles the ray crosses, no more.', 'Compare the number of cells visited with the number of lookups you would need by sampling every 0.05 cells.', 'Paint a wall right next to the origin and aim along it: grazing hits at cell corners are where DDA and sampling disagree.', 'Aim at a gap one cell wide diagonally: a ray passes between two diagonal walls exactly at the corner. Is that a hit? Decide what your game wants.'] },
        { pid: 'drill-raycast', type: 'drill', ref: 'grid_raycast' },
        { pid: 'q-phy4-1', type: 'quiz', q: 'A guard\'s line-of-sight raycast sometimes reports the guard itself as the first thing hit. What is the standard fix?',
          options: ['Make the ray longer', 'Exclude the guard\'s own collider (or its layer) from the query, or start the ray outside its shape', 'Use a bigger guard', 'Cast the ray backwards'], answer: 1, explain: 'A ray that starts inside a shape immediately hits it. Exclusions and masks are part of every query.' },
        { pid: 'q-phy4-2', type: 'quiz', q: 'A raycast-based ground check lets the character fall through 1 pixel gaps between tiles. Which query avoids it?',
          options: ['A longer ray', 'A shape cast (a small box or circle the width of the character\'s feet) instead of a single ray', 'More gravity', 'Turn off collisions'], answer: 1, explain: 'A ray has zero width and can slip through seams; a swept shape covers the character\'s footprint.' },
        { pid: 'q-phy4-3', type: 'quiz', q: 'Eighty enemies each raycast to the player every frame and the game stutters. Which change helps most without changing behaviour noticeably?',
          options: ['Remove the player', 'Check a cheap distance and field-of-view test first, and stagger the raycasts across frames', 'Raise the frame rate', 'Make rays shorter than 1 pixel'], answer: 1, explain: 'Cull with cheap tests and spread the expensive ones. Reaction time of a few frames is invisible for AI.' },
      ],
    },
    {
      id: 'phy-controllers', title: 'Character controllers and platformer physics', minutes: 35,
      summary: 'Why most player characters are not rigid bodies, how move-and-slide works, and the bugs everyone hits with slopes and platforms.',
      checks: [
        { q: 'A character standing still on flat ground slowly sinks, then tunnels through after a minute. The code adds gravity times delta every frame with no grounded check. What is the fix?',
          options: ['Add even more gravity so it sticks harder', 'Zero or clamp the downward velocity on floor contact instead of accumulating it while grounded, and use a swept test plus capped fall speed', 'Remove the floor collision', 'Run rendering at a higher frame rate'],
          answer: 1, explain: 'Gravity must not build while standing. Unbounded fall speed eventually defeats any discrete test.' },
        { q: 'The hero can jump while sliding down a near-vertical cliff face. What is wrong with the grounded test?',
          options: ['It treats any contact below as floor; it must check the contact normal angle against the maximum floor slope, so steep surfaces count as walls', 'The jump button is too sensitive', 'Coyote time is too generous', 'The cliff texture looks too much like a floor'],
          answer: 0, explain: 'Floor is defined by the normal being close to up. Steep contacts are walls and must not grant jumps.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Kinematic, not dynamic</h3>
<p>You could make the player a rigid body pushed by forces. It feels terrible: the character slides on ice after releasing the stick, bounces off walls, gets launched by small collisions, and nothing is precisely tunable. Games with tight controls use a <b>kinematic character controller</b>: your code decides the velocity directly (accelerate to a target speed, jump with a fixed impulse), and the physics engine's job is only to <b>move the body as far as it can without penetrating anything</b>. Godot's <code>CharacterBody2D</code> with <code>move_and_slide()</code>, Unity's <code>CharacterController</code> and Unreal's <code>CharacterMovementComponent</code> are all this.</p>
<h3>Move and slide, step by step</h3>
<ol><li>Start with the desired motion this frame: <code>motion = velocity * dt</code>.</li><li><b>Sweep</b> the character's shape along <code>motion</code> (a shape cast). If nothing is hit, move the whole way and stop.</li><li>If something is hit at fraction <code>t</code>: move to the contact point, keep the <b>remaining</b> motion <code>(1 - t) * motion</code>, and remove the component that points into the surface using the contact normal: <code>remaining -= normal * dot(remaining, normal)</code> (this is the "slide along the wall" projection from the vectors lesson).</li><li>Repeat from step 2 with the slid remainder, up to a small number of times (typically 4). The limit stops infinite loops in tight corners.</li><li>Record what you touched: floor, wall, ceiling, based on the normal's angle. Zero the velocity component into floors and ceilings so gravity does not accumulate while standing.</li></ol>
<h3>The things that make it feel good (and bug)</h3>
<ul><li><b>Floor angle</b>: a surface is "floor" if its normal is within a maximum slope angle (say 45°) of up. Steeper surfaces are walls.</li><li><b>Snap to floor</b>: when running down a slope or a step, the character would briefly leave the ground each frame. After moving, if the character was on the floor and is now just above one, push it down a few pixels so it stays grounded (and so jumping and animations work).</li><li><b>Slope speed</b>: moving along the floor surface at a constant speed (project the horizontal velocity onto the slope direction) keeps speed constant uphill; otherwise uphill is slow and downhill hops.</li><li><b>Step up</b>: automatically climb small ledges (stairs) by testing "if I lift by the step height, is the way forward free?".</li><li><b>One-way platforms</b>: solid only when moving down onto them from above (check that the character was above the platform's top last frame, and that its velocity is downward). Let the player drop through by ignoring the platform for a short time.</li><li><b>Moving platforms</b>: carry the character by the platform's frame movement while grounded on it (add the platform velocity to the character's motion), including rotating platforms.</li><li><b>Ceiling bonk and corner correction</b>: if the head hits only the corner of a ceiling, nudge sideways instead of stopping the jump.</li><li><b>Coyote time, jump buffering, variable jump height</b>: the input-forgiveness tricks of the first track layer on top of "am I grounded?".</li></ul>
<h3>Common bugs and their causes</h3>
<table><tr><th>Symptom</th><th>Usual cause</th></tr>
<tr><td>Character sticks to walls while holding toward them</td><td>Friction applied against the wall, or velocity into the wall never removed (slide step missing)</td></tr>
<tr><td>Falls speed up while standing on the ground (jitter, tunneling after a while)</td><td>Gravity keeps adding to <code>velocity.y</code> while grounded; zero it (or clamp) on floor contact</td></tr>
<tr><td>Jitters on slopes</td><td>No floor snap, or grounded flag flickers between frames; use a small snap distance and a tolerance</td></tr>
<tr><td>Gets stuck in corners or between two slopes</td><td>Too few slide iterations, or both normals fight; add a "depenetrate" step and a minimum margin (skin width)</td></tr>
<tr><td>Falls through thin floors at high speed</td><td>Discrete overlap test instead of a swept test; cap fall speed</td></tr>
<tr><td>Can jump while sliding down a steep slope</td><td>"Grounded" was true for any contact below; check the normal angle</td></tr>
<tr><td>Rides moving platforms wrongly or slides off them</td><td>Platform velocity not added to the character, or platform moves after the character in the update order</td></tr></table>
<h3>Skin width</h3>
<p>Floating-point error means "exactly touching" is unstable: the shape alternates between touching and slightly penetrating. Controllers keep a tiny <b>skin</b> gap (0.01 to 0.1 units) between the character and surfaces so contacts are always clean. If your character "vibrates" against a wall, that is the margin being too small.</p>
<h3>Platformer feel is tuned, not simulated</h3>
<p>Celeste, Super Mario and Hollow Knight use hand-designed rules: different gravity going up and going down (heavier fall), a jump that is cut short when the button is released, horizontal acceleration that is faster in the air to turn, max fall speed. Express them as constants you can tune in the inspector, and describe them with <i>time and distance</i> ("jump apex in 0.4 s, 4 tiles high") rather than raw gravity numbers: <code>gravity = 2 * height / time²</code> and <code>jump_velocity = 2 * height / time</code>.</p>` },
        { pid: 'bug-phy-controller', type: 'bug', title: 'Spot the character controller bugs',
          prompt: '<p>A GDScript controller. Click the <b>3</b> lines responsible for the classic problems: unlimited fall speed while grounded, frame-rate dependence and sticking to walls.</p>',
          code: String.raw`func _physics_process(delta):
    velocity.y += gravity
    var dir = Input.get_axis("left", "right")
    velocity.x = dir * speed
    if is_on_floor() and Input.is_action_just_pressed("jump"):
        velocity.y = -jump_velocity
    move_and_slide()
    if is_on_wall():
        velocity.x = 0
        position.x -= dir * 2`,
          bugs: [{ line: 2, why: '<code>velocity.y += gravity</code> is per frame (not multiplied by <code>delta</code>) and is added even while standing on the floor, so downward speed keeps building. Use <code>gravity * delta</code> and zero it (or only apply it) when not on the floor.' },
                 { line: 10, why: 'Manually moving the position out of the wall bypasses the collision system and can push the body into other geometry or cause jitter. <code>move_and_slide()</code> already slides along walls.' },
                 { line: 9, why: 'Zeroing horizontal velocity on any wall contact makes the player stick when holding toward the wall while falling or jumping, and kills momentum. Let sliding resolve it; the next frame\'s input recomputes velocity.x anyway.' }],
          ok: [4, 6], hint: 'One is about gravity and time, two are about "fixing" wall contact by hand.' },
        { pid: 'q-phy5-1', type: 'quiz', q: 'You want a jump that reaches 3 tiles (96 px) in 0.4 s to the apex. Which gravity and initial speed (up) do you use?',
          options: ['gravity = 600, v = 300', 'gravity = 2·h/t² = 1200 px/s², v = 2·h/t = 480 px/s', 'gravity = 96, v = 0.4', 'gravity = 9.8, v = 3'], answer: 1, explain: 'From h = v·t/2 at the apex and v = g·t: g = 2h/t² and v = 2h/t. Designing from height and time makes tuning intuitive.' },
        { pid: 'q-phy5-2', type: 'quiz', q: 'Running down a gentle slope, the character keeps leaving the ground for a frame, so jumping sometimes fails and the walk animation flickers. What is the standard fix?',
          options: ['Increase gravity', 'Snap the character down to the floor after moving if it was grounded and the floor is within a small distance', 'Make the slope steeper', 'Disable the jump button on slopes'], answer: 1, explain: 'Floor snapping keeps "grounded" stable across descending ground.' },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
