// The main router. It only mounts the other route files.
//
// Foundation change: the individual route definitions that used to be listed here
// (home, about, trains page, trains API, 500 test page) moved into ejs-routes.js and
// api-routes.js. The old src/routes/trains.js file is deleted.
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import railTripsRouter from './trips.js';
import { Router } from 'express';

const router = Router();

// Pages that render EJS templates
router.use(ejsRoutes);

// JSON API routes
router.use(apiRoutes);

// Rail trips. These stay here for now. The Trips and Bookings issues move them into
// the two route files above when they refactor those pages.
router.use('/trips', railTripsRouter);

export default router;