/* Learning exercises use the shared design workspace, with game-specific references. */
if (window.MODE === 'gamedev') {
  window.DESIGN_STEPS = [
    { id: 'scope', title: '1. Playable scope', ask: 'What can the player do? Name a small playable slice and what you will defer.' },
    { id: 'numbers', title: '2. Budgets', ask: 'Choose frame, memory and asset budgets. Show the arithmetic and how you will measure them.' },
    { id: 'api', title: '3. Data and commands', ask: 'Which state is authoritative? Sketch entities, commands and ownership.' },
    { id: 'arch', title: '4. Update and render', ask: 'Sketch the flow from input to simulation to presentation. Show where each system runs.' },
    { id: 'deep', title: '5. Hardest part', ask: 'Work through one concrete edge case. Compare two approaches.' },
    { id: 'ops', title: '6. Test and iterate', ask: 'How will you reproduce bugs, profile costs and validate the player experience?' },
  ];
  window.DESIGNS = [
    {
      id: 'gd-platformer', title: 'A responsive platformer controller', level: 'foundation', minutes: 20,
      prompt: 'Design a one-room platformer with running, jumping, coyote time and moving platforms. Keep simulation stable when rendering slows down.',
      ref: {
        scope: '<p>One character, solid tiles and one moving platform. Defer slopes and combat. Test short hops, ledge jumps and landing while holding jump.</p>',
        numbers: '<p>60 simulation ticks per second gives 16.67 ms per tick. Reserve 4 ms for simulation and measure on the target machine. Cap catch-up steps to prevent a slow frame from creating an endless backlog.</p>',
        api: '<p>Controller state: position, velocity, grounded platform ID, jump-buffer expiry and last-grounded tick. Input commands carry a tick and button transitions; consume each jump once.</p>',
        arch: '<p>Sample input → queue transitions → fixed-step platform motion → character collision and ground detection → controller state → interpolated render. Keep interpolation out of authoritative collision state.</p>',
        deep: '<p>Carry the character by the platform displacement before resolving its own movement. Coyote time checks the last grounded tick; buffered jump checks an unconsumed press. Clearing both after jumping prevents double jumps.</p>',
        ops: '<p>Record tick inputs for replay. Test 30/60/144 render fps, a stalled frame, stepping off a ledge, low ceilings and a platform moving into a wall. Overlay contact normals and measure simulation time.</p>',
      },
      hints: ['Separate input sampling from simulation ticks.', 'Store grace periods as tick deadlines, not frame counts.'],
      tradeoffs: ['A fixed timestep simplifies reproducibility but needs interpolation.', 'Swept collision handles fast movement but costs more than discrete overlap checks.'],
      followups: ['Replay the same jump at several rendering rates.', 'Try a platform that reverses direction while the character stands on it.'],
      rubric: ['Defined a playable scope', 'Calculated a tick budget', 'Separated input, simulation and rendering', 'Handled jump consumption and grace periods', 'Explained moving-platform ownership', 'Named reproducible edge-case tests'],
    },
    {
      id: 'gd-assets', title: 'A sprite pipeline with reliable saves', level: 'practice', minutes: 25,
      prompt: 'Design the art pipeline for a small tile game: edit sprites in Pixel Forge, export animation sheets, load them in the game, and preserve existing saves when assets change.',
      ref: {
        scope: '<p>16×16 tiles and four-frame characters using one palette. Keep editable source and generated PNGs. Defer runtime editing and cloud saves.</p>',
        numbers: '<p>A 256×256 RGBA atlas uses 256 × 256 × 4 = 262,144 bytes before compression. Four atlases use 1 MiB, excluding GPU overhead. Profile texture switches and loading time.</p>',
        api: '<p>Use stable asset IDs with a manifest containing path, frame dimensions, durations and pivot. Saves store asset IDs and a schema version, never atlas coordinates.</p>',
        arch: '<p>spritewright source → deterministic export → manifest validation → game asset cache → renderer. Validate dimensions and required IDs before replacing a loaded atlas.</p>',
        deep: '<p>Repacking an atlas changes coordinates, so resolve stable IDs through the current manifest. Migrate renamed IDs through a versioned mapping. Write saves to a temporary file and atomically replace after validation.</p>',
        ops: '<p>Test transparent pixels, pivots and animation timing at actual size. Reject malformed manifests, test a removed asset with a placeholder, and load old save fixtures after every schema change.</p>',
      },
      hints: ['Separate stable identity from atlas position.', 'Source art and exported runtime assets serve different purposes.'],
      tradeoffs: ['An atlas reduces texture switches but repacking complicates coordinates.', 'Generated assets simplify runtime loading but need reproducible exports.'],
      followups: ['Change the atlas layout and load an old save.', 'Export a walk cycle and check for pivot jitter in the game.'],
      rubric: ['Defined source and export ownership', 'Estimated texture memory', 'Used stable asset IDs', 'Specified animation metadata', 'Handled migration and failed writes', 'Planned visual and old-save tests'],
    },
    {
      id: 'gd-wave', title: 'A wave arena with hundreds of enemies', level: 'stretch', minutes: 30,
      prompt: 'Design a small arena with 500 enemies, projectiles, pickups and reproducible waves. Keep frame time predictable and make it easy to add a new enemy type.',
      ref: {
        scope: '<p>One arena, three enemy types and seeded wave generation. Defer multiplayer. Define a readable cap on simultaneous projectiles and effects.</p>',
        numbers: '<p>500 enemies checked against all others create 500 × 499 / 2 = 124,750 pairs per tick. A uniform grid reduces candidate checks when density is spread out; profile the crowded worst case.</p>',
        api: '<p>Entities have generation-checked IDs and separate transform, health and behaviour data. Spawn commands reference immutable enemy definitions. A seeded random stream belongs to simulation.</p>',
        arch: '<p>Input → spawn queue → AI → movement → grid rebuild → collision → damage events → deferred removals → render. Apply structural changes after iteration to avoid invalidating storage.</p>',
        deep: '<p>Pool projectiles with explicit capacity and reset all fields on reuse. Generation counters prevent delayed events from damaging a new entity that reused an old slot. Grid queries deduplicate pairs.</p>',
        ops: '<p>Replay seeded waves and tick inputs. Track frame percentiles, grid candidates and pool exhaustion. Test clustered enemies, simultaneous deaths and a full projectile pool.</p>',
      },
      hints: ['Look at candidate pair count before optimising arithmetic.', 'Decide when spawning and deletion are allowed.'],
      tradeoffs: ['Dense arrays improve locality but require safe handles.', 'A grid is simple for similar-sized objects; variable sizes may favour a tree.'],
      followups: ['Benchmark every enemy in one grid cell.', 'Reuse an entity slot while an old damage event is queued.'],
      rubric: ['Scoped a readable playable slice', 'Estimated naive collision cost', 'Chose a spatial query strategy', 'Defined safe entity lifetime', 'Handled pool exhaustion', 'Planned replay and worst-case profiling'],
    },
  ];
  const pick = (r, values) => values[Math.floor(r() * values.length)];
  window.ESTIMATES = [
    { id: 'gd-frame', title: 'Frame budget', gen(r) { const fps = pick(r, [30, 60, 120, 144]); return { q: `At ${fps} frames per second, how many milliseconds can one frame take?`, unit: 'ms', answer: 1000 / fps, steps: ['One second contains 1,000 milliseconds.', `1,000 ÷ ${fps} ≈ ${(1000 / fps).toFixed(2)} ms`], tip: 'Measure CPU and GPU time separately; spikes matter as well as averages.' }; } },
    { id: 'gd-atlas', title: 'Texture memory', gen(r) { const side = pick(r, [256, 512, 1024, 2048]); return { q: `An uncompressed ${side}×${side} RGBA8 texture uses four bytes per pixel. How many MiB does it occupy before mipmaps?`, unit: 'MiB', answer: side * side * 4 / 1048576, steps: [`${side} × ${side} × 4 bytes`, 'Divide by 1,048,576 bytes per MiB.'], tip: 'PNG file size is not GPU texture memory. A full mip chain adds roughly one third.' }; } },
    { id: 'gd-pairs', title: 'Collision pairs', gen(r) { const n = pick(r, [100, 200, 500, 1000]); return { q: `For ${n} objects, how many unique pairs does an all-pairs collision check consider?`, unit: 'pairs', answer: n * (n - 1) / 2, steps: [`${n} objects each see ${n - 1} others.`, 'Divide by two to count each unordered pair once.'], tip: 'Spatial partitioning reduces candidate pairs, but measure crowded cases.' }; } },
  ];
  window.NUMBERS = [['30 / 60 / 120 fps frame budget', '33.3 / 16.7 / 8.3 ms'], ['RGBA8 pixel', '4 bytes uncompressed'], ['1024×1024 RGBA8 texture', '4 MiB before mipmaps'], ['Full mip chain', 'About 33% extra memory'], ['60 Hz fixed simulation', 'One tick every 16.7 ms'], ['16-bit unsigned index', '0–65,535']];

}
