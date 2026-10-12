import type { LucideIcon } from 'lucide-react';
import { Bell, Home, LayoutGrid, Mail, Shield, Smartphone, User, Users } from 'lucide-react';

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: '/families', label: 'Главная', icon: Home },
  { href: '/families/members', label: 'Семья', icon: Users, disabled: true },
  { href: '/invites', label: 'Приглашения', icon: Mail },
  { href: '/requests/join', label: 'Заявки', icon: LayoutGrid, disabled: true },
  { href: '/notifications', label: 'Уведомления', icon: Bell, disabled: true },
  { href: '/profile', label: 'Профиль', icon: User, disabled: true },
  { href: '/devices', label: 'Устройства и сессии', icon: Smartphone, disabled: true },
  { href: '/security', label: 'Безопасность', icon: Shield, disabled: true },
];
