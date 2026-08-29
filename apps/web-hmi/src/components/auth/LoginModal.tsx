import React, { useState } from 'react';
import { Shield, Key, UserCheck, X, Lock, Users, AlertCircle, ArrowLeft, Check, Delete } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../types/auth';
import type { ScadaUser } from '../../types/auth';

export const LoginModal: React.FC = () => {
  const { users, currentUser, login, loginWithUserPin, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<'quick' | 'credentials'>('quick');

  // Выбранный пользователь для ввода PIN при быстром выборе
  const [selectedUserForPin, setSelectedUserForPin] = useState<ScadaUser | null>(null);
  const [quickPin, setQuickPin] = useState('');

  // Форма логина
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  // Выбор карточки пользователя -> переход к вводу PIN
  const handleSelectUser = (user: ScadaUser) => {
    setSelectedUserForPin(user);
    setQuickPin('');
    setError(null);
  };

  // Подтверждение PIN при быстром выборе
  const handleQuickPinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserForPin) return;

    setError(null);
    const res = loginWithUserPin(selectedUserForPin.id, quickPin);
    if (!res.success) {
      setError(res.message || 'Неверный PIN-код');
      setQuickPin('');
    } else {
      setSelectedUserForPin(null);
      setQuickPin('');
    }
  };

  // Обработка кликов цифровой клавиатуры (NumPad)
  const handleNumPadClick = (digit: string) => {
    setError(null);
    if (quickPin.length < 8) {
      const nextPin = quickPin + digit;
      setQuickPin(nextPin);
    }
  };

  const handleNumPadClear = () => {
    setQuickPin('');
    setError(null);
  };

  const handleNumPadBackspace = () => {
    setQuickPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(username, pinCode);
    if (!res.success) {
      setError(res.message || 'Ошибка авторизации');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Авторизация пользователя HMI</h3>
              <p className="text-[11px] text-slate-400">Контроль доступа по стандарту ISA-101 / RBAC</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsLoginModalOpen(false);
              setSelectedUserForPin(null);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Переключатель вкладок (скрыт если уже выбран пользователь для ввода PIN) */}
        {!selectedUserForPin && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('quick');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Быстрый выбор пользователя</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('credentials');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Вход по логину</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* ВКЛАДКА 1.А: СПИСОК ПОЛЬЗОВАТЕЛЕЙ ДЛЯ ВЫБОРА             */}
        {/* ======================================================== */}
        {activeTab === 'quick' && !selectedUserForPin && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div className="text-[11px] text-slate-400 font-semibold px-1 pb-1">
              Выберите пользователя для ввода PIN-кода:
            </div>
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const roleInfo = USER_ROLES[user.role];

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                        user.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : user.role === 'engineer'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : user.role === 'technologist'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {user.role === 'admin' ? '👑' : user.fullName.slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {user.fullName}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500 text-white">
                            ТЕКУЩИЙ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        @{user.username} &bull; {user.shift}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border font-mono flex-shrink-0 ml-2 ${roleInfo.badgeClass}`}
                  >
                    {roleInfo.labelRu}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* ВКЛАДКА 1.Б: ВВОД PIN-КОДА ВЫБРАННОГО ПОЛЬЗОВАТЕЛЯ       */}
        {/* ======================================================== */}
        {activeTab === 'quick' && selectedUserForPin && (
          <div className="space-y-4 animate-fade-in">
            {/* Карточка выбранного пользователя */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                    selectedUserForPin.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : selectedUserForPin.role === 'engineer'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : selectedUserForPin.role === 'technologist'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {selectedUserForPin.role === 'admin' ? '👑' : selectedUserForPin.fullName.slice(0, 2)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {selectedUserForPin.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    @{selectedUserForPin.username} &bull; {selectedUserForPin.shift}
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono flex-shrink-0 ml-2 ${
                  USER_ROLES[selectedUserForPin.role].badgeClass
                }`}
              >
                {USER_ROLES[selectedUserForPin.role].labelRu}
              </span>
            </div>

            {/* Форма ввода PIN-кода */}
            <form onSubmit={handleQuickPinSubmit} className="space-y-3">
              <div className="text-center">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Введите PIN-код доступа:
                </label>
                <div className="relative max-w-[220px] mx-auto">
                  <input
                    type="password"
                    autoFocus
                    required
                    maxLength={8}
                    placeholder="••••"
                    value={quickPin}
                    onChange={(e) => setQuickPin(e.target.value)}
                    className="w-full text-center tracking-[0.5em] text-lg font-black py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono shadow-inner"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                  (PIN-код по умолчанию: 1)
                </div>
              </div>

              {/* Цифровая клавиатура NumPad (для Touch-панелей) */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1 select-none">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleNumPadClick(digit)}
                    className="h-10 bg-slate-950 hover:bg-blue-600/30 text-white font-bold font-mono text-base rounded-xl border border-slate-800 hover:border-blue-500/40 transition-all active:scale-95 shadow"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleNumPadClear}
                  className="h-10 bg-slate-950 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 font-bold text-xs rounded-xl border border-slate-800 transition-all active:scale-95"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleNumPadClick('0')}
                  className="h-10 bg-slate-950 hover:bg-blue-600/30 text-white font-bold font-mono text-base rounded-xl border border-slate-800 hover:border-blue-500/40 transition-all active:scale-95 shadow"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumPadBackspace}
                  className="h-10 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-all active:scale-95 flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Кнопки управления */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPin(null);
                    setQuickPin('');
                    setError(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>К списку</span>
                </button>

                <button
                  type="submit"
                  disabled={!quickPin}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Подтвердить вход</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* ВКЛАДКА 2: ВВОД ЛОГИНА И PIN                            */}
        {/* ======================================================== */}
        {activeTab === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Имя пользователя (Логин):
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin, engineer_petrov..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PIN-код / Пароль доступа:
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="••••"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono tracking-widest"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-emerald-400 mt-1 font-mono font-bold">
                (PIN-код по умолчанию для всех: 1)
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20"
            >
              Войти в систему
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
