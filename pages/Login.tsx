import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      onLogin(); // App.tsx will handle the session check
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hero Image */}
      <div className="relative h-64 w-full shrink-0 overflow-hidden">
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAEcIUEriiaMKA7Pgnr7qSLNM0vjOwcZs8a2Uw3OX3NsjMieHoSIoI6gppAfPK_8-rqpYBj3bAbfkWs_zgYCF7eLvGyVK94nlv42dfdisLZUBuYdxLIQlNfHcdvFN3mg2JVFPQCgT2fJzXuMpQkVfY_7IvQSGak5PO_6fa-3VyWRGarXOtwREHPpOnB5YnUdzkS5uPGMwDb9P8INdFpl9b1jCQu-gCYXR9mo3P6acLFXvFpFuJN46YF_COSh3uk9FfFEIFgfwj9cR0")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-white">
          <h2 className="text-3xl font-bold tracking-tight">BINH MINH BAKERY</h2>
          <p className="text-sm font-medium opacity-90">Quản lý Lò Bánh</p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Xin chào!</h1>
          <p className="text-gray-500 mt-2">Đăng nhập để bắt đầu ca làm việc</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Auth Tabs */}
        <div className="flex p-1 mb-8 bg-gray-100 rounded-xl">
          <button className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-white text-primary shadow-sm">
            Đăng nhập
          </button>
          <button className="flex-1 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed opacity-50">
            Đăng ký
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold ml-1 text-gray-700">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3.5 text-gray-400 text-[20px]">mail</span>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary border transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold ml-1 text-gray-700">Mật khẩu</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3.5 text-gray-400 text-[20px]">lock</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary border transition-all"
              />
              <button type="button" className="absolute right-3 top-3.5 text-gray-400">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-primary">Quên mật khẩu?</button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <span className="relative bg-white px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Hoặc đăng nhập bằng</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
              <span className="text-sm font-semibold">Vân tay</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-primary text-[20px]">face</span>
              <span className="text-sm font-semibold">Face ID</span>
            </button>
          </div>
        </div>
      </div>

      <p className="mt-auto py-6 text-center text-gray-400 text-[10px] font-medium uppercase tracking-wider">
        Phiên bản v2.4.0 • Hỗ trợ kỹ thuật: 1900 1234
      </p>
    </div>
  );
};

export default Login;
