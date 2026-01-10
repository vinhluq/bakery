
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, CartItem, CustomerDebt } from '../types';
import InvoicePrint from '../components/InvoicePrint';


const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);

  const [priceMode, setPriceMode] = useState<'retail' | 'wholesale'>('retail');

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);

  // Create Customer Modal State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Discount & Payment State
  const [discount, setDiscount] = useState<number>(0); // Percentage or fixed? User said "chiết khấu (mặc định 0%)", usually percent in simple POS or amount. Let's assume % based on "(mặc định 0%)". Wait, could be amount. But 0% implies percent. I will assume percent.
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null); // For printing


  const [inputQuantity, setInputQuantity] = useState<string>('1');
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, customersRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('customer_debts').select('*').order('name')
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
    };
    fetchData();
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomerName) return alert('Vui lòng nhập tên khách hàng');

    try {
      const { data, error } = await supabase.from('customer_debts').insert([{
        name: newCustomerName,
        phone: newCustomerPhone,
        status: 'pending' // Default status
      }]).select().single();

      if (error) throw error;

      setCustomers(prev => [...prev, data]);
      setSelectedCustomer(data);
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      alert('Tạo khách hàng thành công!');
    } catch (error: any) {
      alert('Lỗi tạo khách hàng: ' + error.message);
    }
  };

  const togglePriceMode = (mode: 'retail' | 'wholesale') => {
    setPriceMode(mode);
    setCart(prev => prev.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return item;
      const newPrice = mode === 'retail' ? product.price : (product.wholesale_price || product.price);
      return { ...item, price: newPrice };
    }));
  };

  const updateCart = (product: Product, quantity: number, mode: 'add' | 'set' = 'add') => {
    const priceToUse = priceMode === 'retail' ? product.price : (product.wholesale_price || product.price);

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (mode === 'set') {
          return quantity === 0
            ? prev.filter(item => item.id !== product.id)
            : prev.map(item => item.id === product.id ? { ...item, quantity, price: priceToUse } : item);
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity, price: priceToUse } : item
        );
      }
      return mode === 'set' && quantity > 0
        ? [...prev, { ...product, quantity, price: priceToUse }]
        : [...prev, { ...product, quantity: quantity, price: priceToUse }];
    });
  };

  const handlePointerDown = (product: Product) => {
    const timer = setTimeout(() => {
      setSelectedProduct(product);
      const currentQty = cart.find(item => item.id === product.id)?.quantity || 1;
      setInputQuantity(currentQty.toString());
      setPressTimer(null);
    }, 500);
    setPressTimer(timer);
  };

  const handlePointerUp = (product: Product) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      updateCart(product, 1, 'add');
    }
  };

  const handlePointerCancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleConfirmQuantity = () => {
    if (selectedProduct && inputQuantity) {
      updateCart(selectedProduct, parseInt(inputQuantity), 'set');
      setSelectedProduct(null);
    }
  };

  const handleKeypad = (num: string) => {
    if (num === 'C') {
      setInputQuantity('0');
    } else {
      setInputQuantity(prev => prev === '0' || prev === '1' ? num : prev + num);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subTotal * discount) / 100;
  const totalPrice = subTotal - discountAmount;


  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (priceMode === 'wholesale' && !selectedCustomer) {
      return alert('Bán sỉ bắt buộc phải chọn khách hàng!');
    }

    // Always show payment modal for both modes
    setShowPaymentModal(true);
  };

  const processPayment = async (method: 'cash' | 'debt') => {
    try {
      // 1. If Debt, update customer balance
      if (method === 'debt' && selectedCustomer) {
        const newDebtAmount = (selectedCustomer.amount || 0) + totalPrice;

        // Update customer debt
        const { error: debtError } = await supabase
          .from('customer_debts')
          .update({
            amount: newDebtAmount,
            status: newDebtAmount > 0 ? 'pending' : 'paid',
            last_activity: new Date().toISOString()
          })
          .eq('id', selectedCustomer.id);

        if (debtError) throw debtError;

        // Optionally create transaction record (recommended for history)
        await supabase.from('debt_transactions').insert([{
          customer_id: selectedCustomer.id,
          amount: totalPrice,
          type: 'debt',
          note: 'Mua hàng (Sỉ)',
          created_at: new Date().toISOString()
        }]);
      }

      // 2. Create Order
      const orderPayload: any = {
        total_amount: totalPrice,
        payment_method: method
      };

      if (selectedCustomer) {
        orderPayload.customer_id = selectedCustomer.id;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderData) {
        const orderItems = cart.map(item => ({
          order_id: orderData.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Prepare print data
        const printData = {
          ...orderData,
          customer_name: selectedCustomer?.name,
          items: orderItems,
          discount: discount,
          subTotal: subTotal
        };
        setLastOrder(printData);

        // Success handling
        setShowPaymentModal(false);
        setShowSuccessPopup(true);

        // Trigger Print immediately
        setTimeout(() => {
          window.print();
        }, 300); // Small delay to allow React to render print view

        // Auto close popup and reset
        setTimeout(() => {
          setShowSuccessPopup(false);
          // Only clear cart after print dialogue might have been closed or started. 
          // Actually clearing cart immediately is fine as lastOrder is separate.
          setCart([]);
          setDiscount(0);
          if (priceMode === 'wholesale') {
            setSelectedCustomer(null);
          }
        }, 1000);
      }
    } catch (error: any) {
      alert('Lỗi thanh toán: ' + error.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="bg-background flex flex-col h-full relative print:hidden">
        {/* Search Header */}
        <header className="bg-white px-4 pt-6 pb-4 shadow-sm z-10 shrink-0">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm món..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm md:text-base focus:ring-primary focus:ring-2"
              />
            </div>
            <button className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary active:scale-95 transition-all">
              <span className="material-symbols-outlined">qr_code_scanner</span>
            </button>
          </div>

          {/* Pricing Mode Toggle */}
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="text-xs md:text-sm font-bold text-gray-400 uppercase">Chế độ giá</div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => togglePriceMode('retail')}
                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${priceMode === 'retail' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
              >
                Giá lẻ
              </button>
              <button
                onClick={() => togglePriceMode('wholesale')}
                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${priceMode === 'wholesale' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
              >
                Giá sỉ
              </button>
            </div>
          </div>

          {/* Customer Selector - Only for Wholesale */}
          {priceMode === 'wholesale' && (
            <div className="mb-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400">person</span>
                <select
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl appearance-none focus:ring-primary focus:ring-2 ${!selectedCustomer ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setShowCustomerModal(true);
                    } else {
                      const cust = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(cust || null);
                    }
                  }}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="new">+ Thêm khách mới</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400">expand_more</span>
                </div>
              </div>
              {!selectedCustomer && (
                <p className="text-xs text-red-500 mt-1 ml-1">* Bắt buộc chọn khách khi bán sỉ</p>
              )}
            </div>
          )}

          {/* Categories chips */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 items-center">
            {['Tất cả', 'Bánh mì', 'Bánh bao', 'Bánh ngọt', 'Thực phẩm', 'Đồ uống'].map((cat, i) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center shrink-0 gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500'
                  }`}
              >
                <span className="text-xs md:text-base font-bold">{cat}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-32 select-none">
          <h2 className="text-lg font-bold mb-4">Phổ biến</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map((p, i) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 group active:scale-95 transition-transform"
                onPointerDown={() => handlePointerDown(p)}
                onPointerUp={() => handlePointerUp(p)}
                onPointerLeave={handlePointerCancel}
                onPointerCancel={handlePointerCancel}
              >
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                  <button className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  {/* Quantity Badge if in cart */}
                  {cart.find(c => c.id === p.id) && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-[12px] font-bold rounded-full shadow-md">
                      x{cart.find(c => c.id === p.id)?.quantity}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm md:text-lg font-bold truncate leading-none">{p.name}</h4>
                  <p className="text-primary text-sm md:text-lg font-bold mt-1">
                    {(priceMode === 'retail' ? p.price : (p.wholesale_price || p.price)).toLocaleString()}đ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Cart Footer */}
        {cart.length > 0 && (
          <div className="absolute bottom-24 left-0 right-0 px-4 z-20">
            <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-between border border-gray-100 animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">shopping_basket</span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{totalItems}</span>
                </div>
                <div>
                  <p className="text-[10px] md:text-sm font-bold text-gray-400">Tổng cộng ({totalItems} món)</p>
                  <p className="text-lg md:text-2xl font-bold text-primary">{totalPrice.toLocaleString()}đ</p>
                  {discount > 0 && <p className="text-[10px] font-bold text-green-500">Đã giảm {discount}%</p>}
                </div>

                {/* Discount Input (only Wholesale) */}
                {priceMode === 'wholesale' && (
                  <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500">CK %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-12 p-1 text-center bg-gray-50 rounded-lg text-sm font-bold border-none focus:ring-primary focus:ring-1"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleCheckout}
                className="bg-primary hover:bg-primary-dark px-6 py-3 rounded-2xl text-white font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <span>Thanh toán</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Quantity Modal */}
        {selectedProduct && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                <img src={selectedProduct.image} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white" alt="" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-primary font-bold">{selectedProduct.price.toLocaleString()}đ</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <span className="text-gray-400 text-sm font-bold mr-3">Số lượng:</span>
                  <input
                    type="number"
                    value={inputQuantity}
                    onChange={(e) => setInputQuantity(e.target.value)}
                    className="text-4xl font-bold text-center w-32 border-b-2 border-primary focus:outline-none bg-transparent"
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex gap-2 mb-6 justify-center">
                  {[10, 20, 50, 100].map(num => (
                    <button
                      key={num}
                      onClick={() => setInputQuantity(num.toString())}
                      className="px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold text-sm active:bg-primary active:text-white transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleKeypad(btn.toString())}
                      className={`h-14 rounded-xl font-bold text-xl active:scale-95 transition-all shadow-sm ${btn === 'C' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    onClick={handleConfirmQuantity}
                    className="h-14 rounded-xl bg-primary text-white font-bold text-xl shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">check</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Create Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-lg">Thêm khách hàng mới</h3>
                <button onClick={() => setShowCustomerModal(false)} className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nhập tên khách..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Nhập SĐT..."
                  />
                </div>
                <button
                  onClick={handleCreateCustomer}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 mt-2"
                >
                  Lưu khách hàng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Confirmation & Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="font-bold text-lg">Hóa đơn thanh toán</h3>
                  <p className="text-xs text-gray-500">Vui lòng kiểm tra lại đơn hàng</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center hover:bg-gray-100">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    {/* Image */}
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover bg-gray-100" alt="" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.price.toLocaleString()}đ</p>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => updateCart(products.find(p => p.id === item.id)!, item.quantity - 1, 'set')}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCart(products.find(p => p.id === item.id)!, item.quantity + 1, 'set')}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-primary active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[60px]">
                      <p className="font-bold text-sm text-primary">{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Summary */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tổng tiền hàng:</span>
                    <span className="font-bold">{subTotal.toLocaleString()}đ</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Chiết khấu ({discount}%):</span>
                      <span>-{discountAmount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-gray-200">
                    <span>Thành tiền:</span>
                    <span>{totalPrice.toLocaleString()}đ</span>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => processPayment('cash')}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined">payments</span>
                      <span className="font-bold">Tiền mặt</span>
                    </div>
                  </button>

                  {/* Debt Button - Disabled if Retail or No Customer */}
                  <button
                    disabled={priceMode === 'retail' || !selectedCustomer}
                    onClick={() => processPayment('debt')}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all border ${priceMode === 'retail' || !selectedCustomer
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-red-500 border-red-200 hover:bg-red-50 active:scale-95'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                      <span className="font-bold">Ghi nợ</span>
                    </div>
                    {(priceMode === 'retail' || !selectedCustomer) && (
                      <span className="text-[10px] font-normal">(Chỉ bán sỉ)</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md text-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-3 shadow-lg shadow-green-500/30">
                <span className="material-symbols-outlined text-3xl">check</span>
              </div>
              <h3 className="font-bold text-xl">Thanh toán thành công!</h3>
              <p className="text-white/80 text-sm mt-1">Đang in hóa đơn...</p>
            </div>
          </div>
        )}

      </div>
      {/* Hidden Print Component */}
      <InvoicePrint order={lastOrder} />
    </>
  );
};

export default POS;
