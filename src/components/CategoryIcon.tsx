import React from 'react';
import {
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  HelpCircle,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react-native';

interface CategoryIconProps extends LucideProps {
  iconKey?: string;
}

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  film: Film,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  wallet: Wallet,
  'trending-up': TrendingUp,
  'circle-dollar-sign': CircleDollarSign,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconKey, ...props }) => {
  const IconComponent = (iconKey && iconMap[iconKey]) || HelpCircle;
  return <IconComponent {...props} />;
};

export default CategoryIcon;
