bool account_open(bank_account *a) { (void)a; return false; }
bool account_close(bank_account *a) { (void)a; return false; }
bool account_balance(bank_account *a, int64_t *out) { (void)a; (void)out; return false; }
bool account_deposit(bank_account *a, int64_t amount) { (void)a; (void)amount; return false; }
bool account_withdraw(bank_account *a, int64_t amount) { (void)a; (void)amount; return false; }
