const std = @import("std");
const t = std.testing;
const a = t.allocator;
const m = @import("bank_account.zig");

test "account lifecycle and invalid operations are atomic" {
    var bank: m.BankAccount = .{};
    try t.expectError(error.AccountNotOpen, bank.getBalance());
    try t.expectError(error.AccountNotOpen, bank.deposit(1));
    try t.expectError(error.AccountNotOpen, bank.withdraw(1));
    try t.expectError(error.AccountNotOpen, bank.close());
    try bank.open();
    try t.expectEqual(@as(i64, 0), try bank.getBalance());
    try t.expectError(error.AccountAlreadyOpen, bank.open());
    try bank.deposit(100);
    try bank.withdraw(25);
    try t.expectEqual(@as(i64, 75), try bank.getBalance());
    try t.expectError(error.AmountMustBePositive, bank.deposit(0));
    try t.expectError(error.AmountMustBePositive, bank.withdraw(-1));
    try t.expectError(error.InsufficientFunds, bank.withdraw(76));
    try t.expectEqual(@as(i64, 75), try bank.getBalance());
    try bank.close();
    try t.expectError(error.AccountNotOpen, bank.getBalance());
    try bank.open();
    try t.expectEqual(@as(i64, 0), try bank.getBalance());
}

const contract_workers = 8;
const contract_iterations = 20000;
fn contractWorker(bank: *m.BankAccount, phase: u8, start: *std.atomic.Value(bool), successes: *std.atomic.Value(u32)) void {
    while (!start.load(.acquire)) std.atomic.spinLoopHint();
    if (phase == 2) {
        bank.open() catch |err| {
            if (err != error.AccountAlreadyOpen) @panic("unexpected open failure");
            return;
        };
    } else if (phase == 3) {
        bank.close() catch |err| {
            if (err != error.AccountNotOpen) @panic("unexpected close failure");
            return;
        };
    } else {
        for (0..contract_iterations) |_| {
            if (phase == 0) bank.deposit(1) catch @panic("deposit failed") else bank.withdraw(1) catch @panic("withdrawal failed");
        }
    }
    _ = successes.fetchAdd(1, .monotonic);
}
fn contractPhase(bank: *m.BankAccount, phase: u8) !u32 {
    var threads: [contract_workers]std.Thread = undefined;
    var start = std.atomic.Value(bool).init(false);
    var successes = std.atomic.Value(u32).init(0);
    for (&threads) |*thread| thread.* = try std.Thread.spawn(.{}, contractWorker, .{ bank, phase, &start, &successes });
    start.store(true, .release);
    for (threads) |thread| thread.join();
    return successes.load(.monotonic);
}
test "parallel deposits withdrawals and lifecycle have parity across tracks" {
    var bank: m.BankAccount = .{};
    try t.expectEqual(@as(u32, 1), try contractPhase(&bank, 2));
    try t.expectEqual(@as(u32, contract_workers), try contractPhase(&bank, 0));
    try t.expectEqual(@as(i64, contract_workers * contract_iterations), try bank.getBalance());
    try t.expectEqual(@as(u32, contract_workers), try contractPhase(&bank, 1));
    try t.expectEqual(@as(i64, 0), try bank.getBalance());
    try t.expectEqual(@as(u32, 1), try contractPhase(&bank, 3));
    try t.expectError(error.AccountNotOpen, bank.deposit(1));
    try t.expectError(error.AccountNotOpen, bank.getBalance());
    try bank.open();
    try t.expectEqual(@as(i64, 0), try bank.getBalance());
    try bank.close();
}
