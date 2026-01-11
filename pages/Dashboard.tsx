
import React, { useState, useEffect } from 'react';
import { AppScreen, CakeOrder, Product, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { SHOP_INFO } from '../constants';

interface DashboardProps {
  onNavigate: (screen: AppScreen) => void;
}

// Mock Data for Cake Orders


const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<CakeOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CakeOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Form Data
  const [products, setProducts] = useState<Product[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const getTodayAt5AM = () => {
    const date = new Date();
    date.setHours(5, 0, 0, 0);
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    // Need to handle timezone offset for correct display
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    deposit_amount: 0,
    delivery_date: getTodayAt5AM(),
    delivery_address: '',
    created_by: '',
    note: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchProfiles();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, created_by: currentUser.full_name }));
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('cake_orders')
      .select('*')
      .order('delivery_date', { ascending: true });

    if (data) setOrders(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setProducts(data);
  };

  const fetchProfiles = async () => {
    // Assuming 'profiles' table exists and is accessible. 
    // If not, we might need to adjust or rely on a simple text input if permissions are strict.
    // Given types.ts has UserProfile, likely fine.
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setCurrentUser(data);
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.customer_name || !formData.product_name || !formData.delivery_date) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const selectedProduct = products.find(p => p.id === formData.product_id);
    const price = selectedProduct ? selectedProduct.price : 0;
    const total_amount = price * formData.quantity;

    // Convert local datetime-local string to UTC timestamp for strict DB saving
    const deliveryDateObj = new Date(formData.delivery_date);
    const deliveryDateISO = deliveryDateObj.toISOString();

    const { error } = await supabase.from('cake_orders').insert([
      {
        ...formData,
        delivery_date: deliveryDateISO,
        total_amount,
        status: 'pending'
      }
    ]);

    if (error) {
      console.error('Error creating order:', error);
      alert('Lỗi khi tạo đơn hàng');
    } else {
      setShowCreateModal(false);
      fetchOrders();
      setFormData({
        customer_name: '',
        phone: '',
        product_id: '',
        product_name: '',
        quantity: 1,
        deposit_amount: 0,
        delivery_date: getTodayAt5AM(),
        delivery_address: '',
        created_by: currentUser ? currentUser.full_name : '',
        note: ''
      });
    }
  };

  const handleMarkAsDelivered = async () => {
    if (!selectedOrder) return;

    // Try to update with completed_at first
    const { error } = await supabase
      .from('cake_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', selectedOrder.id);

    if (error) {
      console.warn('Could not update completed_at, falling back to status only:', error.message);

      // Fallback: Try updating ONLY status (in case column is missing)
      const { error: fallbackError } = await supabase
        .from('cake_orders')
        .update({ status: 'completed' })
        .eq('id', selectedOrder.id);

      if (fallbackError) {
        console.error('Error updating order:', fallbackError);
        alert('Lỗi khi cập nhật trạng thái đơn hàng: ' + fallbackError.message);
        return;
      }
    }

    setSelectedOrder(null);
    fetchOrders();
  };

  const selectedProductPrice = products.find(p => p.id === formData.product_id)?.price || 0;
  const totalAmount = selectedProductPrice * formData.quantity;
  const remainingAmount = totalAmount - formData.deposit_amount;

  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center overflow-hidden border border-primary/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{SHOP_INFO.name}</h1>
            <p className="text-xs text-text-sub font-medium">{SHOP_INFO.address}</p>
          </div>
        </div>
        <button className="relative p-2 rounded-full bg-white shadow-sm">
          <span className="material-symbols-outlined text-gray-600">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      {/* Date & Shift Picker */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/10">
          <span className="material-symbols-outlined text-primary text-sm">schedule</span>
          <span className="text-xs font-bold text-primary">Ca Sáng</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm">
          <span className="material-symbols-outlined text-gray-400 text-sm">calendar_today</span>
          <span className="text-xs font-bold text-gray-700">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Hero Stats - Hide for Baker */}
      {currentUser?.role !== 'baker' && (
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-white/80">
              <span className="material-symbols-outlined text-lg">payments</span>
              <span className="text-xs font-semibold">Doanh thu hôm nay</span>
            </div>
            <span className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold backdrop-blur-sm flex items-center">
              <span className="material-symbols-outlined text-[12px] mr-1">trending_up</span> +12%
            </span>
          </div>
          <div className="text-3xl font-bold mb-4 tracking-tight">15.500.000đ</div>
          <div>
            <p className="text-[10px] font-medium text-white/70 mb-1.5 uppercase tracking-wider">Mục tiêu: 12.000.000đ</p>
            <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-white h-full w-full rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Stats - Hide for Baker */}
      {currentUser?.role !== 'baker' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </div>
              <span className="text-xs font-bold text-text-sub">Đơn hàng</span>
            </div>
            <div className="text-2xl font-bold">45</div>
            <div className="text-green-500 text-[10px] font-bold mt-1">↑ 5 đơn mới</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
              </div>
              <span className="text-xs font-bold text-text-sub">Công nợ</span>
            </div>
            <div className="text-2xl font-bold">2.1tr</div>
            <div className="text-gray-400 text-[10px] font-medium mt-1">Cần thu ngay</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hidden md:block">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
              </div>
              <span className="text-xs font-bold text-text-sub">Tồn kho</span>
            </div>
            <div className="text-2xl font-bold">12</div>
            <div className="text-red-400 text-[10px] font-medium mt-1">Sắp hết hàng</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hidden md:block">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                <span className="material-symbols-outlined text-lg">group</span>
              </div>
              <span className="text-xs font-bold text-text-sub">Khách hàng</span>
            </div>
            <div className="text-2xl font-bold">128</div>
            <div className="text-green-500 text-[10px] font-bold mt-1">↑ 3 mới</div>
          </div>
        </div>
      )}

      {/* Quick Actions - Hide for Baker */}
      {currentUser?.role !== 'baker' && (
        <section>
          <h3 className="text-base font-bold mb-4">Tác vụ nhanh</h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {[
              { label: 'Tạo đơn', icon: 'add_shopping_cart', color: 'bg-primary/10 text-primary border-primary/10', action: () => onNavigate(AppScreen.POS) },
              { label: 'Kho hàng', icon: 'inventory_2', color: 'bg-white text-gray-700 border-gray-100', action: () => onNavigate(AppScreen.PRODUCTS) },
              { label: 'Khách hàng', icon: 'group', color: 'bg-white text-gray-700 border-gray-100', action: () => onNavigate(AppScreen.DEBT) },
              { label: 'Báo cáo', icon: 'bar_chart', color: 'bg-white text-gray-700 border-gray-100', action: () => onNavigate(AppScreen.REPORTS) },
              { label: 'Nhập hàng', icon: 'move_to_inbox', color: 'bg-white text-gray-700 border-gray-100', action: () => onNavigate(AppScreen.PRODUCTS) }, // Shortcut
              { label: 'Ca làm', icon: 'schedule', color: 'bg-white text-gray-700 border-gray-100', action: () => onNavigate(AppScreen.SHIFTS) },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className={`flex flex-col items-center gap-2 ${idx >= 4 ? 'hidden md:flex' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all active:scale-95 ${action.color}`}>
                  <span className="material-symbols-outlined text-[28px]">{action.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Cake Order Schedule */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">Lịch Bánh đặt</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary-dark transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Tạo đơn
            </button>
            <button className="text-xs font-bold text-primary">Xem tất cả</button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section: Cần giao (Urgent - < 2 hours) */}
          {orders.filter(o => {
            const deliveryTime = new Date(o.delivery_date);
            const now = new Date();
            const diffHours = (deliveryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            return o.status === 'pending' && diffHours <= 2;
          }).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">avg_pace</span>
                  Cần giao gấp (Trong 2h)
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders
                    .filter(o => {
                      const deliveryTime = new Date(o.delivery_date);
                      const now = new Date();
                      const diffHours = (deliveryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                      return o.status === 'pending' && diffHours <= 2;
                    })
                    .map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100 flex items-center justify-between active:scale-95 transition-transform cursor-pointer hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white text-red-500 flex flex-col items-center justify-center border border-red-100 shadow-sm">
                            <span className="text-xs font-bold uppercase">{new Date(order.delivery_date).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(order.delivery_date).getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{order.customer_name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{order.product_name} - x{order.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-sm font-bold text-red-600">{new Date(order.delivery_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] bg-white text-red-500 border border-red-200 px-2 py-0.5 rounded-md font-bold">Gấp</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Section: Sắp giao (Today > 2 hours) */}
          {orders.filter(o => {
            const deliveryTime = new Date(o.delivery_date);
            const now = new Date();
            const diffHours = (deliveryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            const isToday = new Date().toDateString() === deliveryTime.toDateString();
            return o.status === 'pending' && diffHours > 2 && isToday;
          }).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  Sắp giao (Hôm nay)
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders
                    .filter(o => {
                      const deliveryTime = new Date(o.delivery_date);
                      const now = new Date();
                      const diffHours = (deliveryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                      const isToday = new Date().toDateString() === deliveryTime.toDateString();
                      return o.status === 'pending' && diffHours > 2 && isToday;
                    })
                    .map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform cursor-pointer hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center border border-blue-100">
                            <span className="text-xs font-bold uppercase">{new Date(order.delivery_date).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(order.delivery_date).getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{order.customer_name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{order.product_name} - x{order.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-sm font-bold text-primary">{new Date(order.delivery_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">Hôm nay</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Section: Ngày mai & Sau này (Future) */}
          {orders.filter(o => {
            const deliveryTime = new Date(o.delivery_date);
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return o.status === 'pending' && deliveryTime >= tomorrow;
          }).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  Sắp tới (Ngày mai +)
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders
                    .filter(o => {
                      const deliveryTime = new Date(o.delivery_date);
                      const now = new Date();
                      const tomorrow = new Date(now);
                      tomorrow.setDate(now.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      return o.status === 'pending' && deliveryTime >= tomorrow;
                    })
                    .map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="bg-gray-50 p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between active:scale-95 transition-transform cursor-pointer hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-200 text-gray-600 flex flex-col items-center justify-center border border-gray-300">
                            <span className="text-xs font-bold uppercase">{new Date(order.delivery_date).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(order.delivery_date).getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-700 line-clamp-1">{order.customer_name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{order.product_name} - x{order.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-sm font-bold text-gray-600">{new Date(order.delivery_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold">Tương lai</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Section: Đã giao (History) */}
          <div>
            <div className="flex items-center gap-2 mb-3 cursor-pointer group" onClick={() => {
              // Toggle history visibility if needed, or just show header
            }}>
              <h4 className="text-sm font-bold text-green-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Đã giao (Lịch sử)
              </h4>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 hover:opacity-100 transition-opacity">
              {orders
                .filter(o => o.status === 'completed')
                .sort((a, b) => {
                  const timeA = new Date(a.completed_at || a.delivery_date).getTime();
                  const timeB = new Date(b.completed_at || b.delivery_date).getTime();
                  return timeB - timeA;
                })
                .slice(0, 5) // Limit to last 5 for cleanliness
                .map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between active:scale-95 transition-transform cursor-pointer hover:bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex flex-col items-center justify-center border border-green-100 grayscale-[0.5]">
                        <span className="material-symbols-outlined text-2xl">check</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-600 line-clamp-1 decoration-gray-400">{order.customer_name}</h4>
                        <p className="text-xs text-gray-400 line-clamp-1">{order.product_name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-bold text-gray-400">{order.completed_at ? 'Giao lúc' : 'Giờ hẹn'}</span>
                      <span className="text-sm font-bold text-green-600">
                        {new Date(order.completed_at || order.delivery_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              {orders.filter(o => o.status === 'completed').length === 0 && (
                <p className="text-xs text-gray-400 italic">Chưa có đơn đã giao.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-purple-900">Chi tiết đơn đặt</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center shadow-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden">
                  <img src="https://ui-avatars.com/api/?name=KH&background=random" alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">{selectedOrder.customer_name}</h4>
                  <p className="text-sm text-gray-500">{selectedOrder.phone || 'Không có sđt'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Loại bánh</span>
                  <span className="font-bold text-sm text-right">{selectedOrder.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Số lượng</span>
                  <span className="font-bold text-sm">x{selectedOrder.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Địa chỉ</span>
                  <span className="font-medium text-sm text-right">{selectedOrder.delivery_address || 'Tại cửa hàng'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Thành tiền</span>
                  <span className="font-bold text-sm text-primary">{selectedOrder.total_amount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Cọc trước</span>
                  <span className="font-bold text-sm">{selectedOrder.deposit_amount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Còn lại</span>
                  <span className="font-bold text-sm text-red-500">{selectedOrder.remaining_amount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Ghi chú</span>
                  <span className="font-medium text-sm text-right italic">"{selectedOrder.note || 'Không có ghi chú'}"</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl text-blue-700">
                <span className="material-symbols-outlined text-2xl">schedule</span>
                <div>
                  <p className="text-xs font-bold opacity-70">Thời gian giao hàng</p>
                  <p className="font-bold text-lg">
                    {new Date(selectedOrder.delivery_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-sm font-normal text-blue-600 ml-1">
                      - {new Date(selectedOrder.delivery_date).toLocaleDateString('vi-VN')}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleMarkAsDelivered}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 mt-2 hover:bg-purple-700 transition-colors"
              >
                Đánh dấu đã giao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 bg-primary text-white flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-lg">Tạo đơn đặt bánh</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên Khách hàng <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  placeholder="Nhập tên khách hàng"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Loại Bánh <span className="text-red-500">*</span></label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                    value={formData.product_id}
                    onChange={e => {
                      const product = products.find(p => p.id === e.target.value);
                      setFormData({
                        ...formData,
                        product_id: e.target.value,
                        product_name: product ? product.name : ''
                      });
                    }}
                  >
                    <option value="">Chọn loại bánh</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()}đ</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50 font-bold"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Thành tiền</label>
                  <div className="w-full px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 font-bold text-primary flex items-center justify-end">
                    {totalAmount.toLocaleString()}đ
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cọc trước</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                    value={formData.deposit_amount}
                    onChange={e => setFormData({ ...formData, deposit_amount: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Còn lại</label>
                  <div className="w-full px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 font-bold text-red-500 flex items-center justify-end">
                    {remainingAmount.toLocaleString()}đ
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày nhận <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  value={formData.delivery_date}
                  onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ nhận hàng</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  placeholder="Nhập địa chỉ giao hàng"
                  value={formData.delivery_address}
                  onChange={e => setFormData({ ...formData, delivery_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Người tạo đơn</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  value={formData.created_by}
                  onChange={e => setFormData({ ...formData, created_by: e.target.value })}
                >
                  <option value="">Chọn nhân viên</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.full_name}>{p.full_name}</option>
                  ))}
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50"
                  rows={2}
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                ></textarea>
              </div>

            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-10">
              <button
                onClick={handleCreateOrder}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                Tạo đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
