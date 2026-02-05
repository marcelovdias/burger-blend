import { BurgerSize } from './types';

export const BURGER_SIZES: BurgerSize[] = [
  { id: 'smash-s', label: 'Ultra Smash', weight: 60, description: 'Crocante e fino', icon: 'fas fa-dot-circle' },
  { id: 'smash-m', label: 'Smash Std', weight: 80, description: 'O clássico smash', icon: 'fas fa-circle' },
  { id: 'smash-l', label: 'Big Smash', weight: 90, description: 'Smash suculento', icon: 'fas fa-circle-dot' },
  { id: 'std-s', label: 'Standard S', weight: 110, description: 'Ideal para combos', icon: 'fas fa-hamburger' },
  { id: 'std-m', label: 'Standard M', weight: 130, description: 'Peso comercial', icon: 'fas fa-hamburger' },
  { id: 'std-l', label: 'Standard L', weight: 140, description: 'Equilíbrio ideal', icon: 'fas fa-layer-group' },
  { id: 'artisan', label: 'Artesanal', weight: 150, description: 'O mais vendido', icon: 'fas fa-drumstick-bite' },
  { id: 'premium', label: 'Premium', weight: 180, description: 'Burger de respeito', icon: 'fas fa-beer' },
  { id: 'heavy', label: 'Heavy Weight', weight: 200, description: 'Para grandes fomes', icon: 'fas fa-weight-hanging' },
  { id: 'monster', label: 'Monster', weight: 220, description: 'O gigante', icon: 'fas fa-skull' },
];

export const BLEND_CATEGORIES = [
  "Clássicos", "Smash", "Premium (Angus/Wagyu)", "Custo-Benefício", "Exóticos"
];
