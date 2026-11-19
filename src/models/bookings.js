import booking from "./schemas/bookings.js";

// Create and save a new booking.
export async function createBooking(bookingData) {
  const newBooking = new booking(bookingData);
  return newBooking.save();
}

// Retrieve all bookings.
export async function getAllBookings() {
  return booking.find({}).lean();
}

// Retrieve one booking using its unique ID.
export async function getBookingById(id) {
  return booking.findOne({ id }).lean();
}
