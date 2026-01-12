alter table cake_orders 
add column if not exists customer_id text references customer_debts(id);
