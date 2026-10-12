#include <threads.h>
#define WORKERS 8
#define ITERATIONS 20000
struct worker_data { bank_account *account; int phase; bool success; };
static int transactions(void *data) {
    struct worker_data *worker = (struct worker_data *)data;
    worker->success = true;
    if (worker->phase == 2) {
        worker->success = account_open(worker->account);
        return 0;
    }
    if (worker->phase == 3) {
        worker->success = account_close(worker->account);
        return 0;
    }
    for (int i = 0; i < ITERATIONS; ++i) {
        bool ok = worker->phase == 0 ? account_deposit(worker->account, 1)
                                    : account_withdraw(worker->account, 1);
        if (!ok) worker->success = false;
    }
    return 0;
}
static unsigned parallel_phase(bank_account *account, int phase) {
    thrd_t threads[WORKERS];
    struct worker_data workers[WORKERS];
    for (int i = 0; i < WORKERS; ++i) {
        workers[i].account = account;
        workers[i].phase = phase;
        workers[i].success = false;
        assert(thrd_create(&threads[i], transactions, &workers[i]) == thrd_success);
    }
    unsigned successes = 0;
    for (int i = 0; i < WORKERS; ++i) {
        assert(thrd_join(threads[i], NULL) == thrd_success);
        successes += workers[i].success;
    }
    return successes;
}
