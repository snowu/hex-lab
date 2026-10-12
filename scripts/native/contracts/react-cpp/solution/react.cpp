#include "react.h"
#include <algorithm>
#include <memory>
#include <new>
#include <vector>

/* The public exercise API borrows cell pointers. The owning reactor keeps every
 * allocation in unique_ptr, so shared/repeated dependencies cannot double-free.
 * Dependencies always predate their compute cell: creation order is topological. */
enum class cell_kind { input, compute_one, compute_two };
struct subscription { callback_id id; callback function; void *context; };
struct cell {
    reactor *owner;
    int value;
    cell_kind kind = cell_kind::input;
    cell *first = nullptr, *second = nullptr;
    compute1 unary = nullptr;
    compute2 binary = nullptr;
    std::vector<subscription> callbacks;
    callback_id next_id = 0;
};
struct reactor { std::vector<std::unique_ptr<cell>> cells; };
reactor *create_reactor() { return new (std::nothrow) reactor{}; }
void destroy_reactor(reactor *owner) { delete owner; }
static cell *append(reactor *owner, std::unique_ptr<cell> next) {
    auto *result = next.get();
    owner->cells.push_back(std::move(next));
    return result;
}
cell *create_input_cell(reactor *owner, int initial) {
    auto next = std::make_unique<cell>();
    next->owner = owner; next->value = initial;
    return append(owner, std::move(next));
}
cell *create_compute1_cell(reactor *owner, cell *input, compute1 compute) {
    auto next = std::make_unique<cell>();
    next->owner = owner; next->kind = cell_kind::compute_one;
    next->first = input; next->unary = compute; next->value = compute(input->value);
    return append(owner, std::move(next));
}
cell *create_compute2_cell(reactor *owner, cell *first, cell *second, compute2 compute) {
    auto next = std::make_unique<cell>();
    next->owner = owner; next->kind = cell_kind::compute_two;
    next->first = first; next->second = second; next->binary = compute;
    next->value = compute(first->value, second->value);
    return append(owner, std::move(next));
}
int get_cell_value(cell *focus) { return focus->value; }
void set_cell_value(cell *input, int value) {
    if (input->kind != cell_kind::input || input->value == value) return;
    auto &cells = input->owner->cells;
    std::vector<int> previous;
    previous.reserve(cells.size());
    for (const auto &current : cells) previous.push_back(current->value);
    input->value = value;
    for (auto &current : cells) {
        if (current->kind == cell_kind::compute_one)
            current->value = current->unary(current->first->value);
        else if (current->kind == cell_kind::compute_two)
            current->value = current->binary(current->first->value, current->second->value);
    }
    // Compare final values, after the whole graph settles, and notify once.
    for (std::size_t i = 0; i < cells.size(); ++i) {
        if (cells[i]->value == previous[i]) continue;
        const auto callbacks = cells[i]->callbacks;
        for (const auto &entry : callbacks) entry.function(entry.context, cells[i]->value);
    }
}
callback_id add_callback(cell *focus, void *context, callback function) {
    const auto id = focus->next_id++;
    focus->callbacks.push_back({id, function, context});
    return id;
}
void remove_callback(cell *focus, callback_id id) {
    std::erase_if(focus->callbacks, [id](const auto &entry) { return entry.id == id; });
}
