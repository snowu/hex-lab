/* Coding Patterns track. Inserted right after "Coding Fluency". Designed for timed mode. */
TRACKS.splice(2, 0, {
  id: 'patterns', icon: '🧩', title: 'Coding Patterns',
  blurb: 'The classic problem shapes senior loops still use, drilled in Python with a clock. Learn to recognise the pattern in the first two minutes, then write it cleanly.',
  lessons: [
    {
      id: 'pat-intro', title: 'How to run a coding round', minutes: 10,
      summary: 'A repeatable routine for the first five minutes, and for the last five.',
      checks: [
        { q: 'A candidate understands the problem and jumps straight to writing the optimal solution. Which routine step did they skip, and why does it matter?',
          options: ['Stating the brute force and its complexity, which names the bottleneck the optimal solution must beat', 'Writing extra examples, which only matters for easy problems', 'Checking the recursion limit, which only matters in Python', 'Adding type hints, which the interviewer cannot evaluate'],
          answer: 0, explain: 'Saying the brute force and its cost first frames the trade-off and earns credit even if the optimal stalls.' },
        { q: 'The prompt says “minimise the largest load on any server”. Which pattern should you name in the first two minutes?',
          options: ['Sliding window over the servers', 'A heap of end times', 'Binary search on the answer with a feasible(x) check', 'Trie lookup by prefix'],
          answer: 2, explain: 'Minimise-the-maximum signals monotonic feasibility: if x works, larger x works, so binary-search x.' },
      ],
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
      checks: [
        { q: 'You need the longest substring with at most K distinct characters. When do you shrink the window?',
          options: ['Expand right and shrink only while the window holds more than K distinct characters, recording the best while valid', 'Shrink after every single expansion regardless of validity', 'Reset left to zero whenever the window breaks and rescan from the start', 'Sort the input first and then take the first K characters'],
          answer: 0, explain: 'For longest-valid problems shrink only to restore the invariant; each pointer still moves forward once, giving O(n).' },
        { q: 'A teammate sees a while loop nested inside a for loop in a sliding-window solution and worries it is O(n²). What is the correct response?',
          options: ['It must be rewritten with sorting to become linear', 'It is only linear for fixed-size windows', 'Each pointer moves forward at most n times, so total work is O(n) despite the nesting', 'Nesting is fine because Python loops are free'],
          answer: 2, explain: 'Both pointers only advance, so the inner loop performs at most n shrinks across the whole run.' },
      ],
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
      checks: [
        { q: 'A booking system uses half-open intervals [a, b). Do [1, 2) and [2, 3) overlap?',
          options: ['Yes, because they share the endpoint 2', 'No: half-open intervals that only touch do not overlap, which is why booking systems prefer them', 'Yes, unless the input was sorted first', 'No, because sorting removes the overlap'],
          answer: 1, explain: 'Decide closed versus half-open up front: with [a, b) touching means free, with [a, b] it means conflict.' },
        { q: 'You must compute the minimum number of meeting rooms for a set of meetings. Which approach fits?',
          options: ['Compare every pair of meetings with nested loops', 'Keep meetings unsorted and scan for a free room each time', 'Binary-search the room count without sorting by start', 'Sort by start, push end times into a min-heap, and reuse a room when the smallest end time is free'],
          answer: 3, explain: 'Sorted starts plus a heap of end times counts overlaps in O(n log n) without pairwise comparison.' },
      ],
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
      checks: [
        { q: 'You need the cheapest payment route where every hop has a non-negative fee. Which tool fits?',
          options: ['BFS with a queue, which always finds the cheapest path', 'DFS, taking the first path found', 'Dijkstra with a min-heap, because edge weights are non-negative', 'Topological sort, because weights imply an order'],
          answer: 2, explain: 'BFS is for uniform cost; with non-negative weights Dijkstra with a heap gives the cheapest path.' },
        { q: 'A teammate writes recursive DFS for a 100000-cell grid. What should you warn about?',
          options: ['Use an explicit stack or deque instead of recursion, since the default limit near 1000 frames crashes on deep grids', 'Keep recursion but add more base cases to avoid the limit', 'Switch to Dijkstra for plain reachability', 'Sort the grid cells first to reduce recursion depth'],
          answer: 0, explain: 'Deep recursive DFS overflows the call stack; an explicit stack visits the same nodes without that limit.' },
      ],
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
      checks: [
        { q: 'You must keep the k largest values from a stream without storing everything sorted. What is the standard approach?',
          options: ['Sort the whole stream after every new element', 'Keep a max-heap of all elements and scan it each time', 'Store everything and sort once at the very end', 'Keep a min-heap of size k with the best seen so far, evicting the smallest on each new arrival'],
          answer: 3, explain: 'A size-k heap holds the k largest with O(log k) per element instead of sorting the whole stream.' },
        { q: 'Your binary search for the minimum feasible capacity never terminates. What did you most likely get wrong?',
          options: ['The search bounds or the lo/hi and mid update, which must preserve progress over a monotonic feasibility check', 'The heap size, which must equal the input size', 'The trie depth, which limits how far the search can go', 'The recursion limit, which stops binary search early'],
          answer: 0, explain: 'Binary search on the answer needs explicit bounds and an update that always shrinks the range over feasible(x).' },
      ],
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
      checks: [
        { q: 'You spot overlapping subproblems and decide on DP. What is the first thing to state out loud?',
          options: ['The language you will code in', 'What dp[i] means in one sentence, before any recurrence', 'The test framework you prefer', 'The order of your import statements'],
          answer: 1, explain: 'Naming the state first forces the recurrence, base cases, and fill order to follow from it.' },
        { q: 'A teammate proposes a greedy “always take the largest coin” for coin change. Using coins [1, 3, 4] and amount 6, what is the correct response?',
          options: ['Greedy with the largest coin first is optimal for every coin system', 'DP only works bottom-up and never with recursion', 'A locally best choice can be wrong later, so test on a tricky case like coins 1, 3, 4 for 6 and use DP', 'Base cases are optional once the recurrence is written'],
          answer: 2, explain: 'Greedy picks 4+1+1 (3 coins) while 3+3 uses 2, so overlapping subproblems need the DP recurrence, not a local rule.' },
      ],
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
      checks: [
        { q: 'You need autocomplete and prefix counts over a million words with fast per-keystroke lookup. Which structure fits?',
          options: ['A hash set scanned fully on every keystroke', 'A trie where each edge is a character, giving lookup cost by word length regardless of word count', 'A heap holding every word sorted by length', 'Binary search on the answer value'],
          answer: 1, explain: 'A trie shares prefixes so lookup and prefix queries cost O(word length), independent of how many words are stored.' },
        { q: 'Edges stream in and you need cycle detection in an undirected graph, Kruskal-style. Why does union-find fit?',
          options: ['It merges groups with union and reports a cycle when an edge joins two nodes already in the same set, in near-constant time with path compression', 'It sorts the edges automatically as they arrive', 'It finds shortest paths between all pairs at once', 'It stores prefixes for autocomplete'],
          answer: 0, explain: 'Union-find tracks connectivity incrementally: each union is effectively O(1) and a same-set edge proves a cycle.' },
      ],
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
