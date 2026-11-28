// Routes that render EJS pages. JSON routes live in api-routes.js.
import { Router } from 'express';
import {
  bookingConfirmationPage,
  bookingPage,
  bookingsAdminPage,
  processBookingRequest,
} from '../controllers/bookings.js';
import { trainsPage } from '../controllers/trains.js';
import { tripDetailsPage, tripListPage } from '../controllers/trips.js';
import {
  loginPage,
  loginUser,
  logoutUser,
  registerPage,
  registerUser,
} from '../controllers/auth.js';
import {
  aboutPage,
  homePage,
  testErrorPage,
} from './index.js';
import {
  requirePageRole
} from '../middleware/auth.js';

const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/register', registerPage);
router.get('/login', loginPage);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/trains', trainsPage);
router.get('/trips', tripListPage);
router.get('/trips/:tripId', tripDetailsPage);
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', bookingConfirmationPage);
router.get('/500', testErrorPage);
router.get('/bookings-admin', requirePageRole('admin'), bookingsAdminPage);

export default router;
