import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_USERS } from '../data/defaultUsers';
import { USER_ROLES } from '../types/auth';
import type { ScadaUser, UserRole } from '../types/auth';

interface AuthContextValue {
  currentUser: ScadaUser;
  users: ScadaUser[];
  login: (username: string, pinCode: string) => { success: boolean; message?: string };
  loginWithUserPin: (userId: string, pinCode: string) => { success: boolean; message?: string };
  switchUser: (userId: string) => boolean;
  logout: () => void;
  canManageUser: (targetUser: ScadaUser) => boolean;
  canRegisterRole: (targetRole: UserRole) => boolean;
  getAllowedRolesToRegister: () => UserRole[];
  getAssignableRolesForUser: (targetUser: ScadaUser) => UserRole[];
  changeUserRole: (targetUserId: string, newRole: UserRole) => { success: boolean; message?: string };
  registerUser: (newUser: Omit<ScadaUser, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateUser: (user: ScadaUser) => { success: boolean; message?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string };
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Список всех пользователей
  const [users, setUsers] = useState<ScadaUser[]>(() => {
    const saved = localStorage.getItem('scada_users_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });

  // Текущий активный пользователь
  const [currentUser, setCurrentUser] = useState<ScadaUser>(() => {
    const savedUserId = localStorage.getItem('scada_current_user_id');
    if (savedUserId) {
      const found = users.find((u) => u.id === savedUserId);
      if (found) return found;
    }
    return users.find((u) => u.role === 'admin') || users[0];
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Синхронизация с localStorage
  useEffect(() => {
    localStorage.setItem('scada_users_v3', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('scada_current_user_id', currentUser.id);
  }, [currentUser]);

  // Проверка прав: может ли текущий пользователь управлять целевым пользователем
  const canManageUser = (targetUser: ScadaUser): boolean => {
    if (targetUser.role === 'admin' && currentUser.id !== targetUser.id) {
      return false; // Никто не может редактировать/удалять/менять роль главного администратора
    }
    if (targetUser.role === 'admin' && currentUser.id === targetUser.id) {
      return true; // Администратор может редактировать свои данные (кроме смены роли с админа)
    }
    const currentLevel = USER_ROLES[currentUser.role]?.level ?? 0;
    const targetLevel = USER_ROLES[targetUser.role]?.level ?? 0;
    return currentLevel > targetLevel || currentUser.id === targetUser.id;
  };

  // Проверка права на назначение/создание конкретной роли
  const canRegisterRole = (targetRole: UserRole): boolean => {
    if (targetRole === 'admin') {
      return false;
    }

    const currentLevel = USER_ROLES[currentUser.role]?.level ?? 0;
    const targetLevel = USER_ROLES[targetRole]?.level ?? 0;
    return currentLevel > targetLevel;
  };

  // Получить список ролей, которые текущий пользователь имеет право зарегистрировать
  const getAllowedRolesToRegister = (): UserRole[] => {
    const roles: UserRole[] = ['engineer', 'technologist', 'lab', 'operator'];
    return roles.filter((role) => canRegisterRole(role));
  };

  // Получить список ролей, на которые текущий пользователь может перевести целевого пользователя
  const getAssignableRolesForUser = (targetUser: ScadaUser): UserRole[] => {
    if (targetUser.role === 'admin') {
      return [];
    }
    if (!canManageUser(targetUser)) {
      return [];
    }
    return getAllowedRolesToRegister();
  };

  // Смена роли пользователя
  const changeUserRole = (
    targetUserId: string,
    newRole: UserRole
  ): { success: boolean; message?: string } => {
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return { success: false, message: 'Пользователь не найден' };

    if (target.role === 'admin') {
      return { success: false, message: 'Нельзя изменить роль главного администратора' };
    }

    if (newRole === 'admin') {
      return { success: false, message: 'В системе может быть только 1 администратор' };
    }

    if (!canRegisterRole(newRole)) {
      return {
        success: false,
        message: `Ваша роль (${USER_ROLES[currentUser.role].labelRu}) не может назначать роль "${USER_ROLES[newRole].labelRu}"`
      };
    }

    if (!canManageUser(target)) {
      return { success: false, message: 'Недостаточно прав для изменения роли этого пользователя' };
    }

    const updated = { ...target, role: newRole };
    setUsers((prev) => prev.map((u) => (u.id === targetUserId ? updated : u)));

    if (currentUser.id === targetUserId) {
      setCurrentUser(updated);
    }

    return { success: true };
  };

  // Авторизация по ID пользователя и введенному PIN (при быстром выборе)
  const loginWithUserPin = (userId: string, pinCode: string): { success: boolean; message?: string } => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'Пользователь не найден' };
    }
    if (!user.isActive) {
      return { success: false, message: 'Учетная запись заблокирована администратором' };
    }
    if (user.pinCode !== pinCode.trim()) {
      return { success: false, message: 'Неверный PIN-код доступа' };
    }

    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  // Авторизация по логину и PIN
  const login = (username: string, pinCode: string): { success: boolean; message?: string } => {
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
      return { success: false, message: 'Пользователь с таким логином не найден' };
    }
    if (!user.isActive) {
      return { success: false, message: 'Учетная запись заблокирована администратором' };
    }
    if (user.pinCode !== pinCode.trim()) {
      return { success: false, message: 'Неверный PIN-код доступа' };
    }

    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  // Прямое переключение пользователя
  const switchUser = (userId: string): boolean => {
    const user = users.find((u) => u.id === userId);
    if (!user || !user.isActive) return false;

    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    return true;
  };

  const logout = () => {
    const op = users.find((u) => u.role === 'operator') || users[0];
    setCurrentUser(op);
    setIsLoginModalOpen(true);
  };

  // Регистрация нового пользователя с соблюдением иерархии
  const registerUser = (
    newUser: Omit<ScadaUser, 'id' | 'createdAt'>
  ): { success: boolean; message?: string } => {
    if (!canRegisterRole(newUser.role)) {
      return {
        success: false,
        message: `Ваша роль (${USER_ROLES[currentUser.role].labelRu}) не имеет прав создавать пользователей с ролью "${USER_ROLES[newUser.role].labelRu}"`
      };
    }

    const exists = users.some(
      (u) => u.username.toLowerCase() === newUser.username.toLowerCase().trim()
    );
    if (exists) {
      return { success: false, message: 'Пользователь с таким логином уже существует' };
    }

    if (newUser.role === 'admin') {
      return { success: false, message: 'В системе может быть зарегистрирован только 1 администратор' };
    }

    const created: ScadaUser = {
      ...newUser,
      id: `user-${Date.now().toString().slice(-6)}`,
      username: newUser.username.trim(),
      pinCode: newUser.pinCode.trim() || '1',
      createdAt: new Date().toISOString().split('T')[0],
      canBeDeleted: true
    };

    setUsers((prev) => [created, ...prev]);
    return { success: true };
  };

  // Обновление данных пользователя
  const updateUser = (user: ScadaUser): { success: boolean; message?: string } => {
    if (!canManageUser(user)) {
      return { success: false, message: 'Недостаточно прав для редактирования этого пользователя' };
    }

    const original = users.find((u) => u.id === user.id);
    if (original && original.role !== user.role) {
      if (original.role === 'admin' || user.role === 'admin' || !canRegisterRole(user.role)) {
        return { success: false, message: 'Недопустимая смена роли' };
      }
    }

    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    if (currentUser.id === user.id) {
      setCurrentUser(user);
    }
    return { success: true };
  };

  // Удаление пользователя
  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Пользователь не найден' };

    if (target.role === 'admin' || target.canBeDeleted === false) {
      return { success: false, message: 'Удаление главного администратора запрещено' };
    }

    if (!canManageUser(target)) {
      return { success: false, message: 'Недостаточно прав для удаления этого пользователя' };
    }

    if (currentUser.id === userId) {
      return { success: false, message: 'Нельзя удалить текущую активную учетную запись' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        loginWithUserPin,
        switchUser,
        logout,
        canManageUser,
        canRegisterRole,
        getAllowedRolesToRegister,
        getAssignableRolesForUser,
        changeUserRole,
        registerUser,
        updateUser,
        deleteUser,
        isLoginModalOpen,
        setIsLoginModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
