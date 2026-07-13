/**
 * GamePackage Type Definition
 * This file is now purely for types. All data is fetched from Firebase RTDB.
 */

export type GamePackage = {
  id: string;
  gameId: string;
  category: 'top-up' | 'accounts' | 'booyah-pass';
  title: string;
  description: string;
  price: number;
  discountedPrice?: number;
  thumbnail: string;
  imageHint?: string;
  tags?: string[];
  whatsappNumber?: string;
  orderIndex?: number;
  isOneTime?: boolean;
};

// Always empty in code. Real data is loaded from Firebase Realtime Database.
export const GAMES_DATA: GamePackage[] = [];
