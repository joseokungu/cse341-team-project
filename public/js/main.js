const hookTripsCatalog = async () => {
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const emptyEl = document.getElementById('trips-empty');
    const errorEl = document.getElementById('trips-error');

    if (!regionSelect || !seasonSelect || !listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trips');
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        const trips = await response.json();
        if (!Array.isArray(trips)) {
            throw new Error('Trip response did not contain a trips list');
        }
        const populateFilter = (select, values, queryParam) => {
            values.forEach((value) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
                select.appendChild(option);
            });

            const requestedValue = new URL(window.location.href).searchParams.get(queryParam);
            if (values.includes(requestedValue)) {
                select.value = requestedValue;
            }
        };

        populateFilter(
            regionSelect,
            [...new Set(trips.map((trip) => trip.region).filter((value) => typeof value === 'string'))].sort(),
            'region'
        );
        populateFilter(
            seasonSelect,
            [...new Set(trips.map((trip) => trip.bestSeason).filter((value) => typeof value === 'string'))].sort(),
            'season'
        );

        const renderTrips = () => {
            const fragment = document.createDocumentFragment();
            const filteredTrips = trips.filter((trip) =>
                (regionSelect.value === 'all' || trip.region === regionSelect.value) &&
                (seasonSelect.value === 'all' || trip.bestSeason === seasonSelect.value)
            );

            filteredTrips.forEach((trip) => {
                const card = templateEl.content.cloneNode(true);
                const cardEl = card.querySelector('.route-card');
                cardEl.classList.add(trip.region);

                card.querySelector('[data-field="name"]').textContent = trip.name;
                card.querySelector('[data-field="region"]').textContent = trip.region;
                card.querySelector('[data-field="start-station"]').textContent = trip.startStation;
                card.querySelector('[data-field="end-station"]').textContent = trip.endStation;
                card.querySelector('[data-field="duration"]').textContent = trip.duration;
                card.querySelector('[data-field="distance"]').textContent = `${trip.distance}km`;
                card.querySelector('[data-field="description"]').textContent = trip.description;

                const seasonBadge = card.querySelector('[data-field="season"]');
                seasonBadge.classList.add(`season-${trip.bestSeason}`);
                seasonBadge.textContent = `Best in ${trip.bestSeason}`;

                const highlightsList = card.querySelector('[data-field="highlights"]');
                trip.highlights.forEach((highlight) => {
                    const tag = document.createElement('span');
                    tag.className = 'highlight-tag';
                    tag.textContent = highlight;
                    highlightsList.appendChild(tag);
                });

                card.querySelector('[data-field="details-link"]').href =
                    `/trips/${encodeURIComponent(trip.id)}`;
                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
            if (emptyEl) {
                emptyEl.hidden = filteredTrips.length > 0;
            }
        };

        const updateFilter = (select, queryParam) => {
            const url = new URL(window.location.href);
            if (select.value === 'all') {
                url.searchParams.delete(queryParam);
            } else {
                url.searchParams.set(queryParam, select.value);
            }
            window.history.replaceState(null, '', url);
            renderTrips();
        };

        regionSelect.addEventListener('change', () => updateFilter(regionSelect, 'region'));
        seasonSelect.addEventListener('change', () => updateFilter(seasonSelect, 'season'));
        renderTrips();

        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
        }
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const trains = await response.json();
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTripsCatalog();
    hookTrainsCatalog();
    hookBookingsCatalog();
    hookSchedulesCatalog();
});


const hookBookingsCatalog = async () => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-row-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');
    const emptyEl = document.getElementById('bookings-empty');
    const tableEl = document.getElementById('bookings-table');

    // Only run on the bookings administration page.
    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/bookings');

        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const bookings = await response.json();

        if (!Array.isArray(bookings)) {
            throw new Error('Invalid bookings response');
        }

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (bookings.length === 0) {
            if (emptyEl) {
                emptyEl.hidden = false;
            }
            return;
        }

        const fragment = document.createDocumentFragment();

        bookings.forEach((booking) => {
            const row = templateEl.content.cloneNode(true);

            row.querySelector('[data-field="reference"]').textContent =
                booking.id;

            row.querySelector('[data-field="trip"]').textContent =
                booking.tripId;

            row.querySelector('[data-field="schedule"]').textContent =
                booking.scheduleId;

            row.querySelector('[data-field="day"]').textContent =
                booking.selectedDay.charAt(0).toUpperCase() +
                booking.selectedDay.slice(1);

            row.querySelector('[data-field="ticket-class"]').textContent =
                booking.ticketClass.charAt(0).toUpperCase() +
                booking.ticketClass.slice(1);

            row.querySelector('[data-field="passengers"]').textContent =
                booking.passengers.length;

            row.querySelector('[data-field="created-at"]').textContent =
                new Date(booking.createdAt).toLocaleDateString();

            fragment.appendChild(row);
        });

        listEl.replaceChildren(fragment);

        if (tableEl) {
            tableEl.hidden = false;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent =
                'Unable to load bookings right now. Please try again later.';
        }
    }
};


const hookSchedulesCatalog = () => {
    const sectionEl = document.getElementById('trip-schedules');
    const monthSelect = document.getElementById('schedule-month');
    const listEl = document.getElementById('schedules-grid');
    const templateEl = document.getElementById('schedule-card-template');
    const messageEl = document.getElementById('schedules-message');

    // Only run on the trip details page.
    if (!sectionEl || !monthSelect || !listEl || !templateEl || !messageEl) {
        return;
    }

    const tripId = sectionEl.dataset.tripId;
    let requestId = 0;

    const loadSchedules = async () => {
        const currentRequest = ++requestId;
        const month = monthSelect.value;

        const url = `/api/trips/${encodeURIComponent(tripId)}/schedules` +
            (month ? `?month=${encodeURIComponent(month)}` : '');

        messageEl.hidden = false;
        messageEl.textContent = 'Loading schedules...';
        listEl.replaceChildren();

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load schedules (${response.status})`);
            }

            const schedules = await response.json();

            if (!Array.isArray(schedules)) {
                throw new Error('Invalid schedules response');
            }

            // Ignore an older response if the visitor changed months.
            if (currentRequest !== requestId) {
                return;
            }

            if (schedules.length === 0) {
                messageEl.textContent = 'No schedules available for this month.';
                return;
            }

            const fragment = document.createDocumentFragment();

            schedules.forEach((schedule) => {
                const card = templateEl.content.cloneNode(true);

                card.querySelector('.departure-time').textContent =
                    schedule.departureTime;

                card.querySelector('.arrival-time').textContent =
                    schedule.arrivalTime;

                const daysEl = card.querySelector('.schedule-days');

                schedule.daysOfWeek.forEach((day) => {
                    const badge = document.createElement('span');
                    badge.className = 'day-badge';
                    badge.textContent = day.substring(0, 3);
                    daysEl.appendChild(badge);
                });

                card.querySelector('.book-btn').href =
                    `/trips/booking/${encodeURIComponent(schedule.id)}`;

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
            messageEl.hidden = true;
        } catch (error) {
            if (currentRequest !== requestId) {
                return;
            }

            console.error('Error loading schedules:', error);
            messageEl.textContent =
                'Unable to load schedules right now. Please try again later.';
        }
    };

    monthSelect.addEventListener('change', loadSchedules);
    loadSchedules();
};
