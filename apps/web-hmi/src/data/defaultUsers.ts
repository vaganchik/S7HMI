import type { ScadaUser } from '../types/auth';

export const DEFAULT_USERS: ScadaUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Главный Администратор АСУ ТП',
    role: 'admin',
    pinCode: '1',
    shift: 'Инженерная служба',
    badgeNumber: 'A-001',
    createdAt: '2026-01-01',
    lastLoginAt: '2026-08-28 20:45',
    isActive: true,
    canBeDeleted: false // Единственный администратор
  },
  {
    id: 'user-eng-1',
    username: 'engineer_petrov',
    fullName: 'Петров Алексей Владимирович',
    role: 'engineer',
    pinCode: '1',
    shift: 'Служба КИПиА',
    badgeNumber: 'E-104',
    createdAt: '2026-01-15',
    lastLoginAt: '2026-08-28 18:20',
    isActive: true,
    canBeDeleted: true
  },
  {
    id: 'user-tech-1',
    username: 'technologist_smirnov',
    fullName: 'Смирнова Елена Николаевна',
    role: 'technologist',
    pinCode: '1',
    shift: 'Технологический отдел',
    badgeNumber: 'T-208',
    createdAt: '2026-02-01',
    lastLoginAt: '2026-08-28 19:10',
    isActive: true,
    canBeDeleted: true
  },
  {
    id: 'user-lab-1',
    username: 'lab_morozova',
    fullName: 'Морозова Анна Игоревна',
    role: 'lab',
    pinCode: '1',
    shift: 'Лаборатория ОТК',
    badgeNumber: 'QC-112',
    createdAt: '2026-02-05',
    lastLoginAt: '2026-08-28 20:15',
    isActive: true,
    canBeDeleted: true
  },
  {
    id: 'user-op-1',
    username: 'operator_ivanov',
    fullName: 'Иванов Иван Иванович',
    role: 'operator',
    pinCode: '1',
    shift: 'Смена #1 (Дневная)',
    badgeNumber: 'OP-301',
    createdAt: '2026-02-10',
    lastLoginAt: '2026-08-28 20:30',
    isActive: true,
    canBeDeleted: true
  },
  {
    id: 'user-op-2',
    username: 'operator_kuznetsov',
    fullName: 'Кузнецов Дмитрий Сергеевич',
    role: 'operator',
    pinCode: '1',
    shift: 'Смена #2 (Ночная)',
    badgeNumber: 'OP-302',
    createdAt: '2026-03-05',
    lastLoginAt: '2026-08-27 22:00',
    isActive: true,
    canBeDeleted: true
  }
];
