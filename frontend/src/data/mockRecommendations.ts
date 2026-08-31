import type { HybridRecommendationResponse } from '../types/recommendation';
import { mockSegment } from './mockGuest'; import { mockBookingRisk } from './mockBooking';
const reasons = ['Strong match with Nature preference.','Fits within guest budget.','Suitable for short stay.','High combined preference and context score.'];
export const mockRecommendationResponse: HybridRecommendationResponse = { guestSegment:mockSegment, bookingRisk:mockBookingRisk, explanation:['Recommendations combine preference compatibility, guest segment, booking context and destination review intelligence.'], services:[
 {serviceId:'S002',serviceName:'Guided Nature Walk',category:'Nature',minBudget:'Low',durationHours:3,preferenceMatch:93.64,contextScore:65,hybridScore:85.05,reasons},
 {serviceId:'S005',serviceName:'Adventure Excursion',category:'Adventure',minBudget:'Medium',durationHours:5,preferenceMatch:94.87,contextScore:40,hybridScore:78.41,reasons},
 {serviceId:'S012',serviceName:'Private Scenic Experience',category:'Nature',minBudget:'High',durationHours:4,preferenceMatch:89.97,contextScore:35,hybridScore:73.48,reasons},
 {serviceId:'S004',serviceName:'Family Activity Experience',category:'Family',minBudget:'Medium',durationHours:3,preferenceMatch:72.6,contextScore:60,hybridScore:68.82,reasons},
 {serviceId:'S006',serviceName:'Cultural Experience',category:'Culture',minBudget:'Low',durationHours:3,preferenceMatch:65.12,contextScore:75,hybridScore:68.08,reasons}], places:[
 {destination:"Ravana's Cave",district:'Badulla',category:'Nature',reviewCount:280,preferenceMatch:87.83,contextScore:85.64,hybridScore:87.28,reasons:['Strong match with Nature preference.','Located in selected Badulla district.','Supported by destination review evidence.','High combined preference and context score.']},
 {destination:'Dunhida Waterfall access point',district:'Badulla',category:'Nature',reviewCount:128,preferenceMatch:86.19,contextScore:84.86,hybridScore:85.86,reasons},
 {destination:'Kurundu Oya Ella Falls',district:'Badulla',category:'Nature',reviewCount:51,preferenceMatch:84.54,contextScore:83.95,hybridScore:84.39,reasons},
 {destination:'Narangala Mountain',district:'Badulla',category:'Adventure',reviewCount:163,preferenceMatch:89.22,contextScore:67.1,hybridScore:83.69,reasons},
 {destination:'Riverston',district:'Matale',category:'Wellness',reviewCount:907,preferenceMatch:89.33,contextScore:65.81,hybridScore:83.45,reasons}] };
