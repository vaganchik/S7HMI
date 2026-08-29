/**
 * Ролевая модель пользователей SCADA (ISA-101 / ISA-88 / RBAC)
 */

export type UserRole = 'operator' | 'lab' | 'technologist' | 'engineer' | 'admin';

export interface UserRoleInfo {
  role: UserRole;
  level: number;
  labelRu: string;
  labelEn: string;
  labelZh: string;
  labelIt: string;
  color: string;
  badgeClass: string;
  description: string;
}

export const USER_ROLES: Record<UserRole, UserRoleInfo> = {
  admin: {
    role: 'admin',
    level: 4,
    labelRu: 'Администратор',
    labelEn: 'Administrator',
    labelZh: '系统管理员',
    labelIt: 'Amministratore',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Полный доступ к системе, конфигурации ПЛК и управлению всеми ролями (только 1 администратор)'
  },
  engineer: {
    role: 'engineer',
    level: 3,
    labelRu: 'Наладчик',
    labelEn: 'Maintenance Engineer',
    labelZh: '调试工程师',
    labelIt: 'Manutentore',
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Наладка приводов, датчиков, TIA XML, создание технологов, лаборантов и операторов'
  },
  technologist: {
    role: 'technologist',
    level: 2,
    labelRu: 'Технолог',
    labelEn: 'Process Technologist',
    labelZh: '工艺工程师',
    labelIt: 'Tecnologo',
    color: 'cyan',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    description: 'Создание и калибровка рецептов минераловатных плит, создание лаборантов и операторов'
  },
  lab: {
    role: 'lab',
    level: 2,
    labelRu: 'Лаборатория / ОТК',
    labelEn: 'QC Lab Inspector',
    labelZh: '质检员 / 实验室',
    labelIt: 'Controllo Qualità / Lab',
    color: 'teal',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    description: 'Проведение лабораторных испытаний продукции, внесение замеров качества (плотность, прочность, теплопроводность, влажность)'
  },
  operator: {
    role: 'operator',
    level: 1,
    labelRu: 'Оператор',
    labelEn: 'Line Operator',
    labelZh: '产线操作工',
    labelIt: 'Operatore',
    color: 'blue',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Мониторинг технологической линии, квитирование аварий, запуск рецептов и ввод оперативных замеров'
  }
};

export interface ScadaUser {
  id: string;
  username: string; // Логин
  fullName: string; // ФИО
  role: UserRole; // Роль
  pinCode: string; // 4-значный PIN или пароль
  shift: string; // Смена (Дневная / Ночная / Смена А / Смена Б)
  badgeNumber: string; // Табельный номер
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  canBeDeleted?: boolean; // false для единственного администратора
}
