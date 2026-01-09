
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryLog, DebtTransaction, Order, CustomerDebt } from '../types';

const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'revenue' | 'inventory' | 'debt'>('revenue');
    // dateRange can be 'month' or a specific date string 'YYYY-MM-DD'
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState<string>(todayStr);

    // Generate last 7 days options
    const pastDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
            value: d.toISOString().split('T')[0],
            label: i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN')
        };
    });

    // Revenue State
    const [orders, setOrders] = useState<Order[]>([]);
    const [revenueStats, setRevenueStats] = useState({ total: 0, count: 0 });

    // Inventory State
    const [logs, setLogs] = useState<InventoryLog[]>([]);

    // Debt State
    const [debts, setDebts] = useState<CustomerDebt[]>([]);
    const [debtTrans, setDebtTrans] = useState<DebtTransaction[]>([]);

    useEffect(() => {
        if (activeTab === 'revenue') fetchRevenue();
        if (activeTab === 'inventory') fetchInventory();
        if (activeTab === 'debt') fetchDebt();
    }, [activeTab, dateRange]);

    const fetchRevenue = async () => {
        let query = supabase.from('orders').select('*, customer_debts(name)').order('created_at', { ascending: false });

        if (dateRange === 'month') {
            const date = new Date();
            date.setDate(1); // First day of current month
            const firstDayOfMonth = date.toISOString().split('T')[0];
            query = query.gte('created_at', firstDayOfMonth);
        } else {
            // Specific Date Filter (Start of day to end of day)
            // dateRange is YYYY-MM-DD
            // gte: YYYY-MM-DDT00:00:00
            // lt: YYYY-MM-DD+1T00:00:00
            const nextDay = new Date(dateRange);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            query = query.gte('created_at', dateRange).lt('created_at', nextDayStr);
        }

        const { data } = await query;
        if (data) {
            setOrders(data as any);
            const total = data.reduce((sum, order) => sum + order.total_amount, 0);
            setRevenueStats({ total, count: data.length });
        }
    };

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory_logs')
            .select(`*, products(name), profiles(full_name)`)
            .order('created_at', { ascending: false })
            .limit(50);
        setLogs((data as any) || []);
    };

    const fetchDebt = async () => {
        const { data: debtData } = await supabase.from('customer_debts').select('*');
        if (debtData) setDebts(debtData as any);

        let query = supabase
            .from('debt_transactions')
            .select('*, customer_debts(name)')
            .order('created_at', { ascending: false });

        // Reuse date logic or keep simple for other tabs? User asked specifically for revenue.
        // Let's apply basic logic if dateRange is today, else limit.
        // But dateRange now holds specific dates.
        // For simplicity on other tabs, if 'month' -> limit 50?
        // Or if specific date -> filter by that date?
        // Let's keep it consistent: filter by the dateRange selected.

        if (dateRange === 'month') {
            query = query.limit(50);
        } else {
            const nextDay = new Date(dateRange);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];
            query = query.gte('created_at', dateRange).lt('created_at', nextDayStr);
        }

        const { data: transData } = await query;
        if (transData) setDebtTrans(transData as any);
    };

    return (
        <div className="bg-white min-h-full pb-20">
            <header className="px-4 py-4 flex items-center justify-between bg-white sticky top-0 z-10 border-b border-gray-50">
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="text-lg font-bold">Báo cáo</h1>
                <div className="w-10"></div>
            </header>

            {/* Tabs */}
            <div className="p-4">
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                    {[
                        { id: 'revenue', label: 'Doanh thu' },
                        { id: 'inventory', label: 'Kho hàng' },
                        { id: 'debt', label: 'Công nợ' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex justify-end mb-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-gray-50 border-none rounded-lg text-xs font-bold py-2 px-3 focus:ring-primary"
                    >
                        {pastDays.map(day => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                        <option value="month">Tháng này</option>
                    </select>
                </div>

                {/* Content */}
                {activeTab === 'revenue' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-center">
                            <p className="text-xs text-primary font-bold uppercase mb-1">Tổng doanh thu</p>
                            <p className="text-3xl font-bold text-primary">{revenueStats.total.toLocaleString()}đ</p>
                            <p className="text-xs text-gray-400 mt-2">{revenueStats.count} đơn hàng</p>
                        </div>

                        <h3 className="font-bold text-sm mt-6 mb-2">Đơn hàng gần đây</h3>
                        <div className="space-y-3">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold">{order.customer_debts?.name || 'Khách lẻ'} <span className="text-[9px] font-normal text-gray-400">(#{order.id.slice(0, 4)})</span></p>
                                        <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                                    </div>
                                    <span className="font-bold text-primary">{order.total_amount.toLocaleString()}đ</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="space-y-3 animate-fade-in">
                        {logs.map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-800">{log.products?.name}</span>
                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[11px] text-primary font-medium">+{log.quantity} <span className="text-gray-400">({log.price.toLocaleString()}đ/đv)</span></p>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 font-bold">{log.profiles?.full_name}</p>
                                        <p className="text-[9px] text-gray-400">{new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-center text-gray-400 text-xs py-10">Chưa có lịch sử nhập hàng</p>}
                    </div>
                )}

                {activeTab === 'debt' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                <p className="text-[10px] text-red-500 font-bold uppercase">Tổng nợ</p>
                                <p className="text-xl font-bold text-red-600">
                                    {debts.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}đ
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <p className="text-[10px] text-green-500 font-bold uppercase">Khách nợ</p>
                                <p className="text-xl font-bold text-green-600">
                                    {debts.filter(d => d.amount > 0).length}
                                </p>
                            </div>
                        </div>

                        <h3 className="font-bold text-sm mt-4 mb-2">Giao dịch gần đây</h3>
                        <div className="space-y-3">
                            {debtTrans.map(t => (
                                <div key={t.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{t.customer_debts?.name || 'Khách hàng'}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className={`text-[10px] font-bold ${t.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                                                {t.type === 'debt' ? 'Ghi nợ' : 'Trả nợ'}
                                            </span>
                                            <span className="text-[9px] text-gray-400">• {new Date(t.created_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                        {t.profiles?.full_name && <p className="text-[9px] text-gray-400 mt-0.5">Bởi: {t.profiles.full_name}</p>}
                                    </div>
                                    <span className={`font-bold ${t.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                                        {t.type === 'debt' ? '+' : '-'}{t.amount.toLocaleString()}đ
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
