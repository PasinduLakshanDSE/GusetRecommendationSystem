export type Budget = 'Low' | 'Medium' | 'High' | 'Luxury';
export type ActivityLevel = 'Low' | 'Medium' | 'High';
export interface GuestProfile { guestId: string; name: string; country: string; email?: string; adults: number; children: number; budget: Budget; district: string; stayDuration: number; activityLevel: ActivityLevel; }
export interface GuestPreferences { Nature_Interest:number; Culture_Interest:number; Adventure_Interest:number; Food_Interest:number; Wellness_Interest:number; Entertainment_Interest:number; Shopping_Interest:number; Family_Interest:number; }
export interface GuestSegment { cluster:number; segment:string; description:string; }
