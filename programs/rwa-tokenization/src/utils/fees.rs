use anchor_lang::prelude::*;

pub fn calculate_platform_fee(amount: u64, fee_bps: u16) -> u64 {
    (amount as u128)
        .checked_mul(fee_bps as u128)
        .unwrap()
        .checked_div(10000)
        .unwrap() as u64
}

pub fn calculate_net_amount(amount: u64, fee_bps: u16) -> u64 {
    amount.checked_sub(calculate_platform_fee(amount, fee_bps)).unwrap()
}

