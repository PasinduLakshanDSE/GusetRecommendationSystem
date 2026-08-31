import type { GuestSegment } from './guest';
import type { BookingRisk } from './booking';
export interface RecommendedService { serviceId:string; serviceName:string; category:string; minBudget:string; durationHours:number; preferenceMatch:number; contextScore:number; hybridScore:number; reasons:string[]; }
export interface RecommendedPlace { destination:string; district:string; category:string; reviewCount:number; preferenceMatch:number; contextScore:number; hybridScore:number; reasons:string[]; }
export interface HybridRecommendationResponse { guestSegment:GuestSegment; bookingRisk:BookingRisk; services:RecommendedService[]; places:RecommendedPlace[]; explanation:string[]; }
