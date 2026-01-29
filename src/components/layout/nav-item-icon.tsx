'use client';

import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  History,
  Warehouse,
  FileText,
  Settings,
  Stethoscope,
  Building2,
  UserCheck,
  AlertCircle,
  Bell,
  Mail,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '@/constants/navigation';

const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  History,
  Warehouse,
  FileText,
  Settings,
  Stethoscope,
  Building2,
  UserCheck,
  AlertCircle,
  Bell,
  Mail,
  Trash2,
};

interface NavItemIconProps {
  iconName: IconName;
  className?: string;
}

export function NavItemIcon({ iconName, className }: NavItemIconProps) {
  const Icon = iconMap[iconName] ?? LayoutDashboard;
  return <Icon className={className} />;
}
