/* Native terminal games: learner callbacks drive gameplay and replay export. */
window.NATIVE_PROJECTS = {
  "version": 1,
  "items": [
    {
      "id": "tile-runner",
      "title": "Tile Runner: movement, collision and pickups",
      "blurb": "Implement the movement callback, collect both coins and reach the exit in a native terminal game.",
      "difficulty": "starter",
      "minutes": 35,
      "lesson": "gd-collision",
      "kind": "runner",
      "grid": [
        "#########",
        "#P..#..G#",
        "#.#.#...#",
        "#.#...#.#",
        "#..C.C..#",
        "#########"
      ],
      "winningReplay": "sssddddddwww",
      "prompt": "Implement can_enter and runner_step. w/a/s/d move one cell; walls and out-of-bounds destinations block movement. Collect each C only once (coins is a two-bit mask: (3,4)=bit 0, (5,4)=bit 1). Reaching G at (7,1) wins only after both pickups. Each input increments ticks and records whether movement succeeded; an already-won game remains unchanged. The terminal executable calls your functions for every action. First make the collision test fail visibly, then repair the mechanics, play a winning route and export its native frames.",
      "version": 1,
      "languages": [
        "c",
        "zig",
        "cpp"
      ]
    },
    {
      "id": "wave-arena",
      "title": "Wave Arena: firing cooldowns and scheduled enemies",
      "blurb": "Build a native turn-based survival game: enforce fire timing, spawn waves and advance enemies.",
      "difficulty": "intermediate",
      "minutes": 50,
      "lesson": "gd-loop",
      "kind": "arena",
      "width": 9,
      "height": 5,
      "winningReplay": "....faa.fddddf",
      "prompt": "Implement arena_step: a/d move horizontally (clamped to columns 0..8), f fires, and . waits. Every action is one fixed simulation tick (250 ms). First reduce a positive cooldown by one; fire only when it is zero, then set it to 3. A shot removes the nearest enemy in the player column and awards one point. Next move surviving enemies down one row; reaching row 4 costs one health and removes the enemy. Increment tick, then spawn at ticks 4,8,12,... in columns 4,2,6 repeating, at row 0. Win at three points while alive; zero health loses. Finished state stays unchanged. The terminal game and replay producer both call your callback.",
      "version": 1,
      "languages": [
        "c",
        "zig",
        "cpp"
      ]
    }
  ]
};
