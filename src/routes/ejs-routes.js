import { Router } from 'express';
import {
    getTripsListPage,
    getTripDetailsPage,
    getTripBookingPage,
    processTripBooking,
    getTripConfirmationPage
} from '../controllers/trips.js';

const router = Router();

router.get('/', getTripsListPage);
router.get('/:tripId', getTripDetailsPage);
router.get('/booking/:scheduleId', getTripBookingPage);
router.post('/book', processTripBooking);
router.get('/confirmation/:confirmationId', getTripConfirmationPage);

export default router;
