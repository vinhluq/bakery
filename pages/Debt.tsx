
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CustomerDebt, DebtTransaction } from '../types';

const Debt: React.FC = () => {
  const [debts, setDebts] = useState<CustomerDebt[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDebts = async () => {
      const { data } = await supabase.from('customer_debts').select('*').order('last_activity', { ascending: false }); // Sort by activity
      setDebts((data as any) || []);
    };
    fetchDebts();
  }, []);

  const filteredDebts = debts.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm)
  );

  /* ... inside component */
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDebt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    image: '',
    initials: '',
    address: ''
  });
  const [uploading, setUploading] = useState(false);

  // Helper to get initials
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const openModal = (customer?: CustomerDebt) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        image: customer.image || '',
        initials: customer.initials || getInitials(customer.name),
        address: customer.address || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        image: '',
        initials: '',
        address: ''
      });
    }
    setShowModal(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `cust_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products') // Reusing products bucket for convenience
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, image: data.publicUrl }));
    } catch (error: any) {
      alert('Lỗi upload ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveCustomer = async () => {
    if (!formData.name) return alert('Vui lòng nhập tên khách hàng');

    const payload = {
      name: formData.name,
      phone: formData.phone,
      image: formData.image,
      initials: getInitials(formData.name),
      address: formData.address,
      // For new customers, default to 0 debt and 'paid' status if not exists
      ...(editingCustomer ? {} : { amount: 0, status: 'paid' })
    };

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customer_debts')
          .update(payload)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_debts')
          .insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);

      // Refresh list
      const { data } = await supabase.from('customer_debts').select('*');
      setDebts((data as any) || []);

    } catch (error: any) {
      alert('Lỗi lưu khách hàng: ' + error.message);
    }
  };


  /* ... inside Debt component ... */
  // ... previous state ...
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'debt' | 'repayment'>('debt');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');

  const [showHistoryList, setShowHistoryList] = useState(false);

  const openHistory = async (customer: CustomerDebt) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setShowHistoryList(false); // Reset to hidden
    // Fetch transactions
    const { data } = await supabase
      .from('debt_transactions')
      .select('*, customer_debts(name)') // Try to get customer name at least. Profiles might fail if no FK. Use fallback in UI.
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    setTransactions((data as any) || []);
  };

  const openTransaction = (type: 'debt' | 'repayment') => {
    setTransactionType(type);
    setTransactionAmount('');
    setTransactionNote('');
    setShowTransactionModal(true);
  };

  const handleTransaction = async () => {
    if (!selectedCustomer || !transactionAmount) return;
    const amount = parseInt(transactionAmount);
    if (isNaN(amount) || amount <= 0) return alert('Số tiền không hợp lệ');

    try {
      // 1. Create Transaction
      const { error: transError } = await supabase
        .from('debt_transactions')
        .insert([{
          customer_id: selectedCustomer.id,
          amount: amount,
          type: transactionType,
          note: transactionNote,
          created_at: new Date().toISOString()
        }]);

      if (transError) throw transError;

      // 2. Update Customer Balance
      let newAmount = selectedCustomer.amount;
      if (transactionType === 'debt') {
        newAmount += amount;
      } else {
        newAmount -= amount;
      }

      // Determine new status
      let newStatus = selectedCustomer.status;
      if (newAmount <= 0) newStatus = 'paid';
      else if (selectedCustomer.status === 'paid') newStatus = 'pending';

      const { error: updateError } = await supabase
        .from('customer_debts')
        .update({ amount: newAmount, status: newStatus, last_activity: new Date().toISOString() })
        .eq('id', selectedCustomer.id);

      if (updateError) throw updateError;

      // 3. Refresh UI
      setShowTransactionModal(false);

      // Refresh transactions list
      const { data: transData } = await supabase
        .from('debt_transactions')
        .select('*')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false });
      setTransactions((transData as any) || []);

      // Refresh customer list
      const { data: debData } = await supabase.from('customer_debts').select('*');
      setDebts((debData as any) || []);

      // Update local selected customer ref
      setSelectedCustomer(prev => prev ? ({ ...prev, amount: newAmount, status: newStatus }) : null);

    } catch (error: any) {
      alert('Lỗi giao dịch: ' + error.message);
    }
  };

  return (
    <div className="bg-background min-h-full flex flex-col relative">
      <header className="px-4 py-4 flex items-center justify-between bg-background sticky top-0 z-10">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5"><span className="material-symbols-outlined">filter_list</span></button>
        <h1 className="text-lg font-bold">Quản lý Khách hàng</h1>
        <button
          onClick={() => openModal()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* ... Search Bar, Summary Row, Tabs ... */}

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-400">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên hoặc SĐT khách hàng..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-primary focus:ring-2"
          />
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4 px-4 mb-6">
        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/10">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-primary uppercase">Tổng phải thu</span>
            <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
          </div>
          <p className="text-xl font-bold text-primary">15.450k</p>
          <p className="text-[9px] font-bold text-text-sub mt-1">+1.2tr hôm nay</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-red-500 uppercase">Quá hạn</span>
            <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
          </div>
          <p className="text-xl font-bold text-red-600">2.100k</p>
          <p className="text-[9px] font-bold text-red-400 mt-1">3 khách hàng</p>
        </div>
      </div>



      <div className="px-4 pb-2">
        <h3 className="text-[10px] font-bold text-text-sub uppercase tracking-widest">Danh sách khách hàng</h3>
      </div>

      {/* Customer List */}
      <div className="px-4 space-y-3 pb-32 flex-1 overflow-y-auto">
        {filteredDebts.map((debt) => (
          <div key={debt.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50 group active:scale-[0.98] transition-all relative">
            <div className="flex items-center gap-4" onClick={() => openModal(debt)}>
              {debt.image ? (
                <img src={debt.image} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${debt.initials === 'T' ? 'bg-orange-100 text-orange-600' :
                  debt.initials === 'K' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                  {debt.initials}
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold">{debt.name}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-text-sub font-medium">{debt.phone || 'Chưa có SĐT'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                  <span className={`text-[10px] font-bold ${debt.status === 'overdue' ? 'text-red-500' : debt.status === 'paid' ? 'text-green-500' : 'text-text-sub'}`}>{debt.amount > 0 ? 'Đang nợ' : 'Sạch nợ'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className={`text-sm font-bold ${debt.status === 'overdue' ? 'text-red-600' : debt.status === 'paid' ? 'text-green-600' : 'text-primary'}`}>
                {debt.amount.toLocaleString()}đ
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openHistory(debt);
                }}
                className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${debt.status === 'paid' ? 'bg-gray-50 text-text-sub' : 'bg-primary/10 text-primary active:bg-primary active:text-white'
                  }`}
              >
                {debt.status === 'paid' ? 'Lịch sử' : 'Xử lý nợ'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal (Previous one) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg">{editingCustomer ? 'Sửa thông tin' : 'Thêm khách mới'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 text-3xl">add_a_photo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><span className="text-xs font-bold">...</span></div>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tên khách hàng (*)</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                  placeholder="Nhập tên..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Số điện thoại</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                  placeholder="09..."
                  type="tel"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Địa chỉ</label>
                <input
                  value={(formData as any).address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value } as any)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                  placeholder="Nhập địa chỉ..."
                />
              </div>

              <button
                onClick={saveCustomer}
                disabled={uploading}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 mt-2 disabled:opacity-50"
              >
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col h-[80vh]">
            {/* Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedCustomer.name}</h3>
                {/* Remove small balance here */}
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Large Debt Balance & Interaction */}
            <div className="p-8 text-center bg-gray-50 border-b border-gray-100 flex flex-col items-center justify-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Tổng dư nợ</p>
              <button
                onClick={() => setShowHistoryList(!showHistoryList)}
                className="text-5xl font-black text-primary active:scale-95 transition-transform flex items-center gap-2"
              >
                {selectedCustomer.amount.toLocaleString()}đ
                <span className={`material-symbols-outlined text-2xl transition-transform ${showHistoryList ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3 border-b border-gray-100">
              <button
                onClick={() => openTransaction('repayment')}
                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">payments</span>
                Thu tiền
              </button>
              <button
                onClick={() => openTransaction('debt')}
                className="flex-1 py-3 bg-red-50 text-red-500 font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">request_quote</span>
                Ghi nợ
              </button>
            </div>

            {/* Transaction List (Collapsible) */}
            {showHistoryList && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 animate-slide-up">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Lịch sử giao dịch</h4>
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Chưa có giao dịch nào</div>
                ) : (
                  transactions.map(t => (
                    <div key={t.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${t.type === 'debt' ? 'text-red-500' : 'text-green-500'}`}>
                            {t.type === 'debt' ? 'Ghi nợ' : 'Thanh toán'}
                          </p>
                          <span className="text-[10px] text-gray-400">• {new Date(t.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        {/* Fake Staff Name if not available, or use profiles if valid */}
                        <p className="text-[10px] text-gray-500 mt-1">
                          Người thực hiện: <span className="font-bold">Nhân viên</span>
                        </p>
                        {t.note && <p className="text-[11px] text-gray-600 mt-1 italic">"{t.note}"</p>}
                      </div>
                      <span className={`text-sm font-bold ${t.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                        {t.type === 'debt' ? '+' : '-'}{t.amount.toLocaleString()}đ
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Input Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-2xl p-4 animate-scale-up">
            <h3 className="font-bold text-center mb-4 text-lg">
              {transactionType === 'debt' ? 'Ghi nợ mới' : 'Thu tiền khách'}
            </h3>
            <input
              type="number"
              value={transactionAmount}
              onChange={e => setTransactionAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className="w-full text-center text-2xl font-bold p-3 border-b-2 border-primary focus:outline-none mb-4"
              autoFocus
            />
            <input
              type="text"
              value={transactionNote}
              onChange={e => setTransactionNote(e.target.value)}
              placeholder="Ghi chú (tùy chọn)..."
              className="w-full p-3 bg-gray-50 rounded-xl text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowTransactionModal(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-500">Hủy</button>
              <button onClick={handleTransaction} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Debt;
