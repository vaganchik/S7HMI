import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Info,
  Edit3,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../types/auth';
import type { ScadaUser, UserRole } from '../../types/auth';

export const UserManagementScreen: React.FC = () => {
  const {
    currentUser,
    users,
    registerUser,
    updateUser,
    deleteUser,
    changeUserRole,
    canManageUser,
    getAllowedRolesToRegister,
    getAssignableRolesForUser
  } = useAuth();

  const [search, setSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ScadaUser | null>(null);
  const [roleChangeModalUser, setRoleChangeModalUser] = useState<ScadaUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('operator');
  const [formError, setFormError] = useState<string | null>(null);

  // Форма регистрации нового пользователя
  const allowedRoles = getAllowedRolesToRegister();
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(allowedRoles[0] || 'operator');
  const [newPinCode, setNewPinCode] = useState('1234');
  const [newShift, setNewShift] = useState('Смена #1 (Дневная)');
  const [newBadgeNumber, setNewBadgeNumber] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.shift.toLowerCase().includes(search.toLowerCase()) ||
      u.badgeNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenRegister = () => {
    setFormError(null);
    setNewUsername('');
    setNewFullName('');
    setNewRole(allowedRoles[0] || 'operator');
    setNewPinCode('');
    setNewShift('Смена #1 (Дневная)');
    setNewBadgeNumber(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const res = registerUser({
      username: newUsername,
      fullName: newFullName,
      role: newRole,
      pinCode: newPinCode,
      shift: newShift,
      badgeNumber: newBadgeNumber,
      isActive: true
    });

    if (res.success) {
      setIsRegisterModalOpen(false);
    } else {
      setFormError(res.message || 'Ошибка при регистрации пользователя');
    }
  };

  const handleOpenRoleChangeModal = (user: ScadaUser) => {
    setFormError(null);
    const assignable = getAssignableRolesForUser(user);
    if (assignable.length === 0) {
      alert('У вас нет прав для изменения роли данного пользователя');
      return;
    }
    setRoleChangeModalUser(user);
    setSelectedNewRole(assignable[0]);
  };

  const handleRoleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeModalUser) return;
    setFormError(null);

    const res = changeUserRole(roleChangeModalUser.id, selectedNewRole);
    if (res.success) {
      setRoleChangeModalUser(null);
    } else {
      setFormError(res.message || 'Ошибка смены роли');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    const res = updateUser(editingUser);
    if (res.success) {
      setEditingUser(null);
    } else {
      setFormError(res.message || 'Ошибка обновления пользователя');
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Вы действительно хотите удалить пользователя "${userName}"?`)) {
      const res = deleteUser(userId);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleToggleUserStatus = (user: ScadaUser) => {
    if (user.role === 'admin') {
      alert('Нельзя заблокировать главного администратора');
      return;
    }
    updateUser({ ...user, isActive: !user.isActive });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Главная плашка экрана пользователей */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                ПОЛЬЗОВАТЕЛИ, РОЛИ И БЕЗОПАСНОСТЬ (RBAC)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                ISA-101 SECURITY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Смена ролей, регистрация сотрудников, права доступа (Администратор &rarr; Наладчик &rarr; Технолог &rarr; Оператор)
            </p>
          </div>
        </div>

        {/* Кнопка регистрации пользователя */}
        <div className="flex items-center space-x-2">
          {allowedRoles.length > 0 ? (
            <button
              onClick={handleOpenRegister}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Зарегистрировать пользователя</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500">
              Ваша роль ({USER_ROLES[currentUser.role].labelRu}) не может регистрировать пользователей
            </div>
          )}
        </div>
      </div>

      {/* 2. Информационная плашка правил иерархии и смены ролей */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Правила смены ролей и иерархии доступа:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/20 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>👑 1. Администратор (Ур. 4)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Только 1 в системе. Назначает роли: <strong>Наладчик, Технолог, Оператор</strong>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/20 space-y-1">
            <div className="font-bold text-purple-400 flex items-center gap-1">
              <span>🔧 2. Наладчик (Ур. 3)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Создается только Администратором. Меняет роли: <strong>Технолог &harr; Оператор</strong>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/20 space-y-1">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>🧪 3. Технолог (Ур. 2)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Создается Наладчиком / Администратором. Управляет ролью: <strong>Оператор</strong>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-blue-500/20 space-y-1">
            <div className="font-bold text-blue-400 flex items-center gap-1">
              <span>👷 4. Оператор (Ур. 1)</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Базовая роль. Не может изменять роли других пользователей.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Поиск */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по ФИО, логину, табельному номеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* 4. Таблица пользователей */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Пользователь (ФИО / Логин)</th>
                <th className="px-4 py-3">Текущая роль</th>
                <th className="px-4 py-3">Подразделение / Смена</th>
                <th className="px-4 py-3">Таб. номер</th>
                <th className="px-4 py-3">Последний вход</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-center">Действия & Смена роли</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredUsers.map((user) => {
                const roleInfo = USER_ROLES[user.role];
                const canManage = canManageUser(user);
                const isCurrent = user.id === currentUser.id;
                const assignableRoles = getAssignableRolesForUser(user);
                const canChangeRole = assignableRoles.length > 0;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCurrent ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    {/* ФИО и логин */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            user.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300'
                              : user.role === 'engineer'
                              ? 'bg-purple-500/20 text-purple-300'
                              : user.role === 'technologist'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {user.role === 'admin' ? '👑' : user.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                            <span>{user.fullName}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white font-mono">
                                ВЫ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Роль в системе */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleInfo.badgeClass}`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{roleInfo.labelRu}</span>
                      </span>
                    </td>

                    {/* Смена */}
                    <td className="px-4 py-3 font-sans text-slate-300">{user.shift}</td>

                    {/* Табельный номер */}
                    <td className="px-4 py-3 text-slate-400">{user.badgeNumber}</td>

                    {/* Дата входа */}
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {user.lastLoginAt || user.createdAt}
                    </td>

                    {/* Статус */}
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold font-sans">
                          <XCircle className="w-3.5 h-3.5" /> Заблокирован
                        </span>
                      )}
                    </td>

                    {/* Действия и кнопка смены роли */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5 font-sans">
                        {/* Кнопка смены роли */}
                        {canChangeRole && user.role !== 'admin' && (
                          <button
                            onClick={() => handleOpenRoleChangeModal(user)}
                            title="Изменить роль пользователя (Повысить / Понизить)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all font-sans text-xs font-bold"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Сменить роль</span>
                          </button>
                        )}

                        {/* Кнопка редактирования данных */}
                        {canManage && (
                          <button
                            onClick={() => {
                              setEditingUser({ ...user });
                              setFormError(null);
                            }}
                            title="Редактировать данные пользователя"
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Блокировка/разблокировка */}
                        {canManage && user.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            title={user.isActive ? 'Заблокировать' : 'Активировать'}
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-xs transition-colors"
                          >
                            {user.isActive ? 'Блок' : 'Разблок'}
                          </button>
                        )}

                        {/* Удаление */}
                        {canManage && user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                            title="Удалить пользователя"
                            className="p-1.5 bg-slate-950 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {user.role === 'admin' && !isCurrent && (
                          <span className="text-[10px] text-amber-500/80 font-bold font-mono">
                            ГЛАВНЫЙ ADMIN
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. МОДАЛЬНОЕ ОКНО СМЕНЫ РОЛИ ПОЛЬЗОВАТЕЛЯ               */}
      {/* ======================================================== */}
      {roleChangeModalUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-purple-400" />
                <span>Смена роли пользователя</span>
              </h3>
              <button
                onClick={() => setRoleChangeModalUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
              <div>Сотрудник: <strong className="text-white font-sans">{roleChangeModalUser.fullName}</strong></div>
              <div>Логин: <span className="text-slate-400">@{roleChangeModalUser.username}</span></div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-500 font-sans">Текущая роль:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${USER_ROLES[roleChangeModalUser.role].badgeClass}`}>
                  {USER_ROLES[roleChangeModalUser.role].labelRu}
                </span>
              </div>
            </div>

            <form onSubmit={handleRoleChangeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Выберите новую роль (Доступные по иерархии):
                </label>
                <div className="space-y-2">
                  {getAssignableRolesForUser(roleChangeModalUser).map((rKey) => {
                    const rInfo = USER_ROLES[rKey];
                    const isSelected = selectedNewRole === rKey;

                    return (
                      <div
                        key={rKey}
                        onClick={() => setSelectedNewRole(rKey)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500/60 shadow-md ring-1 ring-purple-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs">{rInfo.labelRu}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Уровень {rInfo.level}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">{rInfo.description}</p>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-purple-400 bg-purple-600' : 'border-slate-700'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleChangeModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20"
                >
                  Применить новую роль
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ДАННЫХ ПОЛЬЗОВАТЕЛЯ    */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <span>Редактирование профиля пользователя</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ФИО сотрудника:</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Логин:</label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.username}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Роль:</label>
                  {editingUser.role === 'admin' ? (
                    <input
                      type="text"
                      disabled
                      value="Главный Администратор (Admin)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-bold cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                    >
                      {getAssignableRolesForUser(editingUser).concat(editingUser.role).filter((v, i, a) => a.indexOf(v) === i).map((roleKey) => (
                        <option key={roleKey} value={roleKey}>
                          {USER_ROLES[roleKey].labelRu}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    PIN-код доступа:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      maxLength={8}
                      value={editingUser.pinCode}
                      onChange={(e) => setEditingUser({ ...editingUser, pinCode: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Табельный номер:</label>
                  <input
                    type="text"
                    required
                    value={editingUser.badgeNumber}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, badgeNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Смена / Подразделение:</label>
                <input
                  type="text"
                  required
                  value={editingUser.shift}
                  onChange={(e) => setEditingUser({ ...editingUser, shift: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. МОДАЛЬНОЕ ОКНО РЕГИСТРАЦИИ НОВОГО ПОЛЬЗОВАТЕЛЯ       */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span>Регистрация нового пользователя</span>
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ФИО сотрудника:</label>
                <input
                  type="text"
                  required
                  placeholder="Иванов Иван Иванович"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Логин (Username):</label>
                  <input
                    type="text"
                    required
                    placeholder="operator_ivanov"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Роль (Доступные для вас):
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    {allowedRoles.map((roleKey) => (
                      <option key={roleKey} value={roleKey}>
                        {USER_ROLES[roleKey].labelRu}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PIN-код доступа (4 цифры):</label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    placeholder="••••"
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Табельный номер:</label>
                  <input
                    type="text"
                    required
                    value={newBadgeNumber}
                    onChange={(e) => setNewBadgeNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Смена / Подразделение:</label>
                <input
                  type="text"
                  required
                  placeholder="Смена #1 (Дневная)"
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20"
                >
                  Зарегистрировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
