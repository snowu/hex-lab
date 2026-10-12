
bank_account a={false,0};int64_t b;assert(!account_balance(&a,&b)&&!account_deposit(&a,1));assert(account_open(&a)&&!account_open(&a));assert(account_deposit(&a,100)&&account_withdraw(&a,25));assert(account_balance(&a,&b)&&b==75);assert(!account_withdraw(&a,76)&&!account_deposit(&a,-1)&&!account_deposit(&a,0)&&!account_withdraw(&a,0));assert(account_close(&a)&&!account_close(&a));assert(account_open(&a)&&account_balance(&a,&b)&&b==0);

/* Contract: transactions and lifecycle changes are safe across threads. */
bank_account shared = {false, 0};
assert(parallel_phase(&shared, 2) == 1);
assert(parallel_phase(&shared, 0) == WORKERS);
assert(account_balance(&shared, &b) && b == WORKERS * ITERATIONS);
assert(parallel_phase(&shared, 1) == WORKERS);
assert(account_balance(&shared, &b) && b == 0);
assert(parallel_phase(&shared, 3) == 1);
assert(!account_deposit(&shared, 1) && !account_balance(&shared, &b));
assert(account_open(&shared) && account_balance(&shared, &b) && b == 0);
assert(account_close(&shared));
