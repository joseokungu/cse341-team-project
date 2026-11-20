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

        const payload = await response.json();
        if (!Array.isArray(payload.trips)) {
            throw new Error('Trip response did not contain a trips list');
        }

        const trips = payload.trips;
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

        const payload = await response.json();
        const trains = payload.trains || [];
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
});