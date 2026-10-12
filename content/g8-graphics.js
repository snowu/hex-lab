/* Game dev section: graphics, UI and audio concepts. Shader code is written for Godot 4's shading language and is not compiled here. */
TRACKS.push({
  id: 'gdgfx', domain: 'gamedev', icon: '🖼️', title: 'Graphics, UI & Audio',
  blurb: 'How a sprite reaches the screen: coordinate spaces, sorting and batching, transforms and matrices, shaders and 2D lighting, readable UI, and sound as a system.',
  lessons: [
    {
      id: 'gfx-pipeline', title: 'From sprite to screen', minutes: 35,
      summary: 'Coordinate spaces, draw order, draw calls and batching, blending, filtering and the costs you can actually control.',
      checks: [
        { q: 'In a top-down game with y-sorting enabled, the hero always draws above a tree even when standing behind it. The hero has z_index 5 and the tree sprite is centred. What two fixes apply?',
          options: ['Keep z_index equal for things that sort by y, and put the sort origin at the trunk base with an offset instead of the image middle', 'Raise the hero z_index even higher and shrink the tree texture', 'Disable y_sort and sort by name', 'Draw the tree in the UI layer'],
          answer: 0, explain: 'A fixed z overrides y order, and the node origin is the sort key. Feet-based pivots make behind and in-front correct.' },
        { q: 'A mobile level with big soft smoke puffs runs slowly while the triangle count is tiny. What is the likely cost and fix?',
          options: ['Too many draw calls, so add more textures', 'Overdraw and fill rate: stacked translucent pixels are shaded many times, so trim transparent sprite borders, prefer opaque backgrounds and budget full-screen transparency', 'The audio bus is too loud', 'The camera zoom is wrong'],
          answer: 1, explain: 'Transparent pixels cost as much as opaque ones. Layered soft sprites exhaust fill rate first.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>The journey of one sprite</h3>
<p>A character sprite is a rectangle of pixels in a texture. To appear on screen it passes through these steps, in every engine, whether you see them or not:</p>
<ol><li><b>Placement.</b> The sprite has a position, rotation and scale in its parent's space, and parents have parents: its <b>world transform</b> is the product of all of them (see the transforms lesson).</li><li><b>Camera.</b> The world is transformed into <b>view space</b>: moved and scaled so the camera is at the origin. Zoom is a scale, shake is an offset.</li><li><b>Culling.</b> Sprites completely outside the view are skipped.</li><li><b>Sorting.</b> What is drawn on top of what.</li><li><b>Submission.</b> The CPU packs the vertices and the texture reference into <b>draw calls</b> for the GPU.</li><li><b>GPU.</b> Each sprite becomes two triangles. For every screen pixel the triangles cover, a <b>fragment shader</b> samples the texture and outputs a colour, which is <b>blended</b> with what is already there.</li><li><b>Presentation.</b> The finished frame is shown (VSync decides when).</li></ol>
<h3>Coordinate spaces: a cheat sheet</h3>
<table><tr><th>Space</th><th>Origin / unit</th><th>Used for</th></tr>
<tr><td>Local</td><td>The object's pivot</td><td>Where is the sword relative to the hand?</td></tr>
<tr><td>World</td><td>The level's origin, game units</td><td>Gameplay, physics, AI</td></tr>
<tr><td>View / camera</td><td>Camera centre</td><td>Parallax, zoom</td></tr>
<tr><td>Screen / viewport</td><td>Top-left pixel of the window</td><td>Mouse position, UI</td></tr></table>
<p>Most "the click is in the wrong place" and "the HUD moves with the camera" bugs are a mix-up of spaces. Name your variables by space (<code>world_pos</code>, <code>screen_pos</code>) and convert explicitly (Godot: <code>get_global_mouse_position()</code>, <code>canvas_transform</code>).</p>
<h3>Draw order</h3>
<p>2D has no depth buffer by default: <b>later is on top</b>. Order is decided by (1) layers (background, world, effects, UI), (2) a <b>z-index</b>, and (3) the order in the scene tree. For top-down and isometric games, <b>y-sorting</b> draws things lower on the screen later, so a character standing behind a tree is hidden and in front of it is not: use the sprite's <i>feet</i> (its pivot at the base) as the sort key, and make the pivot consistent across all sprites. In Godot enable <code>y_sort_enabled</code> on the parent and give sprites an offset so their origin is at the feet.</p>
<h3>Draw calls and batching</h3>
<p>Each time the CPU tells the GPU "draw this with that texture and that state" costs a roughly fixed overhead, independent of how many pixels it draws. A thousand small sprites in a thousand calls is far slower than the same thousand in a few calls. <b>Batching</b> merges sprites that share the same texture, material and blend mode into one call. How to help it:</p>
<ul><li>Use a <b>texture atlas</b> (many sprites packed into one image) so different sprites share one texture. Pack related things together (all enemies of a level).</li><li>Avoid breaking batches: switching texture, shader, blend mode or clip rectangle between sprites forces a new call. Sort by material when order does not matter.</li><li>Prefer tile maps and multi-mesh instancing for thousands of identical things.</li><li>Check your engine's monitors for draw calls (Godot: Debugger → Monitors → Draw calls) and see how it changes as you add things.</li></ul>
<h3>Blending</h3>
<ul><li><b>Alpha blend</b> (normal): <code>result = src * a + dst * (1 - a)</code>. Needs correct draw order.</li><li><b>Additive</b>: <code>dst + src</code>. Glows, fire, magic. Order does not matter, and it can only brighten.</li><li><b>Multiply</b>: darkens, for shadows and tinting.</li><li><b>Premultiplied alpha</b>: the colour is already multiplied by alpha in the texture. Filtering and scaling look correct (no dark halos around sprite edges), and it is what engines often use internally. Mixing straight and premultiplied textures is the usual cause of white or black fringes.</li></ul>
<h3>Texture filtering</h3>
<p><b>Linear</b> filtering blends neighbouring texels and makes scaled art smooth, which is wrong for pixel art; use <b>nearest</b>. <b>Mipmaps</b> store smaller pre-filtered versions for textures shown small (3D, zooming out) and prevent shimmering; turn them off for pixel art. A texel is a pixel of the texture; the sampling point rarely lands exactly on one, which is why scaling by non-integers and moving by sub-pixels needs the care described in the pixel art track.</p>
<h3>Resolution and scaling</h3>
<p>Decide a <b>base resolution</b> and a <b>stretch policy</b>: pixel art scales by integers with letterboxing (the integer scaling drill); high-definition games usually keep the world's visible height fixed and let the width vary with the aspect ratio, anchoring the UI to the edges. Test extreme aspect ratios (ultrawide, a phone in portrait) and safe areas (notches).</p>
<h3>Overdraw and fill rate</h3>
<p>Transparent pixels cost as much as opaque ones: a full-screen translucent layer, or fifty stacked soft particles, makes the GPU shade the same pixels many times. Mobile and integrated GPUs run out of fill rate long before they run out of triangles. Trim transparent borders of sprites, avoid large soft sprites, and use opaque backgrounds where possible.</p>
<h3>Performance checklist</h3>
<ol><li>Measure draw calls and frame time before changing anything.</li><li>Atlases and shared materials.</li><li>Cull what is off-screen (engines do this for you, but your own effects might not).</li><li>Watch overdraw (a debug overdraw view exists in most engines).</li><li>Don't change shader parameters per sprite if you can avoid it: it breaks batches (use instance parameters or vertex colour).</li></ol>` },
        { pid: 'bug-gfx-order', type: 'bug', title: 'Spot the draw order bugs (GDScript)',
          prompt: '<p>A top-down game. Characters appear in front of a tree when they stand behind it, and the sorting flickers. Click the <b>2</b> lines responsible.</p>',
          code: String.raw`# Level scene: Node2D (y_sort_enabled = true)
#   Tree (Sprite2D)
#   Player (CharacterBody2D)

# tree.gd
func _ready():
    centered = true
    texture = preload("res://art/tree.png")   # 32x64 sprite, trunk base at the bottom

# player.gd
func _ready():
    z_index = 5`,
          bugs: [{ line: 7, why: '<code>centered = true</code> puts the sprite\'s origin in the middle of the 32×64 image, so the y-sort key is the middle of the tree, not the trunk base. Use <code>centered = false</code> with an <code>offset</code> so the origin is at the base of the trunk.' },
                 { line: 12, why: 'A fixed <code>z_index</code> puts the player above everything with a lower z regardless of y, which defeats y-sorting for the player. Leave z_index equal for things that must sort by y.' }],
          ok: [1, 8], hint: 'The sort key is the node origin: one line moves it to the wrong place, one overrides sorting entirely.' },
        { pid: 'q-gfx1-1', type: 'quiz', q: 'Your game has 2,000 small sprites using 200 different textures and runs slowly on mobile. The GPU is not busy. What is the likely bottleneck and fix?',
          options: ['Too many pixels; reduce resolution', 'Too many draw calls from texture switches; pack the sprites into a few atlases so they batch', 'Too few triangles', 'The audio'], answer: 1, explain: 'Many tiny calls are CPU/driver overhead. Atlases let sprites share a texture and be drawn in a few calls.' },
        { pid: 'q-gfx1-2', type: 'quiz', q: 'Scaled-up pixel art looks blurry. Which setting is wrong?',
          options: ['Alpha blending', 'Texture filtering: it should be nearest-neighbour, not linear', 'VSync', 'The camera zoom'], answer: 1, explain: 'Linear filtering interpolates between texels. Nearest keeps the hard pixel edges.' },
        { pid: 'q-gfx1-3', type: 'quiz', q: 'Glowing fire particles overlap and the order they were created in changes how they look. Which blend mode removes the order dependence?',
          options: ['Alpha blend', 'Additive blend (dst + src)', 'Multiply', 'None: it is impossible'], answer: 1, explain: 'Addition is commutative: the sum of all particles is the same in any order (alpha blending is not).' },
      ],
    },
    {
      id: 'gfx-transforms', title: 'Transforms, matrices and hierarchies', minutes: 35,
      summary: 'Position, rotation and scale as matrices, why order matters, parent-child hierarchies, pivots, and a first look at 3D.',
      checks: [
        { q: 'A parent node has scale (2, 1) and its child rotates. The child sprite skews instead of rotating cleanly. What is the rule?',
          options: ['This is gimbal lock and needs quaternions', 'The pivot is too accurate', 'Non-uniform parent scale plus a rotating child produces shear; avoid non-uniform scale on nodes that have rotating children', 'Matrices cannot represent scale'],
          answer: 2, explain: 'Scaled axes are no longer perpendicular, so child rotation shears. Keep ancestor scale uniform or apply it at the leaf.' },
        { q: 'Why does 2D use 3x3 matrices with points written as (x, y, 1)?',
          options: ['To use more memory per sprite', 'The extra 1 turns translation into a multiplication so translation, rotation and scale combine with plain matrix multiplication', 'To make the shader compile faster', 'Because the GPU only accepts three numbers'],
          answer: 1, explain: 'Homogeneous coordinates unify addition and multiplication into one operation that composes and inverts cleanly.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Why matrices</h3>
<p>Moving, rotating and scaling a sprite are three separate operations, but a hierarchy of them (a hand on an arm on a body on a platform) needs to be combined and undone. A <b>matrix</b> packs any combination into one object you can multiply, invert and apply to many points cheaply. In 2D, an <b>affine</b> transform needs six numbers (a 2×2 matrix for rotation, scale and shear plus a translation); in 3D, twelve (a 4×4 matrix with a fixed last row, which is what engines store).</p>
<h3>Homogeneous coordinates in one paragraph</h3>
<p>Translation is an <i>addition</i>, rotation and scale are <i>multiplications</i>, so they do not combine with a single operation. The trick: add a third coordinate that is always 1, <code>(x, y, 1)</code>. Then translation also becomes a multiplication (the translation numbers sit in the third column), and all three combine by plain matrix multiplication. That is the whole reason 3×3 matrices appear in 2D and 4×4 in 3D.</p>
<h3>Order of operations</h3>
<p>Matrix multiplication is <b>not commutative</b>: <code>A * B</code> is not <code>B * A</code>. With column vectors (the convention in most maths and in Godot), <code>M = T * R * S</code> means <b>scale first, then rotate, then translate</b>: the sprite scales around its own origin, turns around it, then moves to its place. That is almost always what you want, and it is the order every engine uses for a node's local transform. Reverse it and the object swings around the world origin instead of its own pivot. The simulation shows it.</p>
<h3>Parents and children</h3>
<p>A child's world transform is <code>world = parent_world * child_local</code>. Walk the tree from the root multiplying. Moving the parent moves everything below it for free; the child only knows its offset. This is how skeletons, turrets on tanks, UI panels and vehicles carrying passengers work. Because multiplications are cheap but a tree can be large, engines cache world transforms and recompute only the changed part (the dirty flag lesson).</p>
<h3>Pivot, origin and anchor</h3>
<p>The <b>pivot</b> is the point the sprite rotates and scales around. A character's pivot at its feet makes y-sorting and ground contact simple; a pivot at the centre is natural for a spinning coin. Changing the pivot without moving the picture means translating the sprite by the pivot offset. Put the pivot where the gameplay needs it, and be consistent across a set of sprites.</p>
<h3>Non-uniform scale and shear</h3>
<p>Scale a parent by (2, 1) and rotate a child inside it: the child's axes are no longer perpendicular, the child is <b>sheared</b>. Engines either forbid it, apply it only at the leaf, or accept the shear. In the simulation, drag <b>parent x-scale</b> away from 1 and watch the axes of the last node. Rule: avoid non-uniform scale on nodes that have rotating children.</p>
<h3>Inverse transforms</h3>
<p>To convert a mouse position (world or screen) into a node's local coordinates, apply the <b>inverse</b> of its world matrix. An inverse exists only if the transform does not flatten space (a scale of 0 does not have one). The drill implements <code>inverse</code> for the 2D case.</p>
<h3>A look at 3D</h3>
<ul><li><b>Model → world → view → projection.</b> The classic pipeline multiplies four matrices: the model matrix places the object, the view matrix is the inverse of the camera's transform, and the <b>projection</b> maps the view volume (a frustum for perspective, a box for orthographic) into the screen cube. Orthographic projection has no perspective; many "2.5D" games use it.</li><li><b>Rotations.</b> Euler angles (three angles) are intuitive but suffer <b>gimbal lock</b> and awkward interpolation. <b>Quaternions</b> (four numbers) have no lock, interpolate smoothly with <b>slerp</b> and compose cheaply; engines store rotation as quaternions and expose Euler angles for editing.</li><li><b>Normals</b> (directions perpendicular to surfaces) transform with the inverse-transpose of the model matrix, not the model matrix itself, once non-uniform scale is involved.</li></ul>
<h3>Debugging transforms</h3>
<ol><li>Draw the axes of the node (red x, green y in many tools).</li><li>Print the local and world positions and compare.</li><li>Check the order: does it rotate around its pivot or around the origin?</li><li>Check units (degrees vs radians; pixels vs tiles).</li><li>Check handedness: 2D screen y points <i>down</i>, which flips rotation direction compared with a maths textbook.</li></ol>` },
        { pid: 'sim-transform', type: 'sim', id: 'gdtransform', title: 'A three-bone arm and the order of operations',
          intro: '<p>Each bone is a child of the previous one. Magenta lines are each node\'s x axis, cyan its y axis. Switch the order to the wrong one and compare.</p>',
          try: ['Move the <b>shoulder</b> slider: the whole arm rotates and the child bones follow for free.', 'Change the <b>order</b> to <i>rotate · translate · scale</i>: the arm no longer bends at the joints, it swings about the origin.', 'Back in the correct order, set <b>parent x-scale</b> to 2 and rotate the <b>elbow</b>: the axes of the later bones stop being perpendicular (shear).', 'Set the parent scale back to 1 and watch the shear warning disappear.'] },
        { pid: 'drill-transform', type: 'drill', ref: 'transform2d' },
        { pid: 'q-gfx2-1', type: 'quiz', q: 'A turret sprite should rotate around its own base, but it orbits the world origin instead. What is the most likely mistake?',
          options: ['The texture is too big', 'Translate and rotate were composed in the wrong order, or the pivot is not at the base', 'The camera is zoomed', 'The frame rate is low'], answer: 1, explain: 'Rotate-then-translate swings the object around the origin. Translate · rotate applies rotation around the object\'s own origin, which must be at the pivot.' },
        { pid: 'q-gfx2-2', type: 'quiz', q: 'Why do engines store 3D rotations as quaternions?',
          options: ['They use less memory than matrices only', 'No gimbal lock, smooth interpolation (slerp) and cheap composition', 'They are easier to read', 'The GPU requires them'], answer: 1, explain: 'Euler angles are good for editing, quaternions are good for computing and blending.' },
        { pid: 'q-gfx2-3', type: 'quiz', q: 'To find which tile the mouse is over, given the mouse position in screen space and a camera that zooms and scrolls, you should…',
          options: ['Divide the screen position by the tile size', 'Convert the screen position to world space with the inverse of the camera transform, then divide by the tile size', 'Multiply by the zoom twice', 'Use the camera position only'], answer: 1, explain: 'World space is where tiles live. The inverse of the world→screen transform brings the mouse into it.' },
      ],
    },
    {
      id: 'gfx-shaders', title: 'Shaders, effects and 2D lighting', minutes: 40,
      summary: 'What a shader is, the handful of tricks behind most 2D effects, and how to light a flat world.',
      checks: [
        { q: 'You need a crisp dark outline around a sprite. How does the classic fragment-shader version work, and what art requirement comes with it?',
          options: ['Blur the whole sprite and call the halo an outline', 'If this pixel is transparent but one of its four alpha neighbours is opaque, output the outline colour; pad the sprite texture by one pixel so the rim has room', 'Draw the sprite twice at different resolutions', 'Increase the mesh triangle count'],
          answer: 1, explain: 'Outlines detect the alpha edge by sampling neighbours. Without padding the rim is clipped at the texture border.' },
        { q: 'Every enemy has its own shader with a per-sprite flash_amount parameter, and draw calls exploded even though all enemies share one texture. What is the fix?',
          options: ['Keep shader parameters per material rather than per sprite, or batching breaks: unique state per sprite forces a new call', 'Give each sprite even more unique parameters', 'Switch to uncompressed audio', 'Disable the fragment shader entirely forever'],
          answer: 0, explain: 'Batching merges sprites sharing texture, material and blend mode. Per-sprite state splits every batch.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>What a shader is</h3>
<p>A <b>shader</b> is a tiny program that runs on the GPU, in parallel, for every vertex or every pixel. It cannot see the game; it only receives inputs and returns a colour. That restriction is why it is fast: thousands of copies run at once with no shared state.</p>
<ul><li><b>Vertex shader</b>: runs per vertex; positions things (a wobbling flag, a swaying tree).</li><li><b>Fragment (pixel) shader</b>: runs per covered pixel; decides its colour. Most 2D effects live here.</li><li><b>Uniforms</b>: values you set from the game for the whole draw (time, a colour, a threshold).</li><li><b>Varyings / UV</b>: values interpolated per pixel; <code>UV</code> says which point of the texture this pixel is, from (0,0) to (1,1).</li><li><b>Textures</b>: images the shader can sample at any UV.</li></ul>
<p>Mental model: <code>colour = f(uv, texture, uniforms, time)</code>, evaluated independently for each pixel. Anything that needs neighbours (blur) must sample the texture at several offsets; anything that needs history needs another render target.</p>
<h3>Your first shader (Godot 4 shading language)</h3>
<pre><code>shader_type canvas_item;

uniform vec4 flash_color : source_color = vec4(1.0);
uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    COLOR = vec4(mix(tex.rgb, flash_color.rgb, flash_amount), tex.a);   // hit flash: blend toward white
}</code></pre>
<p>Set <code>flash_amount</code> to 1 for a frame or two when the enemy is hit and tween it back to 0: that is the white flash from the juice lesson, with no extra art.</p>
<h3>The classic 2D effects</h3>
<ul><li><b>Palette swap.</b> Store the sprite in greyscale or index colours and look the colour up in a small palette texture: <code>texture(palette, vec2(grey, row))</code>. One sprite, many enemy variants, and day/night palettes for free.</li><li><b>Outline.</b> Sample the alpha of the four neighbours; if this pixel is transparent but a neighbour is opaque, output the outline colour. (Mind the texture edge: pad the sprite by one pixel.)</li><li><b>Dissolve.</b> Compare a noise texture to a threshold uniform; discard (or fade) pixels below it, and paint a bright rim just above. Animate the threshold for death and teleport effects.</li><li><b>Scrolling and distortion.</b> Offset the UV by time (water, conveyor, heat haze) or by a noise texture (warp).</li><li><b>Scanlines and CRT.</b> Darken every n-th screen row and add curvature or chromatic offset. Subtle, or it hurts readability.</li><li><b>Colour grading.</b> A final full-screen pass: contrast, saturation, tint (damage vignette, underwater tint), usually via a lookup texture.</li></ul>
<pre><code>// outline: if I am empty but a neighbour is not, I am part of the outline
void fragment() {
    vec2 px = TEXTURE_PIXEL_SIZE;
    float a = texture(TEXTURE, UV).a;
    float n = texture(TEXTURE, UV + vec2(px.x, 0.0)).a + texture(TEXTURE, UV - vec2(px.x, 0.0)).a
            + texture(TEXTURE, UV + vec2(0.0, px.y)).a + texture(TEXTURE, UV - vec2(0.0, px.y)).a;
    COLOR = a &gt; 0.5 ? texture(TEXTURE, UV) : (n &gt; 0.5 ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(0.0));
}</code></pre>
<h3>2D lighting</h3>
<p>A flat world can still be lit. The pieces, from cheap to rich:</p>
<ol><li><b>Ambient tint.</b> Multiply the whole scene by a colour (night = dark blue). One line.</li><li><b>Light sprites.</b> Draw soft round textures with <b>additive</b> blending into a separate "light buffer", then multiply the scene by that buffer. Torches, lamps, the player's lantern. Cheap and fully controllable.</li><li><b>Shadows.</b> Occluder shapes block light; engines build a shadow mask per light (Godot's <code>PointLight2D</code> + <code>LightOccluder2D</code>). The cost grows with lights × occluders.</li><li><b>Normal maps.</b> A second texture per sprite whose colours encode the surface direction, so a flat sprite reacts to the angle of the light and looks bumpy. Authoring cost is high; for pixel art many teams hand-paint a few and use a subtle effect.</li><li><b>Emissive.</b> Mark pixels that glow regardless of lighting (the "emissive pixels" some pipelines mark in the alpha channel), so lava and eyes stay bright in the dark.</li></ol>
<h3>Post-processing</h3>
<p>Render the scene to a texture, then draw that texture to the screen through a shader. Bloom (blur the bright parts and add them back), screen shake of the whole view, pixelation, colour blindness simulation and fades are all post-effects. Each full-screen pass costs fill rate, so budget them on mobile.</p>
<h3>Practical advice</h3>
<ul><li><b>Output values as colours to debug</b>: <code>COLOR = vec4(UV, 0.0, 1.0)</code> shows the UV; <code>COLOR = vec4(vec3(my_value), 1.0)</code> shows any number as grey.</li><li><b>Avoid branching on uniforms per pixel</b> when you can use <code>mix</code> or <code>step</code>; avoid dependent texture reads in loops.</li><li><b>Keep a shader's parameters per material, not per sprite</b>, or batching breaks (graphics pipeline lesson).</li><li><b>Mobile precision</b>: some GPUs use half-precision floats in fragment shaders; large UV offsets and time values can jitter. Wrap time with <code>mod</code>.</li><li><b>Pixel art</b>: sample with nearest filtering and keep effects on whole pixels, or the effect shimmers.</li></ul>` },
        { pid: 'q-gfx3-1', type: 'quiz', q: 'You need 12 colour variants of an enemy and want to add more later without drawing new art. Which approach scales best?',
          options: ['Draw 12 sprite sheets', 'Palette-swap shader: one greyscale/indexed sprite and a small palette texture lookup per variant', 'Tint with a flat colour only', 'Use 12 scenes'], answer: 1, explain: 'A palette lookup replaces individual colours exactly, keeps shading, and a new variant is just a new row in a small texture.' },
        { pid: 'q-gfx3-2', type: 'quiz', q: 'Why can a fragment shader not easily implement "remember what this pixel was last frame"?',
          options: ['It is too slow', 'Each pixel runs independently with no shared mutable state; you need a second render target holding the previous frame', 'GPUs forbid it', 'Shaders cannot read textures'], answer: 1, explain: 'The model is a pure function of inputs. History must be fed back in as a texture (ping-pong render targets).' },
        { pid: 'q-gfx3-3', type: 'quiz', q: 'What is the cheapest convincing way to add torches that light the area around them in a 2D game?',
          options: ['Ray traced global illumination', 'Additive soft light sprites drawn into a light buffer that the scene is multiplied by', 'A shader per tile', 'Draw the torch bigger'], answer: 1, explain: 'It is just textures and blend modes: cheap, art-directable, and works on any hardware. Add occluders for shadows when needed.' },
        { type: 'reveal', title: 'Exercise: design the effects for a boss fight', html: `<p>List the shader/effect for each beat and the uniform you would animate:</p><ol><li>Boss takes damage: hit flash (<code>flash_amount</code> 1 → 0 over 0.1 s).</li><li>Boss enters a rage phase: palette shift to red (<code>palette_row</code> or a tint uniform), screen vignette (post-process).</li><li>Boss dies: dissolve (<code>threshold</code> 0 → 1 over 2 s) with an additive ember rim, then a white screen flash.</li><li>Telegraphed attack: a pulsing outline or a warning decal on the floor (not a shader at all: a sprite!).</li></ol><p>Which of these must <b>not</b> hide gameplay information (the telegraph)? What accessibility option would you add for the flashing?</p>` },
      ],
    },
    {
      id: 'gfx-ui', title: 'UI, HUD and text', minutes: 30,
      summary: 'Layout that survives every screen size, text that stays readable, and interfaces usable with a pad, a thumb or a screen reader.',
      checks: [
        { q: 'A HUD laid out in absolute pixels looks fine at 16:9 but breaks on ultrawide and phones with notches. What is the structural fix?',
          options: ['Ship only one supported resolution', 'Move every element a few pixels to the right', 'Render the UI in world space under the camera', 'Anchor elements to edges and corners with margins, arrange with containers, and keep important UI inside the safe area'],
          answer: 3, explain: 'Anchors and containers adapt to size and aspect instead of assuming one screen. Safe areas avoid notches and overscan.' },
        { q: 'Zooming 3D nameplates must stay sharp at any distance, while tiny pixel-art dialogue must stay crisp. Which font technologies fit?',
          options: ['Bitmap fonts for the scaling nameplates and vector fonts for the pixel dialogue', 'Signed distance field fonts for text that scales, and bitmap fonts at integer scale for the pixel-art dialogue', 'Images of text for everything', 'No fonts at all, only icons'],
          answer: 1, explain: 'SDF reconstructs sharp edges at any scale with outlines and glows; bitmap is crisp only at its native integer size.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>UI is a different kind of rendering</h3>
<p>Game worlds move with the camera; UI is attached to the <b>screen</b>. Engines keep it separate (Godot: <code>CanvasLayer</code> and <code>Control</code> nodes) so camera movement, zoom and shake do not affect it. The challenges are not about drawing but about <b>adapting</b>: to resolution, aspect ratio, language, input device and the player's abilities.</p>
<h3>Layout that adapts</h3>
<ul><li><b>Anchors and containers.</b> Pin elements to the edges or corners (health bar top-left, minimap top-right) with margins, instead of absolute pixel positions. Containers (horizontal and vertical boxes, grids, margins) arrange children and resize to content, so adding a button does not require moving others.</li><li><b>Safe areas.</b> Phones have notches and rounded corners; TVs overscan. Keep important UI inside the safe area.</li><li><b>Scale policy.</b> Either scale the whole UI with the screen (pixel art, consistent look) or keep sizes in physical units and add room (readable on phones and desktops). Decide early and test the extremes: 16:9, ultrawide 21:9, a tall phone, and a tiny window.</li><li><b>Touch targets.</b> About 44 to 48 logical pixels (roughly 9 mm), with space between them. Place thumb-reachable actions near the bottom corners.</li></ul>
<h3>Text rendering</h3>
<ul><li><b>Bitmap fonts</b>: each glyph is a pre-drawn image; crisp at its native size and perfect for pixel art when drawn at an <b>integer scale</b>. Cheap, but one size per font.</li><li><b>Vector fonts</b> rasterised at runtime: any size, good quality, more CPU and memory (glyph cache). Keep the number of sizes small.</li><li><b>Signed distance field (SDF)</b> fonts: a texture stores the distance to the glyph edge, and a shader reconstructs a sharp edge at any scale and gets outlines and glows for free. Great for text that scales (3D and zooming), with some blurring of very small text.</li><li><b>Readability</b>: contrast against any background (add an outline or a backing panel), generous line height, no all-caps paragraphs, text size scaled to the viewing distance (TV games need much larger text).</li></ul>
<h3>Localisation</h3>
<ul><li>Never concatenate sentences from pieces; word order differs. Use format strings with named placeholders (<code>"{player} defeated {enemy}"</code>) and let translators reorder.</li><li>Text expands: German and Finnish are often 30% longer than English. Let layouts grow, and test with a pseudo-language that adds 40% length and accented characters.</li><li>Plurals, numbers, dates and currency follow locale rules; right-to-left languages mirror the layout; CJK needs large font files and different line-breaking.</li><li>Keep text in <b>tables keyed by id</b>, not in code and images.</li></ul>
<h3>Input and navigation</h3>
<ul><li>Every screen must be fully usable by <b>gamepad</b> and <b>keyboard</b>: define focus order, make the focused element obvious, and remember the last focused item when returning.</li><li>Show the correct <b>button prompts</b> for the device in use (and switch live when the player switches device).</li><li>Never rely only on hover.</li></ul>
<h3>Accessibility</h3>
<ul><li><b>Colour is not information alone</b>: add shapes, icons or text to red/green states. Provide a colour-blind friendly palette or filter.</li><li><b>Remappable controls</b>, hold-vs-toggle options, adjustable text size, subtitles with speaker names and backgrounds, and options to reduce screen shake, flashing and motion.</li><li>Difficulty and assist options are an accessibility feature too.</li><li>Check contrast ratios (aim for at least 4.5:1 for normal text).</li></ul>
<h3>HUD design</h3>
<ul><li>Show only what the player needs <i>now</i>; hide the rest or show it contextually.</li><li>Put information where the eyes already are: damage numbers near the hit, ammo near the weapon, health near the character in a tight action game.</li><li>Use <b>change</b> to draw attention: a health bar that animates (a trailing bar that shows what was just lost) communicates more than a number.</li><li>Keep it stable: elements should not jump around as values change width. Use monospaced digits or fixed-width containers.</li></ul>
<h3>Performance</h3>
<ul><li>UI often has many small textures and text pieces; batch with an atlas and avoid re-laying-out every frame (only when data changes: a dirty flag again).</li><li>Beware of per-frame string formatting and allocation (<code>"%d/%d" % [hp, max]</code> only when the value changes).</li><li>Large translucent panels are overdraw.</li></ul>` },
        { pid: 'q-gfx4-1', type: 'quiz', q: 'The German translation overflows its button and clips. What is the right structural fix?',
          options: ['Shrink the German font', 'Let the button grow to its content (container layout) and test layouts with a longer pseudo-language', 'Only ship English', 'Use an image for the text'], answer: 1, explain: 'Text length varies by language. Layouts must adapt rather than assume English lengths.' },
        { pid: 'q-gfx4-2', type: 'quiz', q: 'Why is "red means enemy, green means ally" alone a problem?',
          options: ['It uses too many colours', 'Many players cannot distinguish red and green; add a shape, icon or outline difference', 'Colours are slow to render', 'It breaks batching'], answer: 1, explain: 'Roughly 8% of men have red-green colour vision deficiency. Redundant coding (colour plus shape) fixes it.' },
        { pid: 'q-gfx4-3', type: 'quiz', q: 'You build a sentence as <code>"You found " + count + " " + item</code>. What localisation problem does it cause?',
          options: ['Nothing', 'Word order and plural forms differ between languages; use a translatable template with named placeholders and plural rules', 'It is slow', 'It is too short'], answer: 1, explain: 'Translators need whole sentences with placeholders so they can reorder and inflect.' },
      ],
    },
    {
      id: 'gfx-audio', title: 'Audio as a system', minutes: 30,
      summary: 'Playing a sound is easy; making a mix that works, adapts and does not fatigue is the craft.',
      checks: [
        { q: 'Footsteps need left-right position as the player runs past, and there is one looping music track. Which channel formats fit?',
          options: ['Stereo footsteps and mono music', 'Mono footsteps so the engine can pan and attenuate them, and stereo for the non-positional music', 'Mono for everything to save disk space', '5.1 surround for the UI clicks only'],
          answer: 1, explain: 'Positional sounds must be mono so panning works; stereo is for music and ambience that needs no position.' },
        { q: 'The project has hundreds of short UI clicks and a 5-minute music track. How should they be stored and played?',
          options: ['Keep short frequent effects uncompressed in memory for fast playback, and stream the long compressed music; route both through buses with volumes, ducking and limiting', 'Stream the clicks and load the whole music track decompressed into RAM', 'Convert everything to the highest sample rate available', 'Play all sounds at maximum volume with no buses'],
          answer: 0, explain: 'Short effects need latency-free playback while long tracks need small size. Buses give per-category control and headroom.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Why audio gets neglected, and why it should not</h3>
<p>Sound carries a large part of game feel (the juice lesson's simulation makes it obvious), gives information the screen cannot (something behind you, a low-health warning), and sets emotion. It is also easy to get wrong in ways players feel but cannot name: harsh repetition, clipping, music that fights sound effects, and sounds that arrive late.</p>
<h3>The basics</h3>
<ul><li><b>Sample rate and bit depth</b>: 44.1 or 48 kHz, 16 bit is the working standard. Higher helps only during editing.</li><li><b>Formats</b>: <b>WAV</b> (uncompressed): fastest to play, large, good for short effects. <b>OGG Vorbis</b> or <b>MP3</b> (compressed): small, for music and long ambience, and costs a little CPU to decode. Choose per sound: short and frequent → uncompressed in memory; long → compressed and <b>streamed</b>.</li><li><b>Mono vs stereo</b>: positional (3D or panned) sounds should be <b>mono</b>; the engine does the panning. Stereo is for music and non-positional ambience.</li><li><b>Loudness</b>: normalise your assets to a consistent perceived level (targets vary by platform: roughly −16 LUFS for mobile and −24 to −20 for living-room consoles are commonly cited, so check the platform's guidance). Nothing should clip: if the sum of voices exceeds full scale the output distorts, so leave headroom and use a limiter on the master bus.</li></ul>
<h3>Buses and mixing</h3>
<p>Route sounds into <b>buses</b>: Music, SFX, Voice, UI, Ambience, each with its own volume, effects and mute, all feeding a Master. Reasons: player volume sliders per category (an accessibility need), <b>ducking</b> (automatically lower music while dialogue plays), reverb sends for caves, a low-pass filter on everything except the pause menu when the game is paused, and sensible limiting. Set the structure up early; retrofitting buses is painful.</p>
<h3>Variation: the cure for fatigue</h3>
<p>A footstep that plays the identical sample 500 times becomes a machine gun. Fixes, cheapest first: <b>random pitch</b> within a few percent, <b>random volume</b>, <b>round-robin or random choice among several variants</b> (never the same one twice in a row), and slightly different timing. A good rule: anything heard more than a handful of times a minute needs variation.</p>
<h3>Positional audio</h3>
<ul><li><b>Attenuation</b>: volume falls off with distance (inverse-distance or a curve you control) to a maximum range.</li><li><b>Panning</b>: left/right based on direction relative to the listener. 3D audio adds height and behind-ness cues via HRTF on headphones.</li><li><b>Doppler</b> and <b>occlusion</b> (muffle a sound behind a wall with a low-pass filter) are optional polish.</li><li>For 2D games use a listener at the camera or player and tune the attenuation range to the screen size: sounds just off screen should be quiet but audible, not silent.</li></ul>
<h3>Managing many voices</h3>
<p>A busy scene can request hundreds of sounds a frame. Hardware and mixing time are limited, so engines cap the number of simultaneous <b>voices</b>. Policies: drop the quietest or the oldest, <b>limit per sound</b> (at most 3 footsteps at once), and prioritise (player's gun above distant enemy gunfire). This is the event queue problem from the patterns track, with the "full queue" policy being a design decision.</p>
<h3>Music that adapts</h3>
<ul><li><b>Loops</b>: seamless loop points need a sample-accurate loop and a tail that matches the start; compressed formats can add small gaps, so verify.</li><li><b>Layers (stems)</b>: record music as separate parts (drums, bass, melody) and fade layers in and out with game intensity. Cheap and powerful.</li><li><b>Transitions</b>: switch tracks on the beat or bar with a short crossfade instead of cutting, using tempo information to schedule the change.</li><li><b>Silence</b> is part of the design: constant music wears the player out. Space it out, let ambience carry exploration.</li></ul>
<h3>Technical traps</h3>
<ul><li><b>Latency</b>: buffer sizes trade glitch-resistance for delay. A shot that sounds 150 ms late feels wrong. Web and mobile have more latency than desktop; keep the buffers as small as stable.</li><li><b>Browser autoplay rule</b>: browsers block audio until the user interacts. Start the audio context after the first click or tap (the juice simulation in this site does exactly this).</li><li><b>Pausing</b>: decide which buses pause with the game and which keep playing (menu sounds).</li><li><b>Threading</b>: audio runs on its own thread; do not do slow work in its callback and do not share unsynchronised state with the game thread.</li><li><b>Memory</b>: decompressed music in RAM is large. Stream long files.</li></ul>
<h3>Making sound</h3>
<p>Free and cheap tools: <b>sfxr/jsfxr</b> and <b>Bfxr</b> for retro effects; <b>Audacity</b> for editing; <b>LMMS</b> or <b>Reaper</b> for music; field recordings and CC0 libraries (<b>freesound.org</b>, Kenney) for raw material. Layering two or three simple sounds (a thump, a crack, a tail) beats one perfect sample.</p>` },
        { pid: 'q-gfx5-1', type: 'quiz', q: 'Players complain that the footsteps are "annoying" after an hour. The game already has 3 different footstep samples. What is the best further step?',
          options: ['Turn footsteps off', 'Randomise pitch and volume slightly, never repeat the same variant twice in a row, and vary by surface', 'Add more bass', 'Make them louder'], answer: 1, explain: 'Small random variation and avoiding immediate repetition removes the machine-gun effect. Surface-specific sets add information as well.' },
        { pid: 'q-gfx5-2', type: 'quiz', q: 'Dialogue is hard to hear over loud music and explosions. Which mixing feature fits?',
          options: ['Raise the master volume', 'Ducking: automatically lower the music and effects buses while the voice bus is active', 'Mono output', 'Compression of the dialogue file only'], answer: 1, explain: 'Sidechain-style ducking keeps important sounds intelligible without a permanent mix compromise.' },
        { pid: 'q-gfx5-3', type: 'quiz', q: 'Your web game plays no sound until the player clicks something. Is this a bug?',
          options: ['Yes, the browser is broken', 'No: browsers block audio before a user gesture. Start or resume the audio context on the first click/tap', 'Yes, the files are corrupt', 'No: audio is not supported on the web'], answer: 1, explain: 'It is a platform rule. Add a "click to start" or resume on first input.' },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
