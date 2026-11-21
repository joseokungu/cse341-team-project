import trips from "./schemas/trips.js";

export async function getTripById(id) {
  return trips.findOne({ id }).lean();
}

export async function getAllTrips() {
  return trips.find({}).lean();
}