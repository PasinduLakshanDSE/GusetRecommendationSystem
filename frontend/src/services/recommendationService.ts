import { mockRecommendationResponse } from '../data/mockRecommendations'; import { mockHistory } from '../data/mockHistory'; import type { GuestProfile } from '../types/guest';
const delay = <T,>(value:T) => new Promise<T>(resolve => setTimeout(()=>resolve(value), 550));
// TODO: Replace with Flask API request when VITE_USE_MOCK_API=false.
export const getRecommendations = () => delay(mockRecommendationResponse);
export const getGuestRecommendations = (_guestId:string) => delay(mockRecommendationResponse);
export const analyzeGuest = (_profile:GuestProfile) => delay(mockRecommendationResponse);
export const getRecommendationHistory = () => delay(mockHistory);
