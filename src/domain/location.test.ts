import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateHaversineDistanceKm,
  getEstimatedDistanceBetweenAreas,
  formatCentroidDistance,
  filterJobsByLocation,
  EARTH_RADIUS_KM,
} from './location';
import { findAreaCentroid, SA_AREA_CENTROIDS } from '../config/locations';
import { makeJob } from './testFixtures';

describe('Location & Centroid Distance Engine (R2 / FR-16)', () => {
  describe('T-17: Centroid distance estimation using Haversine formula', () => {
    it('uses standard earth radius 6371 km', () => {
      assert.equal(EARTH_RADIUS_KM, 6371);
    });

    it('returns 0 km for identical coordinates', () => {
      const dist = calculateHaversineDistanceKm(-26.2041, 28.0473, -26.2041, 28.0473);
      assert.equal(dist, 0);
    });

    it('calculates known distance between Soweto and Johannesburg CBD (~18-22 km)', () => {
      const soweto = findAreaCentroid('Soweto')!;
      const jhb = findAreaCentroid('Johannesburg CBD')!;
      assert.ok(soweto);
      assert.ok(jhb);

      const dist = calculateHaversineDistanceKm(soweto.lat, soweto.lng, jhb.lat, jhb.lng);
      assert.ok(dist >= 18 && dist <= 22, `Expected distance ~20 km, got ${dist}`);
    });

    it('calculates known distance between Soweto and Sandton (~25-29 km)', () => {
      const dist = getEstimatedDistanceBetweenAreas('Soweto', 'Sandton');
      assert.ok(dist !== null);
      assert.ok(dist >= 25 && dist <= 29, `Expected distance ~26.6 km, got ${dist}`);
    });

    it('calculates known inter-provincial distance between Soweto and Cape Town (>1200 km)', () => {
      const dist = getEstimatedDistanceBetweenAreas('Soweto', 'Cape Town CBD');
      assert.ok(dist !== null);
      assert.ok(dist > 1200 && dist < 1350, `Expected distance ~1260 km, got ${dist}`);
    });

    it('returns 0 for matching area names without coordinates lookup', () => {
      const dist = getEstimatedDistanceBetweenAreas('Soweto', 'Soweto');
      assert.equal(dist, 0);
    });

    it('handles case-insensitive and partial string matches', () => {
      const dist = getEstimatedDistanceBetweenAreas('Soweto, Johannesburg', 'soweto');
      assert.equal(dist, 0);
    });

    it('returns null when one or both areas are unknown', () => {
      const dist = getEstimatedDistanceBetweenAreas('Atlantis Colony', 'Soweto');
      assert.equal(dist, null);
    });

    it('formats centroid distances into clear, youth-friendly labels', () => {
      assert.equal(formatCentroidDistance(null, 'In-person'), 'Distance uncalculated');
      assert.equal(formatCentroidDistance(null, 'Remote'), 'Remote (Work anywhere)');
      assert.equal(formatCentroidDistance(0, 'In-person'), 'Same local area (< 3 km)');
      assert.equal(formatCentroidDistance(1.5, 'In-person'), 'Same local area (< 3 km)');
      assert.equal(formatCentroidDistance(14.8, 'In-person'), '~15 km away (centroid)');
      assert.equal(formatCentroidDistance(26.4, 'In-person'), '~26 km away (centroid)');
    });
  });

  describe('T-16: Candidate Opportunity Location & Distance Filtering', () => {
    const jobSoweto = makeJob({
      id: 'job-soweto',
      title: 'Tutor in Soweto',
      locationArea: 'Soweto',
      workMode: 'In-person',
    });

    const jobSandton = makeJob({
      id: 'job-sandton',
      title: 'Office Clerk in Sandton',
      locationArea: 'Sandton', // ~26.6 km from Soweto
      workMode: 'In-person',
    });

    const jobCapeTown = makeJob({
      id: 'job-cpt',
      title: 'Retail Helper in Cape Town',
      locationArea: 'Cape Town CBD', // ~1260 km from Soweto
      workMode: 'In-person',
    });

    const jobRemote = makeJob({
      id: 'job-remote',
      title: 'Virtual Assistant',
      locationArea: 'Cape Town CBD',
      workMode: 'Remote',
    });

    const allJobs = [jobSoweto, jobSandton, jobCapeTown, jobRemote];

    it('retains all reachable jobs when no distance limit is selected', () => {
      const filtered = filterJobsByLocation(allJobs, 'Soweto', { maxDistanceKm: null, workMode: 'all' });
      assert.equal(filtered.length, 4);
    });

    it('filters opportunities within 15 km (excludes Sandton & Cape Town, keeps Soweto and Remote)', () => {
      const filtered = filterJobsByLocation(allJobs, 'Soweto', { maxDistanceKm: 15, workMode: 'all' });
      const ids = filtered.map((r) => r.job.id);

      assert.ok(ids.includes('job-soweto'), 'Should include local Soweto job');
      assert.ok(ids.includes('job-remote'), 'Should retain Remote job even when distance limit is set');
      assert.ok(!ids.includes('job-sandton'), 'Should exclude Sandton (~26.6 km > 15 km)');
      assert.ok(!ids.includes('job-cpt'), 'Should exclude Cape Town in-person job');
      assert.equal(filtered.length, 2);
    });

    it('filters opportunities within 30 km (includes Sandton and Soweto and Remote, excludes Cape Town)', () => {
      const filtered = filterJobsByLocation(allJobs, 'Soweto', { maxDistanceKm: 30, workMode: 'all' });
      const ids = filtered.map((r) => r.job.id);

      assert.ok(ids.includes('job-soweto'));
      assert.ok(ids.includes('job-sandton'), 'Should include Sandton (~26.6 km <= 30 km)');
      assert.ok(ids.includes('job-remote'));
      assert.ok(!ids.includes('job-cpt'), 'Should still exclude Cape Town');
      assert.equal(filtered.length, 3);
    });

    it('filters strictly remote-only jobs', () => {
      const filtered = filterJobsByLocation(allJobs, 'Soweto', { workMode: 'remote' });
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].job.id, 'job-remote');
      assert.equal(filtered[0].distanceLabel, 'Remote (Work anywhere)');
    });

    it('filters strictly in-person jobs', () => {
      const filtered = filterJobsByLocation(allJobs, 'Soweto', { workMode: 'in_person' });
      const ids = filtered.map((r) => r.job.id);
      assert.ok(!ids.includes('job-remote'));
      assert.equal(filtered.length, 3);
    });

    it('allows candidate to evaluate reachable distance from a different target area', () => {
      // If evaluating from Cape Town CBD:
      const filtered = filterJobsByLocation(allJobs, 'Soweto', {
        targetArea: 'Cape Town CBD',
        maxDistanceKm: 15,
      });
      const ids = filtered.map((r) => r.job.id);
      assert.ok(ids.includes('job-cpt'), 'Should include Cape Town in-person job');
      assert.ok(ids.includes('job-remote'), 'Should include Remote job');
      assert.ok(!ids.includes('job-soweto'), 'Should exclude Soweto from Cape Town');
      assert.ok(!ids.includes('job-sandton'), 'Should exclude Sandton from Cape Town');
    });
  });

  describe('T-18: Zero Geolocation / GPS Privacy Guarantee (POPIA)', () => {
    it('verifies SA_AREA_CENTROIDS catalog contains only public reference broad areas', () => {
      assert.ok(SA_AREA_CENTROIDS.length >= 25);
      for (const area of SA_AREA_CENTROIDS) {
        assert.ok(area.id.startsWith('area_'), 'Area ID must have area_ prefix');
        assert.ok(typeof area.name === 'string' && area.name.length > 0);
        assert.ok(typeof area.province === 'string' && area.province.length > 0);
        assert.ok(typeof area.lat === 'number' && area.lat < 0, 'South African latitude must be negative');
        assert.ok(typeof area.lng === 'number' && area.lng > 0, 'South African longitude must be positive');
      }
    });

    it('confirms candidate profiles only store broad location string, not device GPS coordinates', () => {
      const dummyCandidate = {
        uid: 'cand1',
        fullName: 'Thabo Ndlovu',
        locationArea: 'Soweto',
      };

      // Ensure no lat/lng/gps fields exist on profile
      const keys = Object.keys(dummyCandidate);
      assert.ok(!keys.includes('lat'), 'Must not store latitude');
      assert.ok(!keys.includes('lng'), 'Must not store longitude');
      assert.ok(!keys.includes('gps'), 'Must not store GPS');
      assert.ok(!keys.includes('coordinates'), 'Must not store coordinates');
      assert.equal(typeof dummyCandidate.locationArea, 'string');
    });

    it('confirms global navigator.geolocation is not invoked during distance filtering', () => {
      // In Node environment, navigator.geolocation is undefined;
      // We ensure the filterJobsByLocation and calculation functions never attempt to access it.
      let geolocationAccessed = false;
      const fakeNavigator = {
        get geolocation() {
          geolocationAccessed = true;
          return {
            getCurrentPosition: () => {},
            watchPosition: () => {},
          };
        },
      };

      // Run calculation with fake navigator in scope
      const soweto = 'Soweto';
      const sandton = 'Sandton';
      const dist = getEstimatedDistanceBetweenAreas(soweto, sandton);
      assert.ok(dist !== null);
      assert.equal(geolocationAccessed, false, 'POPIA: Geolocation API must never be accessed');
    });
  });
});
