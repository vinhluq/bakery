
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shift } from '../types';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    const fetchShifts = async () => {
      const { data } = await supabase.from('shifts').select('*');
      setShifts((data as any) || []);
    };
    fetchShifts();
  }, []);

  /* ... inside component */
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Nhân viên bán hàng',
    time: '05:00 - 12:00',
    image: '',
    status: 'upcoming' as 'active' | 'upcoming' | 'completed'
  });
  const [uploading, setUploading] = useState(false);

  const openModal = (shift?: Shift) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        role: shift.role,
        time: shift.time,
        image: shift.image,
        status: shift.status
      });
    } else {
      setEditingShift(null);
      setFormData({
        name: '',
        role: 'Nhân viên bán hàng',
        time: '05:00 - 12:00',
        image: '',
        status: 'upcoming'
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
      const fileName = `shift_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products') // Reuse bucket
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

  const fetchShifts = async () => {
    const { data } = await supabase.from('shifts').select('*').order('time', { ascending: true });
    setShifts((data as any) || []);
  };

  const saveShift = async () => {
    if (!formData.name) return alert('Vui lòng nhập tên nhân viên');

    try {
      if (editingShift) {
        const { error } = await supabase
          .from('shifts')
          .update(formData)
          .eq('id', editingShift.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shifts')
          .insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchShifts();
    } catch (error: any) {
      alert('Lỗi lưu ca làm việc: ' + error.message);
    }
  };

  const deleteShift = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ca này?')) return;
    try {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;
      fetchShifts();
    } catch (error: any) {
      alert('Lỗi xóa: ' + error.message);
    }
  };

  return (
    <div className="bg-white min-h-full pb-20">
      <header className="px-4 py-4 flex items-center justify-between bg-white sticky top-0 z-10 border-b border-gray-50">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-lg font-bold">Quản lý Ca làm việc</h1>
        <button
          onClick={() => openModal()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Calendar Strip */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">Tháng {new Date().getMonth() + 1} {new Date().getFullYear()}</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-gray-400 text-xl">chevron_left</span>
            <span className="material-symbols-outlined text-gray-400 text-xl">chevron_right</span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(new Date().getDate() + i);
            return d;
          }).map((date, i) => (
            <div key={i} className={`flex flex-col items-center min-w-[50px] py-3 rounded-2xl ${i === 0 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400'}`}>
              <span className="text-[10px] font-bold mb-1 uppercase">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
              </span>
              <span className="text-lg font-bold">{date.getDate()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-3 px-4 py-6 overflow-x-auto no-scrollbar">
        {[
          { label: 'Tổng ca', value: shifts.length, icon: 'groups', color: 'bg-blue-50 text-blue-500' },
          { label: 'Đang làm', value: shifts.filter(s => s.status === 'active').length, icon: 'work_history', color: 'bg-primary/10 text-primary' },
          { label: 'Sắp tới', value: shifts.filter(s => s.status === 'upcoming').length, icon: 'pending_actions', color: 'bg-orange-50 text-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="min-w-[120px] flex-1 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${stat.color}`}>
              <span className="material-symbols-outlined text-lg">{stat.icon}</span>
            </div>
            <p className="text-[10px] font-bold text-text-sub uppercase mb-1 tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">Ca làm việc hôm nay</h3>
        <button className="text-primary text-xs font-bold">Xem tất cả</button>
      </div>

      {/* Shift List */}
      <div className="px-4 space-y-4 pb-24">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            onClick={() => openModal(shift)}
            className={`p-4 rounded-3xl border shadow-sm transition-all active:scale-[0.98] ${shift.status === 'active' ? 'border-primary bg-white' : 'border-gray-50 bg-white'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src={shift.image || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover" alt="" />
                <div>
                  <h4 className="text-sm font-bold">{shift.name}</h4>
                  <p className="text-xs text-text-sub font-medium">{shift.role}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${shift.status === 'active' ? 'bg-green-100 text-green-600' :
                shift.status === 'upcoming' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                {shift.status === 'active' ? 'Đang làm' : shift.status === 'upcoming' ? 'Sắp tới' : 'Đã xong'}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-text-sub uppercase mb-1">{shift.time.includes('05:00') ? 'Ca Sáng' : shift.time.includes('12:00') ? 'Ca Chiều' : 'Ca Tối'}</p>
                <p className="text-lg font-bold font-mono text-gray-700">{shift.time}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteShift(shift.id); }}
                  className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg">{editingShift ? 'Sửa ca làm việc' : 'Thêm ca mới'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Image Upload */}
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
                <label className="block text-xs font-bold text-gray-500 mb-1">Tên nhân viên</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                  placeholder="Nhập tên..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                >
                  <option value="Chủ quán">Chủ quán (Admin)</option>
                  <option value="Thu ngân">Thu ngân</option>
                  <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
                  <option value="Thợ bánh">Thợ bánh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ca làm việc</label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                >
                  <option value="05:00 - 12:00">Ca Sáng (05:00 - 12:00)</option>
                  <option value="12:00 - 20:00">Ca Chiều (12:00 - 20:00)</option>
                  <option value="20:00 - 23:00">Ca Tối (20:00 - 23:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái</label>
                <div className="flex gap-2">
                  {['upcoming', 'active', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFormData({ ...formData, status: status as any })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${formData.status === status
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-gray-500 border-gray-100'
                        }`}
                    >
                      {status === 'upcoming' ? 'Sắp tới' : status === 'active' ? 'Đang làm' : 'Đã xong'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveShift}
                disabled={uploading}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 mt-2 disabled:opacity-50"
              >
                {uploading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
