import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';

export function getTripsListPage(req, res) {
    return res.render('trips/list', {
        title: 'Scenic Train Trips'
    });
}

export const listTripsPage = getTripsListPage;

export const getTripDetails = async (tripId) => {
    const db = getDb();
    const details = await db.collection('trips').findOne({ id: tripId });
    details.schedules = await db.collection('schedules').find({ tripId }).toArray();
    return details;
};

export async function getTripByIdController(req, res) {
    try {
        const { getTripById } = await import('../models/trips.js');
        const trip = await getTripById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        return res.status(200).json(trip);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function getAllTripsController(req, res) {
    try {
        const { getAllTrips } = await import('../models/trips.js');
        const trips = await getAllTrips();
        return res.status(200).json(trips);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function getTripsApi(req, res, next) {
    try {
        const trips = await getDb().collection('trips').find({}).toArray();
        return res.json({ trips });
    } catch (error) {
        return next(error);
    }
}

export async function getTripDetailsPage(req, res) {
    const { tripId } = req.params;
    const details = await getTripDetails(tripId);

    return res.render('trips/details', {
        title: 'Trip Details',
        details
    });
}

export async function getTripBookingPage(req, res) {
    const { scheduleId } = req.params;
    const db = getDb();
    const schedule = await db.collection('schedules').findOne({ id: Number(scheduleId) });
    const trip = await db.collection('trips').findOne({ id: schedule.tripId });
    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    return res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
}

export async function processTripBooking(req, res) {
    const confirmation = {
        id: generateConfirmationCode(),
        createdAt: new Date().toISOString(),
        ...req.body
    };
    await getDb().collection('confirmations').insertOne(confirmation);

    return res.redirect(`/trips/confirmation/${confirmation.id}`);
}

export async function getTripConfirmationPage(req, res) {
    const { confirmationId } = req.params;
    const confirmation = await getDb()
        .collection('confirmations')
        .findOne({ id: confirmationId });

    return res.render('trips/confirm', {
        title: 'Trip Confirmation',
        confirmation
    });
}





