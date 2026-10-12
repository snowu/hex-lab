/* Curated curriculum and teaching notes; native source bundles remain independent. */
window.GAME_LEARNING = {
  "version": 1,
  "topics": {
    "basics": "Native basics",
    "strings": "Strings and text",
    "arrays": "Arrays and slices",
    "collections": "Collections",
    "math": "Math and units",
    "bitwise": "Bits and encodings",
    "time": "Time and calendars",
    "state": "State and lifecycle",
    "grids": "Grids and geometry",
    "graphs": "Graphs and trees",
    "memory": "Memory and ownership",
    "parsing": "Parsing and validation",
    "search": "Search and traversal",
    "sorting": "Ordering and sorting",
    "simulation": "Simulation",
    "optimization": "Optimization",
    "security": "Cipher arithmetic",
    "recursion": "Recursion"
  },
  "paths": [
    {
      "id": "native-basics",
      "title": "Native basics",
      "description": "Get a working compiler, learn values and iteration, then use a caller-owned inventory.",
      "steps": [
        "exercism-hello-world",
        "exercism-two-fer",
        "cooldown",
        "exercism-reverse-string",
        "exercism-accumulate",
        "exercism-list-ops",
        "inventory"
      ],
      "outcome": "Read a typed API, preserve input data and explain where output storage belongs."
    },
    {
      "id": "movement-pong",
      "title": "Movement → collision → Pong",
      "description": "Build frame-independent motion and exact overlap queries before combining them in a running game.",
      "steps": [
        "cooldown",
        "movement",
        "jump-buffer",
        "tile-collision",
        "camera",
        "animation",
        "debug-damage",
        "exercism-robot-simulator"
      ],
      "outcome": "Predict velocity, collision and camera behavior across different update durations.",
      "projects": [
        {
          "id": "tile-runner",
          "title": "Put it together: Tile runner",
          "href": "#/native-project/tile-runner"
        },
        {
          "id": "wave-arena",
          "title": "Apply the loop: Wave arena",
          "href": "#/native-project/wave-arena"
        }
      ],
      "practice": {
        "href": "#/project/pong",
        "title": "Pong build-along"
      }
    },
    {
      "id": "collections-memory",
      "title": "Collections and memory",
      "description": "Move from array transforms to bounded buffers, linked structures and scene-tree editing.",
      "steps": [
        "exercism-accumulate",
        "exercism-list-ops",
        "exercism-high-scores",
        "inventory",
        "exercism-custom-set",
        "exercism-circular-buffer",
        "exercism-simple-linked-list",
        "exercism-linked-list",
        "exercism-tree-building",
        "exercism-binary-search-tree",
        "exercism-zipper"
      ],
      "outcome": "Compare allocation, ownership, traversal cost and cache locality for game data structures."
    },
    {
      "id": "grid-ai",
      "title": "Grid simulation and AI",
      "description": "Practice neighborhood rules, region fills and shortest-state searches on small deterministic worlds.",
      "steps": [
        "tile-collision",
        "exercism-matrix",
        "exercism-transpose",
        "exercism-minesweeper",
        "exercism-game-of-life",
        "exercism-go-counting",
        "exercism-word-search",
        "exercism-connect",
        "exercism-relative-distance",
        "debug-stuck",
        "exercism-two-bucket",
        "exercism-pov"
      ],
      "outcome": "Choose adjacency, visited-state tracking and a frontier appropriate to the cost model."
    },
    {
      "id": "scripting",
      "title": "Parsers and gameplay scripting",
      "description": "Build up from delimiters and tokens to structured documents and a small stack interpreter.",
      "steps": [
        "exercism-matching-brackets",
        "exercism-word-count",
        "exercism-run-length-encoding",
        "exercism-markdown",
        "exercism-wordy",
        "exercism-dot-dsl",
        "exercism-forth",
        "exercism-sgf-parsing",
        "debug-saves",
        "exercism-rest-api"
      ],
      "outcome": "Validate input before state mutation and separate grammar, evaluation and output formatting."
    },
    {
      "id": "state-systems",
      "title": "State, timing and reactive systems",
      "description": "Make transitions explicit, keep future-dependent scoring correct and propagate final state changes.",
      "steps": [
        "cooldown",
        "waves",
        "animation",
        "exercism-clock",
        "exercism-hangman",
        "exercism-bowling",
        "exercism-camicia",
        "exercism-bank-account",
        "exercism-react"
      ],
      "outcome": "Identify lifecycle boundaries and prevent duplicate updates or intermediate-state callbacks.",
      "projects": [
        {
          "id": "wave-arena",
          "title": "Integrate scheduled waves",
          "href": "#/native-project/wave-arena"
        }
      ]
    },
    {
      "id": "optimization",
      "title": "Search and economy optimization",
      "description": "Learn when greedy decisions fail and how constraints or repeated subproblems reduce search.",
      "steps": [
        "exercism-sum-of-multiples",
        "exercism-sieve",
        "exercism-change",
        "exercism-knapsack",
        "exercism-book-store",
        "exercism-killer-sudoku-helper",
        "exercism-alphametics",
        "exercism-zebra-puzzle"
      ],
      "outcome": "Explain the search state, pruning invariant and time/memory tradeoff before optimizing."
    }
  ],
  "exercises": {
    "hello-world": {
      "topics": [
        "basics"
      ],
      "concept": "A function can produce a fixed result before it needs input.",
      "strategy": "Return exactly the greeting required by the tests.",
      "edges": "Capitalization, spaces and punctuation belong to the output contract.",
      "complexity": "O(1) time and space.",
      "gameContext": "Use a tiny smoke test to confirm your game toolchain works.",
      "tradeoffs": "Keep setup separate from game logic so failures are easy to locate.",
      "difficulty": 1,
      "prereqs": [],
      "hints": [
        "A function can produce a fixed result before it needs input.",
        "Return exactly the greeting required by the tests.",
        "Capitalization, spaces and punctuation belong to the output contract."
      ],
      "explanation": "A function can produce a fixed result before it needs input. The reference follows this strategy: Return exactly the greeting required by the tests. Keep setup separate from game logic so failures are easy to locate.",
      "examples": [
        {
          "input": "no input",
          "output": "Hello, World!"
        }
      ]
    },
    "two-fer": {
      "topics": [
        "basics",
        "strings"
      ],
      "concept": "One missing input selects a default phrase.",
      "strategy": "Choose the supplied name or the default, then format the sentence.",
      "edges": "An absent name and an empty name may have different native APIs.",
      "complexity": "O(n) output construction.",
      "gameContext": "Format a dialogue line with a fallback character name.",
      "tradeoffs": "A shared formatter prevents slightly different text across UI screens.",
      "difficulty": 1,
      "prereqs": [
        "exercism-hello-world"
      ],
      "hints": [
        "One missing input selects a default phrase.",
        "Choose the supplied name or the default, then format the sentence.",
        "An absent name and an empty name may have different native APIs."
      ],
      "explanation": "One missing input selects a default phrase. The reference follows this strategy: Choose the supplied name or the default, then format the sentence. A shared formatter prevents slightly different text across UI screens.",
      "examples": [
        {
          "input": "two_fer()",
          "output": "'One for you, one for me.'"
        }
      ]
    },
    "reverse-string": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Reversal changes order while preserving the elements.",
      "strategy": "Walk from the last element to the first or swap symmetric positions.",
      "edges": "Check empty strings and the native bundle's character representation.",
      "complexity": "O(n) time; output storage depends on the API.",
      "gameContext": "Reverse an input sequence when previewing a replay backwards.",
      "tradeoffs": "Byte reversal is simpler than Unicode grapheme reversal; follow the tested contract.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Reversal changes order while preserving the elements.",
        "Walk from the last element to the first or swap symmetric positions.",
        "Check empty strings and the native bundle's character representation."
      ],
      "explanation": "Reversal changes order while preserving the elements. The reference follows this strategy: Walk from the last element to the first or swap symmetric positions. Byte reversal is simpler than Unicode grapheme reversal; follow the tested contract.",
      "examples": [
        {
          "input": "'robot'",
          "output": "'tobor'"
        }
      ]
    },
    "anagram": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "Matching words have the same letter multiplicities.",
      "strategy": "Normalize case and compare letter counts, excluding the original word.",
      "edges": "Repeated letters matter; identical words are not anagrams.",
      "complexity": "O(n + total candidate length) with fixed alphabet counts.",
      "gameContext": "Match rearranged spell names while retaining duplicate runes.",
      "tradeoffs": "Count tables avoid sorting every candidate but depend on the accepted alphabet.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Matching words have the same letter multiplicities.",
        "Normalize case and compare letter counts, excluding the original word.",
        "Repeated letters matter; identical words are not anagrams."
      ],
      "explanation": "Matching words have the same letter multiplicities. The reference follows this strategy: Normalize case and compare letter counts, excluding the original word. Count tables avoid sorting every candidate but depend on the accepted alphabet.",
      "examples": [
        {
          "input": "word=\"listen\", candidates=[\"enlists\",\"inlets\",\"silent\"]",
          "output": "[\"inlets\",\"silent\"]"
        }
      ]
    },
    "armstrong-numbers": {
      "topics": [
        "math"
      ],
      "concept": "Each digit contributes its digit-count power.",
      "strategy": "Count digits, then sum the corresponding powers without changing the original number.",
      "edges": "Zero, one-digit numbers and overflowing intermediate powers need attention.",
      "complexity": "O(d) digit processing.",
      "gameContext": "Validate a numeric puzzle gate in a dungeon.",
      "tradeoffs": "Integer powers avoid floating rounding in an exact equality test.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Each digit contributes its digit-count power.",
        "Count digits, then sum the corresponding powers without changing the original number.",
        "Zero, one-digit numbers and overflowing intermediate powers need attention."
      ],
      "explanation": "Each digit contributes its digit-count power. The reference follows this strategy: Count digits, then sum the corresponding powers without changing the original number. Integer powers avoid floating rounding in an exact equality test.",
      "examples": [
        {
          "input": "153",
          "output": "true: 1³+5³+3³=153"
        }
      ]
    },
    "binary-search": {
      "topics": [
        "search",
        "arrays"
      ],
      "concept": "A sorted range allows half the candidates to be discarded.",
      "strategy": "Maintain a half-open search interval and move one boundary around the midpoint.",
      "edges": "Empty input, missing values and searches at both ends expose off-by-one errors.",
      "complexity": "O(log n) time, O(1) auxiliary space.",
      "gameContext": "Find a timestamp in a sorted replay keyframe index.",
      "tradeoffs": "Sorting is a prerequisite; an unsorted inventory needs another search method.",
      "difficulty": 1,
      "prereqs": [
        "exercism-high-scores"
      ],
      "hints": [
        "A sorted range allows half the candidates to be discarded.",
        "Maintain a half-open search interval and move one boundary around the midpoint.",
        "Empty input, missing values and searches at both ends expose off-by-one errors."
      ],
      "explanation": "A sorted range allows half the candidates to be discarded. The reference follows this strategy: Maintain a half-open search interval and move one boundary around the midpoint. Sorting is a prerequisite; an unsorted inventory needs another search method.",
      "examples": [
        {
          "input": "[1, 3, 4, 6, 8, 9, 11], 6",
          "output": "3"
        }
      ]
    },
    "bob": {
      "topics": [
        "strings",
        "state"
      ],
      "concept": "Reply selection is a priority decision over properties of the input.",
      "strategy": "Trim whitespace, then classify silence, shouting and questions before choosing a reply.",
      "edges": "Shouting requires a letter; a shouted question has its own response.",
      "complexity": "O(n) character classification.",
      "gameContext": "Implement a dialogue NPC whose reactions have explicit priorities.",
      "tradeoffs": "Separate classification from response selection so overlapping conditions stay visible.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Reply selection is a priority decision over properties of the input.",
        "Trim whitespace, then classify silence, shouting and questions before choosing a reply.",
        "Shouting requires a letter; a shouted question has its own response."
      ],
      "explanation": "Reply selection is a priority decision over properties of the input. The reference follows this strategy: Trim whitespace, then classify silence, shouting and questions before choosing a reply. Separate classification from response selection so overlapping conditions stay visible.",
      "examples": [
        {
          "input": "'Does this cryogenic chamber make me look fat?'",
          "output": "'Sure.'"
        }
      ]
    },
    "collatz-conjecture": {
      "topics": [
        "math",
        "simulation"
      ],
      "concept": "Each transition chooses one rule based on parity.",
      "strategy": "Count steps until one, rejecting nonpositive inputs before the loop.",
      "edges": "One takes zero steps; intermediate multiplication can overflow fixed integers.",
      "complexity": "O(number of transitions) time.",
      "gameContext": "Model a deterministic turn-by-turn puzzle sequence.",
      "tradeoffs": "A mathematically simple rule can still need runtime limits or overflow handling.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Each transition chooses one rule based on parity.",
        "Count steps until one, rejecting nonpositive inputs before the loop.",
        "One takes zero steps; intermediate multiplication can overflow fixed integers."
      ],
      "explanation": "Each transition chooses one rule based on parity. The reference follows this strategy: Count steps until one, rejecting nonpositive inputs before the loop. A mathematically simple rule can still need runtime limits or overflow handling.",
      "examples": [
        {
          "input": "16",
          "output": "4"
        }
      ]
    },
    "darts": {
      "topics": [
        "math",
        "grids"
      ],
      "concept": "Squared distance determines which concentric scoring region contains a point.",
      "strategy": "Compare x*x+y*y with squared radii, starting with the innermost circle.",
      "edges": "Points on boundaries score inside; negative coordinates are valid.",
      "complexity": "O(1) time and space.",
      "gameContext": "Score hits against a circular target without taking a square root.",
      "tradeoffs": "Squared comparisons are cheaper and preserve the stated boundary rules.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Squared distance determines which concentric scoring region contains a point.",
        "Compare x*x+y*y with squared radii, starting with the innermost circle.",
        "Points on boundaries score inside; negative coordinates are valid."
      ],
      "explanation": "Squared distance determines which concentric scoring region contains a point. The reference follows this strategy: Compare x*x+y*y with squared radii, starting with the innermost circle. Squared comparisons are cheaper and preserve the stated boundary rules.",
      "examples": [
        {
          "input": "0, 10",
          "output": "1"
        }
      ]
    },
    "difference-of-squares": {
      "topics": [
        "math"
      ],
      "concept": "The square of a sum differs from a sum of squares.",
      "strategy": "Compute both quantities independently and subtract.",
      "edges": "Zero terms and larger inputs help reveal accumulator overflow.",
      "complexity": "O(n) with accumulation or O(1) with formulas.",
      "gameContext": "Compare aggregate scoring formulas for a combat system.",
      "tradeoffs": "Closed forms are fast, while loops make the arithmetic easier to inspect.",
      "difficulty": 1,
      "prereqs": [
        "exercism-hello-world"
      ],
      "hints": [
        "The square of a sum differs from a sum of squares.",
        "Compute both quantities independently and subtract.",
        "Zero terms and larger inputs help reveal accumulator overflow."
      ],
      "explanation": "The square of a sum differs from a sum of squares. The reference follows this strategy: Compute both quantities independently and subtract. Closed forms are fast, while loops make the arithmetic easier to inspect.",
      "examples": [
        {
          "input": "numbers 1 through 10",
          "output": "square of sum=3025; sum of squares=385; difference=2640"
        }
      ]
    },
    "etl": {
      "topics": [
        "collections",
        "strings"
      ],
      "concept": "An old score-to-letters mapping can be inverted.",
      "strategy": "Visit each group and emit lowercase letter-to-score entries.",
      "edges": "Every letter must keep its score, with case normalized consistently.",
      "complexity": "O(total letters) time.",
      "gameContext": "Migrate a legacy item-category table into direct lookup data.",
      "tradeoffs": "Normalize at import time so runtime queries stay simple.",
      "difficulty": 1,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "An old score-to-letters mapping can be inverted.",
        "Visit each group and emit lowercase letter-to-score entries.",
        "Every letter must keep its score, with case normalized consistently."
      ],
      "explanation": "An old score-to-letters mapping can be inverted. The reference follows this strategy: Visit each group and emit lowercase letter-to-score entries. Normalize at import time so runtime queries stay simple.",
      "examples": [
        {
          "input": "{1: ['A']}",
          "output": "{'a': 1}"
        }
      ]
    },
    "flatten-array": {
      "topics": [
        "arrays",
        "recursion"
      ],
      "concept": "Nested arrays form a tree whose leaves can be collected in order.",
      "strategy": "Recurse into array values, append integer leaves and skip nulls.",
      "edges": "Nested empties, nulls and mixed depths must preserve left-to-right ordering.",
      "complexity": "O(nodes) time, O(depth) traversal stack plus output.",
      "gameContext": "Flatten nested scene command batches for a replay stream.",
      "tradeoffs": "Recursion is concise; an explicit stack can protect against untrusted nesting depth.",
      "difficulty": 1,
      "prereqs": [
        "exercism-list-ops"
      ],
      "hints": [
        "Nested arrays form a tree whose leaves can be collected in order.",
        "Recurse into array values, append integer leaves and skip nulls.",
        "Nested empties, nulls and mixed depths must preserve left-to-right ordering."
      ],
      "explanation": "Nested arrays form a tree whose leaves can be collected in order. The reference follows this strategy: Recurse into array values, append integer leaves and skip nulls. Recursion is concise; an explicit stack can protect against untrusted nesting depth.",
      "examples": [
        {
          "input": "[1,[2,null,[3]],null]",
          "output": "[1,2,3]"
        }
      ]
    },
    "gigasecond": {
      "topics": [
        "time",
        "math"
      ],
      "concept": "A duration is added to an instant, not to individual calendar fields.",
      "strategy": "Represent the moment on a timeline and add one billion seconds.",
      "edges": "Preserve the time of day and handle day, month and leap-year rollovers.",
      "complexity": "O(1) for a timeline representation.",
      "gameContext": "Calculate a long-lived save milestone timestamp.",
      "tradeoffs": "Civil dates need calendar conversion; elapsed durations do not use frame counts.",
      "difficulty": 1,
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "A duration is added to an instant, not to individual calendar fields.",
        "Represent the moment on a timeline and add one billion seconds.",
        "Preserve the time of day and handle day, month and leap-year rollovers."
      ],
      "explanation": "A duration is added to an instant, not to individual calendar fields. The reference follows this strategy: Represent the moment on a timeline and add one billion seconds. Civil dates need calendar conversion; elapsed durations do not use frame counts.",
      "examples": [
        {
          "input": "datetime(2011, 4, 25, 0, 0)",
          "output": "'2043-01-01 01:46:40'"
        }
      ]
    },
    "grains": {
      "topics": [
        "math",
        "bitwise"
      ],
      "concept": "Each square doubles the preceding square's grain count.",
      "strategy": "Use powers of two for a square and a geometric sum for the board.",
      "edges": "The first and last squares, invalid square numbers and integer width matter.",
      "complexity": "O(1) time.",
      "gameContext": "Inspect exponential reward growth before it overflows an economy counter.",
      "tradeoffs": "Shifts are exact only when the shift amount and integer width are valid.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Each square doubles the preceding square's grain count.",
        "Use powers of two for a square and a geometric sum for the board.",
        "The first and last squares, invalid square numbers and integer width matter."
      ],
      "explanation": "Each square doubles the preceding square's grain count. The reference follows this strategy: Use powers of two for a square and a geometric sum for the board. Shifts are exact only when the shift amount and integer width are valid.",
      "examples": [
        {
          "input": "square=4",
          "output": "8 grains"
        }
      ]
    },
    "hamming": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Distance counts mismatches at corresponding positions.",
      "strategy": "Require equal lengths, then compare each pair once.",
      "edges": "Empty equal strings are valid; different lengths are an error.",
      "complexity": "O(n) time, O(1) extra space.",
      "gameContext": "Measure changed bytes between equal-size state snapshots.",
      "tradeoffs": "This metric ignores insertions and deletions; it is not edit distance.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Distance counts mismatches at corresponding positions.",
        "Require equal lengths, then compare each pair once.",
        "Empty equal strings are valid; different lengths are an error."
      ],
      "explanation": "Distance counts mismatches at corresponding positions. The reference follows this strategy: Require equal lengths, then compare each pair once. This metric ignores insertions and deletions; it is not edit distance.",
      "examples": [
        {
          "input": "'G', 'T'",
          "output": "1"
        }
      ]
    },
    "house": {
      "topics": [
        "strings",
        "recursion"
      ],
      "concept": "Each verse adds a new layer to the same ordered phrase chain.",
      "strategy": "Store reusable phrase fragments and compose the requested verses.",
      "edges": "Keep punctuation, line order and verse separators exact.",
      "complexity": "O(output length) time.",
      "gameContext": "Generate cumulative quest recap text from a sequence of events.",
      "tradeoffs": "Data-driven fragments are easier to maintain than a separate hardcoded verse function.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Each verse adds a new layer to the same ordered phrase chain.",
        "Store reusable phrase fragments and compose the requested verses.",
        "Keep punctuation, line order and verse separators exact."
      ],
      "explanation": "Each verse adds a new layer to the same ordered phrase chain. The reference follows this strategy: Store reusable phrase fragments and compose the requested verses. Data-driven fragments are easier to maintain than a separate hardcoded verse function.",
      "examples": [
        {
          "input": "1, 1",
          "output": "['This is the house that Jack built.']"
        }
      ]
    },
    "isbn-verifier": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "A weighted digit checksum validates the whole identifier.",
      "strategy": "Ignore allowed separators, apply position weights and test the modulus.",
      "edges": "X is valid only as the last check digit; malformed lengths must fail.",
      "complexity": "O(n) time.",
      "gameContext": "Validate imported asset-pack identifiers before loading them.",
      "tradeoffs": "Validation should reject malformed input instead of silently dropping arbitrary characters.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "A weighted digit checksum validates the whole identifier.",
        "Ignore allowed separators, apply position weights and test the modulus.",
        "X is valid only as the last check digit; malformed lengths must fail."
      ],
      "explanation": "A weighted digit checksum validates the whole identifier. The reference follows this strategy: Ignore allowed separators, apply position weights and test the modulus. Validation should reject malformed input instead of silently dropping arbitrary characters.",
      "examples": [
        {
          "input": "\"3-598-21508-8\"",
          "output": "valid ISBN-10"
        }
      ]
    },
    "isogram": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "A word is valid when no letter repeats after case normalization.",
      "strategy": "Track seen letters while ignoring the allowed punctuation.",
      "edges": "Spaces and hyphens are not repeated letters; case variants are.",
      "complexity": "O(n) time.",
      "gameContext": "Check a rune puzzle in which each symbol may be used once.",
      "tradeoffs": "A fixed bitset is compact when the input alphabet is fixed.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "A word is valid when no letter repeats after case normalization.",
        "Track seen letters while ignoring the allowed punctuation.",
        "Spaces and hyphens are not repeated letters; case variants are."
      ],
      "explanation": "A word is valid when no letter repeats after case normalization. The reference follows this strategy: Track seen letters while ignoring the allowed punctuation. A fixed bitset is compact when the input alphabet is fixed.",
      "examples": [
        {
          "input": "\"lumberjacks\"",
          "output": "true; each letter occurs once"
        }
      ]
    },
    "leap": {
      "topics": [
        "time",
        "math"
      ],
      "concept": "Gregorian leap years have a century exception and a 400-year exception.",
      "strategy": "Apply the divisibility rules in a clear order.",
      "edges": "Years divisible by 100 and 400 distinguish the exceptions.",
      "complexity": "O(1) time and space.",
      "gameContext": "Keep a game calendar's annual events on the right dates.",
      "tradeoffs": "Encoding the complete rule is safer than a four-year approximation.",
      "difficulty": 1,
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "Gregorian leap years have a century exception and a 400-year exception.",
        "Apply the divisibility rules in a clear order.",
        "Years divisible by 100 and 400 distinguish the exceptions."
      ],
      "explanation": "Gregorian leap years have a century exception and a 400-year exception. The reference follows this strategy: Apply the divisibility rules in a clear order. Encoding the complete rule is safer than a four-year approximation.",
      "examples": [
        {
          "input": "years 2000 and 1900",
          "output": "2000=true; 1900=false"
        }
      ]
    },
    "line-up": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "Ordinal suffixes depend on both the last digit and the last two digits.",
      "strategy": "Special-case 11,12,13 before selecting the final-digit suffix.",
      "edges": "Large ranks ending in the teen exceptions need the same handling.",
      "complexity": "O(output length) time.",
      "gameContext": "Render a player's place in a leaderboard.",
      "tradeoffs": "Formatting rules belong in a helper rather than scattered UI branches.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Ordinal suffixes depend on both the last digit and the last two digits.",
        "Special-case 11,12,13 before selecting the final-digit suffix.",
        "Large ranks ending in the teen exceptions need the same handling."
      ],
      "explanation": "Ordinal suffixes depend on both the last digit and the last two digits. The reference follows this strategy: Special-case 11,12,13 before selecting the final-digit suffix. Formatting rules belong in a helper rather than scattered UI branches.",
      "examples": [
        {
          "input": "'Gianna', 4",
          "output": "'Gianna, you are the 4th customer we serve today. Thank you!'"
        }
      ]
    },
    "list-ops": {
      "topics": [
        "arrays",
        "collections"
      ],
      "concept": "List operations can be built from iteration and accumulation.",
      "strategy": "Implement append, concat, filter, map and left/right folds with their own loops.",
      "edges": "Empty input and noncommutative folds reveal direction and identity mistakes.",
      "complexity": "O(n) for each traversal; concatenation scales with all elements.",
      "gameContext": "Build predictable transforms over game entities and event lists.",
      "tradeoffs": "Manual loops expose allocation and traversal costs hidden by convenience functions.",
      "difficulty": 1,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "List operations can be built from iteration and accumulation.",
        "Implement append, concat, filter, map and left/right folds with their own loops.",
        "Empty input and noncommutative folds reveal direction and identity mistakes."
      ],
      "explanation": "List operations can be built from iteration and accumulation. The reference follows this strategy: Implement append, concat, filter, map and left/right folds with their own loops. Manual loops expose allocation and traversal costs hidden by convenience functions.",
      "examples": [
        {
          "input": "[1,2,3], fold-left subtract from 0",
          "output": "-6"
        }
      ]
    },
    "pangram": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "Presence matters, rather than how many times each letter appears.",
      "strategy": "Normalize letters and mark the alphabet positions seen.",
      "edges": "Ignore punctuation and repeated characters; require all letters.",
      "complexity": "O(n) time, fixed alphabet storage.",
      "gameContext": "Validate a text fixture that exercises every glyph in a font atlas.",
      "tradeoffs": "A bitset suits a known alphabet, while broader scripts need a larger representation.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Presence matters, rather than how many times each letter appears.",
        "Normalize letters and mark the alphabet positions seen.",
        "Ignore punctuation and repeated characters; require all letters."
      ],
      "explanation": "Presence matters, rather than how many times each letter appears. The reference follows this strategy: Normalize letters and mark the alphabet positions seen. A bitset suits a known alphabet, while broader scripts need a larger representation.",
      "examples": [
        {
          "input": "\"The quick brown fox jumps over the lazy dog.\"",
          "output": "true; every English letter appears"
        }
      ]
    },
    "perfect-numbers": {
      "topics": [
        "math",
        "search"
      ],
      "concept": "Classification compares a number with the sum of its proper divisors.",
      "strategy": "Collect divisors without including the number itself, then compare the sum.",
      "edges": "Reject nonpositive inputs and avoid double-counting square-root divisor pairs.",
      "complexity": "O(sqrt n) with paired divisors.",
      "gameContext": "Tune a numerical puzzle around divisor-based categories.",
      "tradeoffs": "The simple full scan is easier, but paired divisors reduce work for larger values.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Classification compares a number with the sum of its proper divisors.",
        "Collect divisors without including the number itself, then compare the sum.",
        "Reject nonpositive inputs and avoid double-counting square-root divisor pairs."
      ],
      "explanation": "Classification compares a number with the sum of its proper divisors. The reference follows this strategy: Collect divisors without including the number itself, then compare the sum. The simple full scan is easier, but paired divisors reduce work for larger values.",
      "examples": [
        {
          "input": "6",
          "output": "'perfect'"
        }
      ]
    },
    "raindrops": {
      "topics": [
        "math",
        "strings"
      ],
      "concept": "Divisibility selects independent sound fragments.",
      "strategy": "Append every applicable factor's sound in the required order.",
      "edges": "Multiple factors produce combined sounds; no factors fall back to the number.",
      "complexity": "O(output length) time.",
      "gameContext": "Compose an audio cue label from several active gameplay conditions.",
      "tradeoffs": "Independent conditions differ from a mutually exclusive if/else chain.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Divisibility selects independent sound fragments.",
        "Append every applicable factor's sound in the required order.",
        "Multiple factors produce combined sounds; no factors fall back to the number."
      ],
      "explanation": "Divisibility selects independent sound fragments. The reference follows this strategy: Append every applicable factor's sound in the required order. Independent conditions differ from a mutually exclusive if/else chain.",
      "examples": [
        {
          "input": "105",
          "output": "PlingPlangPlong"
        }
      ]
    },
    "resistor-color": {
      "topics": [
        "collections",
        "basics"
      ],
      "concept": "Color names are positions in a fixed ordered table.",
      "strategy": "Use one authoritative color sequence for lookup and listing.",
      "edges": "The first and last colors expose table ordering mistakes.",
      "complexity": "O(number of colors) lookup.",
      "gameContext": "Map named rarity colors to stable numeric codes.",
      "tradeoffs": "An enum/table pair should share one ordering to prevent drift.",
      "difficulty": 1,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Color names are positions in a fixed ordered table.",
        "Use one authoritative color sequence for lookup and listing.",
        "The first and last colors expose table ordering mistakes."
      ],
      "explanation": "Color names are positions in a fixed ordered table. The reference follows this strategy: Use one authoritative color sequence for lookup and listing. An enum/table pair should share one ordering to prevent drift.",
      "examples": [
        {
          "input": "'white'",
          "output": "9"
        }
      ]
    },
    "resistor-color-duo": {
      "topics": [
        "math",
        "collections"
      ],
      "concept": "Two color digits form a two-digit decimal value.",
      "strategy": "Look up the first two colors, multiply the first digit by ten and add the second.",
      "edges": "Extra bands are ignored; black can occupy either digit position.",
      "complexity": "O(1) after lookup.",
      "gameContext": "Decode a compact two-part item code.",
      "tradeoffs": "Keep representation lookup separate from positional arithmetic.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Two color digits form a two-digit decimal value.",
        "Look up the first two colors, multiply the first digit by ten and add the second.",
        "Extra bands are ignored; black can occupy either digit position."
      ],
      "explanation": "Two color digits form a two-digit decimal value. The reference follows this strategy: Look up the first two colors, multiply the first digit by ten and add the second. Keep representation lookup separate from positional arithmetic.",
      "examples": [
        {
          "input": "['brown', 'black']",
          "output": "10"
        }
      ]
    },
    "resistor-color-expert": {
      "topics": [
        "math",
        "collections"
      ],
      "concept": "More bands add precision, a multiplier and tolerance information.",
      "strategy": "Decode each band's role before formatting the scaled resistance and tolerance.",
      "edges": "Zero, unit scaling and optional band roles require separate tests.",
      "complexity": "O(number of bands + output length).",
      "gameContext": "Render a detailed stat line from compact color-coded equipment data.",
      "tradeoffs": "Structured intermediate data avoids mixing parsing with presentation.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "More bands add precision, a multiplier and tolerance information.",
        "Decode each band's role before formatting the scaled resistance and tolerance.",
        "Zero, unit scaling and optional band roles require separate tests."
      ],
      "explanation": "More bands add precision, a multiplier and tolerance information. The reference follows this strategy: Decode each band's role before formatting the scaled resistance and tolerance. Structured intermediate data avoids mixing parsing with presentation.",
      "examples": [
        {
          "input": "['orange', 'orange', 'black', 'red']",
          "output": "'33 ohms ±2%'"
        }
      ]
    },
    "resistor-color-trio": {
      "topics": [
        "math",
        "collections"
      ],
      "concept": "The third band is an exponent, not another digit.",
      "strategy": "Form the first two digits, multiply by a power of ten and scale the units.",
      "edges": "Zero resistance, extra colors and transitions between units matter.",
      "complexity": "O(exponent) integer multiplication, bounded by the color range.",
      "gameContext": "Decode a stat with a decimal magnitude modifier.",
      "tradeoffs": "Integer multiplication avoids floating rounding for powers of ten.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "The third band is an exponent, not another digit.",
        "Form the first two digits, multiply by a power of ten and scale the units.",
        "Zero resistance, extra colors and transitions between units matter."
      ],
      "explanation": "The third band is an exponent, not another digit. The reference follows this strategy: Form the first two digits, multiply by a power of ten and scale the units. Integer multiplication avoids floating rounding for powers of ten.",
      "examples": [
        {
          "input": "['orange', 'orange', 'black']",
          "output": "'33 ohms'"
        }
      ]
    },
    "rna-transcription": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "Transcription replaces each source nucleotide with one mapped target.",
      "strategy": "Use a complete four-symbol mapping and walk the input once.",
      "edges": "Empty sequences and every accepted nucleotide must be covered.",
      "complexity": "O(n) time and output space.",
      "gameContext": "Translate encoded creature DNA into another symbol alphabet.",
      "tradeoffs": "A table makes a complete mapping easier to verify than scattered conditionals.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Transcription replaces each source nucleotide with one mapped target.",
        "Use a complete four-symbol mapping and walk the input once.",
        "Empty sequences and every accepted nucleotide must be covered."
      ],
      "explanation": "Transcription replaces each source nucleotide with one mapped target. The reference follows this strategy: Use a complete four-symbol mapping and walk the input once. A table makes a complete mapping easier to verify than scattered conditionals.",
      "examples": [
        {
          "input": "DNA=\"GCTA\"",
          "output": "RNA=\"CGAU\""
        }
      ]
    },
    "rotational-cipher": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "Alphabet positions wrap under modular addition.",
      "strategy": "Rotate upper and lowercase letters within their own ranges.",
      "edges": "Punctuation remains unchanged; shifts across z/Z wrap.",
      "complexity": "O(n) time.",
      "gameContext": "Obfuscate a puzzle inscription with a reversible letter rotation.",
      "tradeoffs": "This is a teaching cipher, not protection for player secrets.",
      "difficulty": 1,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Alphabet positions wrap under modular addition.",
        "Rotate upper and lowercase letters within their own ranges.",
        "Punctuation remains unchanged; shifts across z/Z wrap."
      ],
      "explanation": "Alphabet positions wrap under modular addition. The reference follows this strategy: Rotate upper and lowercase letters within their own ranges. This is a teaching cipher, not protection for player secrets.",
      "examples": [
        {
          "input": "text=\"Zebra\", shift=13",
          "output": "Mroen"
        }
      ]
    },
    "secret-handshake": {
      "topics": [
        "bitwise",
        "arrays"
      ],
      "concept": "Each set bit selects an action; another bit reverses the action order.",
      "strategy": "Inspect the action bits in order, then apply the reversal flag.",
      "edges": "No actions and reversal combined with several actions are distinct cases.",
      "complexity": "O(number of action bits).",
      "gameContext": "Decode compact input flags into an ordered emote sequence.",
      "tradeoffs": "Bit packing saves space but needs explicit meanings for every bit.",
      "difficulty": 1,
      "prereqs": [
        "exercism-binary"
      ],
      "hints": [
        "Each set bit selects an action; another bit reverses the action order.",
        "Inspect the action bits in order, then apply the reversal flag.",
        "No actions and reversal combined with several actions are distinct cases."
      ],
      "explanation": "Each set bit selects an action; another bit reverses the action order. The reference follows this strategy: Inspect the action bits in order, then apply the reversal flag. Bit packing saves space but needs explicit meanings for every bit.",
      "examples": [
        {
          "input": "mask=0b10011",
          "output": "[double blink, wink] (reverse flag set)"
        }
      ]
    },
    "space-age": {
      "topics": [
        "time",
        "math"
      ],
      "concept": "A single duration can be expressed in several planetary-year units.",
      "strategy": "Convert seconds to Earth years, then divide by each orbit ratio.",
      "edges": "Use the provided ratios and the test tolerance for fractional results.",
      "complexity": "O(1) per requested planet.",
      "gameContext": "Display elapsed campaign time under different fictional calendars.",
      "tradeoffs": "Unit conversion should happen at a boundary, not be mixed into simulation steps.",
      "difficulty": 1,
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "A single duration can be expressed in several planetary-year units.",
        "Convert seconds to Earth years, then divide by each orbit ratio.",
        "Use the provided ratios and the test tolerance for fractional results."
      ],
      "explanation": "A single duration can be expressed in several planetary-year units. The reference follows this strategy: Convert seconds to Earth years, then divide by each orbit ratio. Unit conversion should happen at a boundary, not be mixed into simulation steps.",
      "examples": [
        {
          "input": "1,000,000,000 seconds; planet=Earth",
          "output": "≈31.69 Earth years"
        }
      ]
    },
    "sum-of-multiples": {
      "topics": [
        "math",
        "collections"
      ],
      "concept": "A value divisible by several factors must still be counted once.",
      "strategy": "Visit candidates below the limit and include each qualifying value once.",
      "edges": "Zero factors, empty factor lists and exclusive upper limits need explicit handling.",
      "complexity": "O(limit × factors) with a direct scan.",
      "gameContext": "Sum unique reward triggers produced by overlapping periodic rules.",
      "tradeoffs": "Marking multiples is faster for many queries but uses extra storage.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "A value divisible by several factors must still be counted once.",
        "Visit candidates below the limit and include each qualifying value once.",
        "Zero factors, empty factor lists and exclusive upper limits need explicit handling."
      ],
      "explanation": "A value divisible by several factors must still be counted once. The reference follows this strategy: Visit candidates below the limit and include each qualifying value once. Marking multiples is faster for many queries but uses extra storage.",
      "examples": [
        {
          "input": "4, [3, 5]",
          "output": "3"
        }
      ]
    },
    "triangle": {
      "topics": [
        "math"
      ],
      "concept": "Side classification is meaningful only after triangle validity is checked.",
      "strategy": "Require positive sides and valid inequalities, then compare equalities.",
      "edges": "Degenerate triangles and all-zero sides are invalid.",
      "complexity": "O(1) time and space.",
      "gameContext": "Validate triangle-shaped hitbox inputs.",
      "tradeoffs": "Validation and classification are separate responsibilities even in a tiny function.",
      "difficulty": 1,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Side classification is meaningful only after triangle validity is checked.",
        "Require positive sides and valid inequalities, then compare equalities.",
        "Degenerate triangles and all-zero sides are invalid."
      ],
      "explanation": "Side classification is meaningful only after triangle validity is checked. The reference follows this strategy: Require positive sides and valid inequalities, then compare equalities. Validation and classification are separate responsibilities even in a tiny function.",
      "examples": [
        {
          "input": "sides [3,3,3]",
          "output": "valid equilateral triangle"
        }
      ]
    },
    "accumulate": {
      "topics": [
        "arrays",
        "basics"
      ],
      "concept": "An operation transforms each input into one output in the same order.",
      "strategy": "Allocate or prepare the destination, then call the supplied operation for each element.",
      "edges": "Empty lists, changed output types and repeated transformations matter.",
      "complexity": "O(n) calls and output storage.",
      "gameContext": "Transform entity positions or damage values without mutating the source list.",
      "tradeoffs": "A new collection simplifies reasoning but allocates storage rather than editing in place.",
      "difficulty": 2,
      "prereqs": [
        "exercism-hello-world"
      ],
      "hints": [
        "An operation transforms each input into one output in the same order.",
        "Allocate or prepare the destination, then call the supplied operation for each element.",
        "Empty lists, changed output types and repeated transformations matter."
      ],
      "explanation": "An operation transforms each input into one output in the same order. The reference follows this strategy: Allocate or prepare the destination, then call the supplied operation for each element. A new collection simplifies reasoning but allocates storage rather than editing in place.",
      "examples": [
        {
          "input": "[1,2,3], operation=square",
          "output": "[1,4,9]"
        }
      ]
    },
    "acronym": {
      "topics": [
        "strings"
      ],
      "concept": "Word boundaries determine which letters become initials.",
      "strategy": "Track word starts across the allowed separators and uppercase each initial.",
      "edges": "Hyphens, punctuation and consecutive separators expose boundary mistakes.",
      "complexity": "O(n) time.",
      "gameContext": "Create short labels for long skill or quest names.",
      "tradeoffs": "Boundary rules are part of the format and should be tested explicitly.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Word boundaries determine which letters become initials.",
        "Track word starts across the allowed separators and uppercase each initial.",
        "Hyphens, punctuation and consecutive separators expose boundary mistakes."
      ],
      "explanation": "Word boundaries determine which letters become initials. The reference follows this strategy: Track word starts across the allowed separators and uppercase each initial. Boundary rules are part of the format and should be tested explicitly.",
      "examples": [
        {
          "input": "'Portable Network Graphics'",
          "output": "'PNG'"
        }
      ]
    },
    "atbash-cipher": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "Letters mirror across the alphabet, while output is grouped for display.",
      "strategy": "Normalize accepted characters, substitute mirrored letters and group encoded output.",
      "edges": "Digits survive, punctuation is filtered and decoding should undo the letter mapping.",
      "complexity": "O(n) time.",
      "gameContext": "Build an ancient-inscription puzzle encoder.",
      "tradeoffs": "Display grouping is separate from the substitution and is removed while decoding.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Letters mirror across the alphabet, while output is grouped for display.",
        "Normalize accepted characters, substitute mirrored letters and group encoded output.",
        "Digits survive, punctuation is filtered and decoding should undo the letter mapping."
      ],
      "explanation": "Letters mirror across the alphabet, while output is grouped for display. The reference follows this strategy: Normalize accepted characters, substitute mirrored letters and group encoded output. Display grouping is separate from the substitution and is removed while decoding.",
      "examples": [
        {
          "input": "'yes'",
          "output": "'bvh'"
        }
      ]
    },
    "dnd-character": {
      "topics": [
        "math",
        "simulation"
      ],
      "concept": "Ability generation and derived stats obey different rules.",
      "strategy": "Roll the required dice, discard the smallest and derive modifiers with floor division.",
      "edges": "Odd low scores reveal truncation-versus-floor errors; random results must stay in range.",
      "complexity": "O(1) work per ability.",
      "gameContext": "Generate character sheets with reproducible RNG during tests.",
      "tradeoffs": "Injectable randomness makes failures reproducible instead of depending on global RNG state.",
      "difficulty": 2,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Ability generation and derived stats obey different rules.",
        "Roll the required dice, discard the smallest and derive modifiers with floor division.",
        "Odd low scores reveal truncation-versus-floor errors; random results must stay in range."
      ],
      "explanation": "Ability generation and derived stats obey different rules. The reference follows this strategy: Roll the required dice, discard the smallest and derive modifiers with floor division. Injectable randomness makes failures reproducible instead of depending on global RNG state.",
      "examples": [
        {
          "input": "ability score=9",
          "output": "modifier=-1"
        }
      ]
    },
    "diamond": {
      "topics": [
        "strings",
        "grids"
      ],
      "concept": "Each row is symmetric around the center and the middle row has maximum width.",
      "strategy": "Derive letter positions and spaces from distance to the center row.",
      "edges": "The smallest diamond and trailing/leading spaces need exact checks.",
      "complexity": "O(n²) output size.",
      "gameContext": "Generate a symmetric text pattern for a terminal minimap.",
      "tradeoffs": "Compute geometry once rather than special-casing each row.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Each row is symmetric around the center and the middle row has maximum width.",
        "Derive letter positions and spaces from distance to the center row.",
        "The smallest diamond and trailing/leading spaces need exact checks."
      ],
      "explanation": "Each row is symmetric around the center and the middle row has maximum width. The reference follows this strategy: Derive letter positions and spaces from distance to the center row. Compute geometry once rather than special-casing each row.",
      "examples": [
        {
          "input": "'A'",
          "output": "['A']"
        }
      ]
    },
    "eliuds-eggs": {
      "topics": [
        "bitwise",
        "math"
      ],
      "concept": "The number of eggs equals the number of set binary bits.",
      "strategy": "Shift and count low bits, or repeatedly remove the lowest set bit.",
      "edges": "Zero has no eggs; sparse large values distinguish the algorithms.",
      "complexity": "O(bit width), or O(set bits) with bit clearing.",
      "gameContext": "Count enabled components in an entity flag mask.",
      "tradeoffs": "Bit-clearing work scales with active flags rather than the whole integer width.",
      "difficulty": 2,
      "prereqs": [
        "exercism-binary"
      ],
      "hints": [
        "The number of eggs equals the number of set binary bits.",
        "Shift and count low bits, or repeatedly remove the lowest set bit.",
        "Zero has no eggs; sparse large values distinguish the algorithms."
      ],
      "explanation": "The number of eggs equals the number of set binary bits. The reference follows this strategy: Shift and count low bits, or repeatedly remove the lowest set bit. Bit-clearing work scales with active flags rather than the whole integer width.",
      "examples": [
        {
          "input": "16",
          "output": "1"
        }
      ]
    },
    "luhn": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "The checksum transforms alternating digits from the right.",
      "strategy": "Validate characters, double the required digits, reduce values above nine and sum.",
      "edges": "Spaces may be allowed; too few digits and non-digits are invalid.",
      "complexity": "O(n) time.",
      "gameContext": "Validate a numeric purchase or entitlement code in an offline fixture.",
      "tradeoffs": "Start from the right so formatting length does not change the alternating pattern.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "The checksum transforms alternating digits from the right.",
        "Validate characters, double the required digits, reduce values above nine and sum.",
        "Spaces may be allowed; too few digits and non-digits are invalid."
      ],
      "explanation": "The checksum transforms alternating digits from the right. The reference follows this strategy: Validate characters, double the required digits, reduce values above nine and sum. Start from the right so formatting length does not change the alternating pattern.",
      "examples": [
        {
          "input": "\"4539 3195 0343 6467\"",
          "output": "valid checksum"
        }
      ]
    },
    "matching-brackets": {
      "topics": [
        "parsing",
        "collections"
      ],
      "concept": "A closing bracket must match the most recent unmatched opener.",
      "strategy": "Push opening kinds on a stack and check each closing kind against its top.",
      "edges": "Ignore other text; an early closer or leftover opener is invalid.",
      "complexity": "O(n) time and O(depth) stack space.",
      "gameContext": "Validate nested expressions in a scripting editor.",
      "tradeoffs": "Counts alone cannot detect incorrectly nested bracket types.",
      "difficulty": 2,
      "prereqs": [
        "exercism-reverse-string"
      ],
      "hints": [
        "A closing bracket must match the most recent unmatched opener.",
        "Push opening kinds on a stack and check each closing kind against its top.",
        "Ignore other text; an early closer or leftover opener is invalid."
      ],
      "explanation": "A closing bracket must match the most recent unmatched opener. The reference follows this strategy: Push opening kinds on a stack and check each closing kind against its top. Counts alone cannot detect incorrectly nested bracket types.",
      "examples": [
        {
          "input": "'[]'",
          "output": "True"
        }
      ]
    },
    "nth-prime": {
      "topics": [
        "math",
        "search"
      ],
      "concept": "The requested position counts primes, not arbitrary candidates.",
      "strategy": "Generate candidates and test divisibility only as far as their square root.",
      "edges": "The first prime and invalid zero-based requests need clear semantics.",
      "complexity": "O(search range × sqrt candidate) for trial division.",
      "gameContext": "Generate a deterministic sequence of puzzle seeds.",
      "tradeoffs": "A sieve trades memory for speed when many prime queries share a range.",
      "difficulty": 2,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "The requested position counts primes, not arbitrary candidates.",
        "Generate candidates and test divisibility only as far as their square root.",
        "The first prime and invalid zero-based requests need clear semantics."
      ],
      "explanation": "The requested position counts primes, not arbitrary candidates. The reference follows this strategy: Generate candidates and test divisibility only as far as their square root. A sieve trades memory for speed when many prime queries share a range.",
      "examples": [
        {
          "input": "1",
          "output": "2"
        }
      ]
    },
    "nucleotide-count": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "The histogram must account for every accepted nucleotide.",
      "strategy": "Initialize all nucleotide counts, then increment one for each symbol.",
      "edges": "Absent symbols still have zero counts; invalid symbols must be rejected.",
      "complexity": "O(n) time, fixed-size result.",
      "gameContext": "Build a histogram of creature gene symbols.",
      "tradeoffs": "Validate at ingestion so downstream consumers never see an unknown category.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "The histogram must account for every accepted nucleotide.",
        "Initialize all nucleotide counts, then increment one for each symbol.",
        "Absent symbols still have zero counts; invalid symbols must be rejected."
      ],
      "explanation": "The histogram must account for every accepted nucleotide. The reference follows this strategy: Initialize all nucleotide counts, then increment one for each symbol. Validate at ingestion so downstream consumers never see an unknown category.",
      "examples": [
        {
          "input": "DNA=\"ACCG\"",
          "output": "A=1, C=2, G=1, T=0"
        }
      ]
    },
    "phone-number": {
      "topics": [
        "strings",
        "parsing"
      ],
      "concept": "Normalization must still enforce the numbering rules.",
      "strategy": "Remove allowed formatting, handle the optional country prefix, then validate digit positions.",
      "edges": "Malformed length and invalid area/exchange leading digits must fail.",
      "complexity": "O(n) time.",
      "gameContext": "Normalize player support contact data before storing it.",
      "tradeoffs": "Formatting removal is not a substitute for domain validation.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Normalization must still enforce the numbering rules.",
        "Remove allowed formatting, handle the optional country prefix, then validate digit positions.",
        "Malformed length and invalid area/exchange leading digits must fail."
      ],
      "explanation": "Normalization must still enforce the numbering rules. The reference follows this strategy: Remove allowed formatting, handle the optional country prefix, then validate digit positions. Formatting removal is not a substitute for domain validation.",
      "examples": [
        {
          "input": "\"(223) 456-7890\"",
          "output": "normalized digits: 2234567890"
        }
      ]
    },
    "pig-latin": {
      "topics": [
        "strings",
        "parsing"
      ],
      "concept": "Transformation depends on the initial sound cluster, not just the first letter.",
      "strategy": "Find the vowel or special cluster boundary and move only the prefix.",
      "edges": "Special vowel starts, qu and y cases require ordered rules.",
      "complexity": "O(n) processing and output.",
      "gameContext": "Build a playful NPC dialect transformation.",
      "tradeoffs": "A small rule scanner is easier to extend than several overlapping replacements.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Transformation depends on the initial sound cluster, not just the first letter.",
        "Find the vowel or special cluster boundary and move only the prefix.",
        "Special vowel starts, qu and y cases require ordered rules."
      ],
      "explanation": "Transformation depends on the initial sound cluster, not just the first letter. The reference follows this strategy: Find the vowel or special cluster boundary and move only the prefix. A small rule scanner is easier to extend than several overlapping replacements.",
      "examples": [
        {
          "input": "'apple'",
          "output": "'appleay'"
        }
      ]
    },
    "prime-factors": {
      "topics": [
        "math"
      ],
      "concept": "Repeated prime divisors preserve multiplicity.",
      "strategy": "Divide out the current factor until it no longer divides, then advance.",
      "edges": "One has no factors; prime inputs and repeated powers need separate checks.",
      "complexity": "O(sqrt n) candidate search in the basic version.",
      "gameContext": "Decompose a crafting quantity into reusable multiplicative ingredients.",
      "tradeoffs": "Repeated division reduces the remaining search range as factors are discovered.",
      "difficulty": 2,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Repeated prime divisors preserve multiplicity.",
        "Divide out the current factor until it no longer divides, then advance.",
        "One has no factors; prime inputs and repeated powers need separate checks."
      ],
      "explanation": "Repeated prime divisors preserve multiplicity. The reference follows this strategy: Divide out the current factor until it no longer divides, then advance. Repeated division reduces the remaining search range as factors are discovered.",
      "examples": [
        {
          "input": "60",
          "output": "[2,2,3,5]"
        }
      ]
    },
    "protein-translation": {
      "topics": [
        "strings",
        "parsing"
      ],
      "concept": "Three-letter codons map to proteins until a stop codon terminates translation.",
      "strategy": "Read complete triples in sequence and stop before emitting a stop marker.",
      "edges": "Invalid/incomplete codons and early termination must follow the native tests.",
      "complexity": "O(n) input processing.",
      "gameContext": "Interpret fixed-width opcodes in a creature-generation stream.",
      "tradeoffs": "A stop token changes control flow, so it should not be treated as an ordinary value.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Three-letter codons map to proteins until a stop codon terminates translation.",
        "Read complete triples in sequence and stop before emitting a stop marker.",
        "Invalid/incomplete codons and early termination must follow the native tests."
      ],
      "explanation": "Three-letter codons map to proteins until a stop codon terminates translation. The reference follows this strategy: Read complete triples in sequence and stop before emitting a stop marker. A stop token changes control flow, so it should not be treated as an ordinary value.",
      "examples": [
        {
          "input": "'AUG'",
          "output": "['Methionine']"
        }
      ]
    },
    "proverb": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Adjacent items generate lines, and a final line refers to the first item.",
      "strategy": "Walk adjacent pairs, then emit the closing sentence only when input exists.",
      "edges": "Empty and single-item inputs have different output sizes.",
      "complexity": "O(total output length).",
      "gameContext": "Generate a chain of cause-and-effect quest messages.",
      "tradeoffs": "Keep the closing rule separate from the pairwise loop.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Adjacent items generate lines, and a final line refers to the first item.",
        "Walk adjacent pairs, then emit the closing sentence only when input exists.",
        "Empty and single-item inputs have different output sizes."
      ],
      "explanation": "Adjacent items generate lines, and a final line refers to the first item. The reference follows this strategy: Walk adjacent pairs, then emit the closing sentence only when input exists. Keep the closing rule separate from the pairwise loop.",
      "examples": [
        {
          "input": "items=[nail,shoe]",
          "output": "For want of a nail the shoe was lost.\nAnd all for the want of a nail."
        }
      ]
    },
    "queen-attack": {
      "topics": [
        "grids",
        "math"
      ],
      "concept": "Two positions attack when they share a row, column or diagonal.",
      "strategy": "Compare coordinates and absolute differences.",
      "edges": "Coordinates must be valid; coincident placements may be rejected by the API.",
      "complexity": "O(1) time.",
      "gameContext": "Detect directional line-of-sight threats on a board.",
      "tradeoffs": "Arithmetic checks suit an empty board; obstacles would require a traversal.",
      "difficulty": 2,
      "prereqs": [
        "tile-collision"
      ],
      "hints": [
        "Two positions attack when they share a row, column or diagonal.",
        "Compare coordinates and absolute differences.",
        "Coordinates must be valid; coincident placements may be rejected by the API."
      ],
      "explanation": "Two positions attack when they share a row, column or diagonal. The reference follows this strategy: Compare coordinates and absolute differences. Arithmetic checks suit an empty board; obstacles would require a traversal.",
      "examples": [
        {
          "input": "queen=(2,3), other=(5,6)",
          "output": "true: same diagonal"
        }
      ]
    },
    "robot-name": {
      "topics": [
        "state",
        "collections"
      ],
      "concept": "Names must stay unique across creation and resets.",
      "strategy": "Generate a candidate, check the shared registry and reserve it before returning.",
      "edges": "Reset must produce an allowed unused name; exhaustion needs a deliberate policy.",
      "complexity": "Expected O(1) registry lookup per attempt.",
      "gameContext": "Assign stable human-readable names to spawned bots.",
      "tradeoffs": "Random retry is simple but slows as the finite namespace fills.",
      "difficulty": 2,
      "prereqs": [
        "animation"
      ],
      "hints": [
        "Names must stay unique across creation and resets.",
        "Generate a candidate, check the shared registry and reserve it before returning.",
        "Reset must produce an allowed unused name; exhaustion needs a deliberate policy."
      ],
      "explanation": "Names must stay unique across creation and resets. The reference follows this strategy: Generate a candidate, check the shared registry and reserve it before returning. Random retry is simple but slows as the finite namespace fills.",
      "examples": [
        {
          "input": "create then reset a robot name",
          "output": "both names match two uppercase letters + three digits, and differ"
        }
      ]
    },
    "roman-numerals": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "Some values are represented by a subtractive pair rather than repetition.",
      "strategy": "Consume ordered symbol/value pairs from largest to smallest.",
      "edges": "Subtractive boundaries such as 4,9,40,90 expose table mistakes.",
      "complexity": "O(output length), bounded for the supported range.",
      "gameContext": "Render a chapter number or boss phase label.",
      "tradeoffs": "A data table keeps exceptional pairs visible without many nested branches.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Some values are represented by a subtractive pair rather than repetition.",
        "Consume ordered symbol/value pairs from largest to smallest.",
        "Subtractive boundaries such as 4,9,40,90 expose table mistakes."
      ],
      "explanation": "Some values are represented by a subtractive pair rather than repetition. The reference follows this strategy: Consume ordered symbol/value pairs from largest to smallest. A data table keeps exceptional pairs visible without many nested branches.",
      "examples": [
        {
          "input": "1994",
          "output": "MCMXCIV"
        }
      ]
    },
    "run-length-encoding": {
      "topics": [
        "strings",
        "parsing"
      ],
      "concept": "Adjacent equal characters form runs; decoding expands counts.",
      "strategy": "Track the current run while encoding, and parse counts before symbols while decoding.",
      "edges": "Runs of one omit the count; spaces and multi-digit counts must survive.",
      "complexity": "O(input + output length).",
      "gameContext": "Compress repeated tiles or repeated input states in a simple replay format.",
      "tradeoffs": "RLE is effective on repetition but can expand highly varied data.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Adjacent equal characters form runs; decoding expands counts.",
        "Track the current run while encoding, and parse counts before symbols while decoding.",
        "Runs of one omit the count; spaces and multi-digit counts must survive."
      ],
      "explanation": "Adjacent equal characters form runs; decoding expands counts. The reference follows this strategy: Track the current run while encoding, and parse counts before symbols while decoding. RLE is effective on repetition but can expand highly varied data.",
      "examples": [
        {
          "input": "\"AABCCC\"",
          "output": "encode → \"2AB3C\"; decode → \"AABCCC\""
        }
      ]
    },
    "say": {
      "topics": [
        "strings",
        "math"
      ],
      "concept": "Large numbers are grouped into named three-digit chunks.",
      "strategy": "Format a chunk, then attach its scale name while skipping zero chunks.",
      "edges": "Zero, teens, hyphens and values outside the stated range need dedicated cases.",
      "complexity": "O(number of decimal groups + output length).",
      "gameContext": "Speak reward totals in an accessible game UI.",
      "tradeoffs": "Separating chunk formatting from scales avoids duplicated grammar rules.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Large numbers are grouped into named three-digit chunks.",
        "Format a chunk, then attach its scale name while skipping zero chunks.",
        "Zero, teens, hyphens and values outside the stated range need dedicated cases."
      ],
      "explanation": "Large numbers are grouped into named three-digit chunks. The reference follows this strategy: Format a chunk, then attach its scale name while skipping zero chunks. Separating chunk formatting from scales avoids duplicated grammar rules.",
      "examples": [
        {
          "input": "1",
          "output": "'one'"
        }
      ]
    },
    "scrabble-score": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "Each letter contributes an independent table score.",
      "strategy": "Normalize case and sum the score mapped to each letter.",
      "edges": "Empty text and mixed case must preserve the same scoring rules.",
      "complexity": "O(n) time.",
      "gameContext": "Score words in a spell-building minigame.",
      "tradeoffs": "Use one scoring table so validation and scoring cannot disagree.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Each letter contributes an independent table score.",
        "Normalize case and sum the score mapped to each letter.",
        "Empty text and mixed case must preserve the same scoring rules."
      ],
      "explanation": "Each letter contributes an independent table score. The reference follows this strategy: Normalize case and sum the score mapped to each letter. Use one scoring table so validation and scoring cannot disagree.",
      "examples": [
        {
          "input": "'a'",
          "output": "1"
        }
      ]
    },
    "series": {
      "topics": [
        "arrays",
        "strings"
      ],
      "concept": "A sliding window includes every valid consecutive substring.",
      "strategy": "Validate the requested length, then produce each offset's window.",
      "edges": "Zero/negative lengths and windows larger than input are errors in the tested contract.",
      "complexity": "O(number of windows × window length) when copying.",
      "gameContext": "Extract consecutive input combos from a recorded move string.",
      "tradeoffs": "Borrowed windows reduce copying but depend on the lifetime of the original string.",
      "difficulty": 2,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "A sliding window includes every valid consecutive substring.",
        "Validate the requested length, then produce each offset's window.",
        "Zero/negative lengths and windows larger than input are errors in the tested contract."
      ],
      "explanation": "A sliding window includes every valid consecutive substring. The reference follows this strategy: Validate the requested length, then produce each offset's window. Borrowed windows reduce copying but depend on the lifetime of the original string.",
      "examples": [
        {
          "input": "digits=\"49142\", window=3",
          "output": "[\"491\",\"914\",\"142\"]"
        }
      ]
    },
    "square-root": {
      "topics": [
        "math",
        "search"
      ],
      "concept": "The integer root is the greatest integer whose square does not exceed the input.",
      "strategy": "Use bounded search or Newton updates with integer comparisons.",
      "edges": "Zero, one and exact/nonexact squares expose rounding and bounds.",
      "complexity": "O(log n) with binary search.",
      "gameContext": "Compute a discrete distance scale without floating-point conversion.",
      "tradeoffs": "Compare through division when squaring a candidate could overflow.",
      "difficulty": 2,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "The integer root is the greatest integer whose square does not exceed the input.",
        "Use bounded search or Newton updates with integer comparisons.",
        "Zero, one and exact/nonexact squares expose rounding and bounds."
      ],
      "explanation": "The integer root is the greatest integer whose square does not exceed the input. The reference follows this strategy: Use bounded search or Newton updates with integer comparisons. Compare through division when squaring a candidate could overflow.",
      "examples": [
        {
          "input": "81",
          "output": "9"
        }
      ]
    },
    "sublist": {
      "topics": [
        "arrays",
        "search"
      ],
      "concept": "Contiguous containment determines equality, sublist, superlist or neither.",
      "strategy": "Check equality, then search the shorter sequence inside the longer.",
      "edges": "Empty lists, repeated prefixes and overlapping candidates require careful windows.",
      "complexity": "O(nm) with a simple window scan.",
      "gameContext": "Recognize a recorded combo inside a longer action sequence.",
      "tradeoffs": "A prefix-search algorithm can improve long scans, but the simple version is easier to audit.",
      "difficulty": 2,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Contiguous containment determines equality, sublist, superlist or neither.",
        "Check equality, then search the shorter sequence inside the longer.",
        "Empty lists, repeated prefixes and overlapping candidates require careful windows."
      ],
      "explanation": "Contiguous containment determines equality, sublist, superlist or neither. The reference follows this strategy: Check equality, then search the shorter sequence inside the longer. A prefix-search algorithm can improve long scans, but the simple version is easier to audit.",
      "examples": [
        {
          "input": "left=[1,2], right=[0,1,2,3]",
          "output": "left is a sublist of right"
        }
      ]
    },
    "transpose": {
      "topics": [
        "arrays",
        "grids"
      ],
      "concept": "Rows become columns while preserving the intended ragged-text shape.",
      "strategy": "Read each column across rows and supply padding only where the format needs it.",
      "edges": "Unequal row lengths and trailing spaces distinguish a correct text transpose.",
      "complexity": "O(output area) time.",
      "gameContext": "Rotate a text-based level's row/column representation.",
      "tradeoffs": "Ragged text has different padding rules from a rectangular numeric matrix.",
      "difficulty": 2,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Rows become columns while preserving the intended ragged-text shape.",
        "Read each column across rows and supply padding only where the format needs it.",
        "Unequal row lengths and trailing spaces distinguish a correct text transpose."
      ],
      "explanation": "Rows become columns while preserving the intended ragged-text shape. The reference follows this strategy: Read each column across rows and supply padding only where the format needs it. Ragged text has different padding rules from a rectangular numeric matrix.",
      "examples": [
        {
          "input": "'A1'",
          "output": "'A\\n1'"
        }
      ]
    },
    "twelve-days": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Each verse accumulates the gifts from its day back to the first.",
      "strategy": "Store ordinal and gift fragments, then compose in reverse gift order.",
      "edges": "The first day and the conjunction in later verses are special.",
      "complexity": "O(output length) time.",
      "gameContext": "Generate a cumulative reward ceremony sequence.",
      "tradeoffs": "Represent repeated content as data instead of duplicating the full verses.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Each verse accumulates the gifts from its day back to the first.",
        "Store ordinal and gift fragments, then compose in reverse gift order.",
        "The first day and the conjunction in later verses are special."
      ],
      "explanation": "Each verse accumulates the gifts from its day back to the first. The reference follows this strategy: Store ordinal and gift fragments, then compose in reverse gift order. Represent repeated content as data instead of duplicating the full verses.",
      "examples": [
        {
          "input": "1, 1",
          "output": "['On the first day of Christmas my true love gave to me: a Partridge in a Pear Tree.']"
        }
      ]
    },
    "word-count": {
      "topics": [
        "strings",
        "collections"
      ],
      "concept": "Tokens are normalized words, with particular apostrophe rules.",
      "strategy": "Scan word boundaries and update a frequency map for normalized tokens.",
      "edges": "Punctuation, case, quoted words and internal apostrophes need separate tests.",
      "complexity": "O(n) expected time with a hash map.",
      "gameContext": "Count chat or dialogue terms for a local content-analysis tool.",
      "tradeoffs": "Token rules should be explicit so two pipelines do not produce different counts.",
      "difficulty": 2,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Tokens are normalized words, with particular apostrophe rules.",
        "Scan word boundaries and update a frequency map for normalized tokens.",
        "Punctuation, case, quoted words and internal apostrophes need separate tests."
      ],
      "explanation": "Tokens are normalized words, with particular apostrophe rules. The reference follows this strategy: Scan word boundaries and update a frequency map for normalized tokens. Token rules should be explicit so two pipelines do not produce different counts.",
      "examples": [
        {
          "input": "'word'",
          "output": "{'word': 1}"
        }
      ]
    },
    "yacht": {
      "topics": [
        "math",
        "collections"
      ],
      "concept": "A category determines how the dice are interpreted.",
      "strategy": "Count face occurrences, then apply the selected category's rule.",
      "edges": "Full house, four-of-a-kind, straights and all-equal dice must not share one predicate.",
      "complexity": "O(number of dice) with a fixed histogram.",
      "gameContext": "Score a dice-based tavern minigame.",
      "tradeoffs": "A histogram avoids repeated scans for each face and scoring category.",
      "difficulty": 2,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "A category determines how the dice are interpreted.",
        "Count face occurrences, then apply the selected category's rule.",
        "Full house, four-of-a-kind, straights and all-equal dice must not share one predicate."
      ],
      "explanation": "A category determines how the dice are interpreted. The reference follows this strategy: Count face occurrences, then apply the selected category's rule. A histogram avoids repeated scans for each face and scoring category.",
      "examples": [
        {
          "input": "[5, 5, 5, 5, 5], yacht.YACHT",
          "output": "50"
        }
      ]
    },
    "allergies": {
      "topics": [
        "bitwise",
        "collections"
      ],
      "concept": "An allergy score is a set of recognized bit flags.",
      "strategy": "Test the flag for membership and list only known set flags.",
      "edges": "Unknown high bits must not become extra allergies.",
      "complexity": "O(number of supported flags).",
      "gameContext": "Decode status-effect flags from a saved character record.",
      "tradeoffs": "Preserve unrecognized bits during migration only when the storage contract requires it.",
      "difficulty": 3,
      "prereqs": [
        "exercism-binary"
      ],
      "hints": [
        "An allergy score is a set of recognized bit flags.",
        "Test the flag for membership and list only known set flags.",
        "Unknown high bits must not become extra allergies."
      ],
      "explanation": "An allergy score is a set of recognized bit flags. The reference follows this strategy: Test the flag for membership and list only known set flags. Preserve unrecognized bits during migration only when the storage contract requires it.",
      "examples": [
        {
          "input": "Allergies(1).lst",
          "output": "['eggs']"
        }
      ]
    },
    "beer-song": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Pluralization and the zero verse change the standard template.",
      "strategy": "Build a verse from bottle count, action and next count, then join requested verses.",
      "edges": "One, zero and blank separators are distinct formatting cases.",
      "complexity": "O(output length) time.",
      "gameContext": "Generate repeated announcements whose grammar depends on an item count.",
      "tradeoffs": "A shared verse builder keeps singular and reset behavior consistent across ranges.",
      "difficulty": 3,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Pluralization and the zero verse change the standard template.",
        "Build a verse from bottle count, action and next count, then join requested verses.",
        "One, zero and blank separators are distinct formatting cases."
      ],
      "explanation": "Pluralization and the zero verse change the standard template. The reference follows this strategy: Build a verse from bottle count, action and next count, then join requested verses. A shared verse builder keeps singular and reset behavior consistent across ranges.",
      "examples": [
        {
          "input": "start=99",
          "output": "['99 bottles of beer on the wall, 99 bottles of beer.', 'Take one down and pass it around, 98 bottles of beer on the wall.']"
        }
      ]
    },
    "binary": {
      "topics": [
        "math",
        "parsing"
      ],
      "concept": "Positional value is built by multiplying the accumulated prefix by two.",
      "strategy": "Validate each digit and update the accumulated value from left to right.",
      "edges": "Any nonbinary symbol must fail; leading zeros do not change the value.",
      "complexity": "O(d) digit processing.",
      "gameContext": "Decode an explicit binary flag string from a debug console.",
      "tradeoffs": "Manual conversion exposes both invalid input and fixed-width overflow.",
      "difficulty": 3,
      "prereqs": [
        "exercism-hello-world"
      ],
      "hints": [
        "Positional value is built by multiplying the accumulated prefix by two.",
        "Validate each digit and update the accumulated value from left to right.",
        "Any nonbinary symbol must fail; leading zeros do not change the value."
      ],
      "explanation": "Positional value is built by multiplying the accumulated prefix by two. The reference follows this strategy: Validate each digit and update the accumulated value from left to right. Manual conversion exposes both invalid input and fixed-width overflow.",
      "examples": [
        {
          "input": "digits=\"101011\"",
          "output": "43"
        }
      ]
    },
    "bottle-song": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "A countdown song varies number words and singular/plural bottle forms.",
      "strategy": "Render each verse using the current and next counts, then add the required separators.",
      "edges": "Last verse, one bottle and zero remaining bottles need exact wording.",
      "complexity": "O(output length) time.",
      "gameContext": "Produce countdown narration for a staged collectible challenge.",
      "tradeoffs": "Store number words as data while keeping grammar rules in one formatter.",
      "difficulty": 3,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "A countdown song varies number words and singular/plural bottle forms.",
        "Render each verse using the current and next counts, then add the required separators.",
        "Last verse, one bottle and zero remaining bottles need exact wording."
      ],
      "explanation": "A countdown song varies number words and singular/plural bottle forms. The reference follows this strategy: Render each verse using the current and next counts, then add the required separators. Store number words as data while keeping grammar rules in one formatter.",
      "examples": [
        {
          "input": "start=10",
          "output": "['Ten green bottles hanging on the wall,', 'Ten green bottles hanging on the wall,', 'And if one green bottle should accidentally fall,', \"There'll be nine green bottles hanging on the wall.\"]"
        }
      ]
    },
    "circular-buffer": {
      "topics": [
        "memory",
        "collections"
      ],
      "concept": "Read and write positions wrap inside a fixed capacity.",
      "strategy": "Track occupancy separately from the cursor and advance indexes modulo capacity.",
      "edges": "Empty reads, full writes, overwrite behavior and clear must be distinguished.",
      "complexity": "O(1) operations, O(capacity) storage.",
      "gameContext": "Keep the latest input events without growing memory every frame.",
      "tradeoffs": "A fixed buffer bounds memory but requires an explicit policy for losing old data.",
      "difficulty": 3,
      "prereqs": [
        "inventory"
      ],
      "hints": [
        "Read and write positions wrap inside a fixed capacity.",
        "Track occupancy separately from the cursor and advance indexes modulo capacity.",
        "Empty reads, full writes, overwrite behavior and clear must be distinguished."
      ],
      "explanation": "Read and write positions wrap inside a fixed capacity. The reference follows this strategy: Track occupancy separately from the cursor and advance indexes modulo capacity. A fixed buffer bounds memory but requires an explicit policy for losing old data.",
      "examples": [
        {
          "input": "capacity=2; write A,B; read; overwrite C",
          "output": "read A; remaining B,C"
        }
      ]
    },
    "clock": {
      "topics": [
        "time",
        "math"
      ],
      "concept": "Time arithmetic wraps modulo a day.",
      "strategy": "Normalize total minutes with a positive modulo, then format hours and minutes.",
      "edges": "Negative offsets and several days of overflow must normalize correctly.",
      "complexity": "O(1) arithmetic.",
      "gameContext": "Display a repeating day/night cycle clock.",
      "tradeoffs": "A clock face discards the date, so it is unsuitable for absolute save timestamps.",
      "difficulty": 3,
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "Time arithmetic wraps modulo a day.",
        "Normalize total minutes with a positive modulo, then format hours and minutes.",
        "Negative offsets and several days of overflow must normalize correctly."
      ],
      "explanation": "Time arithmetic wraps modulo a day. The reference follows this strategy: Normalize total minutes with a positive modulo, then format hours and minutes. A clock face discards the date, so it is unsuitable for absolute save timestamps.",
      "examples": [
        {
          "input": "23:59 + 2 minutes",
          "output": "00:01"
        }
      ]
    },
    "connect": {
      "topics": [
        "grids",
        "graphs"
      ],
      "concept": "Winning means a path connects the player's designated opposite borders.",
      "strategy": "Flood-fill same-color cells from one starting border using the board's adjacency rules.",
      "edges": "Corner adjacency differs from square-grid neighbors; either player may be the winner.",
      "complexity": "O(cells) traversal and visited storage.",
      "gameContext": "Detect connected territory in a hex-board minigame.",
      "tradeoffs": "Explicit adjacency makes changing board geometry safer than scattered neighbor checks.",
      "difficulty": 3,
      "prereqs": [
        "tile-collision"
      ],
      "hints": [
        "Winning means a path connects the player's designated opposite borders.",
        "Flood-fill same-color cells from one starting border using the board's adjacency rules.",
        "Corner adjacency differs from square-grid neighbors; either player may be the winner."
      ],
      "explanation": "Winning means a path connects the player's designated opposite borders. The reference follows this strategy: Flood-fill same-color cells from one starting border using the board's adjacency rules. Explicit adjacency makes changing board geometry safer than scattered neighbor checks.",
      "examples": [
        {
          "input": "board=[\"XX\",\"..\"]",
          "output": "X wins by connecting left to right"
        }
      ]
    },
    "game-of-life": {
      "topics": [
        "grids",
        "simulation"
      ],
      "concept": "Every cell's next state depends on the old generation.",
      "strategy": "Count neighbors into a separate destination using the survival and birth rules.",
      "edges": "Edges do not wrap; isolated cells, overcrowding and oscillators reveal in-place updates.",
      "complexity": "O(cells) time and a new generation buffer.",
      "gameContext": "Simulate a cellular-automaton world patch.",
      "tradeoffs": "Double buffering costs memory but prevents update order from changing the result.",
      "difficulty": 3,
      "prereqs": [
        "exercism-minesweeper"
      ],
      "hints": [
        "Every cell's next state depends on the old generation.",
        "Count neighbors into a separate destination using the survival and birth rules.",
        "Edges do not wrap; isolated cells, overcrowding and oscillators reveal in-place updates."
      ],
      "explanation": "Every cell's next state depends on the old generation. The reference follows this strategy: Count neighbors into a separate destination using the survival and birth rules. Double buffering costs memory but prevents update order from changing the result.",
      "examples": [
        {
          "input": "[[0, 0, 0], [0, 1, 0], [0, 1, 0]]",
          "output": "[[0, 0, 0], [0, 0, 0], [0, 0, 0]]"
        }
      ]
    },
    "crypto-square": {
      "topics": [
        "strings",
        "grids"
      ],
      "concept": "Normalized text is arranged in a near-square rectangle and read by columns.",
      "strategy": "Remove disallowed characters, compute row/column sizes, then format column groups.",
      "edges": "Empty input and incomplete final rows require the specified padding.",
      "complexity": "O(n) time and output space.",
      "gameContext": "Encode a message by rearranging a small text grid.",
      "tradeoffs": "Separate normalization from geometry so padding does not affect size calculations.",
      "difficulty": 3,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Normalized text is arranged in a near-square rectangle and read by columns.",
        "Remove disallowed characters, compute row/column sizes, then format column groups.",
        "Empty input and incomplete final rows require the specified padding."
      ],
      "explanation": "Normalized text is arranged in a near-square rectangle and read by columns. The reference follows this strategy: Remove disallowed characters, compute row/column sizes, then format column groups. Separate normalization from geometry so padding does not affect size calculations.",
      "examples": [
        {
          "input": "'A'",
          "output": "'a'"
        }
      ]
    },
    "diffie-hellman": {
      "topics": [
        "math",
        "security"
      ],
      "concept": "Both peers reach the same modular exponent from different private keys.",
      "strategy": "Use modular exponentiation by repeated squaring and draw private keys in the permitted range.",
      "edges": "Large products require wider intermediates; public/secret computations must agree.",
      "complexity": "O(log exponent) modular operations.",
      "gameContext": "Study deterministic arithmetic behind a multiplayer key-exchange example.",
      "tradeoffs": "The exercise is educational; production networking needs an audited protocol and RNG.",
      "difficulty": 3,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Both peers reach the same modular exponent from different private keys.",
        "Use modular exponentiation by repeated squaring and draw private keys in the permitted range.",
        "Large products require wider intermediates; public/secret computations must agree."
      ],
      "explanation": "Both peers reach the same modular exponent from different private keys. The reference follows this strategy: Use modular exponentiation by repeated squaring and draw private keys in the permitted range. The exercise is educational; production networking needs an audited protocol and RNG.",
      "examples": [
        {
          "input": "p=23, g=5, private=6",
          "output": "public=8"
        }
      ]
    },
    "grade-school": {
      "topics": [
        "collections",
        "sorting"
      ],
      "concept": "A student belongs to at most one grade, while rosters have stable ordering.",
      "strategy": "Reject duplicate names globally, track addition outcomes, then sort by grade and name.",
      "edges": "Duplicates across grades and clearing the addition-result history need checks.",
      "complexity": "O(n log n) roster sorting.",
      "gameContext": "Group players into divisions with a deterministic display order.",
      "tradeoffs": "Insertion history and sorted views are different data, so keep them separate.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "A student belongs to at most one grade, while rosters have stable ordering.",
        "Reject duplicate names globally, track addition outcomes, then sort by grade and name.",
        "Duplicates across grades and clearing the addition-result history need checks."
      ],
      "explanation": "A student belongs to at most one grade, while rosters have stable ordering. The reference follows this strategy: Reject duplicate names globally, track addition outcomes, then sort by grade and name. Insertion history and sorted views are different data, so keep them separate.",
      "examples": [
        {
          "input": "add Zoe to grade 3; add Amy to grade 2",
          "output": "roster [Amy,Zoe]"
        }
      ]
    },
    "hexadecimal": {
      "topics": [
        "math",
        "parsing"
      ],
      "concept": "Hexadecimal digits represent values from zero through fifteen.",
      "strategy": "Normalize accepted letter case and fold digits with base sixteen.",
      "edges": "Leading zeros, uppercase letters, invalid symbols and fixed-width overflow matter.",
      "complexity": "O(d) digit processing.",
      "gameContext": "Read color/debug addresses from a hexadecimal console field.",
      "tradeoffs": "Validation avoids interpreting a malformed address as a different number.",
      "difficulty": 3,
      "prereqs": [
        "exercism-binary"
      ],
      "hints": [
        "Hexadecimal digits represent values from zero through fifteen.",
        "Normalize accepted letter case and fold digits with base sixteen.",
        "Leading zeros, uppercase letters, invalid symbols and fixed-width overflow matter."
      ],
      "explanation": "Hexadecimal digits represent values from zero through fifteen. The reference follows this strategy: Normalize accepted letter case and fold digits with base sixteen. Validation avoids interpreting a malformed address as a different number.",
      "examples": [
        {
          "input": "digits=\"19ACE\"",
          "output": "105166"
        }
      ]
    },
    "high-scores": {
      "topics": [
        "arrays",
        "sorting"
      ],
      "concept": "Latest, highest and top-three queries ask different questions of the same sequence.",
      "strategy": "Preserve insertion order for latest, and derive sorted values for ranking.",
      "edges": "Empty histories, tied scores and fewer than three entries need the API's behavior.",
      "complexity": "O(n log n) to sort; O(n) maximum.",
      "gameContext": "Build an arcade scoreboard without rearranging the player's history.",
      "tradeoffs": "Sorting a copy preserves the original chronological data.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Latest, highest and top-three queries ask different questions of the same sequence.",
        "Preserve insertion order for latest, and derive sorted values for ranking.",
        "Empty histories, tied scores and fewer than three entries need the API's behavior."
      ],
      "explanation": "Latest, highest and top-three queries ask different questions of the same sequence. The reference follows this strategy: Preserve insertion order for latest, and derive sorted values for ranking. Sorting a copy preserves the original chronological data.",
      "examples": [
        {
          "input": "[30,50,20,50]",
          "output": "latest=50; top three=[50,50,30]"
        }
      ]
    },
    "kindergarten-garden": {
      "topics": [
        "collections",
        "strings"
      ],
      "concept": "Each child receives fixed positions from two ordered rows.",
      "strategy": "Sort child names and map each child's pair of columns to plant codes.",
      "edges": "Default/custom child lists and unknown symbols need the tested validation.",
      "complexity": "O(children log children + plants).",
      "gameContext": "Assign fixed inventory slots from a two-row loadout template.",
      "tradeoffs": "A positional representation is compact but ties data layout to ordering rules.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Each child receives fixed positions from two ordered rows.",
        "Sort child names and map each child's pair of columns to plant codes.",
        "Default/custom child lists and unknown symbols need the tested validation."
      ],
      "explanation": "Each child receives fixed positions from two ordered rows. The reference follows this strategy: Sort child names and map each child's pair of columns to plant codes. A positional representation is compact but ties data layout to ordering rules.",
      "examples": [
        {
          "input": "rows=\"RC\\nGG\"; child=Alice",
          "output": "[Radishes,Clover,Grass,Grass]"
        }
      ]
    },
    "matrix": {
      "topics": [
        "arrays",
        "parsing"
      ],
      "concept": "Row and column access are two views of rectangular numeric data.",
      "strategy": "Parse every row consistently and validate the shape before serving either view.",
      "edges": "Trailing whitespace, one row/column and invalid indexes reveal boundary assumptions.",
      "complexity": "O(cells) parsing; O(view length) copying.",
      "gameContext": "Load a tile or stat table with explicit row/column queries.",
      "tradeoffs": "Parsing once avoids repeated work each time a view is requested.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Row and column access are two views of rectangular numeric data.",
        "Parse every row consistently and validate the shape before serving either view.",
        "Trailing whitespace, one row/column and invalid indexes reveal boundary assumptions."
      ],
      "explanation": "Row and column access are two views of rectangular numeric data. The reference follows this strategy: Parse every row consistently and validate the shape before serving either view. Parsing once avoids repeated work each time a view is requested.",
      "examples": [
        {
          "input": "matrix=[[1,2],[3,4]]; first row and second column",
          "output": "row=[1,2]; column=[2,4]"
        }
      ]
    },
    "ocr-numbers": {
      "topics": [
        "strings",
        "parsing"
      ],
      "concept": "Each digit is a fixed cell pattern embedded in blocks of text.",
      "strategy": "Partition input into digit-sized blocks and compare against the pattern table.",
      "edges": "Malformed dimensions fail; unknown patterns produce the specified placeholder.",
      "complexity": "O(input area) time.",
      "gameContext": "Read a tiny bitmap-font score display in a terminal game fixture.",
      "tradeoffs": "Dimension validation should happen before pattern lookup.",
      "difficulty": 3,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Each digit is a fixed cell pattern embedded in blocks of text.",
        "Partition input into digit-sized blocks and compare against the pattern table.",
        "Malformed dimensions fail; unknown patterns produce the specified placeholder."
      ],
      "explanation": "Each digit is a fixed cell pattern embedded in blocks of text. The reference follows this strategy: Partition input into digit-sized blocks and compare against the pattern table. Dimension validation should happen before pattern lookup.",
      "examples": [
        {
          "input": "[' _ ', '| |', '|_|', '   ']",
          "output": "'0'"
        }
      ]
    },
    "octal": {
      "topics": [
        "math",
        "parsing"
      ],
      "concept": "Each octal digit extends the accumulated value by base eight.",
      "strategy": "Validate digits zero through seven and update the prefix value.",
      "edges": "Eight/nine and embedded letters are invalid; empty input follows the bundle's policy.",
      "complexity": "O(d) digit processing.",
      "gameContext": "Read an old octal permissions field in an asset pipeline exercise.",
      "tradeoffs": "A generic base converter is reusable, but this exercise isolates digit validation.",
      "difficulty": 3,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Each octal digit extends the accumulated value by base eight.",
        "Validate digits zero through seven and update the prefix value.",
        "Eight/nine and embedded letters are invalid; empty input follows the bundle's policy."
      ],
      "explanation": "Each octal digit extends the accumulated value by base eight. The reference follows this strategy: Validate digits zero through seven and update the prefix value. A generic base converter is reusable, but this exercise isolates digit validation.",
      "examples": [
        {
          "input": "digits=\"17\"",
          "output": "15"
        }
      ]
    },
    "point-mutations": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Only corresponding positions contribute to the mutation distance.",
      "strategy": "Compare paired symbols across the range specified by the native API.",
      "edges": "The exercise's unequal-length policy must be read from its tests.",
      "complexity": "O(compared length) time.",
      "gameContext": "Compare fixed creature gene slots after a mutation step.",
      "tradeoffs": "Positional distance does not describe inserted or removed symbols.",
      "difficulty": 3,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Only corresponding positions contribute to the mutation distance.",
        "Compare paired symbols across the range specified by the native API.",
        "The exercise's unequal-length policy must be read from its tests."
      ],
      "explanation": "Only corresponding positions contribute to the mutation distance. The reference follows this strategy: Compare paired symbols across the range specified by the native API. Positional distance does not describe inserted or removed symbols.",
      "examples": [
        {
          "input": "'ACT', 'GGA'",
          "output": "3"
        }
      ]
    },
    "poker": {
      "topics": [
        "collections",
        "sorting"
      ],
      "concept": "A hand's category and tie-breaking ranks form an ordered score.",
      "strategy": "Normalize cards, count ranks/suits, classify patterns and compare category-specific kickers.",
      "edges": "Ace-low straights, duplicate ranks and tied best hands expose ranking bugs.",
      "complexity": "O(hands × cards log cards), with fixed-size hands.",
      "gameContext": "Evaluate hands in a card-game AI.",
      "tradeoffs": "A structured score tuple makes tie-breaking clearer than nested comparison branches.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "A hand's category and tie-breaking ranks form an ordered score.",
        "Normalize cards, count ranks/suits, classify patterns and compare category-specific kickers.",
        "Ace-low straights, duplicate ranks and tied best hands expose ranking bugs."
      ],
      "explanation": "A hand's category and tie-breaking ranks form an ordered score. The reference follows this strategy: Normalize cards, count ranks/suits, classify patterns and compare category-specific kickers. A structured score tuple makes tie-breaking clearer than nested comparison branches.",
      "examples": [
        {
          "input": "['4S 5S 7H 8D JC']",
          "output": "['4S 5S 7H 8D JC']"
        }
      ]
    },
    "pythagorean-triplet": {
      "topics": [
        "math",
        "search"
      ],
      "concept": "Valid triples satisfy ordering, a fixed sum and the squared equality.",
      "strategy": "Search ordered a/b candidates and derive c from the sum.",
      "edges": "Return every matching triple, no duplicates, and empty results for impossible sums.",
      "complexity": "O(sum²) in the direct search.",
      "gameContext": "Generate integer triangle puzzle targets for a physics lesson.",
      "tradeoffs": "Algebraic bounds reduce wasted candidates without changing the search contract.",
      "difficulty": 3,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Valid triples satisfy ordering, a fixed sum and the squared equality.",
        "Search ordered a/b candidates and derive c from the sum.",
        "Return every matching triple, no duplicates, and empty results for impossible sums."
      ],
      "explanation": "Valid triples satisfy ordering, a fixed sum and the squared equality. The reference follows this strategy: Search ordered a/b candidates and derive c from the sum. Algebraic bounds reduce wasted candidates without changing the search contract.",
      "examples": [
        {
          "input": "sum=12",
          "output": "[(3,4,5)]"
        }
      ]
    },
    "rectangles": {
      "topics": [
        "grids",
        "search"
      ],
      "concept": "ASCII corners define a rectangle only when its whole perimeter is connected.",
      "strategy": "Choose corner pairs and check horizontal and vertical edge characters.",
      "edges": "Overlapping rectangles and intermediate plus junctions must also count.",
      "complexity": "O(candidate corners × perimeter checks).",
      "gameContext": "Detect framed regions in an ASCII level editor.",
      "tradeoffs": "A geometry search is clearer when edge validity is a separate helper.",
      "difficulty": 3,
      "prereqs": [
        "tile-collision"
      ],
      "hints": [
        "ASCII corners define a rectangle only when its whole perimeter is connected.",
        "Choose corner pairs and check horizontal and vertical edge characters.",
        "Overlapping rectangles and intermediate plus junctions must also count."
      ],
      "explanation": "ASCII corners define a rectangle only when its whole perimeter is connected. The reference follows this strategy: Choose corner pairs and check horizontal and vertical edge characters. A geometry search is clearer when edge validity is a separate helper.",
      "examples": [
        {
          "input": "['+-+', '| |', '+-+']",
          "output": "1"
        }
      ]
    },
    "robot-simulator": {
      "topics": [
        "state",
        "grids"
      ],
      "concept": "Each instruction changes either heading or position.",
      "strategy": "Represent heading as a cycle; only advance moves along the current direction.",
      "edges": "Turns must not move, and negative coordinates remain valid.",
      "complexity": "O(instructions) time.",
      "gameContext": "Replay a bot's movement commands deterministically.",
      "tradeoffs": "Keep orientation transitions separate from movement deltas.",
      "difficulty": 3,
      "prereqs": [
        "animation"
      ],
      "hints": [
        "Each instruction changes either heading or position.",
        "Represent heading as a cycle; only advance moves along the current direction.",
        "Turns must not move, and negative coordinates remain valid."
      ],
      "explanation": "Each instruction changes either heading or position. The reference follows this strategy: Represent heading as a cycle; only advance moves along the current direction. Keep orientation transitions separate from movement deltas.",
      "examples": [
        {
          "input": "position=(0,0), heading=north; instructions=RAA",
          "output": "position=(2,0), heading=east"
        }
      ]
    },
    "saddle-points": {
      "topics": [
        "arrays",
        "grids"
      ],
      "concept": "A candidate must be greatest in its row and least in its column.",
      "strategy": "Test both conditions, retaining all candidates and converting to the tested coordinate convention.",
      "edges": "Tied extrema, rectangular shapes and empty matrices require complete handling.",
      "complexity": "O(rows × cols × (rows + cols)) directly.",
      "gameContext": "Find special terrain/stat cells defined by two directional comparisons.",
      "tradeoffs": "Precomputed row maxima/column minima speed repeated queries at a memory cost.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "A candidate must be greatest in its row and least in its column.",
        "Test both conditions, retaining all candidates and converting to the tested coordinate convention.",
        "Tied extrema, rectangular shapes and empty matrices require complete handling."
      ],
      "explanation": "A candidate must be greatest in its row and least in its column. The reference follows this strategy: Test both conditions, retaining all candidates and converting to the tested coordinate convention. Precomputed row maxima/column minima speed repeated queries at a memory cost.",
      "examples": [
        {
          "input": "matrix=[[9,8,7],[5,3,2],[6,6,7]]",
          "output": "saddle at row 2, column 1 (one-based)"
        }
      ]
    },
    "sieve": {
      "topics": [
        "math",
        "search"
      ],
      "concept": "Multiples of a known prime cannot be new primes.",
      "strategy": "Maintain a composite marker array and mark multiples from each unmarked candidate.",
      "edges": "Limits below two and inclusive upper bounds need explicit handling.",
      "complexity": "O(n log log n) time, O(n) storage.",
      "gameContext": "Precompute a bounded set of valid puzzle numbers at level load.",
      "tradeoffs": "A one-time table is useful when runtime queries are frequent.",
      "difficulty": 3,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Multiples of a known prime cannot be new primes.",
        "Maintain a composite marker array and mark multiples from each unmarked candidate.",
        "Limits below two and inclusive upper bounds need explicit handling."
      ],
      "explanation": "Multiples of a known prime cannot be new primes. The reference follows this strategy: Maintain a composite marker array and mark multiples from each unmarked candidate. A one-time table is useful when runtime queries are frequent.",
      "examples": [
        {
          "input": "2",
          "output": "[2]"
        }
      ]
    },
    "simple-cipher": {
      "topics": [
        "strings",
        "security"
      ],
      "concept": "A repeating key supplies a different shift for each character.",
      "strategy": "Validate or generate the key, then cycle its positions during encode/decode.",
      "edges": "Short keys wrap, decoding reverses the shift, and invalid keys are rejected.",
      "complexity": "O(n) processing.",
      "gameContext": "Build a keyed inscription puzzle whose behavior is reproducible in tests.",
      "tradeoffs": "Random key generation should be separate from deterministic transformation.",
      "difficulty": 3,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "A repeating key supplies a different shift for each character.",
        "Validate or generate the key, then cycle its positions during encode/decode.",
        "Short keys wrap, decoding reverses the shift, and invalid keys are rejected."
      ],
      "explanation": "A repeating key supplies a different shift for each character. The reference follows this strategy: Validate or generate the key, then cycle its positions during encode/decode. Random key generation should be separate from deterministic transformation.",
      "examples": [
        {
          "input": "text=aaaa, key=abc",
          "output": "encode=abca; decode=aaaa"
        }
      ]
    },
    "simple-linked-list": {
      "topics": [
        "memory",
        "collections"
      ],
      "concept": "The head node gives constant-time access to the newest element.",
      "strategy": "Link/unlink nodes at the head and implement the required conversion/reversal operations.",
      "edges": "Empty pop, order during conversion and releasing every node need tests.",
      "complexity": "O(1) push/pop; O(n) traversal.",
      "gameContext": "Maintain a simple stack of pending game actions.",
      "tradeoffs": "Pointer-based nodes complicate ownership compared with a contiguous array.",
      "difficulty": 3,
      "prereqs": [
        "exercism-list-ops"
      ],
      "hints": [
        "The head node gives constant-time access to the newest element.",
        "Link/unlink nodes at the head and implement the required conversion/reversal operations.",
        "Empty pop, order during conversion and releasing every node need tests."
      ],
      "explanation": "The head node gives constant-time access to the newest element. The reference follows this strategy: Link/unlink nodes at the head and implement the required conversion/reversal operations. Pointer-based nodes complicate ownership compared with a contiguous array.",
      "examples": [
        {
          "input": "push 1; push 2; pop",
          "output": "2, then remaining head 1"
        }
      ]
    },
    "state-of-tic-tac-toe": {
      "topics": [
        "state",
        "grids"
      ],
      "concept": "Move counts and winning lines constrain which board states are possible.",
      "strategy": "Validate turn counts before classifying wins, draws or ongoing play.",
      "edges": "Simultaneous winners and a win with inconsistent counts are invalid.",
      "complexity": "O(board size), fixed for the exercise.",
      "gameContext": "Validate a saved turn-based board before resuming it.",
      "tradeoffs": "Winning-line detection alone is not enough to establish reachability.",
      "difficulty": 3,
      "prereqs": [
        "animation"
      ],
      "hints": [
        "Move counts and winning lines constrain which board states are possible.",
        "Validate turn counts before classifying wins, draws or ongoing play.",
        "Simultaneous winners and a win with inconsistent counts are invalid."
      ],
      "explanation": "Move counts and winning lines constrain which board states are possible. The reference follows this strategy: Validate turn counts before classifying wins, draws or ongoing play. Winning-line detection alone is not enough to establish reachability.",
      "examples": [
        {
          "input": "['XOO', 'X  ', 'X  ']",
          "output": "'win'"
        }
      ]
    },
    "strain": {
      "topics": [
        "arrays",
        "collections"
      ],
      "concept": "Keep and discard use complementary predicates over the same collection.",
      "strategy": "Walk once, append elements whose predicate result matches the selected mode.",
      "edges": "Empty input, all/none matches and nested values test generic behavior.",
      "complexity": "O(n) predicate calls and output storage.",
      "gameContext": "Select visible entities or remove expired effects with the same filtering mechanism.",
      "tradeoffs": "Generic predicates improve reuse while making ownership of output explicit.",
      "difficulty": 3,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Keep and discard use complementary predicates over the same collection.",
        "Walk once, append elements whose predicate result matches the selected mode.",
        "Empty input, all/none matches and nested values test generic behavior."
      ],
      "explanation": "Keep and discard use complementary predicates over the same collection. The reference follows this strategy: Walk once, append elements whose predicate result matches the selected mode. Generic predicates improve reuse while making ownership of output explicit.",
      "examples": [
        {
          "input": "[2, 4, 6, 8, 10], lambda x: x % 2 == 0",
          "output": "[2, 4, 6, 8, 10]"
        }
      ]
    },
    "tree-building": {
      "topics": [
        "graphs",
        "parsing"
      ],
      "concept": "Parent records describe a tree only if identifier and parent rules are consistent.",
      "strategy": "Sort/check records, create nodes, then connect each valid child to its parent.",
      "edges": "Missing/duplicate IDs, invalid roots and parent-order violations must fail.",
      "complexity": "O(n log n) with sorting.",
      "gameContext": "Load a scene hierarchy from a flat serialized record list.",
      "tradeoffs": "Validation at construction prevents impossible parent links during traversal.",
      "difficulty": 3,
      "prereqs": [
        "exercism-simple-linked-list"
      ],
      "hints": [
        "Parent records describe a tree only if identifier and parent rules are consistent.",
        "Sort/check records, create nodes, then connect each valid child to its parent.",
        "Missing/duplicate IDs, invalid roots and parent-order violations must fail."
      ],
      "explanation": "Parent records describe a tree only if identifier and parent rules are consistent. The reference follows this strategy: Sort/check records, create nodes, then connect each valid child to its parent. Validation at construction prevents impossible parent links during traversal.",
      "examples": [
        {
          "input": "records (id,parent)=[(0,0),(1,0),(2,1)]",
          "output": "root 0 → child 1 → child 2"
        }
      ]
    },
    "wordy": {
      "topics": [
        "parsing",
        "math"
      ],
      "concept": "A sentence encodes ordered arithmetic operations.",
      "strategy": "Tokenize the accepted grammar and evaluate left to right as required.",
      "edges": "Unknown operations, malformed operands and operand order must fail correctly.",
      "complexity": "O(tokens) time.",
      "gameContext": "Parse a tiny debug-console command language.",
      "tradeoffs": "Do not borrow usual mathematical precedence when the exercise specifies sequential evaluation.",
      "difficulty": 3,
      "prereqs": [
        "exercism-matching-brackets"
      ],
      "hints": [
        "A sentence encodes ordered arithmetic operations.",
        "Tokenize the accepted grammar and evaluate left to right as required.",
        "Unknown operations, malformed operands and operand order must fail correctly."
      ],
      "explanation": "A sentence encodes ordered arithmetic operations. The reference follows this strategy: Tokenize the accepted grammar and evaluate left to right as required. Do not borrow usual mathematical precedence when the exercise specifies sequential evaluation.",
      "examples": [
        {
          "input": "What is 1 plus 2 multiplied by 3?",
          "output": "9 (evaluate left to right)"
        }
      ]
    },
    "all-your-base": {
      "topics": [
        "math",
        "parsing"
      ],
      "concept": "A digit sequence can be converted through its positional value.",
      "strategy": "Validate both bases/digits, accumulate the value and repeatedly divide into the destination base.",
      "edges": "Zero, empty input, leading zeros and invalid bases need normalized results.",
      "complexity": "O(input digits + output digits), ignoring big-integer cost.",
      "gameContext": "Convert compact save identifiers between human-friendly alphabets.",
      "tradeoffs": "Large inputs may require wider arithmetic or a digit-wise conversion method.",
      "difficulty": 4,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "A digit sequence can be converted through its positional value.",
        "Validate both bases/digits, accumulate the value and repeatedly divide into the destination base.",
        "Zero, empty input, leading zeros and invalid bases need normalized results."
      ],
      "explanation": "A digit sequence can be converted through its positional value. The reference follows this strategy: Validate both bases/digits, accumulate the value and repeatedly divide into the destination base. Large inputs may require wider arithmetic or a digit-wise conversion method.",
      "examples": [
        {
          "input": "base=2, digits=[1,0,1,0], target base=10",
          "output": "[1,0]"
        }
      ]
    },
    "change": {
      "topics": [
        "optimization",
        "math"
      ],
      "concept": "The fewest coins is a global choice, not always a greedy choice.",
      "strategy": "Use dynamic programming for reachable amounts and reconstruct a minimum combination.",
      "edges": "Impossible amounts, zero target and denominations with greedy counterexamples are essential.",
      "complexity": "O(target × coin types) time, O(target) storage.",
      "gameContext": "Make exact change in an in-game shop with unusual denominations.",
      "tradeoffs": "Dynamic programming is predictable but scales with the numeric target.",
      "difficulty": 4,
      "prereqs": [
        "exercism-sum-of-multiples"
      ],
      "hints": [
        "The fewest coins is a global choice, not always a greedy choice.",
        "Use dynamic programming for reachable amounts and reconstruct a minimum combination.",
        "Impossible amounts, zero target and denominations with greedy counterexamples are essential."
      ],
      "explanation": "The fewest coins is a global choice, not always a greedy choice. The reference follows this strategy: Use dynamic programming for reachable amounts and reconstruct a minimum combination. Dynamic programming is predictable but scales with the numeric target.",
      "examples": [
        {
          "input": "[1, 5, 10, 25], 1",
          "output": "[1]"
        }
      ]
    },
    "complex-numbers": {
      "topics": [
        "math"
      ],
      "concept": "Real and imaginary parts obey paired arithmetic rules.",
      "strategy": "Implement each operation from its algebraic definition and normalize derived quantities.",
      "edges": "Division uses squared magnitude; zero divisors need the API's policy.",
      "complexity": "O(1) time and storage.",
      "gameContext": "Represent a 2D rotation or oscillation as a complex number.",
      "tradeoffs": "Complex arithmetic is concise for rotations but still needs clear coordinate conventions.",
      "difficulty": 4,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Real and imaginary parts obey paired arithmetic rules.",
        "Implement each operation from its algebraic definition and normalize derived quantities.",
        "Division uses squared magnitude; zero divisors need the API's policy."
      ],
      "explanation": "Real and imaginary parts obey paired arithmetic rules. The reference follows this strategy: Implement each operation from its algebraic definition and normalize derived quantities. Complex arithmetic is concise for rotations but still needs clear coordinate conventions.",
      "examples": [
        {
          "input": "a=1+2i, b=3+4i",
          "output": "a+b=4+6i; a*b=-5+10i"
        }
      ]
    },
    "flower-field": {
      "topics": [
        "grids"
      ],
      "concept": "Each empty cell displays the number of neighboring flowers.",
      "strategy": "Visit the eight neighboring offsets while keeping flower cells unchanged.",
      "edges": "Edges, empty rows and a fully occupied field reveal boundary errors.",
      "complexity": "O(cells) time with fixed-size neighborhoods.",
      "gameContext": "Annotate nearby hazards in a garden-like grid puzzle.",
      "tradeoffs": "A fresh output keeps source symbols available throughout the pass.",
      "difficulty": 4,
      "prereqs": [
        "tile-collision"
      ],
      "hints": [
        "Each empty cell displays the number of neighboring flowers.",
        "Visit the eight neighboring offsets while keeping flower cells unchanged.",
        "Edges, empty rows and a fully occupied field reveal boundary errors."
      ],
      "explanation": "Each empty cell displays the number of neighboring flowers. The reference follows this strategy: Visit the eight neighboring offsets while keeping flower cells unchanged. A fresh output keeps source symbols available throughout the pass.",
      "examples": [
        {
          "input": "rows=[\"   \",\" * \",\"   \"]",
          "output": "[\"111\",\"1*1\",\"111\"]"
        }
      ]
    },
    "food-chain": {
      "topics": [
        "strings",
        "arrays"
      ],
      "concept": "Each verse combines a new animal with a chain of earlier consequences.",
      "strategy": "Store animal names, special lines and the repeated chain fragments separately.",
      "edges": "The terminal animal and special middle verses break the normal template.",
      "complexity": "O(output length) time.",
      "gameContext": "Generate a cumulative encounter recap with exception lines.",
      "tradeoffs": "Data-driven repetition still needs explicit handling for genuine exceptions.",
      "difficulty": 4,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Each verse combines a new animal with a chain of earlier consequences.",
        "Store animal names, special lines and the repeated chain fragments separately.",
        "The terminal animal and special middle verses break the normal template."
      ],
      "explanation": "Each verse combines a new animal with a chain of earlier consequences. The reference follows this strategy: Store animal names, special lines and the repeated chain fragments separately. Data-driven repetition still needs explicit handling for genuine exceptions.",
      "examples": [
        {
          "input": "1, 1",
          "output": "['I know an old lady who swallowed a fly.', \"I don't know why she swallowed the fly. Perhaps she'll die.\"]"
        }
      ]
    },
    "go-counting": {
      "topics": [
        "grids",
        "graphs"
      ],
      "concept": "One empty connected region has one owner determined by all bordering stones.",
      "strategy": "Flood-fill orthogonal empty cells and gather the set of neighboring colors.",
      "edges": "Mixed/no colors mean unowned; stones are not territory and invalid coordinates fail.",
      "complexity": "O(cells) total traversal with visited tracking.",
      "gameContext": "Calculate owned empty regions in a territory-control game.",
      "tradeoffs": "Tracking visited regions once avoids refilling the same area for every coordinate.",
      "difficulty": 4,
      "prereqs": [
        "exercism-minesweeper"
      ],
      "hints": [
        "One empty connected region has one owner determined by all bordering stones.",
        "Flood-fill orthogonal empty cells and gather the set of neighboring colors.",
        "Mixed/no colors mean unowned; stones are not territory and invalid coordinates fail."
      ],
      "explanation": "One empty connected region has one owner determined by all bordering stones. The reference follows this strategy: Flood-fill orthogonal empty cells and gather the set of neighboring colors. Tracking visited regions once avoids refilling the same area for every coordinate.",
      "examples": [
        {
          "input": "board=[\" B \"]; territory at (0,0)",
          "output": "black owns {(0,0)}"
        }
      ]
    },
    "grep": {
      "topics": [
        "strings",
        "parsing"
      ],
      "concept": "Flags change matching and output formatting independently.",
      "strategy": "Read files in order, classify each line with the selected flags and then format matches.",
      "edges": "Case folding, inversion, whole-line matching, filenames and line numbers must combine correctly.",
      "complexity": "O(total text × pattern search cost).",
      "gameContext": "Search native game logs with a small fixed-string command.",
      "tradeoffs": "Keep matching separate from formatting so flags do not accidentally alter each other.",
      "difficulty": 4,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "Flags change matching and output formatting independently.",
        "Read files in order, classify each line with the selected flags and then format matches.",
        "Case folding, inversion, whole-line matching, filenames and line numbers must combine correctly."
      ],
      "explanation": "Flags change matching and output formatting independently. The reference follows this strategy: Read files in order, classify each line with the selected flags and then format matches. Keep matching separate from formatting so flags do not accidentally alter each other.",
      "examples": [
        {
          "input": "one file: \"one\\ntwo\\none\\n\"; pattern=\"one\"; flags=\"-n\"",
          "output": "\"1:one\\n3:one\\n\""
        }
      ]
    },
    "hangman": {
      "topics": [
        "state",
        "collections"
      ],
      "concept": "Guesses update revealed letters, remaining attempts and terminal state.",
      "strategy": "Record accepted guesses, reveal all occurrences and derive win/loss after each event.",
      "edges": "Repeated guesses cost attempts; actions after the game ends are errors.",
      "complexity": "O(word length) per guess.",
      "gameContext": "Implement a word minigame as an explicit state machine.",
      "tradeoffs": "A single transition function makes terminal-state rules easier to enforce.",
      "difficulty": 4,
      "prereqs": [
        "animation"
      ],
      "hints": [
        "Guesses update revealed letters, remaining attempts and terminal state.",
        "Record accepted guesses, reveal all occurrences and derive win/loss after each event.",
        "Repeated guesses cost attempts; actions after the game ends are errors."
      ],
      "explanation": "Guesses update revealed letters, remaining attempts and terminal state. The reference follows this strategy: Record accepted guesses, reveal all occurrences and derive win/loss after each event. A single transition function makes terminal-state rules easier to enforce.",
      "examples": [
        {
          "input": "word=\"banana\"; guess a",
          "output": "masked=\"_a_a_a\"; guesses unchanged"
        }
      ]
    },
    "killer-sudoku-helper": {
      "topics": [
        "search",
        "math"
      ],
      "concept": "Combinations must satisfy both a sum and a no-repeat digit constraint.",
      "strategy": "Backtrack over increasing allowed digits, pruning impossible partial sums.",
      "edges": "Excluded digits, cage size and cases with no combinations require complete results.",
      "complexity": "O(search combinations), pruned by constraints.",
      "gameContext": "Generate legal puzzle-cage candidates for a hint system.",
      "tradeoffs": "Pruning preserves correctness only when the bound rules out every completion.",
      "difficulty": 4,
      "prereqs": [
        "exercism-binary-search"
      ],
      "hints": [
        "Combinations must satisfy both a sum and a no-repeat digit constraint.",
        "Backtrack over increasing allowed digits, pruning impossible partial sums.",
        "Excluded digits, cage size and cases with no combinations require complete results."
      ],
      "explanation": "Combinations must satisfy both a sum and a no-repeat digit constraint. The reference follows this strategy: Backtrack over increasing allowed digits, pruning impossible partial sums. Pruning preserves correctness only when the bound rules out every completion.",
      "examples": [
        {
          "input": "1, 1, []",
          "output": "[[1]]"
        }
      ]
    },
    "largest-series-product": {
      "topics": [
        "arrays",
        "math"
      ],
      "concept": "Each fixed-size window contributes a product, and the maximum is retained.",
      "strategy": "Validate input/window size, then examine every consecutive window.",
      "edges": "Zero digits, length zero and invalid symbols affect the result or errors.",
      "complexity": "O(n × span) directly.",
      "gameContext": "Score the strongest consecutive streak of encoded move values.",
      "tradeoffs": "Rolling products require special handling for zero; recomputing is easier to get right.",
      "difficulty": 4,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Each fixed-size window contributes a product, and the maximum is retained.",
        "Validate input/window size, then examine every consecutive window.",
        "Zero digits, length zero and invalid symbols affect the result or errors."
      ],
      "explanation": "Each fixed-size window contributes a product, and the maximum is retained. The reference follows this strategy: Validate input/window size, then examine every consecutive window. Rolling products require special handling for zero; recomputing is easier to get right.",
      "examples": [
        {
          "input": "'29', 2",
          "output": "18"
        }
      ]
    },
    "ledger": {
      "topics": [
        "strings",
        "sorting"
      ],
      "concept": "A table must apply ordering, locale formatting and alignment consistently.",
      "strategy": "Parse entries, sort the required keys, then format dates, descriptions and signed money separately.",
      "edges": "Negative currency, thousands separators, truncation and tied entries need exact output.",
      "complexity": "O(n log n + output length).",
      "gameContext": "Render a shop transaction history with stable, locale-aware rows.",
      "tradeoffs": "Formatting by characters rather than bytes matters for Unicode currency symbols.",
      "difficulty": 4,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "A table must apply ordering, locale formatting and alignment consistently.",
        "Parse entries, sort the required keys, then format dates, descriptions and signed money separately.",
        "Negative currency, thousands separators, truncation and tied entries need exact output."
      ],
      "explanation": "A table must apply ordering, locale formatting and alignment consistently. The reference follows this strategy: Parse entries, sort the required keys, then format dates, descriptions and signed money separately. Formatting by characters rather than bytes matters for Unicode currency symbols.",
      "examples": [
        {
          "input": "'USD', 'en_US', [create_entry('2015-01-01', 'Buy present', -1000)]",
          "output": "'Date       | Description               | Change       \\n01/01/2015 | Buy present               |      ($10.00)'"
        }
      ]
    },
    "linked-list": {
      "topics": [
        "memory",
        "collections"
      ],
      "concept": "A doubly linked node has two neighboring links that must agree.",
      "strategy": "Update head/tail and both directions during push, pop, shift and unshift.",
      "edges": "Empty/single-node transitions and destructor cleanup expose broken links.",
      "complexity": "O(1) endpoint operations, O(n) storage.",
      "gameContext": "Manage a small ordered queue whose ends change independently.",
      "tradeoffs": "Links support cheap endpoint changes but sacrifice cache locality and require careful ownership.",
      "difficulty": 4,
      "prereqs": [
        "exercism-simple-linked-list"
      ],
      "hints": [
        "A doubly linked node has two neighboring links that must agree.",
        "Update head/tail and both directions during push, pop, shift and unshift.",
        "Empty/single-node transitions and destructor cleanup expose broken links."
      ],
      "explanation": "A doubly linked node has two neighboring links that must agree. The reference follows this strategy: Update head/tail and both directions during push, pop, shift and unshift. Links support cheap endpoint changes but sacrifice cache locality and require careful ownership.",
      "examples": [
        {
          "input": "push 1; push 2; shift; pop",
          "output": "shift=1; pop=2; list empty"
        }
      ]
    },
    "markdown": {
      "topics": [
        "parsing",
        "strings"
      ],
      "concept": "Block structure and inline emphasis are different parsing layers.",
      "strategy": "Process headers/lists/paragraphs while tracking list state, then convert supported emphasis.",
      "edges": "Close lists on a new block; preserve symbols that are not valid markup delimiters.",
      "complexity": "O(text length) for a direct scanner.",
      "gameContext": "Render simple help text or mod documentation.",
      "tradeoffs": "A limited grammar is manageable; a complete Markdown implementation is a larger parser.",
      "difficulty": 4,
      "prereqs": [
        "exercism-matching-brackets"
      ],
      "hints": [
        "Block structure and inline emphasis are different parsing layers.",
        "Process headers/lists/paragraphs while tracking list state, then convert supported emphasis.",
        "Close lists on a new block; preserve symbols that are not valid markup delimiters."
      ],
      "explanation": "Block structure and inline emphasis are different parsing layers. The reference follows this strategy: Process headers/lists/paragraphs while tracking list state, then convert supported emphasis. A limited grammar is manageable; a complete Markdown implementation is a larger parser.",
      "examples": [
        {
          "input": "'This will be a paragraph'",
          "output": "'<p>This will be a paragraph</p>'"
        }
      ]
    },
    "meetup": {
      "topics": [
        "time",
        "search"
      ],
      "concept": "An ordinal weekday selects one date within a specific month.",
      "strategy": "Find the first matching weekday in the requested range or work backwards from month end.",
      "edges": "Teenth dates, leap February and impossible fifth occurrences test calendar assumptions.",
      "complexity": "O(1) calendar arithmetic or a bounded month scan.",
      "gameContext": "Schedule recurring community events in a game calendar.",
      "tradeoffs": "Use civil-date arithmetic instead of assuming every month has the same length.",
      "difficulty": 4,
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "An ordinal weekday selects one date within a specific month.",
        "Find the first matching weekday in the requested range or work backwards from month end.",
        "Teenth dates, leap February and impossible fifth occurrences test calendar assumptions."
      ],
      "explanation": "An ordinal weekday selects one date within a specific month. The reference follows this strategy: Find the first matching weekday in the requested range or work backwards from month end. Use civil-date arithmetic instead of assuming every month has the same length.",
      "examples": [
        {
          "input": "2013, 5, 'teenth', 'Monday'",
          "output": "'2013-05-13'"
        }
      ]
    },
    "minesweeper": {
      "topics": [
        "grids"
      ],
      "concept": "Each non-mine cell counts adjacent mines from the unchanged board.",
      "strategy": "Scan the eight neighbor offsets and render zero as the required blank.",
      "edges": "Corners, edges, empty boards and existing mines must be preserved.",
      "complexity": "O(cells) time.",
      "gameContext": "Build a local hazard proximity display.",
      "tradeoffs": "Centralizing bounds checks makes all neighbor-counting mechanics safer.",
      "difficulty": 4,
      "prereqs": [
        "tile-collision"
      ],
      "hints": [
        "Each non-mine cell counts adjacent mines from the unchanged board.",
        "Scan the eight neighbor offsets and render zero as the required blank.",
        "Corners, edges, empty boards and existing mines must be preserved."
      ],
      "explanation": "Each non-mine cell counts adjacent mines from the unchanged board. The reference follows this strategy: Scan the eight neighbor offsets and render zero as the required blank. Centralizing bounds checks makes all neighbor-counting mechanics safer.",
      "examples": [
        {
          "input": "rows=[\" * \",\"   \"]",
          "output": "[\"1*1\",\"111\"]"
        }
      ]
    },
    "palindrome-products": {
      "topics": [
        "math",
        "search"
      ],
      "concept": "Extremal palindromes need all factor pairs, not just one pair.",
      "strategy": "Enumerate ordered factor pairs, detect palindromic products and track equal extrema's pairs.",
      "edges": "Invalid ranges, no solutions and one palindrome that is both extrema need tests.",
      "complexity": "O(range² × digit count).",
      "gameContext": "Generate mirrored-number shop puzzles and all valid explanations.",
      "tradeoffs": "Brute force is clear; pruning helps only when it still preserves every factor pair.",
      "difficulty": 4,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Extremal palindromes need all factor pairs, not just one pair.",
        "Enumerate ordered factor pairs, detect palindromic products and track equal extrema's pairs.",
        "Invalid ranges, no solutions and one palindrome that is both extrema need tests."
      ],
      "explanation": "Extremal palindromes need all factor pairs, not just one pair. The reference follows this strategy: Enumerate ordered factor pairs, detect palindromic products and track equal extrema's pairs. Brute force is clear; pruning helps only when it still preserves every factor pair.",
      "examples": [
        {
          "input": "factors range 1..9",
          "output": "smallest=1 with (1,1); largest=9 with (1,9),(3,3)"
        }
      ]
    },
    "pascals-triangle": {
      "topics": [
        "arrays",
        "math"
      ],
      "concept": "Every inner entry is the sum of two entries from the preceding row.",
      "strategy": "Begin with the edge ones and build each next row from its predecessor.",
      "edges": "Zero rows, the first row and integer width affect the output.",
      "complexity": "O(rows²) time and output storage.",
      "gameContext": "Generate weighted branching counts for a combinatorial puzzle.",
      "tradeoffs": "Keeping only one row saves working memory when the full triangle is not needed.",
      "difficulty": 4,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Every inner entry is the sum of two entries from the preceding row.",
        "Begin with the edge ones and build each next row from its predecessor.",
        "Zero rows, the first row and integer width affect the output."
      ],
      "explanation": "Every inner entry is the sum of two entries from the preceding row. The reference follows this strategy: Begin with the edge ones and build each next row from its predecessor. Keeping only one row saves working memory when the full triangle is not needed.",
      "examples": [
        {
          "input": "rows=4",
          "output": "[[1],[1,1],[1,2,1],[1,3,3,1]]"
        }
      ]
    },
    "rail-fence-cipher": {
      "topics": [
        "strings",
        "grids"
      ],
      "concept": "A zigzag route assigns each character to one rail.",
      "strategy": "Track direction between first/last rail; for decoding count rail positions before filling them.",
      "edges": "One rail, short messages and rail counts larger than text need sensible handling.",
      "complexity": "O(text length) time and storage.",
      "gameContext": "Rearrange a puzzle message along a visible zigzag path.",
      "tradeoffs": "Decode reconstructs the route, rather than simply running encode backwards.",
      "difficulty": 4,
      "prereqs": [
        "exercism-two-fer"
      ],
      "hints": [
        "A zigzag route assigns each character to one rail.",
        "Track direction between first/last rail; for decoding count rail positions before filling them.",
        "One rail, short messages and rail counts larger than text need sensible handling."
      ],
      "explanation": "A zigzag route assigns each character to one rail. The reference follows this strategy: Track direction between first/last rail; for decoding count rail positions before filling them. Decode reconstructs the route, rather than simply running encode backwards.",
      "examples": [
        {
          "input": "text=\"WEAREDISCOVEREDFLEEATONCE\", rails=3",
          "output": "\"WECRLTEERDSOEEFEAOCAIVDEN\""
        }
      ]
    },
    "scale-generator": {
      "topics": [
        "collections",
        "math"
      ],
      "concept": "A sequence of intervals advances through a chosen chromatic spelling.",
      "strategy": "Choose sharp/flat note spelling, then accumulate interval steps from the tonic.",
      "edges": "Enharmonic names and mixed-size intervals must match the specified spelling.",
      "complexity": "O(notes in scale).",
      "gameContext": "Generate pitch sets for procedural music cues.",
      "tradeoffs": "Musical spelling is domain data, not just pitch-class arithmetic.",
      "difficulty": 4,
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "A sequence of intervals advances through a chosen chromatic spelling.",
        "Choose sharp/flat note spelling, then accumulate interval steps from the tonic.",
        "Enharmonic names and mixed-size intervals must match the specified spelling."
      ],
      "explanation": "A sequence of intervals advances through a chosen chromatic spelling. The reference follows this strategy: Choose sharp/flat note spelling, then accumulate interval steps from the tonic. Musical spelling is domain data, not just pitch-class arithmetic.",
      "examples": [
        {
          "input": "'C').chromatic(",
          "output": "['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']"
        }
      ]
    },
    "spiral-matrix": {
      "topics": [
        "grids",
        "simulation"
      ],
      "concept": "A spiral fills shrinking perimeter layers.",
      "strategy": "Maintain top/bottom/left/right boundaries and advance each after one side.",
      "edges": "Zero size and odd-sized center cells reveal duplicated writes.",
      "complexity": "O(n²) time and output storage.",
      "gameContext": "Assign discovery order to tiles in a spiral reveal effect.",
      "tradeoffs": "Boundary loops avoid carrying a visited set for a regular shape.",
      "difficulty": 4,
      "prereqs": [
        "tile-collision"
      ],
      "hints": [
        "A spiral fills shrinking perimeter layers.",
        "Maintain top/bottom/left/right boundaries and advance each after one side.",
        "Zero size and odd-sized center cells reveal duplicated writes."
      ],
      "explanation": "A spiral fills shrinking perimeter layers. The reference follows this strategy: Maintain top/bottom/left/right boundaries and advance each after one side. Boundary loops avoid carrying a visited set for a regular shape.",
      "examples": [
        {
          "input": "size=3",
          "output": "[[1,2,3],[8,9,4],[7,6,5]]"
        }
      ]
    },
    "swift-scheduling": {
      "topics": [
        "time",
        "parsing"
      ],
      "concept": "Delivery descriptions map an input timestamp to rule-based calendar targets.",
      "strategy": "Parse the requested description, determine its calendar boundary and preserve the required time policy.",
      "edges": "Week/month/year rollover and relative versus fixed deadlines need separate rules.",
      "complexity": "Bounded calendar operations per description.",
      "gameContext": "Schedule a game's delivery quest with human-friendly deadlines.",
      "tradeoffs": "Keep description parsing distinct from date arithmetic to make each rule inspectable.",
      "difficulty": 4,
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "Delivery descriptions map an input timestamp to rule-based calendar targets.",
        "Parse the requested description, determine its calendar boundary and preserve the required time policy.",
        "Week/month/year rollover and relative versus fixed deadlines need separate rules."
      ],
      "explanation": "Delivery descriptions map an input timestamp to rule-based calendar targets. The reference follows this strategy: Parse the requested description, determine its calendar boundary and preserve the required time policy. Keep description parsing distinct from date arithmetic to make each rule inspectable.",
      "examples": [
        {
          "input": "'2012-02-13T09:00:00', 'NOW'",
          "output": "'2012-02-13T11:00:00'"
        }
      ]
    },
    "tournament": {
      "topics": [
        "parsing",
        "sorting"
      ],
      "concept": "Match outcomes update two teams' aggregate records.",
      "strategy": "Parse each result, update both teams, then sort by points and the tie-break rule.",
      "edges": "Unknown outcomes, new teams and tied standings must keep stable formatting.",
      "complexity": "O(matches + teams log teams).",
      "gameContext": "Build a league table for AI tournaments.",
      "tradeoffs": "Store numeric records first and render the final table once.",
      "difficulty": 4,
      "prereqs": [
        "exercism-matching-brackets"
      ],
      "hints": [
        "Match outcomes update two teams' aggregate records.",
        "Parse each result, update both teams, then sort by points and the tie-break rule.",
        "Unknown outcomes, new teams and tied standings must keep stable formatting."
      ],
      "explanation": "Match outcomes update two teams' aggregate records. The reference follows this strategy: Parse each result, update both teams, then sort by points and the tie-break rule. Store numeric records first and render the final table once.",
      "examples": [
        {
          "input": "Allegoric Alaskans;Blithering Badgers;win",
          "output": "Alaskans: MP=1,W=1,P=3; Badgers: MP=1,L=1,P=0"
        }
      ]
    },
    "trinary": {
      "topics": [
        "math",
        "parsing"
      ],
      "concept": "Base-three conversion uses the same positional fold with a smaller alphabet.",
      "strategy": "Multiply the prefix by three and add the next digit after validation.",
      "edges": "Only zero, one and two are valid; malformed input follows the tested failure contract.",
      "complexity": "O(d) digit processing.",
      "gameContext": "Experiment with a three-state terrain encoding.",
      "tradeoffs": "The validation policy differs across native exercises, so check this bundle's exact tests.",
      "difficulty": 4,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Base-three conversion uses the same positional fold with a smaller alphabet.",
        "Multiply the prefix by three and add the next digit after validation.",
        "Only zero, one and two are valid; malformed input follows the tested failure contract."
      ],
      "explanation": "Base-three conversion uses the same positional fold with a smaller alphabet. The reference follows this strategy: Multiply the prefix by three and add the next digit after validation. The validation policy differs across native exercises, so check this bundle's exact tests.",
      "examples": [
        {
          "input": "'1'",
          "output": "1"
        }
      ]
    },
    "variable-length-quantity": {
      "topics": [
        "bitwise",
        "parsing"
      ],
      "concept": "Seven-bit payload groups use a continuation bit to frame each integer.",
      "strategy": "Split values into groups when encoding; accumulate until a terminating group while decoding.",
      "edges": "An unfinished final value and overflow must not be accepted as complete data.",
      "complexity": "O(encoded bytes) time.",
      "gameContext": "Pack small counters in a replay or network-message fixture.",
      "tradeoffs": "Compactness adds framing errors that a fixed-width representation does not have.",
      "difficulty": 4,
      "prereqs": [
        "exercism-binary"
      ],
      "hints": [
        "Seven-bit payload groups use a continuation bit to frame each integer.",
        "Split values into groups when encoding; accumulate until a terminating group while decoding.",
        "An unfinished final value and overflow must not be accepted as complete data."
      ],
      "explanation": "Seven-bit payload groups use a continuation bit to frame each integer. The reference follows this strategy: Split values into groups when encoding; accumulate until a terminating group while decoding. Compactness adds framing errors that a fixed-width representation does not have.",
      "examples": [
        {
          "input": "value=128",
          "output": "encoded bytes=[0x81,0x00]; decode=128"
        }
      ]
    },
    "binary-search-tree": {
      "topics": [
        "graphs",
        "memory"
      ],
      "concept": "Insertion places smaller/larger values along different child branches.",
      "strategy": "Walk to the insertion position, then expose the required traversal/search behavior.",
      "edges": "Duplicate placement, empty trees and traversal ordering need the declared policy.",
      "complexity": "O(height) insert/search; O(n) traversal.",
      "gameContext": "Index small scene data by a numeric key.",
      "tradeoffs": "An unbalanced tree can become linear; balancing changes implementation complexity.",
      "difficulty": 5,
      "prereqs": [
        "exercism-tree-building"
      ],
      "hints": [
        "Insertion places smaller/larger values along different child branches.",
        "Walk to the insertion position, then expose the required traversal/search behavior.",
        "Duplicate placement, empty trees and traversal ordering need the declared policy."
      ],
      "explanation": "Insertion places smaller/larger values along different child branches. The reference follows this strategy: Walk to the insertion position, then expose the required traversal/search behavior. An unbalanced tree can become linear; balancing changes implementation complexity.",
      "examples": [
        {
          "input": "insert [4,2,6,1,3]",
          "output": "in-order traversal [1,2,3,4,6]"
        }
      ]
    },
    "bowling": {
      "topics": [
        "state",
        "simulation"
      ],
      "concept": "Bonuses depend on future rolls, so frame count and score cannot share one cursor.",
      "strategy": "Validate rolls/frame transitions, then apply strike/spare bonuses over the roll stream.",
      "edges": "The tenth frame and incomplete/extra rolls are the hardest boundary cases.",
      "complexity": "O(rolls), bounded for a game.",
      "gameContext": "Score a minigame with delayed rewards and terminal-state validation.",
      "tradeoffs": "Storing rolls separates future-dependent scoring from accepting input events.",
      "difficulty": 5,
      "prereqs": [
        "animation"
      ],
      "hints": [
        "Bonuses depend on future rolls, so frame count and score cannot share one cursor.",
        "Validate rolls/frame transitions, then apply strike/spare bonuses over the roll stream.",
        "The tenth frame and incomplete/extra rolls are the hardest boundary cases."
      ],
      "explanation": "Bonuses depend on future rolls, so frame count and score cannot share one cursor. The reference follows this strategy: Validate rolls/frame transitions, then apply strike/spare bonuses over the roll stream. Storing rolls separates future-dependent scoring from accepting input events.",
      "examples": [
        {
          "input": "20 rolls of 1",
          "output": "score 20"
        }
      ]
    },
    "camicia": {
      "topics": [
        "simulation",
        "collections"
      ],
      "concept": "Penalty cards change who plays and who collects the central pile.",
      "strategy": "Model decks, turn, pile and debt explicitly; record normalized states to detect loops.",
      "edges": "Payment chains, empty decks and number-card equivalence affect termination counts.",
      "complexity": "O(cards played × deck/state work), with stored states.",
      "gameContext": "Study a card-game simulation that can loop forever.",
      "tradeoffs": "Loop detection needs the complete behavior-relevant state, not a step-count guess.",
      "difficulty": 5,
      "prereqs": [
        "movement"
      ],
      "hints": [
        "Penalty cards change who plays and who collects the central pile.",
        "Model decks, turn, pile and debt explicitly; record normalized states to detect loops.",
        "Payment chains, empty decks and number-card equivalence affect termination counts."
      ],
      "explanation": "Penalty cards change who plays and who collects the central pile. The reference follows this strategy: Model decks, turn, pile and debt explicitly; record normalized states to detect loops. Loop detection needs the complete behavior-relevant state, not a step-count guess.",
      "examples": [
        {
          "input": "['2'], ['3']",
          "output": "{'status': 'finished', 'cards': 2, 'tricks': 1}"
        }
      ]
    },
    "custom-set": {
      "topics": [
        "collections",
        "memory"
      ],
      "concept": "A set eliminates duplicates and defines relations independent of order.",
      "strategy": "Build membership first, then express subset, disjointness and set algebra through it.",
      "edges": "Empty-set identities and duplicates should hold across every operation.",
      "complexity": "O(nm) for linear membership; hash storage can reduce expected costs.",
      "gameContext": "Track unique active effects and combine overlapping entity groups.",
      "tradeoffs": "A custom representation makes ordering and allocation tradeoffs visible.",
      "difficulty": 5,
      "prereqs": [
        "exercism-list-ops"
      ],
      "hints": [
        "A set eliminates duplicates and defines relations independent of order.",
        "Build membership first, then express subset, disjointness and set algebra through it.",
        "Empty-set identities and duplicates should hold across every operation."
      ],
      "explanation": "A set eliminates duplicates and defines relations independent of order. The reference follows this strategy: Build membership first, then express subset, disjointness and set algebra through it. A custom representation makes ordering and allocation tradeoffs visible.",
      "examples": [
        {
          "input": "left={1,2,3}, right={3,4}",
          "output": "intersection={3}; union={1,2,3,4}"
        }
      ]
    },
    "dot-dsl": {
      "topics": [
        "parsing",
        "graphs"
      ],
      "concept": "A graph description contains typed nodes, edges and attributes.",
      "strategy": "Validate each item kind/shape and build the corresponding ordered graph records.",
      "edges": "Malformed tuples, unknown kinds and repeated attributes need explicit outcomes.",
      "complexity": "O(description size), plus attribute lookup work.",
      "gameContext": "Define a small scene/state graph configuration language.",
      "tradeoffs": "Typed intermediate records are easier to validate than passing raw tuples through runtime code.",
      "difficulty": 5,
      "prereqs": [
        "exercism-matching-brackets"
      ],
      "hints": [
        "A graph description contains typed nodes, edges and attributes.",
        "Validate each item kind/shape and build the corresponding ordered graph records.",
        "Malformed tuples, unknown kinds and repeated attributes need explicit outcomes."
      ],
      "explanation": "A graph description contains typed nodes, edges and attributes. The reference follows this strategy: Validate each item kind/shape and build the corresponding ordered graph records. Typed intermediate records are easier to validate than passing raw tuples through runtime code.",
      "examples": [
        {
          "input": "node a; node b; edge a→b; title=\"scene\"",
          "output": "2 nodes, 1 edge, graph title=\"scene\""
        }
      ]
    },
    "forth": {
      "topics": [
        "parsing",
        "state"
      ],
      "concept": "A stack language evaluates words against both a data stack and a dictionary.",
      "strategy": "Resolve definitions at definition time, then execute their captured operations.",
      "edges": "Underflow, divide-by-zero, case folding and redefining words expose dictionary semantics.",
      "complexity": "O(executed operations), with stack and definition storage.",
      "gameContext": "Build a tiny scripting VM for gameplay commands.",
      "tradeoffs": "Capturing old definitions prevents later redefinitions from silently changing earlier words.",
      "difficulty": 5,
      "prereqs": [
        "exercism-matching-brackets",
        "exercism-list-ops"
      ],
      "hints": [
        "A stack language evaluates words against both a data stack and a dictionary.",
        "Resolve definitions at definition time, then execute their captured operations.",
        "Underflow, divide-by-zero, case folding and redefining words expose dictionary semantics."
      ],
      "explanation": "A stack language evaluates words against both a data stack and a dictionary. The reference follows this strategy: Resolve definitions at definition time, then execute their captured operations. Capturing old definitions prevents later redefinitions from silently changing earlier words.",
      "examples": [
        {
          "input": "instructions=\"1 2 + 4 *\"",
          "output": "stack=[12]"
        }
      ]
    },
    "knapsack": {
      "topics": [
        "optimization",
        "math"
      ],
      "concept": "The best value under a weight limit may require excluding an attractive item.",
      "strategy": "Use include/exclude dynamic programming or memoized search over items and remaining capacity.",
      "edges": "Each item is usable once; zero capacity and combinations beating a greedy pick matter.",
      "complexity": "O(items × capacity) for a capacity DP.",
      "gameContext": "Select a bot's equipment within a carried-weight budget.",
      "tradeoffs": "A weight-based table is efficient only when capacity is reasonably bounded.",
      "difficulty": 5,
      "prereqs": [
        "exercism-change"
      ],
      "hints": [
        "The best value under a weight limit may require excluding an attractive item.",
        "Use include/exclude dynamic programming or memoized search over items and remaining capacity.",
        "Each item is usable once; zero capacity and combinations beating a greedy pick matter."
      ],
      "explanation": "The best value under a weight limit may require excluding an attractive item. The reference follows this strategy: Use include/exclude dynamic programming or memoized search over items and remaining capacity. A weight-based table is efficient only when capacity is reasonably bounded.",
      "examples": [
        {
          "input": "capacity=5; (weight,value)=[(2,3),(3,4),(4,5)]",
          "output": "maximum value=7 using the first two items"
        }
      ]
    },
    "rational-numbers": {
      "topics": [
        "math"
      ],
      "concept": "Fractions represent exact ratios and should be reduced consistently.",
      "strategy": "Use greatest-common-divisor normalization, then implement operations over numerator/denominator pairs.",
      "edges": "Normalize signs, reject zero denominators and check division by zero fractions.",
      "complexity": "O(log magnitudes) normalization.",
      "gameContext": "Keep exact fractional resource rates without accumulated floating error.",
      "tradeoffs": "Integer products can overflow even when the final reduced fraction is small.",
      "difficulty": 5,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Fractions represent exact ratios and should be reduced consistently.",
        "Use greatest-common-divisor normalization, then implement operations over numerator/denominator pairs.",
        "Normalize signs, reject zero denominators and check division by zero fractions."
      ],
      "explanation": "Fractions represent exact ratios and should be reduced consistently. The reference follows this strategy: Use greatest-common-divisor normalization, then implement operations over numerator/denominator pairs. Integer products can overflow even when the final reduced fraction is small.",
      "examples": [
        {
          "input": "1/2 + 1/3",
          "output": "5/6"
        }
      ]
    },
    "relative-distance": {
      "topics": [
        "graphs",
        "search"
      ],
      "concept": "Distance between people is the shortest path through permitted family relationships.",
      "strategy": "Construct the relationship graph and use breadth-first search with visited tracking.",
      "edges": "Disconnected nodes, self-distance and multiple routes need the correct reachability policy.",
      "complexity": "O(vertices + edges).",
      "gameContext": "Find degrees of connection between entities in a relationship system.",
      "tradeoffs": "BFS is suitable for equal-cost edges; weighted links need another algorithm.",
      "difficulty": 5,
      "prereqs": [
        "exercism-connect"
      ],
      "hints": [
        "Distance between people is the shortest path through permitted family relationships.",
        "Construct the relationship graph and use breadth-first search with visited tracking.",
        "Disconnected nodes, self-distance and multiple routes need the correct reachability policy."
      ],
      "explanation": "Distance between people is the shortest path through permitted family relationships. The reference follows this strategy: Construct the relationship graph and use breadth-first search with visited tracking. BFS is suitable for equal-cost edges; weighted links need another algorithm.",
      "examples": [
        {
          "input": "Alice→Bob→Cara; distance Alice to Cara",
          "output": "2 relationship edges"
        }
      ]
    },
    "zebra-puzzle": {
      "topics": [
        "search",
        "optimization"
      ],
      "concept": "Constraints eliminate inconsistent assignments before a complete arrangement is built.",
      "strategy": "Choose constrained properties first and backtrack while checking partial relationships.",
      "edges": "All uniqueness, adjacency and relative-position constraints must hold together.",
      "complexity": "O(search assignments), strongly reduced by pruning.",
      "gameContext": "Build an explainable logic-puzzle generator/solver.",
      "tradeoffs": "Constraint ordering can dominate performance without changing the final solution.",
      "difficulty": 5,
      "prereqs": [
        "exercism-killer-sudoku-helper"
      ],
      "hints": [
        "Constraints eliminate inconsistent assignments before a complete arrangement is built.",
        "Choose constrained properties first and backtrack while checking partial relationships.",
        "All uniqueness, adjacency and relative-position constraints must hold together."
      ],
      "explanation": "Constraints eliminate inconsistent assignments before a complete arrangement is built. The reference follows this strategy: Choose constrained properties first and backtrack while checking partial relationships. Constraint ordering can dominate performance without changing the final solution.",
      "examples": [
        {
          "input": "apply all house, color, nationality, drink, pet and position constraints",
          "output": "Norwegian drinks water; Japanese owns the zebra"
        }
      ]
    },
    "affine-cipher": {
      "topics": [
        "math",
        "security"
      ],
      "concept": "Decoding requires a multiplicative inverse modulo the alphabet size.",
      "strategy": "Validate coprimality, apply the affine transformation and use its modular inverse for decode.",
      "edges": "Noninvertible keys fail; normalize symbols and output grouping according to the contract.",
      "complexity": "O(text + log modulus).",
      "gameContext": "Encode a puzzle message with two numeric key parameters.",
      "tradeoffs": "An invertibility check is essential; a key can look valid but make decoding impossible.",
      "difficulty": 6,
      "prereqs": [
        "exercism-difference-of-squares"
      ],
      "hints": [
        "Decoding requires a multiplicative inverse modulo the alphabet size.",
        "Validate coprimality, apply the affine transformation and use its modular inverse for decode.",
        "Noninvertible keys fail; normalize symbols and output grouping according to the contract."
      ],
      "explanation": "Decoding requires a multiplicative inverse modulo the alphabet size. The reference follows this strategy: Validate coprimality, apply the affine transformation and use its modular inverse for decode. An invertibility check is essential; a key can look valid but make decoding impossible.",
      "examples": [
        {
          "input": "'yes', 5, 7",
          "output": "'xbt'"
        }
      ]
    },
    "alphametics": {
      "topics": [
        "search",
        "math"
      ],
      "concept": "Distinct letters are digits and each column constrains a carry.",
      "strategy": "Search digit assignments from low columns, rejecting used digits and leading zeros early.",
      "edges": "More than ten letters, impossible carries and repeated addends must be handled.",
      "complexity": "Exponential search, pruned by column constraints.",
      "gameContext": "Generate a letter-number puzzle whose solution obeys an exact arithmetic equation.",
      "tradeoffs": "Column-wise pruning avoids enumerating every full digit permutation blindly.",
      "difficulty": 6,
      "prereqs": [
        "exercism-killer-sudoku-helper"
      ],
      "hints": [
        "Distinct letters are digits and each column constrains a carry.",
        "Search digit assignments from low columns, rejecting used digits and leading zeros early.",
        "More than ten letters, impossible carries and repeated addends must be handled."
      ],
      "explanation": "Distinct letters are digits and each column constrains a carry. The reference follows this strategy: Search digit assignments from low columns, rejecting used digits and leading zeros early. Column-wise pruning avoids enumerating every full digit permutation blindly.",
      "examples": [
        {
          "input": "'I + BB == ILL'",
          "output": "{'I': 1, 'B': 9, 'L': 0}"
        }
      ]
    },
    "bank-account": {
      "topics": [
        "state",
        "memory"
      ],
      "concept": "Lifecycle and balance mutations must agree even across concurrent access.",
      "strategy": "Serialize state checks with the corresponding update and reset balance when reopening.",
      "edges": "Closed accounts, repeated open/close, nonpositive amounts and overdrafts must fail atomically.",
      "complexity": "O(1) operations, synchronized shared state.",
      "gameContext": "Protect a shared currency account from duplicate or racing transactions.",
      "tradeoffs": "Lock scope must include validation plus mutation, not only the final write.",
      "difficulty": 6,
      "prereqs": [
        "inventory",
        "exercism-circular-buffer"
      ],
      "hints": [
        "Lifecycle and balance mutations must agree even across concurrent access.",
        "Serialize state checks with the corresponding update and reset balance when reopening.",
        "Closed accounts, repeated open/close, nonpositive amounts and overdrafts must fail atomically."
      ],
      "explanation": "Lifecycle and balance mutations must agree even across concurrent access. The reference follows this strategy: Serialize state checks with the corresponding update and reset balance when reopening. Lock scope must include validation plus mutation, not only the final write.",
      "examples": [
        {
          "input": "open; deposit 100; withdraw 25",
          "output": "balance 75"
        }
      ]
    },
    "react": {
      "topics": [
        "graphs",
        "state"
      ],
      "concept": "Derived cells form a dependency graph whose callbacks observe the final propagated values.",
      "strategy": "Update dependencies first, then issue callbacks only for changed final values.",
      "edges": "Diamond dependencies, unchanged outputs and removing callbacks expose ordering bugs.",
      "complexity": "O(affected graph + callbacks), depending on traversal strategy.",
      "gameContext": "Drive UI health bars and derived stats from reactive game data.",
      "tradeoffs": "Immediate callbacks can observe intermediate values; batching avoids inconsistent notifications.",
      "difficulty": 6,
      "prereqs": [
        "exercism-tree-building",
        "animation"
      ],
      "hints": [
        "Derived cells form a dependency graph whose callbacks observe the final propagated values.",
        "Update dependencies first, then issue callbacks only for changed final values.",
        "Diamond dependencies, unchanged outputs and removing callbacks expose ordering bugs."
      ],
      "explanation": "Derived cells form a dependency graph whose callbacks observe the final propagated values. The reference follows this strategy: Update dependencies first, then issue callbacks only for changed final values. Immediate callbacks can observe intermediate values; batching avoids inconsistent notifications.",
      "examples": [
        {
          "input": "input=2; computed=input×2; set input=3",
          "output": "computed=6; callback fires once for final change"
        }
      ]
    },
    "two-bucket": {
      "topics": [
        "graphs",
        "search"
      ],
      "concept": "A state is the pair of bucket volumes, with allowed fill/empty/pour transitions.",
      "strategy": "Explore valid states from the required starting bucket and retain the move count.",
      "edges": "Impossible goals, starting-bucket rules and which bucket ends with the goal matter.",
      "complexity": "O(capacity-state space), with visited storage.",
      "gameContext": "Solve a water-measuring puzzle using shortest-state search.",
      "tradeoffs": "Modeling all legal transitions is safer than a formula that misses start restrictions.",
      "difficulty": 6,
      "prereqs": [
        "exercism-relative-distance"
      ],
      "hints": [
        "A state is the pair of bucket volumes, with allowed fill/empty/pour transitions.",
        "Explore valid states from the required starting bucket and retain the move count.",
        "Impossible goals, starting-bucket rules and which bucket ends with the goal matter."
      ],
      "explanation": "A state is the pair of bucket volumes, with allowed fill/empty/pour transitions. The reference follows this strategy: Explore valid states from the required starting bucket and retain the move count. Modeling all legal transitions is safer than a formula that misses start restrictions.",
      "examples": [
        {
          "input": "3, 5, 1, 'one'",
          "output": "(4, 'one', 5)"
        }
      ]
    },
    "word-search": {
      "topics": [
        "grids",
        "search"
      ],
      "concept": "Each candidate start and direction defines an ordered character path.",
      "strategy": "Try matching from every valid start across the permitted directions.",
      "edges": "Reverse directions, overlaps, out-of-bounds paths and missing words need complete results.",
      "complexity": "O(words × cells × word length × directions).",
      "gameContext": "Locate clue words in a generated board.",
      "tradeoffs": "Early mismatch rejection keeps a straightforward search practical for small boards.",
      "difficulty": 6,
      "prereqs": [
        "exercism-matrix",
        "exercism-reverse-string"
      ],
      "hints": [
        "Each candidate start and direction defines an ordered character path.",
        "Try matching from every valid start across the permitted directions.",
        "Reverse directions, overlaps, out-of-bounds paths and missing words need complete results."
      ],
      "explanation": "Each candidate start and direction defines an ordered character path. The reference follows this strategy: Try matching from every valid start across the permitted directions. Early mismatch rejection keeps a straightforward search practical for small boards.",
      "examples": [
        {
          "input": "board=[\"ABC\",\"DEF\"], word=\"BC\"",
          "output": "start=(1,0), end=(2,0), zero-based x/y"
        }
      ]
    },
    "zipper": {
      "topics": [
        "graphs",
        "memory"
      ],
      "concept": "A focused subtree plus its path context can reconstruct the whole tree.",
      "strategy": "Store parent context and sibling data while navigating, then rebuild on the way up.",
      "edges": "Root navigation, replacing the focus and preserving untouched branches need tests.",
      "complexity": "O(depth) reconstruction; local navigation depends on representation.",
      "gameContext": "Edit a focused scene-tree branch without losing the surrounding hierarchy.",
      "tradeoffs": "Persistent reconstruction preserves prior trees but may allocate new path nodes.",
      "difficulty": 6,
      "prereqs": [
        "exercism-binary-search-tree"
      ],
      "hints": [
        "A focused subtree plus its path context can reconstruct the whole tree.",
        "Store parent context and sibling data while navigating, then rebuild on the way up.",
        "Root navigation, replacing the focus and preserving untouched branches need tests."
      ],
      "explanation": "A focused subtree plus its path context can reconstruct the whole tree. The reference follows this strategy: Store parent context and sibling data while navigating, then rebuild on the way up. Persistent reconstruction preserves prior trees but may allocate new path nodes.",
      "examples": [
        {
          "input": "focus root a with left child b; descend left; replace with c; rebuild",
          "output": "root a now has left child c; untouched branches preserved"
        }
      ]
    },
    "book-store": {
      "topics": [
        "optimization",
        "collections"
      ],
      "concept": "The cheapest grouping of duplicates is not always the largest possible group.",
      "strategy": "Memoize remaining book counts and compare all permitted discounted groups.",
      "edges": "Repeated titles and the classic greedy grouping counterexample need exact prices.",
      "complexity": "Exponential state search with memoization over count vectors.",
      "gameContext": "Choose bundles in a shop economy where discounts interact.",
      "tradeoffs": "Integer minor units avoid rounding while memoization prevents repeating subproblems.",
      "difficulty": 7,
      "prereqs": [
        "exercism-knapsack"
      ],
      "hints": [
        "The cheapest grouping of duplicates is not always the largest possible group.",
        "Memoize remaining book counts and compare all permitted discounted groups.",
        "Repeated titles and the classic greedy grouping counterexample need exact prices."
      ],
      "explanation": "The cheapest grouping of duplicates is not always the largest possible group. The reference follows this strategy: Memoize remaining book counts and compare all permitted discounted groups. Integer minor units avoid rounding while memoization prevents repeating subproblems.",
      "examples": [
        {
          "input": "titles=[1,1,2,2,3,3,4,5]",
          "output": "5120 minor units: two groups of four"
        }
      ]
    },
    "dominoes": {
      "topics": [
        "graphs",
        "search"
      ],
      "concept": "A valid closed chain uses every tile and matches neighboring endpoints.",
      "strategy": "Treat tile endpoints as a multigraph or backtrack while tracking used tile identities.",
      "edges": "Duplicates are separate tiles; empty input and disconnected edges need their own outcomes.",
      "complexity": "O(edges) for an Eulerian construction or exponential backtracking.",
      "gameContext": "Assemble a loop puzzle from interchangeable-looking but distinct pieces.",
      "tradeoffs": "Graph structure can remove most search, but multiplicity must not be lost.",
      "difficulty": 7,
      "prereqs": [
        "exercism-connect"
      ],
      "hints": [
        "A valid closed chain uses every tile and matches neighboring endpoints.",
        "Treat tile endpoints as a multigraph or backtrack while tracking used tile identities.",
        "Duplicates are separate tiles; empty input and disconnected edges need their own outcomes."
      ],
      "explanation": "A valid closed chain uses every tile and matches neighboring endpoints. The reference follows this strategy: Treat tile endpoints as a multigraph or backtrack while tracking used tile identities. Graph structure can remove most search, but multiplicity must not be lost.",
      "examples": [
        {
          "input": "[(1,2),(2,3),(3,1)]",
          "output": "closed chain exists; each tile is used once"
        }
      ]
    },
    "satellite": {
      "topics": [
        "graphs",
        "recursion"
      ],
      "concept": "Preorder identifies the root while inorder partitions its subtrees.",
      "strategy": "Find each root in inorder, split ranges and recursively rebuild matching preorder segments.",
      "edges": "Mismatched sequences, duplicate ambiguity and empty trees must follow validation rules.",
      "complexity": "O(n²) with repeated searches or O(n) with an index map.",
      "gameContext": "Rebuild a serialized scene tree from traversal streams.",
      "tradeoffs": "Index maps speed lookup but assume identifiers have the required uniqueness.",
      "difficulty": 7,
      "prereqs": [
        "exercism-binary-search-tree"
      ],
      "hints": [
        "Preorder identifies the root while inorder partitions its subtrees.",
        "Find each root in inorder, split ranges and recursively rebuild matching preorder segments.",
        "Mismatched sequences, duplicate ambiguity and empty trees must follow validation rules."
      ],
      "explanation": "Preorder identifies the root while inorder partitions its subtrees. The reference follows this strategy: Find each root in inorder, split ranges and recursively rebuild matching preorder segments. Index maps speed lookup but assume identifiers have the required uniqueness.",
      "examples": [
        {
          "input": "preorder=[a,b,c], inorder=[b,a,c]",
          "output": "root a; left b; right c"
        }
      ]
    },
    "sgf-parsing": {
      "topics": [
        "parsing",
        "graphs"
      ],
      "concept": "A parenthesized sequence contains nodes, properties and branching child trees.",
      "strategy": "Use a cursor parser for delimiters, property values and nested variations.",
      "edges": "Escaped brackets/backslashes, whitespace normalization and malformed trees require precise handling.",
      "complexity": "O(text length + tree output) for a cursor parser.",
      "gameContext": "Parse a structured board-game replay with branches.",
      "tradeoffs": "A grammar-aware scanner is more reliable than splitting on delimiters that can be escaped.",
      "difficulty": 7,
      "prereqs": [
        "exercism-matching-brackets",
        "exercism-tree-building"
      ],
      "hints": [
        "A parenthesized sequence contains nodes, properties and branching child trees.",
        "Use a cursor parser for delimiters, property values and nested variations.",
        "Escaped brackets/backslashes, whitespace normalization and malformed trees require precise handling."
      ],
      "explanation": "A parenthesized sequence contains nodes, properties and branching child trees. The reference follows this strategy: Use a cursor parser for delimiters, property values and nested variations. A grammar-aware scanner is more reliable than splitting on delimiters that can be escaped.",
      "examples": [
        {
          "input": "(;A[B](;C[D])(;E[F]))",
          "output": "root property A=[B], two child variations"
        }
      ]
    },
    "rest-api": {
      "topics": [
        "parsing",
        "collections"
      ],
      "concept": "An IOU transfer changes two balances and can cancel an opposite debt.",
      "strategy": "Validate request data, normalize users and update reciprocal debt/credit records consistently.",
      "edges": "Unknown routes/users, reciprocal cancellation and sorted responses need explicit behavior.",
      "complexity": "O(users/relationships touched + output formatting).",
      "gameContext": "Model a local trade ledger behind an engine/tool API boundary.",
      "tradeoffs": "Separate JSON transport from ledger rules so malformed input cannot partially mutate balances.",
      "difficulty": 8,
      "prereqs": [
        "exercism-ledger",
        "exercism-bank-account"
      ],
      "hints": [
        "An IOU transfer changes two balances and can cancel an opposite debt.",
        "Validate request data, normalize users and update reciprocal debt/credit records consistently.",
        "Unknown routes/users, reciprocal cancellation and sorted responses need explicit behavior."
      ],
      "explanation": "An IOU transfer changes two balances and can cancel an opposite debt. The reference follows this strategy: Validate request data, normalize users and update reciprocal debt/credit records consistently. Separate JSON transport from ledger rules so malformed input cannot partially mutate balances.",
      "examples": [
        {
          "input": "Alice lends Bob 5; Bob lends Alice 2",
          "output": "Bob owes Alice 3; reciprocal balances agree"
        }
      ]
    },
    "pov": {
      "topics": [
        "graphs",
        "recursion"
      ],
      "concept": "Changing the root reverses the links along one path and preserves all off-path branches.",
      "strategy": "Find the target path, reverse its parent/child orientation and reconnect the untouched subtrees.",
      "edges": "Missing nodes, leaf roots and path queries must preserve every existing node.",
      "complexity": "O(vertices + edges) traversal/reconstruction.",
      "gameContext": "Change the viewpoint of a scene or relationship tree without dropping branches.",
      "tradeoffs": "A new rooted view can share immutable data; mutable reparenting needs ownership care.",
      "difficulty": 9,
      "prereqs": [
        "exercism-tree-building"
      ],
      "hints": [
        "Changing the root reverses the links along one path and preserves all off-path branches.",
        "Find the target path, reverse its parent/child orientation and reconnect the untouched subtrees.",
        "Missing nodes, leaf roots and path queries must preserve every existing node."
      ],
      "explanation": "Changing the root reverses the links along one path and preserves all off-path branches. The reference follows this strategy: Find the target path, reverse its parent/child orientation and reconnect the untouched subtrees. A new rooted view can share immutable data; mutable reparenting needs ownership care.",
      "examples": [
        {
          "input": "tree a→b→c; select b as root",
          "output": "b has children a and c"
        }
      ]
    },
    "cooldown": {
      "difficulty": 1,
      "topics": [
        "time",
        "basics"
      ],
      "prereqs": [],
      "hints": [
        "Think in seconds: frame count is not elapsed time.",
        "Subtract dt from the remaining duration, then clamp to zero.",
        "A negative dt returns NaN; zero dt leaves a positive cooldown unchanged."
      ],
      "concept": "Think in seconds: frame count is not elapsed time.",
      "strategy": "Subtract dt from the remaining duration, then clamp to zero.",
      "edges": "A negative dt returns NaN; zero dt leaves a positive cooldown unchanged.",
      "explanation": "One subtraction and a clamp keep the countdown bounded at zero, independently of how many frames elapse.",
      "complexity": "O(1) time and space.",
      "tradeoffs": "Clamping is appropriate for a remaining duration; an absolute timestamp should not be clamped.",
      "gameContext": "Throttle firing and ability reuse without depending on rendering FPS.",
      "examples": [
        {
          "input": "remaining=2, dt=0.25",
          "output": "1.75 seconds"
        },
        {
          "input": "remaining=0.1, dt=0.2",
          "output": "0 seconds"
        },
        {
          "input": "remaining=1, dt=-1",
          "output": "NaN"
        }
      ],
      "ownership": {
        "c": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "cpp": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "zig": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged."
      }
    },
    "inventory": {
      "difficulty": 2,
      "topics": [
        "collections",
        "arrays"
      ],
      "prereqs": [
        "exercism-accumulate"
      ],
      "hints": [
        "Existing partial stacks have priority over empty slots.",
        "Use two passes: fill nonempty stacks first, then empty slots, reducing the remaining count.",
        "Mutate only the borrowed slots; return leftover items. Empty/full inventories and zero count matter."
      ],
      "concept": "Existing partial stacks have priority over empty slots.",
      "strategy": "Use two passes: fill nonempty stacks first, then empty slots, reducing the remaining count.",
      "edges": "Mutate only the borrowed slots; return leftover items. Empty/full inventories and zero count matter.",
      "explanation": "Each pass transfers the smaller of available stack capacity and remaining items. Two passes preserve the stated stacking priority.",
      "complexity": "O(slots) time, O(1) extra space.",
      "tradeoffs": "In-place slots avoid allocation, but callers must own mutable inventory storage.",
      "gameContext": "Add loot without opening a new stack while a partial one can hold it.",
      "examples": [
        {
          "input": "slots=[3,0,4], add=5, max=5",
          "output": "slots=[5,2,5], leftover=0"
        },
        {
          "input": "slots=[5], add=3, max=5",
          "output": "slots=[5], leftover=3"
        }
      ],
      "ownership": {
        "c": "The slots buffer is borrowed and intentionally mutated in place. The caller keeps ownership of the slots. Count/max are values, and the returned integer is the number of items left over; no new inventory is allocated.",
        "cpp": "The slots buffer is borrowed and intentionally mutated in place. The caller keeps ownership of the slots. Count/max are values, and the returned integer is the number of items left over; no new inventory is allocated.",
        "zig": "The slots buffer is borrowed and intentionally mutated in place. The caller keeps ownership of the slots. Count/max are values, and the returned integer is the number of items left over; no new inventory is allocated."
      }
    },
    "waves": {
      "difficulty": 2,
      "topics": [
        "time",
        "simulation"
      ],
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "Spawn times form an arithmetic progression on a timeline.",
        "Write start + index*interval into each output position.",
        "Negative interval fails without writing; zero count succeeds for a valid interval; zero interval spawns together."
      ],
      "concept": "Spawn times form an arithmetic progression on a timeline.",
      "strategy": "Write start + index*interval into each output position.",
      "edges": "Negative interval fails without writing; zero count succeeds for a valid interval; zero interval spawns together.",
      "explanation": "The output index supplies the offset directly, so there is no cumulative frame or rounding drift from repeatedly adding a delta.",
      "complexity": "O(count) time, caller-owned output.",
      "tradeoffs": "Precomputed times make scheduling predictable; a live scheduler would consume this timeline.",
      "gameContext": "Arrange enemy-wave arrivals while keeping spawning separate from rendering.",
      "examples": [
        {
          "input": "start=2, interval=0.5, count=4",
          "output": "[2,2.5,3,3.5]"
        },
        {
          "input": "out=[9,8], interval=-1",
          "output": "false; out remains [9,8]"
        }
      ],
      "ownership": {
        "c": "The caller provides and owns the output buffer. Write only its requested count/slice length. The boolean is success, not an owned result; a negative interval must leave every output entry unchanged.",
        "cpp": "The caller provides and owns the output buffer. Write only its requested count/slice length. The boolean is success, not an owned result; a negative interval must leave every output entry unchanged.",
        "zig": "The caller provides and owns the output buffer. Write only its requested count/slice length. The boolean is success, not an owned result; a negative interval must leave every output entry unchanged."
      }
    },
    "animation": {
      "difficulty": 2,
      "topics": [
        "state",
        "simulation"
      ],
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "Several conditions can be true, but one state wins by priority.",
        "Evaluate dead, hurt, airborne, running and idle in that order.",
        "Health≤0 wins over hit; the running threshold is strict abs(speed)>0.1."
      ],
      "concept": "Several conditions can be true, but one state wins by priority.",
      "strategy": "Evaluate dead, hurt, airborne, running and idle in that order.",
      "edges": "Health≤0 wins over hit; the running threshold is strict abs(speed)>0.1.",
      "explanation": "Ordered branches encode a priority table. Keeping this table separate from sprite playback avoids inconsistent transitions.",
      "complexity": "O(1) time and space.",
      "tradeoffs": "An enum is clearer in a larger engine; this exercise uses the specified integer state codes.",
      "gameContext": "Choose the character animation from health and movement state.",
      "examples": [
        {
          "input": "health=0, hit=true, airborne, speed=10",
          "output": "0 (dead)"
        },
        {
          "input": "health=10, no hit, grounded, speed=0.1",
          "output": "4 (idle)"
        }
      ],
      "ownership": {
        "c": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "cpp": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "zig": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged."
      }
    },
    "movement": {
      "difficulty": 2,
      "topics": [
        "math",
        "simulation"
      ],
      "prereqs": [
        "cooldown"
      ],
      "hints": [
        "Acceleration limits how far velocity can move toward its target per elapsed second.",
        "Compute acceleration*dt, move in the target direction and clamp before overshooting.",
        "Use signed velocities. Equal current/target, zero acceleration and zero dt leave the velocity unchanged."
      ],
      "concept": "Acceleration limits how far velocity can move toward its target per elapsed second.",
      "strategy": "Compute acceleration*dt, move in the target direction and clamp before overshooting.",
      "edges": "Use signed velocities. Equal current/target, zero acceleration and zero dt leave the velocity unchanged.",
      "explanation": "A bounded approach changes speed smoothly while the min/max clamp prevents overshooting when close to the target.",
      "complexity": "O(1) time and space.",
      "tradeoffs": "Acceleration gives controlled response; directly setting velocity gives instant response.",
      "gameContext": "Accelerate, brake and reverse a controller using pixels per second.",
      "examples": [
        {
          "input": "current=0, target=100, acceleration=200, dt=0.1",
          "output": "20"
        },
        {
          "input": "current=90, target=100, acceleration=200, dt=0.1",
          "output": "100"
        },
        {
          "input": "current=10, target=-100, acceleration=200, dt=0.1",
          "output": "-10"
        }
      ],
      "ownership": {
        "c": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "cpp": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "zig": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged."
      }
    },
    "jump-buffer": {
      "difficulty": 3,
      "topics": [
        "state",
        "time"
      ],
      "prereqs": [
        "cooldown",
        "movement"
      ],
      "hints": [
        "A press can be remembered briefly, and recent ground contact can remain eligible briefly.",
        "Require an unconsumed press with both nonnegative ages inside their inclusive time windows.",
        "Return eligibility only; the caller consumes a successful press. Both exact window boundaries are accepted."
      ],
      "concept": "A press can be remembered briefly, and recent ground contact can remain eligible briefly.",
      "strategy": "Require an unconsumed press with both nonnegative ages inside their inclusive time windows.",
      "edges": "Return eligibility only; the caller consumes a successful press. Both exact window boundaries are accepted.",
      "explanation": "The conjunction checks input lifetime and coyote time independently. The consumed flag prevents one press from triggering multiple jumps.",
      "complexity": "O(1) time and space.",
      "tradeoffs": "Longer windows feel forgiving but can make input timing less precise.",
      "gameContext": "Allow early jump presses and a small grace period after leaving an edge.",
      "examples": [
        {
          "input": "press_age=0.1, grounded_age=0.1, windows=0.1, consumed=false",
          "output": "true"
        },
        {
          "input": "same ages, consumed=true",
          "output": "false"
        }
      ],
      "ownership": {
        "c": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "cpp": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "zig": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged."
      }
    },
    "camera": {
      "difficulty": 3,
      "topics": [
        "math",
        "time"
      ],
      "prereqs": [
        "movement"
      ],
      "hints": [
        "Exponential smoothing composes over elapsed time, unlike a fixed per-frame lerp.",
        "Compute 1-exp(-rate*dt) as the interpolation factor.",
        "Zero rate or dt preserves current. Compare fractional results with tolerance; split durations should agree."
      ],
      "concept": "Exponential smoothing composes over elapsed time, unlike a fixed per-frame lerp.",
      "strategy": "Compute 1-exp(-rate*dt) as the interpolation factor.",
      "edges": "Zero rate or dt preserves current. Compare fractional results with tolerance; split durations should agree.",
      "explanation": "The exponential decay factor multiplies over successive steps, so two half-duration updates equal one full-duration update toward a fixed target.",
      "complexity": "O(1) time and space.",
      "tradeoffs": "This smooths toward a fixed target; changing targets mid-interval introduces a different trajectory.",
      "gameContext": "Keep camera follow behavior stable when rendering FPS changes.",
      "examples": [
        {
          "input": "current=0, target=100, rate=2, dt=0.5",
          "output": "≈63.21205588"
        },
        {
          "input": "two updates with dt=0.25, same target",
          "output": "same final value as dt=0.5"
        }
      ],
      "ownership": {
        "c": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "cpp": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged.",
        "zig": "Arguments and the return value are plain numbers/booleans passed by value. The function owns no buffers, allocates no memory and leaves its inputs unchanged."
      }
    },
    "tile-collision": {
      "difficulty": 3,
      "topics": [
        "grids",
        "arrays"
      ],
      "prereqs": [
        "movement"
      ],
      "hints": [
        "Touching an edge has zero overlap area, even if coordinates are equal.",
        "For every solid tile compare strict rectangle bounds, count every match and write only those that fit.",
        "Return total matches, independent of output capacity. Inputs/output are borrowed; invalid geometry writes nothing."
      ],
      "concept": "Touching an edge has zero overlap area, even if coordinates are equal.",
      "strategy": "For every solid tile compare strict rectangle bounds, count every match and write only those that fit.",
      "edges": "Return total matches, independent of output capacity. Inputs/output are borrowed; invalid geometry writes nothing.",
      "explanation": "Strict rectangle comparisons find overlapping solid cells. Coordinates are returned in row-major order, with counting separated from bounded output writes.",
      "complexity": "O(rows×columns) time, O(1) auxiliary space.",
      "tradeoffs": "Scanning is clear; restricting to covered tile ranges speeds large maps while preserving boundary rules.",
      "gameContext": "Query the tiles a moving body overlaps before resolving movement.",
      "examples": [
        {
          "input": "2×2 solids=[1,1,0,1], rect=(15,15,2,2), tile size=16",
          "output": "3 matches: (0,0),(0,1),(1,1)"
        },
        {
          "input": "rect=(-16,0,16,16), tile size=16",
          "output": "0: edge touching is not overlap"
        }
      ],
      "ownership": {
        "c": "Both the grid and coordinate output are borrowed caller-owned storage. Never mutate the input grid. Write only the output capacity, but return the full match count, which can exceed that capacity. No result buffer is allocated.",
        "cpp": "Both the grid and coordinate output are borrowed caller-owned storage. Never mutate the input grid. Write only the output capacity, but return the full match count, which can exceed that capacity. No result buffer is allocated.",
        "zig": "Both the grid and coordinate output are borrowed caller-owned storage. Never mutate the input grid. Write only the output capacity, but return the full match count, which can exceed that capacity. No result buffer is allocated."
      }
    },
    "debug-damage": {
      "difficulty": 3,
      "topics": [
        "state",
        "collections"
      ],
      "prereqs": [
        "tile-collision",
        "exercism-custom-set"
      ],
      "hints": [
        "The same hit ID represents one event, even if reports are separated.",
        "Record which IDs have already occurred; apply only the first damage for each ID, then clamp final health.",
        "Borrow events without mutating them. Conflicting duplicate amounts use the first report; negative damage may heal."
      ],
      "concept": "The same hit ID represents one event, even if reports are separated.",
      "strategy": "Record which IDs have already occurred; apply only the first damage for each ID, then clamp final health.",
      "edges": "Borrow events without mutating them. Conflicting duplicate amounts use the first report; negative damage may heal.",
      "explanation": "Deduplicating event identity prevents repeated collision reports from dealing repeated damage. Clamping after the batch preserves healing semantics.",
      "complexity": "O(n²) for direct prior-ID scans; expected O(n) with a hash set.",
      "tradeoffs": "A hash set reduces lookup work but introduces allocation and a larger footprint.",
      "gameContext": "Repair duplicate damage across collision ticks.",
      "examples": [
        {
          "input": "health=100, hits=[(1,10),(2,5),(1,99)]",
          "output": "85"
        },
        {
          "input": "health=5, hits=[(1,10),(2,-20)]",
          "output": "15"
        }
      ],
      "ownership": {
        "c": "The const Hit array is borrowed and must remain unchanged. Health and the result are scalar values. This reference scans prior events directly and allocates no output or deduplication buffer.",
        "cpp": "The const Hit span borrows immutable events. The reference owns a temporary unordered_set of IDs, released automatically at return; only the final health value is returned.",
        "zig": "The const Hit slice borrows immutable events. Prior-event scans allocate no temporary set. The returned health is a scalar value with no allocator or cleanup responsibility."
      }
    },
    "debug-saves": {
      "difficulty": 5,
      "topics": [
        "parsing",
        "state"
      ],
      "prereqs": [
        "exercism-matching-brackets",
        "inventory"
      ],
      "hints": [
        "Migration must preserve values while rejecting unsupported or malformed input.",
        "Parse and validate the complete JSON record, then choose coins for v1 or gold for v2 and emit v2.",
        "Versions/amounts must be numeric with valid finite nonnegative values. Commit caller-owned output only after success."
      ],
      "concept": "Migration must preserve values while rejecting unsupported or malformed input.",
      "strategy": "Parse and validate the complete JSON record, then choose coins for v1 or gold for v2 and emit v2.",
      "edges": "Versions/amounts must be numeric with valid finite nonnegative values. Commit caller-owned output only after success.",
      "explanation": "Parsing and domain checks run before producing the normalized save, so an invalid load cannot partially overwrite a good state.",
      "complexity": "O(JSON length) parsing, with parser-dependent temporary storage.",
      "tradeoffs": "Explicit version branches are easier to audit than trying to accept every vaguely compatible record.",
      "gameContext": "Upgrade an old save without corrupting currency or accepting malformed data.",
      "examples": [
        {
          "input": "{\"version\":1,\"coins\":7}",
          "output": "version=2, gold=7"
        },
        {
          "input": "{\"version\":2,\"gold\":-1}",
          "output": "reject; previous output is unchanged"
        }
      ],
      "ownership": {
        "c": "JSON text is borrowed. Save output belongs to the caller and is written only after parsing/validation succeeds. The returned SaveStatus reports failure without replacing an existing output; parsing storage is temporary.",
        "cpp": "The JSON string view borrows its text. The caller owns the Save output, which changes only on success. Temporary parser values have local lifetimes; the Save result contains scalar fields, not borrowed JSON slices.",
        "zig": "The JSON text is borrowed and parsing storage uses the supplied allocator. Release temporary parsing state on success and error. The returned Save owns no buffers, so the caller does not free a JSON tree."
      }
    },
    "debug-stuck": {
      "difficulty": 5,
      "topics": [
        "graphs",
        "search"
      ],
      "prereqs": [
        "exercism-binary-search",
        "tile-collision"
      ],
      "hints": [
        "A straight-line step cannot find a route around a wall.",
        "Use breadth-first search over four neighbors and record each cell’s first predecessor, then reconstruct from the goal.",
        "Include start and goal; visit right, down, left, up for ties. Empty/unreachable endpoints and too-small C output buffers have explicit outcomes."
      ],
      "concept": "A straight-line step cannot find a route around a wall.",
      "strategy": "Use breadth-first search over four neighbors and record each cell’s first predecessor, then reconstruct from the goal.",
      "edges": "Include start and goal; visit right, down, left, up for ties. Empty/unreachable endpoints and too-small C output buffers have explicit outcomes.",
      "explanation": "Breadth-first search visits cells by path length. Reconstructing predecessor links produces a shortest route instead of trying to steer through obstacles.",
      "complexity": "O(cells) time and visited/predecessor storage.",
      "tradeoffs": "BFS is correct for equal-cost steps; weighted terrain requires a cost-aware frontier.",
      "gameContext": "Repair an enemy that gets stuck by walking straight toward a goal.",
      "examples": [
        {
          "input": "wall blocks the direct route",
          "output": "return a shortest route around it"
        },
        {
          "input": "goal separated by walls",
          "output": "empty path"
        }
      ],
      "ownership": {
        "c": "The grid is borrowed and immutable. The caller owns the path output. PATH_BUFFER_TOO_SMALL reports the required path length without writing an incomplete path. Internal search storage is temporary and released before return.",
        "cpp": "The grid is borrowed and immutable. A successful query returns an owning vector of coordinates; its destructor releases path storage. Empty results represent unreachable/out-of-bounds endpoints.",
        "zig": "The grid is borrowed and immutable. The returned Point slice is allocated with the supplied allocator; the caller must free it, including an empty result. Search queue/predecessor storage is released internally."
      }
    }
  }
};
