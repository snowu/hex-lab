/* Pattern drills (Python). `minutes` is the target time used by timed mode. */
Object.assign(window.EXERCISES, {

  longest_unique: {
    title: 'Longest substring without repeats', minutes: 15, level: 'medium',
    prompt: `<p>Write <code>longest_unique(s)</code> returning the length of the longest substring of <code>s</code> that has no repeated characters. O(n) time.</p>`,
    starter: String.raw`def longest_unique(s):
    pass
`,
    tests: String.raw`for text, expected in (('abcabcbb', 3), ('bbbbb', 1), ('pwwkew', 3), ('', 0), ('abba', 2), ('dvdf', 3), ('tmmzuxt', 5), ('a', 1), ('abcdef', 6)):
    test(f'{text!r}', lambda text=text, expected=expected: eq(longest_unique(text), expected))

@test('is linear time (big input)')
def _():
    eq(longest_unique('ab' * 50000), 2)
`,
    hint: 'Keep a window [left, i] and a dict of the last index where each character was seen. When you meet a character already inside the window, jump left to one past its previous position. Never move left backwards ("tmmzuxt" catches that).',
    solution: String.raw`def longest_unique(s):
    last = {}
    left = best = 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = i
        best = max(best, i - left + 1)
    return best`,
    notes: 'Variable-size sliding window: expand right every step, shrink left only when the invariant breaks. The classic bug is moving left backwards.',
  },

  shortest_subarray: {
    title: 'Shortest subarray with sum at least target', minutes: 15, level: 'medium',
    prompt: `<p>Write <code>shortest_subarray(target, nums)</code> returning the length of the shortest contiguous subarray of positive integers whose sum is at least <code>target</code>, or <code>0</code> if there is none. O(n) time.</p>`,
    starter: String.raw`def shortest_subarray(target, nums):
    pass
`,
    tests: String.raw`test('classic', lambda: eq(shortest_subarray(7, [2, 3, 1, 2, 4, 3]), 2))
test('single element', lambda: eq(shortest_subarray(4, [1, 4, 4]), 1))
test('impossible', lambda: eq(shortest_subarray(11, [1] * 8), 0))
test('whole array', lambda: eq(shortest_subarray(15, [1, 2, 3, 4, 5]), 5))
test('empty', lambda: eq(shortest_subarray(3, []), 0))
test('exact match', lambda: eq(shortest_subarray(6, [1, 2, 3]), 3))

@test('is linear time (big input)')
def _():
    eq(shortest_subarray(10 ** 9, [1] * 200000), 0)
`,
    hint: 'Grow the window on the right adding to a running sum. While the sum is at least target, record the length and shrink from the left. This works because every number is positive.',
    solution: String.raw`def shortest_subarray(target, nums):
    best = 0
    left = total = 0
    for right, x in enumerate(nums):
        total += x
        while total >= target:
            length = right - left + 1
            best = length if best == 0 else min(best, length)
            total -= nums[left]
            left += 1
    return best`,
    notes: 'The window only works for non-negative numbers. With negatives the sum is no longer monotonic, and you need prefix sums plus a monotonic deque (or a heap).',
  },

  merge_intervals: {
    title: 'Merge intervals', minutes: 15, level: 'medium',
    prompt: `<p>Write <code>merge_intervals(intervals)</code>: given a list of <code>[start, end]</code> pairs (any order), return the merged, sorted list. Intervals that touch (<code>[1, 4]</code> and <code>[4, 5]</code>) merge. Do not mutate the input.</p>`,
    starter: String.raw`def merge_intervals(intervals):
    pass
`,
    tests: String.raw`test('overlapping', lambda: eq(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]), [[1, 6], [8, 10], [15, 18]]))
test('touching merges', lambda: eq(merge_intervals([[1, 4], [4, 5]]), [[1, 5]]))
test('unsorted input', lambda: eq(merge_intervals([[8, 10], [1, 3], [2, 6]]), [[1, 6], [8, 10]]))
test('fully nested', lambda: eq(merge_intervals([[1, 10], [2, 3], [4, 5]]), [[1, 10]]))
test('empty', lambda: eq(merge_intervals([]), []))
test('single', lambda: eq(merge_intervals([[5, 7]]), [[5, 7]]))

@test('does not mutate the input')
def _():
    data = [[3, 4], [1, 2]]
    merge_intervals(data)
    eq(data, [[3, 4], [1, 2]])
`,
    hint: 'Sort by start. Walk through: if the next interval starts at or before the current end, extend the end with max(end, next_end); otherwise start a new one. Copy the lists you append so you do not alias the input.',
    solution: String.raw`def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    notes: 'sorted() returns a new list, but the inner lists are still the input objects. Here we append fresh [start, end] lists, so mutating merged[-1] never touches the input. Think about whether the half-open or closed interpretation applies in the real problem (booking systems usually use half-open).',
  },

  min_rooms: {
    title: 'Minimum meeting rooms', minutes: 20, level: 'medium',
    prompt: `<p>Write <code>min_rooms(meetings)</code>: given <code>(start, end)</code> tuples, return the minimum number of rooms needed so no two overlapping meetings share one. Intervals are half-open: a meeting ending at 10 and another starting at 10 can use the same room. O(n log n).</p>`,
    starter: String.raw`def min_rooms(meetings):
    pass
`,
    tests: String.raw`test('classic', lambda: eq(min_rooms([(0, 30), (5, 10), (15, 20)]), 2))
test('no overlap', lambda: eq(min_rooms([(7, 10), (2, 4)]), 1))
test('back to back reuses a room', lambda: eq(min_rooms([(1, 5), (5, 8)]), 1))
test('all overlap', lambda: eq(min_rooms([(1, 10), (2, 9), (3, 8), (4, 7)]), 4))
test('empty', lambda: eq(min_rooms([]), 0))
test('same times', lambda: eq(min_rooms([(1, 2), (1, 2), (1, 2)]), 3))
`,
    hint: 'Sort by start time and keep a min-heap of end times for the rooms in use. If the earliest-ending room is free (end <= next start), reuse it (pop) before pushing the new end. The heap size at the end is the answer.',
    solution: String.raw`import heapq

def min_rooms(meetings):
    ends = []  # min-heap of end times of rooms currently in use
    for start, end in sorted(meetings):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)`,
    notes: 'The alternative is a sweep over sorted start and end events. The same shape appears in capacity planning, booking engines, and "max concurrent connections" questions.',
  },

  num_islands: {
    title: 'Count islands', minutes: 20, level: 'medium',
    prompt: `<p>Write <code>num_islands(grid)</code>: <code>grid</code> is a list of strings of <code>'1'</code> (land) and <code>'0'</code> (water). Return the number of islands (groups of land connected up, down, left or right). Do not mutate the input and avoid recursion depth problems on a big grid.</p>`,
    starter: String.raw`def num_islands(grid):
    pass
`,
    tests: String.raw`test('classic', lambda: eq(num_islands(['11110', '11010', '11000', '00000']), 1))
test('three islands', lambda: eq(num_islands(['11000', '11000', '00100', '00011']), 3))
test('diagonals do not connect', lambda: eq(num_islands(['10', '01']), 2))
test('no land', lambda: eq(num_islands(['000', '000']), 0))
test('empty grid', lambda: eq(num_islands([]), 0))
test('single cell', lambda: eq(num_islands(['1']), 1))

@test('large grid does not blow the stack')
def _():
    n = 400
    eq(num_islands(['1' * n for _ in range(n)]), 1)

@test('does not mutate the input')
def _():
    grid = ['11', '00']
    num_islands(grid)
    eq(grid, ['11', '00'])
`,
    hint: 'Scan every cell. When you find unvisited land, count an island and flood-fill it with an explicit stack or deque (BFS) while marking cells in a visited set. Recursion would exceed Python’s default recursion limit on a 400x400 grid.',
    solution: String.raw`def num_islands(grid):
    seen = set()
    count = 0
    rows = len(grid)
    for r in range(rows):
        for c in range(len(grid[r])):
            if grid[r][c] == '1' and (r, c) not in seen:
                count += 1
                seen.add((r, c))
                stack = [(r, c)]
                while stack:
                    y, x = stack.pop()
                    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                        if 0 <= ny < rows and 0 <= nx < len(grid[ny]) and grid[ny][nx] == '1' and (ny, nx) not in seen:
                            seen.add((ny, nx))
                            stack.append((ny, nx))
    return count`,
    notes: 'Grid problems are graph problems with implicit edges. Use a visited set (or mutate a copy) and an explicit stack when the depth can be large. Union-find is the alternative when cells arrive incrementally.',
  },

  cheapest_route: {
    title: 'Cheapest route (Dijkstra)', minutes: 25, level: 'medium',
    prompt: `<p>Payments can be routed through intermediaries, each hop with a fee. Write <code>cheapest_route(edges, src, dst)</code> where <code>edges</code> is a list of <code>(from, to, cost)</code> for a <b>directed</b> graph with non-negative costs. Return the minimum total cost from <code>src</code> to <code>dst</code>, or <code>None</code> if unreachable. <code>src == dst</code> costs 0.</p>`,
    starter: String.raw`def cheapest_route(edges, src, dst):
    pass
`,
    tests: String.raw`EDGES = [('A', 'B', 1), ('B', 'C', 2), ('A', 'C', 5), ('C', 'D', 1), ('B', 'D', 7)]

test('picks the cheaper multi-hop path', lambda: eq(cheapest_route(EDGES, 'A', 'D'), 4))
test('direct is not always cheapest', lambda: eq(cheapest_route(EDGES, 'A', 'C'), 3))
test('unreachable', lambda: eq(cheapest_route(EDGES, 'D', 'A'), None))
test('same node', lambda: eq(cheapest_route(EDGES, 'A', 'A'), 0))
test('unknown node', lambda: eq(cheapest_route(EDGES, 'A', 'Z'), None))
test('zero-cost edges', lambda: eq(cheapest_route([('A', 'B', 0), ('B', 'C', 0)], 'A', 'C'), 0))
test('directed only', lambda: eq(cheapest_route([('A', 'B', 1)], 'B', 'A'), None))

@test('handles a long chain and stays fast')
def _():
    edges = [(i, i + 1, 1) for i in range(20000)] + [(0, 20000, 30000)]
    eq(cheapest_route(edges, 0, 20000), 20000)
`,
    hint: 'Build an adjacency dict. Use a min-heap of (cost_so_far, node). Pop the cheapest; skip it if you already have a better distance recorded; relax its neighbours. Stop early when you pop dst.',
    solution: String.raw`import heapq
from collections import defaultdict

def cheapest_route(edges, src, dst):
    graph = defaultdict(list)
    for u, v, cost in edges:
        graph[u].append((v, cost))
    best = {src: 0}
    heap = [(0, 0, src)]  # (cost, tiebreak, node): the tiebreak keeps non-comparable node ids out of comparisons
    counter = 1
    while heap:
        cost, _, node = heapq.heappop(heap)
        if node == dst:
            return cost
        if cost > best.get(node, float('inf')):
            continue
        for nxt, w in graph[node]:
            new = cost + w
            if new < best.get(nxt, float('inf')):
                best[nxt] = new
                heapq.heappush(heap, (new, counter, nxt))
                counter += 1
    return None`,
    notes: 'Dijkstra needs non-negative weights; with negative edges use Bellman-Ford. The tiebreak counter avoids comparing node objects that may not be orderable. For a source-to-target query on a huge graph, mention bidirectional search and A*.',
  },

  merge_k_sorted: {
    title: 'Merge k sorted lists', minutes: 15, level: 'medium',
    prompt: `<p>Write <code>merge_k_sorted(lists)</code>: <code>lists</code> is a list of individually sorted lists of numbers. Return one sorted list containing all elements. Aim for O(N log k) where N is the total number of elements. Empty lists may appear.</p>`,
    starter: String.raw`def merge_k_sorted(lists):
    pass
`,
    tests: String.raw`test('basic', lambda: eq(merge_k_sorted([[1, 4, 5], [1, 3, 4], [2, 6]]), [1, 1, 2, 3, 4, 4, 5, 6]))
test('empty lists are fine', lambda: eq(merge_k_sorted([[], [1], []]), [1]))
test('no lists', lambda: eq(merge_k_sorted([]), []))
test('duplicates and negatives', lambda: eq(merge_k_sorted([[-3, -3, 0], [-3, 2]]), [-3, -3, -3, 0, 2]))

@test('does not mutate the input lists')
def _():
    data = [[1, 3], [2]]
    merge_k_sorted(data)
    eq(data, [[1, 3], [2]])

@test('scales: 1000 lists of 200 items')
def _():
    lists = [list(range(i, i + 200 * 1000, 1000)) for i in range(1000)]
    out = merge_k_sorted(lists)
    eq(len(out), 200000)
    eq(out == sorted(out), True)
`,
    hint: 'Push (value, list_index, position) for the first element of each non-empty list into a heap. Pop the smallest, append it, and push the next element from the same list. (heapq.merge exists, but be able to write it yourself.)',
    solution: String.raw`import heapq

def merge_k_sorted(lists):
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    out = []
    while heap:
        value, i, j = heapq.heappop(heap)
        out.append(value)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
    return out`,
    notes: 'Same shape as merging sorted log shards or sorted result pages from several services. The heap holds k items, so each of the N pops costs O(log k).',
  },

  min_capacity: {
    title: 'Binary search on the answer', minutes: 20, level: 'hard',
    prompt: `<p>Packages with the given <code>weights</code> must be shipped <b>in order</b> within <code>days</code> days; each day you load consecutive packages onto a ship up to its capacity. Write <code>min_capacity(weights, days)</code> returning the smallest ship capacity that makes it possible. (Think: batch jobs with a daily quota.)</p>`,
    starter: String.raw`def min_capacity(weights, days):
    pass
`,
    tests: String.raw`test('1..10 in 5 days', lambda: eq(min_capacity(list(range(1, 11)), 5), 15))
test('mixed', lambda: eq(min_capacity([3, 2, 2, 4, 1, 4], 3), 6))
test('small', lambda: eq(min_capacity([1, 2, 3, 1, 1], 4), 3))
test('one package', lambda: eq(min_capacity([7], 3), 7))
test('one day: sum', lambda: eq(min_capacity([4, 4, 4], 1), 12))
test('days >= packages: the heaviest', lambda: eq(min_capacity([5, 1, 9, 2], 10), 9))

@test('scales to many packages')
def _():
    eq(min_capacity([1] * 100000, 10), 10000)
`,
    hint: 'The answer lies between max(weights) and sum(weights), and feasibility is monotonic: if capacity C works, C+1 works. Binary search the capacity, with a greedy helper that counts the days needed for a given capacity.',
    solution: String.raw`def min_capacity(weights, days):
    def days_needed(cap):
        used, load = 1, 0
        for w in weights:
            if load + w > cap:
                used += 1
                load = 0
            load += w
        return used

    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if days_needed(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    notes: 'Recognise “minimise the maximum” or “smallest value that satisfies a monotonic check” as binary search on the answer space. The same trick sizes rate limits, worker counts and batch sizes.',
  },

  coin_change: {
    title: 'Coin change (fewest coins)', minutes: 20, level: 'medium',
    prompt: `<p>Write <code>coin_change(coins, amount)</code> returning the fewest coins needed to make <code>amount</code> from the given denominations (unlimited supply of each), or <code>-1</code> if impossible. <code>amount == 0</code> needs 0 coins.</p>`,
    starter: String.raw`def coin_change(coins, amount):
    pass
`,
    tests: String.raw`test('classic', lambda: eq(coin_change([1, 2, 5], 11), 3))
test('impossible', lambda: eq(coin_change([2], 3), -1))
test('zero amount', lambda: eq(coin_change([1], 0), 0))
test('greedy fails here', lambda: eq(coin_change([1, 3, 4], 6), 2))
test('single coin exact', lambda: eq(coin_change([7], 14), 2))
test('large amount', lambda: eq(coin_change([186, 419, 83, 408], 6249), 20))
test('no coins', lambda: eq(coin_change([], 5), -1))
`,
    hint: 'dp[a] = fewest coins to make a. dp[0] = 0, everything else starts at infinity. For each amount, try every coin: dp[a] = min(dp[a], dp[a - c] + 1). Greedy (largest coin first) is wrong for [1, 3, 4] and 6.',
    solution: String.raw`def coin_change(coins, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == INF else dp[amount]`,
    notes: 'O(amount × coins) time and O(amount) space. The DP interview recipe: define the state, the recurrence, the base case and the order of evaluation, then say the complexity. Mention that if the question were “how many ways”, you would add instead of min.',
  },

  edit_distance: {
    title: 'Edit distance', minutes: 25, level: 'hard',
    prompt: `<p>Write <code>edit_distance(a, b)</code>: the minimum number of single-character insertions, deletions or substitutions needed to turn <code>a</code> into <code>b</code> (Levenshtein distance). Use O(len(a) × len(b)) time, and keep memory to O(min of the two lengths) if you can.</p>`,
    starter: String.raw`def edit_distance(a, b):
    pass
`,
    tests: String.raw`for a, b, expected in (('horse', 'ros', 3), ('intention', 'execution', 5), ('', 'abc', 3), ('abc', '', 3), ('abc', 'abc', 0), ('kitten', 'sitting', 3), ('', '', 0), ('a', 'b', 1)):
    test(f'{a!r} -> {b!r}', lambda a=a, b=b, expected=expected: eq(edit_distance(a, b), expected))

test('symmetric', lambda: eq(edit_distance('flaw', 'lawn'), edit_distance('lawn', 'flaw')))

@test('handles 1500 x 1500')
def _():
    eq(edit_distance('a' * 1500, 'b' * 1500), 1500)
`,
    hint: 'dp[i][j] is the distance between a[:i] and b[:j]. If the characters match, copy the diagonal; otherwise 1 + min(delete, insert, substitute). You only need the previous row, so keep two rows.',
    solution: String.raw`def edit_distance(a, b):
    if len(a) < len(b):
        a, b = b, a  # make b the shorter string to save memory
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            if ca == cb:
                cur.append(prev[j - 1])
            else:
                cur.append(1 + min(prev[j], cur[j - 1], prev[j - 1]))
        prev = cur
    return prev[-1]`,
    notes: 'The same recurrence powers diff tools, fuzzy matching and "did you mean" suggestions. For huge inputs mention banded variants and Myers diff.',
  },

  trie: {
    title: 'Autocomplete with a trie', minutes: 25, level: 'medium',
    prompt: `<p>Implement <code>class Trie</code> with <code>insert(word)</code> and <code>suggest(prefix, limit=3)</code>, returning up to <code>limit</code> inserted words that start with <code>prefix</code>, in alphabetical order. Inserting a word twice must not duplicate it. An empty prefix suggests from all words.</p>`,
    starter: String.raw`class Trie:
    def __init__(self):
        pass

    def insert(self, word):
        pass

    def suggest(self, prefix, limit=3):
        pass
`,
    tests: String.raw`def build(*words):
    t = Trie()
    for w in words:
        t.insert(w)
    return t

WORDS = ('apple', 'app', 'apply', 'apt', 'banana', 'band')

test('basic prefix', lambda: eq(build(*WORDS).suggest('app'), ['app', 'apple', 'apply']))
test('limit applies', lambda: eq(build(*WORDS).suggest('ap', limit=2), ['app', 'apple']))
test('a word is its own suggestion', lambda: eq(build(*WORDS).suggest('apt'), ['apt']))
test('no match', lambda: eq(build(*WORDS).suggest('x'), []))
test('empty prefix', lambda: eq(build(*WORDS).suggest('', limit=10), ['app', 'apple', 'apply', 'apt', 'banana', 'band']))
test('duplicates are ignored', lambda: eq(build('go', 'go', 'gone').suggest('go', limit=5), ['go', 'gone']))
test('case sensitive', lambda: eq(build('Go', 'go').suggest('g'), ['go']))
test('prefix longer than any word', lambda: eq(build('app').suggest('apple'), []))
`,
    hint: 'Each node is a dict of children plus an is_word flag. To suggest: walk down the prefix (return [] if it breaks), then DFS the subtree visiting children in sorted order so results come out alphabetically, stopping once you have limit words.',
    solution: String.raw`class Trie:
    def __init__(self):
        self.children = {}
        self.is_word = False

    def insert(self, word):
        node = self
        for ch in word:
            node = node.children.setdefault(ch, Trie())
        node.is_word = True

    def suggest(self, prefix, limit=3):
        node = self
        for ch in prefix:
            node = node.children.get(ch)
            if node is None:
                return []
        out = []

        def dfs(n, path):
            if len(out) >= limit:
                return
            if n.is_word:
                out.append(prefix + path)
            for ch in sorted(n.children):
                dfs(n.children[ch], path + ch)

        dfs(node, '')
        return out`,
    notes: 'Real autocomplete adds ranking (store a score per word and keep a top-k per node), sharding by prefix, and caching hot prefixes. Time per query is O(prefix + visited nodes), independent of how many words are stored.',
  },

  components: {
    title: 'Connected components (union-find)', minutes: 20, level: 'medium',
    prompt: `<p>Write <code>count_components(n, edges)</code>: <code>n</code> nodes labelled <code>0..n-1</code> and a list of undirected <code>[u, v]</code> edges. Return the number of connected components. (Think: which accounts are linked by shared devices?)</p>`,
    starter: String.raw`def count_components(n, edges):
    pass
`,
    tests: String.raw`test('two components', lambda: eq(count_components(5, [[0, 1], [1, 2], [3, 4]]), 2))
test('no edges: every node alone', lambda: eq(count_components(4, []), 4))
test('no nodes', lambda: eq(count_components(0, []), 0))
test('a cycle is one component', lambda: eq(count_components(3, [[0, 1], [1, 2], [2, 0]]), 1))
test('duplicate and self edges', lambda: eq(count_components(3, [[0, 1], [1, 0], [2, 2]]), 2))
test('chain', lambda: eq(count_components(6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]), 1))

@test('long chain is fast and does not recurse deeply')
def _():
    n = 100000
    eq(count_components(n, [[i, i + 1] for i in range(n - 1)]), 1)
`,
    hint: 'Union-find: parent[] starts as identity; find(x) follows parents with path compression; union merges two roots and decrements the component counter only when the roots differ. Do not use recursion for find on a 100k chain.',
    solution: String.raw`def count_components(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    count = n
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            count -= 1
    return count`,
    notes: 'Union-find shines when edges arrive incrementally (online) and you only need connectivity. For "is there a path" on a static graph a BFS is just as good. Mention union by rank for the formal inverse-Ackermann bound.',
  },
});
window.resolveExercises();
