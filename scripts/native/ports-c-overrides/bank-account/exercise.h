#ifdef __cplusplus
#include <atomic>
typedef std::atomic_bool account_lock;
#else
#include <stdatomic.h>
typedef atomic_bool account_lock;
#endif
/* Zero-initialize before use; do not copy an account while threads use it. */
typedef struct {
    bool is_open;
    int64_t balance;
    account_lock locked;
} bank_account;
bool account_open(bank_account *account);
bool account_close(bank_account *account);
bool account_balance(bank_account *account, int64_t *out);
bool account_deposit(bank_account *account, int64_t amount);
bool account_withdraw(bank_account *account, int64_t amount);
