export const BADGES_EARNED_EVENT = 'kaya:badges-earned';

export interface BadgesEarnedEventDetail {
  userId: string;
  badgeIds: string[];
  badgeNamesTh: string[];
  badgeNamesEn: string[];
}
