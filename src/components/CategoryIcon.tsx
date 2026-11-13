import React from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleDollarSign,
  DollarSign,
  Film,
  GraduationCap,
  Heart,
  HeartPulse,
  HelpCircle,
  Home,
  Laptop,
  MoreHorizontal,
  ShoppingCart,
  TrendingUp,
  Tv,
  Utensils,
  Wallet,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react-native';

interface CategoryIconProps extends LucideProps {
  iconKey?: string;
}

const iconMap: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  briefcase: Briefcase,
  award: Award,
  laptop: Laptop,
  'dollar-sign': DollarSign,
  utensils: Utensils,
  bus: Bus,
  car: Car,
  home: Home,
  film: Film,
  tv: Tv,
  heart: Heart,
  'heart-pulse': HeartPulse,
  book: BookOpen,
  'graduation-cap': GraduationCap,
  'more-horizontal': MoreHorizontal,
  wallet: Wallet,
  'trending-up': TrendingUp,
  'circle-dollar-sign': CircleDollarSign,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconKey, ...props }) => {
  const IconComponent = (iconKey && iconMap[iconKey]) || HelpCircle;
  return <IconComponent {...props} />;
};

export default CategoryIcon;
