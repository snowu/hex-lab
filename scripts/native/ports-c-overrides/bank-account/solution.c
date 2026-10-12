/* The lock covers the entire lifecycle and every read-modify-write operation.
 * Relaxed balance reads outside this lock would also be a data race. */
static void acquire(bank_account *account) {
#ifdef __cplusplus
    while (account->locked.exchange(true, std::memory_order_acquire)) {}
#else
    while (atomic_exchange_explicit(&account->locked, true, memory_order_acquire)) {}
#endif
}
static void release(bank_account *account) {
#ifdef __cplusplus
    account->locked.store(false, std::memory_order_release);
#else
    atomic_store_explicit(&account->locked, false, memory_order_release);
#endif
}
bool account_open(bank_account *account) {
    acquire(account);
    bool success = !account->is_open;
    if (success) {
        account->is_open = true;
        account->balance = 0;
    }
    release(account);
    return success;
}
bool account_close(bank_account *account) {
    acquire(account);
    bool success = account->is_open;
    if (success) {
        account->is_open = false;
        account->balance = 0;
    }
    release(account);
    return success;
}
bool account_balance(bank_account *account, int64_t *out) {
    acquire(account);
    bool success = account->is_open;
    if (success) *out = account->balance;
    release(account);
    return success;
}
bool account_deposit(bank_account *account, int64_t amount) {
    acquire(account);
    bool success = account->is_open && amount > 0 && account->balance <= INT64_MAX - amount;
    if (success) account->balance += amount;
    release(account);
    return success;
}
bool account_withdraw(bank_account *account, int64_t amount) {
    acquire(account);
    bool success = account->is_open && amount > 0 && amount <= account->balance;
    if (success) account->balance -= amount;
    release(account);
    return success;
}
