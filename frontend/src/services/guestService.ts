import { mockGuest, mockPreferences, mockSegment } from '../data/mockGuest'; import type { GuestProfile } from '../types/guest';
const delay=<T,>(v:T)=>new Promise<T>(r=>setTimeout(()=>r(v),350));
// TODO: Replace with Flask API request.
export const getGuest=()=>delay({profile:mockGuest,preferences:mockPreferences,segment:mockSegment});
export const saveGuestProfile=(profile:GuestProfile)=>delay(profile);
