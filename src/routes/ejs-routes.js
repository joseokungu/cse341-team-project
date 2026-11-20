// Routes that render EJS pages. (JSON routes live in api-routes.js.)
//
// Foundation change: this is a new file. These routes used to be listed directly in
// src/routes/router.js. router.js now mounts this file instead.
//
// The /trips pages are not here yet. The Trips and Bookings issues move them into
// this file when they refactor those pages.
import { Router } from 'express';
import { trainsPage } from '../controllers/trains.js';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { bookingsAdminPage } from '../controllers/bookings.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page. The handler now lives in the trains controller (see controllers/trains.js).
router.get('/trains', trainsPage);

// Test 500 error page
router.get('/500', testErrorPage);

// Bookings administration page
router.get('/bookings-admin', bookingsAdminPage);

export default router;