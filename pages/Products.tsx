
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, InventoryLog, UserProfile } from '../types';

interface ProductsProps {
  user?: UserProfile | null;
}

const Products: React.FC<ProductsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [importQuantity, setImportQuantity] = useState<string>('');
  const [importPrice, setImportPrice] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Product Add/Edit Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    wholesale_price: '',
    image: '',
    category: 'Bánh mì',
    stock: 0,
    base_product_id: '',
    isComposite: false
  });

  const [uploading, setUploading] = useState(false);

  /* --- Constants & Data Fetching --- */
  const categories = [
    { name: 'Tất cả', icon: 'check' },
    { name: 'Bánh mì', icon: 'bakery_dining' },
    { name: 'Bánh bao', icon: 'lunch_dining' },
    { name: 'Bánh ngọt', icon: 'cake' },
    { name: 'Thực phẩm', icon: 'inventory_2' },
    { name: 'Đồ uống', icon: 'local_cafe' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*, products(name), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching logs:', error);
    else setLogs(data || []);
  };

  const handleImport = async () => {
    if (!selectedProduct || !importQuantity || !importPrice) return;

    const qty = parseInt(importQuantity);
    const price = parseInt(importPrice);

    try {
      // 1. Create Log
      const { error: logError } = await supabase.from('inventory_logs').insert({
        product_id: selectedProduct.id,
        quantity: qty,
        price: price,
        created_by: user?.id
      });
      if (logError) throw logError;

      // 2. Update Product Stock
      const newStock = (selectedProduct.stock === 'unlimited' ? 0 : selectedProduct.stock) + qty;
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id);

      if (stockError) throw stockError;

      alert('Nhập hàng thành công!');
      setShowImportModal(false);
      resetImportForm();
      fetchProducts();
      if (activeTab === 'history') fetchLogs();

    } catch (error: any) {
      alert('Lỗi nhập hàng: ' + error.message);
    }
  };

  const resetImportForm = () => {
    setSelectedProduct(null);
    setImportQuantity('');
    setImportPrice('');
    setSearchTerm('');
  };

  /* --- Product CRUD Handlers --- */
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        wholesale_price: (product.wholesale_price || product.price).toString(),
        image: product.image,
        category: product.category,
        stock: typeof product.stock === 'number' ? product.stock : 0,
        base_product_id: product.base_product_id || '',
        isComposite: !!product.base_product_id
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        wholesale_price: '',
        image: '',
        category: 'Bánh mì',
        stock: 0,
        base_product_id: '',
        isComposite: false
      });
    }
    setShowProductModal(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Bạn cần chọn ảnh để tải lên.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);

      setProductForm(prev => ({ ...prev, image: data.publicUrl }));
    } catch (error: any) {
      alert('Lỗi tải ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };


  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) return alert('Vui lòng nhập tên và giá');

    const productData = {
      name: productForm.name,
      price: parseInt(productForm.price),
      wholesale_price: parseInt(productForm.wholesale_price || productForm.price),
      image: productForm.image || 'https://via.placeholder.com/150',
      category: productForm.category,
      stock: (productForm as any).isComposite ? 0 : productForm.stock,
      base_product_id: (productForm as any).isComposite && (productForm as any).base_product_id ? (productForm as any).base_product_id : null
    };

    try {
      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }

      setShowProductModal(false);
      fetchProducts();
    } catch (error: any) {
      alert('Lỗi lưu sản phẩm: ' + error.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Tất cả' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="bg-background min-h-full flex flex-col">
      <header className="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Quản lý Kho & Sản phẩm</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() => openProductModal()}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-primary active:scale-95 transition-all"
                title="Thêm món mới"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add_box</span>
              Nhập hàng
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
          >
            Danh sách
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
          >
            Lịch sử nhập
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 p-4">
        {activeTab === 'list' ? (
          <>
            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Tìm tên sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-primary focus:ring-2"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap border transition-all ${activeCategory === cat.name
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-500 border-gray-100'
                      }`}
                  >
                    <span className="text-xs font-bold">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white p-3 rounded-2xl flex gap-4 shadow-sm border border-gray-100 relative group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                    <img src={product.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <h4 className="font-bold text-gray-900">{product.name}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-medium text-gray-500">{product.price.toLocaleString()}đ</span>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${product.stock === 0 ? 'bg-red-50 text-red-600' :
                        typeof product.stock === 'number' && product.stock < 10 ? 'bg-orange-50 text-orange-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                        <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                        Tồn: {product.stock === 'unlimited' ? '∞' : product.stock}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => openProductModal(product)}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* History Tab */
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{log.products?.name || 'Sản phẩm đã xóa'}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                    +{log.quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-base">person</span>
                    <span className="font-medium text-gray-600">{log.profiles?.full_name || 'Admin'}</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {log.price.toLocaleString()}đ <span className="text-gray-400 font-normal">/cái</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg">Nhập hàng mới</h3>
              <button onClick={() => setShowImportModal(false)} className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {/* Step 1: Select Product */}
              {!selectedProduct ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm để nhập..."
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-primary focus:ring-2 mb-2"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
                      >
                        <img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-gray-200" alt="" />
                        <div className="flex-1">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-xs text-gray-500">Tồn: {p.stock}</div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Step 2: Enter Details */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <img src={selectedProduct.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                    <div>
                      <div className="font-bold text-gray-900">{selectedProduct.name}</div>
                      <button onClick={() => setSelectedProduct(null)} className="text-xs text-primary font-bold hover:underline">Thay đổi</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Số lượng nhập</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={importQuantity}
                        onChange={(e) => setImportQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-lg focus:ring-primary focus:ring-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Giá nhập (đơn giá)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={importPrice}
                        onChange={(e) => setImportPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-lg focus:ring-primary focus:ring-2"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Thành tiền:</span>
                      <span className="font-bold text-gray-900">
                        {((parseInt(importQuantity) || 0) * (parseInt(importPrice) || 0)).toLocaleString()}đ
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleImport}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">save_alt</span>
                    Xác nhận Nhập kho
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-32 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg">{editingProduct ? 'Sửa món' : 'Thêm món mới'}</h3>
              <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full bg-white text-gray-500 flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tên món</label>
                <input
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ví dụ: Bánh mì Pate"
                />
              </div>

              {/* Composite Product Toggle */}
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={(productForm as any).isComposite}
                      onChange={(e) => setProductForm({ ...productForm, isComposite: e.target.checked } as any)}
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary transition-all"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">Đây là món chế biến (Combo)?</span>
                </label>
                {(productForm as any).isComposite && (
                  <div className="mt-3 animate-fade-in">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Món gốc (trừ kho)</label>
                    <select
                      className="w-full p-2 bg-white rounded-lg border border-orange-200 text-sm focus:ring-primary focus:ring-1"
                      value={(productForm as any).base_product_id}
                      onChange={(e) => setProductForm({ ...productForm, base_product_id: e.target.value } as any)}
                    >
                      <option value="">-- Chọn món gốc --</option>
                      {products.filter(p => p.id !== editingProduct?.id).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-orange-600 mt-1 italic">
                      * Khi bán món này, hệ thống sẽ trừ kho của món gốc đã chọn.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Giá lẻ</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Giá sỉ</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                    value={(productForm as any).wholesale_price}
                    onChange={(e) => setProductForm({ ...productForm, wholesale_price: e.target.value } as any)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Hình ảnh</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    {productForm.image ? (
                      <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400">image</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block w-full">
                      <span className="sr-only">Chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-bold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                            disabled:opacity-50"
                      />
                    </label>
                    {uploading && <p className="text-xs text-primary mt-1">Đang tải lên...</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Danh mục</label>
                <select
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-primary focus:ring-2"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  {categories.filter(c => c.name !== 'Tất cả').map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={saveProduct}
                disabled={uploading}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 mt-2 disabled:opacity-50"
              >
                {uploading ? 'Đang tải ảnh...' : 'Lưu thông tin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
