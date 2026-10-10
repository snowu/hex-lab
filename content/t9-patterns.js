/* Coding Patterns track. Inserted right after "Coding Fluency". Designed for timed mode. */
TRACKS.splice(2, 0, {
  id: 'patterns', icon: '🧩', title: 'Coding Patterns',
  blurb: 'The classic problem shapes senior loops still use, drilled in Python with a clock. Learn to recognise the pattern in the first two minutes, then write it cleanly.',
  lessons: [
    {
      id: 'pat-intro', title: 'How to run a coding round', minutes: 10,
      summary: 'A repeatable routine for the first five minutes, and for the last five.',
      sections: [
        { type: 'text', html: `
<p>Most candidates do not fail on the algorithm. They fail on <b>process under pressure</b>. Use the same routine every time, so it becomes automatic:</p>
<ol>
<li><b>Restate</b> the problem in your own words and confirm.</li>
<li><b>Clarify</b> input size, types, empty input, duplicates, negative numbers, ordering, memory limits.</li>
<li><b>Examples:</b> one normal, one edge case. Say the expected output.</li>
<li><b>Brute force first</b> (say it and its complexity), then name the bottleneck.</li>
<li><b>Pick the pattern</b> and state the invariant before you type.</li>
<li><b>Code</b> in small, named steps. Narrate decisions, not syntax.</li>
<li><b>Test by hand</b> on your examples, then on an edge case. Fix before the interviewer finds it.</li>
<li><b>State complexity</b> (time and space) and one follow-up improvement.</li>
</ol>
<div class="callout tip"><b>If you are stuck:</b> say what you know, simplify (smaller input, one dimension, sorted input), solve that, then generalise. Silence is the real failure mode. Thinking aloud shows the process they are scoring.</div>
<h3>Recognise the pattern from the wording</h3>
<table>
<tr><th>If the problem says…</th><th>Think…</th></tr>
<tr><td>longest / shortest contiguous range, with a condition</td><td>sliding window, two pointers</td></tr>
<tr><td>overlaps, meetings, ranges, schedules</td><td>sort by start, sweep, heap of end times</td></tr>
<tr><td>grid, connections, dependencies, “reachable”</td><td>graph: BFS / DFS / union-find / topological sort</td></tr>
<tr><td>cheapest / fewest steps with weights</td><td>Dijkstra (or BFS if unweighted)</td></tr>
<tr><td>k largest / smallest, merge sorted streams</td><td>heap</td></tr>
<tr><td>minimise the maximum / smallest value that works</td><td>binary search on the answer</td></tr>
<tr><td>number of ways / min cost with overlapping subproblems</td><td>dynamic programming</td></tr>
<tr><td>prefix lookups, autocomplete</td><td>trie</td></tr>
</table>
<p>Practise in <b>timed mode</b> (the Timed button on every exercise): the target times are realistic interview budgets. Do not look at the hint or solution until time is up.</p>` },
        { type: 'quiz', q: 'You are given a list of positive integers and asked for the shortest contiguous subarray whose sum is at least a target. Which approach is the best fit?',
          options: ['Try every subarray with two nested loops and keep the best', 'A variable-size sliding window, because all numbers are positive so the sum is monotonic', 'Sort the array first and take the largest elements', 'Dynamic programming over every pair of indexes'],
          answer: 1, explain: 'Positive numbers make the window sum monotonic: growing it increases the sum, shrinking it decreases it, so two pointers give O(n). With negative numbers that guarantee disappears.' },
        { type: 'quiz', q: 'An interviewer says nothing for 90 seconds while you think. What should you do?',
          options: ['Keep thinking silently until you have the full solution', 'Say what you have so far (brute force and its cost, what you are trying to improve), so they can follow and nudge you', 'Ask them for the answer', 'Start coding something and fix it later'],
          answer: 1, explain: 'Interviewers score your reasoning. A narrated partial solution earns hints and credit. Silence gives them nothing to evaluate.' },
      ],
    },
    {
      id: 'pat-window', title: 'Sliding window & two pointers', minutes: 30,
      summary: 'Expand right, shrink left, keep an invariant. O(n) instead of O(n²).',
      sections: [
        { type: 'text', html: `
<p>When the question asks about a <b>contiguous range</b>, avoid recomputing from scratch for every start. Maintain a window <code>[left, right]</code> and a summary of what is inside (a sum, a set, a count dictionary).</p>
<pre><code>left = 0
for right, x in enumerate(items):
    add(x)                     # expand
    while window_is_invalid():  # or: while window_is_valid() for "shortest"
        remove(items[left])     # shrink
        left += 1
    update_best(right - left + 1)</code></pre>
<ul><li><b>Fixed size</b> k: slide by adding the new element and removing the one leaving.</li><li><b>Variable size</b>: shrink only when the invariant breaks (longest) or while it holds (shortest).</li><li>Each pointer only moves forward, so the total work is O(n), even with a nested <code>while</code>.</li></ul>` },
        { type: 'code', ref: 'longest_unique' },
        { type: 'code', ref: 'shortest_subarray' },
      ],
    },
    {
      id: 'pat-intervals', title: 'Intervals & scheduling', minutes: 30,
      summary: 'Sort by start, sweep, and use a heap of end times.',
      sections: [
        { type: 'text', html: `
<p>Interval problems become easy once the input is <b>sorted by start time</b>. Decide up front whether intervals are closed <code>[a, b]</code> or half-open <code>[a, b)</code>, because that decides whether touching intervals overlap. Booking systems normally use half-open.</p>
<ul><li><b>Merge:</b> sort, then extend the last merged interval or start a new one.</li><li><b>Count overlaps / resources:</b> a min-heap of end times (or a sweep over +1/−1 events).</li><li><b>Insert / remove:</b> binary search the position, then merge locally.</li></ul>` },
        { type: 'code', ref: 'merge_intervals' },
        { type: 'code', ref: 'min_rooms' },
      ],
    },
    {
      id: 'pat-graphs', title: 'Graphs: BFS, DFS & shortest paths', minutes: 35,
      summary: 'Implicit graphs on grids, and Dijkstra with a heap.',
      sections: [
        { type: 'text', html: `
<p>Many problems are graphs in disguise: grids (cells are nodes), dependencies, payment routes, service call chains. Pick the traversal by the question:</p>
<table>
<tr><th>Question</th><th>Tool</th></tr>
<tr><td>Is X reachable? How many groups?</td><td>DFS / BFS with a visited set, or union-find</td></tr>
<tr><td>Fewest steps (unweighted)</td><td>BFS (queue); first time you reach a node is the shortest</td></tr>
<tr><td>Cheapest path, non-negative weights</td><td>Dijkstra with a min-heap</td></tr>
<tr><td>Order with dependencies / detect cycles</td><td>Topological sort (Kahn) as in the Terraform exercise</td></tr>
</table>
<div class="callout warn"><b>Python gotcha:</b> the default recursion limit is about 1000 frames. Recursive DFS on a big grid or a long chain crashes with <code>RecursionError</code>. Use an explicit stack or deque.</div>` },
        { type: 'code', ref: 'num_islands' },
        { type: 'code', ref: 'cheapest_route' },
        { type: 'quiz', q: 'A grid has 1,000 × 1,000 cells and you need the shortest path (in steps) between two cells with obstacles. Which is the most appropriate?',
          options: ['Recursive DFS and take the minimum over all paths', 'BFS with a queue and a visited set', 'Dijkstra with a heap, and it is strictly required', 'Dynamic programming over all paths'],
          answer: 1, explain: 'All steps cost the same, so BFS finds the shortest path in O(cells). Dijkstra also works but adds a log factor for no benefit. Recursive DFS over all paths is exponential and would overflow the stack.' },
      ],
    },
    {
      id: 'pat-heap-search', title: 'Heaps & binary search on the answer', minutes: 35,
      summary: 'k-way merging, and turning “minimise the maximum” into a search.',
      sections: [
        { type: 'text', html: `
<h3>Heaps</h3>
<p><code>heapq</code> is a <b>min-heap</b>. For a max-heap push negated values. Use a heap when you repeatedly need “the smallest/largest remaining”: top-k (keep a heap of size k), merging k sorted streams, scheduling by earliest deadline, Dijkstra.</p>
<h3>Binary search on the answer</h3>
<p>If you can write a fast <code>feasible(x)</code> that is monotonic (false … false true … true), you can binary search <code>x</code> even though the input is not sorted. Typical wording: “smallest capacity / minimum rate / minimise the maximum”. Always set the search bounds explicitly (lowest possible, highest possible) and be careful with <code>lo &lt; hi</code> and <code>mid</code> updates to avoid infinite loops.</p>` },
        { type: 'code', ref: 'merge_k_sorted' },
        { type: 'code', ref: 'min_capacity' },
      ],
    },
    {
      id: 'pat-dp', title: 'Dynamic programming', minutes: 40,
      summary: 'State, recurrence, base case, order. Then optimise the memory.',
      sections: [
        { type: 'text', html: `
<p>DP is “recursion with memory”. When a problem asks for a best/min/max/count of something built from smaller versions of itself, use this recipe aloud:</p>
<ol>
<li><b>State:</b> what does <code>dp[i]</code> (or <code>dp[i][j]</code>) mean, in one sentence?</li>
<li><b>Recurrence:</b> how does a state follow from smaller ones?</li>
<li><b>Base case(s).</b></li>
<li><b>Order:</b> fill so dependencies are ready (bottom-up), or memoise recursion with <code>functools.lru_cache</code>.</li>
<li><b>Answer</b> and <b>complexity</b>. Then: can you keep only the previous row?</li>
</ol>
<div class="callout warn"><b>Greedy vs DP:</b> if a locally best choice can be wrong later (coin change with [1, 3, 4] and 6), you need DP. Always test your idea on a tricky small case before coding.</div>` },
        { type: 'code', ref: 'coin_change' },
        { type: 'code', ref: 'edit_distance' },
      ],
    },
    {
      id: 'pat-structures', title: 'Tries & union-find', minutes: 35,
      summary: 'Two data structures that turn awkward problems into short code.',
      sections: [
        { type: 'text', html: `
<h3>Trie</h3>
<p>A tree where each edge is a character. Lookup and prefix queries cost O(length of the word), regardless of how many words are stored. Use it for autocomplete, prefix counts and dictionary matching.</p>
<h3>Union-find (disjoint set)</h3>
<p>Maintains groups under “these two are connected” updates. <code>find</code> returns a group's representative, <code>union</code> merges two groups. With path compression it is effectively O(1) per operation. Use it for connected components, “are these accounts linked”, Kruskal's minimum spanning tree and cycle detection in undirected graphs.</p>` },
        { type: 'code', ref: 'trie' },
        { type: 'code', ref: 'components' },
        { type: 'quiz', q: 'Edges arrive one at a time and after each one you must report whether two given nodes are connected. Which structure fits best?',
          options: ['Rebuild a BFS from scratch after every edge', 'Union-find, updated incrementally', 'A heap of edges', 'A sorted list of nodes'],
          answer: 1, explain: 'Union-find handles online connectivity: each edge is a near-constant-time union, and each query is two finds.' },
      ],
    },
  ],
});
