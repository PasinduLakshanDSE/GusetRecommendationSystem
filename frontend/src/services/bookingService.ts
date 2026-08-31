import { mockBooking, mockBookingRisk } from '../data/mockBooking';
// TODO: Replace with Flask API request.
export const getBookingRisk=async()=>({risk:mockBookingRisk,details:mockBooking});
