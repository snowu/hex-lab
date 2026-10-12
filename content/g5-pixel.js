/* Game dev section, track 5: pixel art. */
TRACKS.push({
  id: 'gdpixel', domain: 'gamedev', icon: '👾', title: 'Pixel Art',
  blurb: 'Resolution and clean lines, colour ramps and hue shifting, shading and dithering, animation, tilesets and a workflow that fits version control. Includes a pixel editor you can draw in.',
  lessons: [
    {
      id: 'px-basics', title: 'Fundamentals: resolution, lines and shapes', minutes: 30,
      summary: 'What makes pixel art pixel art, how big to draw, and how to get clean lines. Draw in the built-in editor.',
      checks: [
        { q: 'A scene mixes a 16×16 character scaled up 2× next to a native 32×32 prop, and the character looks chunky and wrong. What is the problem?',
          options: ['The canvas is too small', 'The palette is too large', 'Mixed pixel sizes (mixels): the two sprites have different on-screen pixel grids', 'The line runs are too even'],
          answer: 2, explain: 'Pick one base resolution and scale; every sprite in a scene must share the same on-screen pixel grid size.' },
        { q: 'A new sprite is shaded with the lightest colour in the middle and dark colours all around the edge, and it looks flat. What should you change?',
          options: ['Pick one light direction and shade surfaces by how they face it instead of following the outline', 'Add more scattered single pixels', 'Zoom in further to judge it', 'Rotate the sprite 30 degrees in the engine'],
          answer: 0, explain: 'Outline-following pillow shading ignores the light source; shading must come from a fixed light direction.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Every pixel is a decision</h3>
<p>Pixel art is drawing where you control each pixel on a coarse grid. The constraint is the point: with only a handful of pixels you must decide what matters (shape, silhouette, one highlight) and drop the rest. Good pixel art is <i>readable at actual size</i>. If you need to zoom to understand it, simplify.</p>
<h3>Resolution: pick it once</h3>
<ul><li>A game has a <b>base resolution</b> (for example 320×180, 384×216 or 480×270) that is scaled up by a whole number. 320×180 scales exactly to 1280×720 (×4) and 1920×1080 (×6).</li><li>Sprite sizes are chosen from it: <b>8×8</b> icons and tiny tiles, <b>16×16</b> characters and tiles (very common), <b>32×32</b> detailed characters, <b>64×64</b> and up for bosses.</li><li>Smaller canvases are faster to draw and animate and force stylisation. Larger ones show more detail but cost more per animation frame.</li><li><b>Never mix pixel sizes</b> in one scene (“mixels”): a scaled-up 16×16 sprite next to a native 32×32 one looks wrong because the pixel grid sizes differ. Never rotate or scale pixel art by arbitrary angles in the engine; redraw or use a dedicated rotation algorithm (rotsprite).</li></ul>
<h3>Clean lines</h3>
<ul><li>Aim for lines made of <b>even runs</b>: for a shallow slope use 3-3-3 or 2-2-2, not 3-1-4-2. Runs that step smoothly look intentional.</li><li>Remove <b>doubles</b>: an L-shaped corner (a pixel touching its neighbours on two sides) makes the line look thick and lumpy. This is the “pixel perfect” cleanup that many editors have as a toggle.</li><li><b>Jaggies</b> are the stair-steps that break a curve. A curve should shorten its runs gradually (6-3-2-1-1-2-3-6), never zig-zag.</li><li>Start with a <b>silhouette</b> in one flat colour. If it reads as the thing (a slime, a sword, a hero), add colour and detail. If not, no detail will fix it.</li><li>Use <b>clusters</b>: group same-colour pixels into deliberate shapes. Scattered single pixels look like noise.</li><li>Avoid <b>pillow shading</b>: shading that follows the outline (light in the centre, dark all around) ignores the light source and flattens the form. Pick a light direction (the next lessons).</li></ul>
<h3>Tools</h3>
<ul><li><b>Aseprite</b> (paid, or compile it yourself from source), <b>LibreSprite</b> (free fork), <b>Pixelorama</b> (free, open source, made in Godot), <b>Piskel</b> (free, browser). A mouse is perfectly fine.</li><li>Learn four tools: pencil, eraser, fill, colour pick, plus a mirror/symmetry mode and a layer for sketching. The editor below has them.</li><li>Work zoomed in to draw and zoomed out (1× and 2×) to judge. The preview next to the canvas shows real size.</li></ul>` },
        { pid: 'sim-px-editor', type: 'sim', id: 'pxedit', title: 'Pixel editor (draw something)',
          intro: '<p>A 16×16 canvas with a 16-colour palette. Your drawing is saved in this browser and you can export it as a PNG upscaled 16× with no smoothing. (A standalone, reusable version of this editor is described at the end of this track.)</p>',
          try: ['Draw a simple <b>slime</b>: an outline silhouette in one colour first, then fill.', 'Turn on <b>mirror</b> and draw half a face: symmetry is the fastest way to make readable characters.', 'Look at the real-size preview to the right: does it still read? Remove detail that disappears.', 'Draw a diagonal line three pixels per step, then try to draw it with uneven steps and compare.', 'Press <b>16</b> or <b>32</b> to change canvas size; keep the same drawing idea at 8 × 8 and notice what you must drop.'] },
        { pid: 'q-px1-1', type: 'quiz', q: 'A 320×180 game is shown fullscreen at 1920×1080. What scale keeps every pixel square and the same size?',
          options: ['6 (an integer)', '5.5', '6.4 (to fill the width exactly)', 'Any value if filtering is on'], answer: 0, explain: '1920 / 320 = 6 and 1080 / 180 = 6. Non-integer scaling makes some pixels 1 screen pixel wider than others, which shimmers when things move.' },
        { pid: 'q-px1-2', type: 'quiz', q: 'Your diagonal line looks lumpy. The pixel runs go 2, 3, 1, 3, 2. What is the usual fix?',
          options: ['Add anti-aliasing colours on every step', 'Make the runs consistent (for example 2-2-2-2-2 or 3-3-3) so the stair-step is regular', 'Make it thicker', 'Use a rounder brush'], answer: 1, explain: 'Regular steps read as a clean line. Irregular ones look like mistakes. Also remove corner doubles.' },
        { pid: 'q-px1-3', type: 'quiz', q: 'What is the best first step when drawing a new character sprite?',
          options: ['Add the details and the shading', 'Draw a flat one-colour silhouette and check it reads at real size', 'Pick the final palette', 'Animate it'], answer: 1, explain: 'If the silhouette is not recognisable at small size, polishing will not save it. Players recognise characters by silhouette in motion.' },
      ],
    },
    {
      id: 'px-color', title: 'Colour: palettes, ramps and hue shifting', minutes: 30,
      summary: 'Why limited palettes work, how to build a ramp, and the one trick that makes flat art look lit.',
      checks: [
        { q: 'A sprite shaded with pure black shadows and pure white highlights looks harsh and chalky. What is the usual fix?',
          options: ['Add more ramp steps', 'Increase the canvas size', 'Draw bigger outlines', 'Use a very dark purple or navy instead of black and an off-white with a warm tint instead of white'],
          answer: 3, explain: 'Extremes should be saved for outlines or sparkles; near-blacks and off-whites shade far more naturally.' },
        { q: 'A bright red hero gets lost on a bright, saturated forest background. What does colour hierarchy say to do?',
          options: ['Reserve the highest contrast and saturation for the focal object and mute the background', 'Make the background even more saturated', 'Give every object its own unrelated palette', 'Shift every ramp by 90 degrees'],
          answer: 0, explain: 'The eye goes to contrast and vividness, so backgrounds stay quieter while the thing the player must notice stays loudest.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Limited palettes</h3>
<p>A small palette forces cohesion: every asset in a game shares the same colours, so things look like they belong together. Typical sizes are 8 to 32 colours for a game (16 for a single sprite is already plenty). Pre-made palettes are on <b>Lospec</b> (the palette list there is the standard reference). Well-known ones include PICO-8 (16), Sweetie 16, Endesga 32 and 64, Resurrect 64 and Apollo. Pick one early and stick with it; changing the palette later means re-colouring everything (indexed colour and palette swaps help, see the workflow lesson).</p>
<h3>Value first</h3>
<p>Colour has <b>hue</b> (which colour), <b>saturation</b> (how vivid) and <b>value</b> (how light or dark). The eye reads <b>value</b> before hue. Squint or switch the preview to greyscale: if the sprite does not separate into light, mid and dark in greyscale, colour will not fix it. Build contrast with value; use hue for mood and grouping.</p>
<h3>Ramps</h3>
<p>A <b>ramp</b> is a short run of colours from dark to light for one material (3 to 5 steps is usually enough: shadow, base, light, maybe highlight). Draw each material from one ramp, share ramps between objects of the same material, and you stay inside the palette budget.</p>
<h3>Hue shifting</h3>
<p>A ramp made by only changing lightness looks muddy and flat: it is the colour of the object under a grey light. Real light has colour. A common, effective convention is: <b>highlights drift toward the light colour</b> (warmer, towards yellow) and <b>shadows drift toward the ambient/sky colour</b> (cooler, towards blue or purple), along with small changes in saturation (shadows and lights often a little less saturated than mid-tones, extremes avoided). Adjust it by scene: a night scene or a lava level reverses the warm and cool roles.</p>
<ul><li>Shift by about 10 to 30 degrees per step, not 90.</li><li>Avoid pure black and pure white for shading. A very dark purple or navy is a better “black”; an off-white with a hint of yellow is a better “white”. Save the extremes for outlines or sparkles if at all.</li><li>Keep saturation under control: a saturated sprite on a saturated background is unreadable. Reserve the most vivid colours for the things the player must notice.</li><li>Build <b>colour hierarchy</b>: the focal object gets the highest contrast and saturation, the background the least.</li></ul>` },
        { pid: 'sim-px-ramp', type: 'sim', id: 'pxramp', title: 'Build a ramp, shift the hue',
          intro: '<p>Both balls use the same number of colours and the same light direction. The left ramp changes only lightness. The right one also shifts the hue between shadow and highlight.</p>',
          try: ['Slide <b>hue shift</b> from 0 up to ~30° and compare the two spheres: the right one starts to look lit by a warm light.', 'Change the <b>base hue</b> (try blue, red, green) and see that the effect works for any colour.', 'Reduce <b>steps</b> to 3: a tiny ramp can still be enough for a small sprite.', 'Raise the shift to 60: it starts to look like separate colours, not one material. Too much is as wrong as none.'] },
        { pid: 'q-px2-1', type: 'quiz', q: 'You are unsure whether a sprite has enough contrast. What quick check do you do?',
          options: ['Add more colours', 'View it in greyscale (or squint): the light/mid/dark masses should still read', 'Make everything more saturated', 'Increase the canvas size'], answer: 1, explain: 'Value carries the form. If greyscale looks flat, colour changes will only disguise the problem.' },
        { pid: 'q-px2-2', type: 'quiz', q: 'A warm sun lights a green bush. Which ramp reads best?',
          options: ['Dark green to light green, same hue', 'Shadows lean blue/teal, base is green, highlights lean yellow-green', 'Shadows lean red, highlights lean blue', 'Black to white'], answer: 1, explain: 'Highlights pick up the warm light, shadows pick up the cool ambient light. This hue shift is what makes it feel lit.' },
        { pid: 'q-px2-3', type: 'quiz', q: 'Why use ramps shared between objects?',
          options: ['It is required by the engine', 'It keeps the palette small and the scene visually consistent', 'It makes files smaller', 'It speeds up drawing lines'], answer: 1, explain: 'Cohesion is the main benefit: the grass, bush and tree leaves all belong to the same world because they share colours.' },
      ],
    },
    {
      id: 'px-shading', title: 'Light, shading, dithering and outlines', minutes: 30,
      summary: 'Putting form into a sprite: a light source, banding, dithering and anti-aliasing by hand, and outline styles.',
      checks: [
        { q: 'Every object in a game is shaded as if lit from a different side, and the scene feels wrong. What rule was broken?',
          options: ['Choose one light direction for the whole game and shade every object from it', 'Every object needs its own palette', 'Dither everything with noise', 'Remove all cast shadows'],
          answer: 0, explain: 'One shared light direction is what makes separate sprites read as belonging to one world.' },
        { q: 'A moving character has soft edge pixels sampled from a green field, and it shows a green halo over a dark cave. What is the fix?',
          options: ['Add more anti-aliasing colours', 'Dither the whole sprite', 'Keep moving sprite edges hard or outlined, and save hand anti-aliasing for big static high-contrast shapes', 'Scale the sprite by 1.5×'],
          answer: 2, explain: 'Edge pixels that match one background become a visible halo on another, so moving sprites stay hard-edged.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Pick one light source</h3>
<p>Choose a direction (commonly top-left, sometimes top-right) and keep it for every object in the game. Then shade by form:</p>
<ul><li>Surfaces facing the light get the lightest tone, surfaces turning away get the base tone, and surfaces facing away get the shadow tone.</li><li>A sphere has a highlight near the light side, a mid area, a <b>core shadow</b> a bit in from the edge on the dark side, and often a faint <b>reflected light</b> right at the edge. That tiny lighter rim on the dark side separates the object from the background.</li><li>A cube is easier: top face lightest, lit side mid, shadow side darkest, with flat shapes per face.</li><li>Cast <b>shadows</b> ground an object: a simple dark ellipse under a character helps it sit in the world.</li></ul>
<h3>Banding</h3>
<p><b>Banding</b> is when shading steps form lines parallel to the outline or evenly spaced stripes. It looks like contour lines on a map. Break it up: vary the width of the bands, let a lighter region wrap around the form instead of repeating the outline shape, and use fewer, bolder shapes.</p>
<h3>Dithering</h3>
<p>Dithering mixes two colours in a pattern so the eye sees something in between. With a small palette it creates gradients and texture.</p>
<ul><li><b>Checkerboard</b> (50% blend) and <b>ordered patterns</b> (Bayer matrices: 25%, 50%, 75% fills) look regular and “retro”.</li><li><b>Noise</b> dithering looks organic but dirty at low resolution.</li><li>At game resolution it can <b>shimmer</b> when moving. Use it on static backgrounds and large surfaces, and sparingly on sprites. Hand-placed dither at the boundary between two ramp steps is more elegant than pattern fills everywhere.</li></ul>
<h3>Anti-aliasing by hand</h3>
<p>Adding an intermediate colour in the corner of a stair-step smooths a curve. It is useful on big, static, high-contrast shapes (a moon, a logo). On sprites that move over changing backgrounds, AA pixels that match one background look like halos on another, so keep sprite edges hard or use outlines.</p>
<h3>Outlines</h3>
<ul><li><b>Black or very dark outline</b>: strongest separation from any background; classic look.</li><li><b>Coloured outline</b> (a dark shade of the fill): softer, more painterly, still readable.</li><li><b>Selective outline (“selout”)</b>: the outline gets lighter where the form catches light (outline colour follows the adjacent fill), so the sprite feels lit all the way to the edge.</li><li><b>No outline</b> for background elements keeps attention on the foreground. Make sure foreground sprites are separated by value then.</li><li>Inner lines: only where they describe a form change; too many lines flatten the shading.</li></ul>` },
        { pid: 'sim-px-dither', type: 'sim', id: 'pxdither', title: 'Banding and dithering',
          intro: '<p>A smooth horizontal gradient squeezed into a few colours. Compare the patterns.</p>',
          try: ['With <b>none</b> and 3 colours you see hard bands. The eye notices the edges between them.', 'Choose <b>ordered 4×4</b>: the same 3 colours now suggest many more tones.', 'Compare <b>2×2</b> (coarse, few extra tones) with <b>8×8</b> (finer, closer to a true gradient).', 'Try <b>random noise</b>: smooth in tone but grainy. Which would you use on a tiny sprite?', 'Raise the colours to 8: at some point you need much less dithering.'] },
        { pid: 'q-px3-1', type: 'quiz', q: 'Your tree has three green shades as concentric rings following its outline, and it looks like a flat badge. What is this problem called and what helps?',
          options: ['Aliasing; add more colours', 'Pillow shading/banding; commit to a light direction and shade by form, not by outline', 'Dithering; remove it', 'Overdraw'], answer: 1, explain: 'Shading must come from a light source. Make one side lit and one shaded, with shapes that describe the form.' },
        { pid: 'q-px3-2', type: 'quiz', q: 'Where is dithering usually a poor idea?',
          options: ['Large static backgrounds', 'Small sprites that move quickly across the screen', 'Skies', 'Textures on walls'], answer: 1, explain: 'Patterns that move across the pixel grid shimmer and add noise that distracts from the sprite\'s shape.' },
        { pid: 'q-px3-3', type: 'quiz', q: 'What does a “selective outline” do?',
          options: ['Outlines only some sprites', 'Varies the outline colour with the nearby fill/light so lit edges are lighter', 'Removes the outline', 'Uses pure black everywhere'], answer: 1, explain: 'It keeps the separation of an outline while letting the lit side feel lit.' },
      ],
    },
    {
      id: 'px-anim', title: 'Animation', minutes: 30,
      summary: 'Frame counts, timing, the animation principles that matter at small sizes, and walk cycles.',
      checks: [
        { q: 'A bouncing ball frame stretches it taller at speed but keeps the same width, so it looks like it gains volume. What is wrong?',
          options: ['The fps is too low', 'Squash and stretch must preserve believable volume: taller means narrower, wider means shorter', 'The canvas is too small', 'It needs dithering'],
          answer: 1, explain: 'Volume preservation is what sells squash and stretch; stretching one way must compress the other.' },
        { q: 'A walk loop looks fine in the editor but the character glides like it is moonwalking in game. What do you check first?',
          options: ['The palette size', 'The outline style', 'The number of idle frames', 'Whether stride length matches movement speed, and adjust one of them'],
          answer: 3, explain: 'Animation and locomotion must agree; test in the engine at the real camera and speed, not just looping in the editor.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Fewer frames, better timing</h3>
<p>Pixel art animation is usually <b>low frame count</b> (often 6 to 12 frames per second of animation, not 60). The skill is choosing which poses to draw and how long to hold each. Holding a pose for two or three ticks gives weight; every frame at the same duration looks robotic. Most tools (and Godot\'s <code>AnimatedSprite2D</code> or <code>AnimationPlayer</code>) let you set per-frame durations, so you do not need extra drawings to slow a part down.</p>
<h3>Principles that pay off at 16×16</h3>
<ul><li><b>Squash and stretch</b>: compress on impact and stretch at speed. Keep the volume believable (wider means shorter). A bouncing ball is the classic exercise (use the simulation).</li><li><b>Anticipation</b>: a small opposite motion before the action (crouch before jump, wind-up before a swing). It tells the player the attack is coming, which is also a gameplay readability tool.</li><li><b>Follow-through and overlap</b>: hair, scarf and tails lag the body and settle after it stops.</li><li><b>Ease in/out (spacing)</b>: put the drawings close together at the start and end of a motion and further apart in the middle.</li><li><b>Arcs</b>: limbs and bodies move along curves, not straight lines.</li><li><b>Key frames first</b>: draw the extreme poses, then the in-betweens.</li></ul>
<h3>Common cycles</h3>
<ul><li><b>Idle</b>: 2 to 4 frames, a slow breathing bob of a pixel or two. Sync with a subtle highlight.</li><li><b>Walk</b>: four key poses (contact, down, passing, up) mirrored for the other leg gives an 8-frame cycle. A 4-frame walk reads fine for small sprites. Bob the body one pixel on the “down” frames.</li><li><b>Run</b>: same with more lean and a longer stride and airborne frames.</li><li><b>Attack</b>: anticipation (long hold), strike (very short, often one frame with a smear), recovery. Hold the contact frame for a tick to sell impact (the hit stop idea from the juice lesson).</li><li><b>Hurt and death</b>: one flash frame (white) plus a knockback pose.</li></ul>
<h3>Practicalities</h3>
<ul><li><b>Consistent canvas and origin</b>: every frame on the same canvas size, with the character\'s feet (the pivot) at the same pixel, or it will jitter in game.</li><li>Use onion skinning (ghost the previous frame) to check spacing.</li><li>Export a <b>sprite sheet</b> (a grid of frames in one PNG) plus frame size and durations. Aseprite can export a sheet and a JSON description.</li><li>Test in the engine with the real camera and speed. An animation that looks good looping in the editor can fight the movement speed (“moonwalking”). Match stride to velocity.</li></ul>` },
        { pid: 'sim-px-anim', type: 'sim', id: 'pxanim', title: 'Bounce: frames, timing and squash',
          intro: '<p>A slime bounces. The sprite sheet below the preview shows the real frames generated for the current settings.</p>',
          try: ['Turn <b>squash &amp; stretch</b> off: the slime moves, but feels like a rigid ball.', 'Turn it on: look at the frame where it lands (widest and shortest) and the frame at the top (stretched thin).', 'Reduce <b>frames</b> to 4: it still reads, just choppier. Raise to 12 at the same fps: slower and floatier.', 'Change <b>fps</b> to 6: deliberate and chunky. To 20: smooth, less “pixel-art” feel.'] },
        { pid: 'q-px4-1', type: 'quiz', q: 'You want an attack to feel more powerful without drawing extra frames. What is the cheapest thing to try?',
          options: ['Redraw the whole sprite larger', 'Hold the contact frame a little longer and give the wind-up a longer, clear anticipation', 'Make the animation faster everywhere', 'Add a second outline'], answer: 1, explain: 'Timing is free: anticipation and a held impact frame communicate force.' },
        { pid: 'q-px4-2', type: 'quiz', q: 'In game the character\'s sprite jitters up and down by a pixel while running even though the animation is smooth in the editor. A likely cause?',
          options: ['The frame rate is too low', 'The pivot/origin differs between frames or the frames have different canvas sizes', 'The palette is too small', 'Dithering'], answer: 1, explain: 'All frames must share a canvas and an anchor (usually the feet) or the drawing shifts when frames change.' },
      ],
    },
    {
      id: 'px-tiles-workflow', title: 'Tilesets, sprite sheets and the art pipeline', minutes: 40,
      summary: 'Tiles that connect, indexed colour and palette swaps, scaling rules, and keeping art in version control.',
      checks: [
        { q: 'A floor tile has one bright pebble and the finished room shows an obvious repeating grid of pebbles. What helps most?',
          options: ['Draw 2 to 4 plain variants and place them randomly so the repetition breaks up', 'Make the tile bigger', 'Turn on texture filtering', 'Add more saturation'],
          answer: 0, explain: 'A distinctive feature betrays the grid; variants plus random placement hide the repeat.' },
        { q: 'You need day, night, and poisoned variants of the same enemy without redrawing it. Which workflow makes that trivial?',
          options: ['Export three PNGs by hand', 'Redraw the silhouette each time', 'Store art as indexed colour against a fixed palette so swapping the palette recolours everything', 'Scale by non-integer factors'],
          answer: 2, explain: 'Indexed pixels are palette references, so one art set yields many recolours from palette swaps.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Tilesets</h3>
<ul><li>Pick a tile size (16×16 or 32×32 are the usual) and a layout grid. All tiles in a game share it.</li><li>Tiles must <b>tile seamlessly</b>: opposite edges match. Preview them in a 3×3 repeat while drawing.</li><li>Avoid a distinctive feature (a bright pebble) that makes repetition obvious. Make 2 to 4 variants of floor tiles and place them randomly.</li><li><b>Autotiling</b>: instead of drawing every combination by hand, a tile is chosen by which of its neighbours are solid. With four neighbours (N, E, S, W) that is a 4-bit number, so 16 tiles. Including diagonals gives the 47-tile “blob” set. Godot 4 does the matching with terrain sets; you draw the tiles. The first drill below computes the bitmask.</li><li>Pad or <b>extrude</b> tiles inside an atlas by 1 pixel if you see seams between tiles when the camera moves (sub-pixel sampling pulls colours from the neighbouring tile).</li></ul>
<h3>Indexed colour and palette swaps</h3>
<p>If the art uses a fixed palette, store it as <b>indexed</b> (each pixel is a palette index). Changing the palette changes all the art: enemy recolours, day and night, accessibility variants. Converting an arbitrary image to a palette is a nearest-colour search, the second drill. For smooth results add dithering; for pixel art you draw by hand you rarely need it.</p>
<h3>Scaling and import</h3>
<ul><li>Render at the base resolution, scale up by an <b>integer</b> (third drill), centre with black bars if the window does not fit.</li><li>Godot: default texture filter <b>Nearest</b>; stretch mode canvas_items with integer scaling; snap 2D transforms to pixel; set import options to no mipmaps for pixel art.</li><li>Keep a single source of truth for sizes: tile size, base resolution and pixel scale in one constants file, not scattered.</li></ul>
<h3>Pipeline and version control</h3>
<ul><li>Keep <b>source files</b> (.aseprite, .pixelorama, or a layered format) in the repo next to the exported PNGs, or you lose layers and palettes forever.</li><li>PNG files are binary, so Git cannot merge them. Treat each sprite as a file with a single editor at a time, and use small, named commits (“slime: add hurt frame”).</li><li>GitHub shows image diffs in pull requests (2-up, swipe, onion skin), so art changes can be reviewed visually. Pair that with a naming convention and the artist can open PRs for art without touching code.</li><li>Automate export: a script that turns source files into the sheets and JSON the game loads, so nobody exports by hand.</li><li>Document the palette and sizes in the repo\'s README so any new artist can match the style.</li></ul>
<div class="callout tip">The last lesson below sketches a reusable pixel editor that lives <i>inside</i> a game repo, finds the sprites, lets you edit them, and (optionally) proposes the change as a pull request.</div>` },
        { pid: 'drill-autotile', type: 'drill', ref: 'autotile' },
        { pid: 'drill-quant', type: 'drill', ref: 'quantize' },
        { pid: 'drill-scale', type: 'drill', ref: 'integer_scale' },
        { pid: 'q-px5-1', type: 'quiz', q: 'Thin lines appear between tiles when the camera scrolls slowly. What do you try first?',
          options: ['Use bigger tiles', 'Add 1-pixel extrusion/padding in the atlas and snap the camera to whole pixels', 'Turn on filtering', 'Reduce the palette'], answer: 1, explain: 'Sub-pixel positions sample the edge of the neighbouring atlas tile. Pad or extrude the tile edges and keep positions on whole pixels.' },
        { pid: 'q-px5-2', type: 'quiz', q: 'Why keep the .aseprite (source) files in the repository and not just the exported PNGs?',
          options: ['They load faster', 'The source keeps layers, palettes and animation data, so art can be edited later and exports regenerated', 'PNG cannot store pixels', 'GitHub requires it'], answer: 1, explain: 'A flattened PNG has lost the information you need to change it safely.' },
        { pid: 'q-px5-3', type: 'quiz', q: 'You have 4-bit autotile masks (N=1, E=2, S=4, W=8). What mask does a horizontal corridor piece (solid on W and E only) have?',
          options: ['3', '10', '5', '12'], answer: 1, explain: 'E (2) + W (8) = 10. A vertical corridor (N and S) is 1 + 4 = 5.' },
      ],
    },
    {
      id: 'px-practice', title: 'A practice routine and a reusable editor', minutes: 20,
      summary: 'Daily drills that build skill quickly, and the design of a pixel editor you can drop into any game project.',
      checks: [
        { q: 'You want to learn how a favourite game places its pixels. Which practice does the lesson recommend?',
          options: ['Trace it with a large brush', 'Copy a sprite pixel by pixel, then close it and redraw from memory', 'Upscale it with smoothing', 'Recolour it randomly'],
          answer: 1, explain: 'Copying teaches placement, and redrawing from memory reveals what you actually retained.' },
        { q: 'An artist with no git setup must fix one sprite in a game repo and get it reviewed. What is the lightest path with spritewright?',
          options: ['Open the hosted editor in a browser, pick the GitHub repo, edit, and Propose PR, which forks first if needed', 'Email a screenshot of the fix', 'Rewrite the game in a new engine', 'Edit the exported PNG bytes by hand'],
          answer: 0, explain: 'The standalone browser flow lists repo sprites and opens a pull request through the API with nothing to install.' },
      ],
      sections: [
        { type: 'text', html: `
<h3>Twenty minutes a day beats a weekend a month</h3>
<ol>
<li><b>Icon of the day</b> (8×8 or 16×16, one palette of 4 to 8 colours): sword, potion, key, mushroom, heart. Timebox it to 15 minutes. Do not undo more than you must.</li>
<li><b>Copy a sprite pixel by pixel</b> from a game you love, then close it and redraw from memory. You learn how others place pixels, then what you retained.</li>
<li><b>Ramp study</b>: draw the same sphere three times in three palettes (warm light, cool light, night). Compare with the ramp simulation.</li>
<li><b>Silhouette thumbnails</b>: draw 10 different monsters as 16×16 black shapes. Keep the three most distinct, give them colour.</li>
<li><b>Animate a bounce, then a blink, then a walk.</b> Always the same order: bounce first.</li>
<li><b>Tile a floor</b> with 16 tiles that connect, then build a room from them in the engine.</li>
<li>Once a week, make a <b>small scene</b> (64×64 to 128×128) with background, midground and a character, and post it for feedback.</li>
</ol>
<h3>Learning resources (free)</h3>
<p>See the Links page in this section for tutorials and palette libraries. The habit that matters is <b>looking at lots of good work and asking where each pixel is a decision</b>.</p>
<h3>A reusable editor: spritewright</h3>
<p>The editor in the first lesson is a teaching toy. The real tool lives in its own project, <b>spritewright</b>: a dependency-free pixel editor you can use <b>by itself</b> or <b>drop into a game repository</b>.</p>
<ul><li><b>By itself, in a browser.</b> Open the hosted page (<a href="https://snowu.github.io/spritewright/" target="_blank" rel="noopener">snowu.github.io/spritewright</a>): upload a PNG, edit and download it, or pick a project: a <b>GitHub repository</b> (it lists the PNG sprites, you edit, and <b>Propose PR</b> opens a pull request through the GitHub API, forking first if you have no write access) or a <b>folder on your computer</b> (Chromium browsers; <b>Save</b> writes back in place). Nothing to install, nothing added to the game repo.</li><li><b>As a dependency of a game repository.</b> From a clone of the game, <code>npx --allow-git=root github:snowu/spritewright --open</code> runs it with nothing installed (npm 12 refuses GitHub packages unless you opt in). To pin it: add <code>allow-git=root</code> to <code>.npmrc</code>, <code>npm i -D github:snowu/spritewright</code>, then <code>npx spritewright init</code> writes a config (it picks the art folders and skips docs and screenshots) and <code>npx spritewright --open</code> serves the editor with save-to-disk. Add <code>"art": "spritewright --open"</code> to <code>package.json</code> so an artist just runs <code>npm run art</code>. It is one file plus a tiny Node server, no build step.</li><li><b>As a library.</b> <code>PixelForge.mount(element, options)</code> embeds the editor in your own tool or page, with TypeScript types.</li></ul>
<p>What it does: pencil, eraser, fill, line, rectangles, mirror drawing, "clean lines" mode, a palette panel (recolour a colour everywhere, load a Lospec <code>.hex</code> palette, snap an image to it), flip/rotate/shift/resize, a sprite-sheet animation preview, PNG import and export. Saves are <b>lossless</b>: it reads and writes PNG bytes itself, so even semi-transparent pixels (an alpha value used as a marker) come back unchanged. Its README lists the limits honestly, including that the pull request flow is tested against a mocked GitHub API.</p>` },
        { type: 'reveal', title: 'Exercise: spec the PR flow', html: `<p>Before reading the code of the editor, write down in five bullets what should happen when an artist presses “Propose change”: which API calls, in which order (read the base branch ref, create blobs, create a tree, create a commit, create or update a branch ref, open the pull request), what the branch is called, what the PR body contains (before/after images), and what happens on a conflict. Then compare with the editor\'s implementation.</p>` },
      ],
    },
  ],
});
window.resolveDrills && window.resolveDrills();
