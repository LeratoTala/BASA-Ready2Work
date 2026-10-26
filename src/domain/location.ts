import type { Job } from './types';
import { findAreaCentroid } from '../config/locations';

/**
 * Earth mean radius in kilometers (WGS84 standard).
 */
export const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Pure Haversine distance calculator between two geographic coordinates.
 * Returns distance in kilometers rounded to one decimal place.
 * (POPIA: strictly operates on area centroids, never device GPS).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

/**
 * Calculates estimated distance between two broad South African areas by finding their centroids.
 * Returns 0 if identical area name.
 * Returns estimated km if centroids exist.
 * Returns null if either centroid is unknown or unspecified.
 */
export function getEstimatedDistanceBetweenAreas(
  areaA: string | undefined | null,
  areaB: string | undefined | null
): number | null {
  if (!areaA || !areaB) return null;
  const normA = areaA.trim().toLowerCase();
  const normB = areaB.trim().toLowerCase();

  if (normA === normB || normA.includes(normB) || normB.includes(normA)) {
    return 0; // Same area
  }

  const centroidA = findAreaCentroid(areaA);
  const centroidB = findAreaCentroid(areaB);

  if (!centroidA || !centroidB) {
    return null;
  }

  return calculateHaversineDistanceKm(centroidA.lat, centroidA.lng, centroidB.lat, centroidB.lng);
}

/**
 * Formats a distance into a transparent, youth-friendly label.
 */
export function formatCentroidDistance(
  distanceKm: number | null,
  workMode?: string
): string {
  if (workMode === 'Remote') {
    return 'Remote (Work anywhere)';
  }
  if (distanceKm === null) {
    return 'Distance uncalculated';
  }
  if (distanceKm === 0 || distanceKm < 3) {
    return 'Same local area (< 3 km)';
  }
  return `~${Math.round(distanceKm)} km away (centroid)`;
}

export interface LocationFilterOptions {
  workMode?: 'all' | 'in_person' | 'remote';
  maxDistanceKm?: number | null; // e.g. 15, 30, 50, or null for any distance
  targetArea?: string; // override candidate's own location if desired
}

export interface FilteredJobResult {
  job: Job;
  distanceKm: number | null;
  distanceLabel: string;
  isReachable: boolean;
}

/**
 * Filters a list of open opportunities by work mode and reachable distance.
 * Remote jobs are always retained when distance filtering is applied because they require no travel.
 */
export function filterJobsByLocation(
  jobs: Job[],
  referenceArea: string | undefined | null,
  options: LocationFilterOptions = {}
): FilteredJobResult[] {
  const { workMode = 'all', maxDistanceKm = null, targetArea } = options;
  const originArea = targetArea || referenceArea || '';

  const results: FilteredJobResult[] = [];

  for (const job of jobs) {
    const isRemote = job.workMode === 'Remote';

    // 1. Work mode filter
    if (workMode === 'remote' && !isRemote) {
      continue;
    }
    if (workMode === 'in_person' && isRemote) {
      continue;
    }

    // 2. Distance estimation
    const distanceKm = isRemote ? null : getEstimatedDistanceBetweenAreas(originArea, job.locationArea);
    const distanceLabel = formatCentroidDistance(distanceKm, job.workMode);

    // 3. Max distance threshold filter (applies only to in-person / hybrid roles)
    if (maxDistanceKm !== null && !isRemote) {
      if (distanceKm !== null) {
        if (distanceKm > maxDistanceKm) {
          continue; // Outside reachable radius
        }
      } else {
        // Centroid unknown: if exact string mismatch and radius is strict (< 50 km), filter out
        const looseMatch =
          originArea &&
          job.locationArea &&
          (originArea.toLowerCase().includes(job.locationArea.toLowerCase()) ||
            job.locationArea.toLowerCase().includes(originArea.toLowerCase()));
        if (!looseMatch && maxDistanceKm < 50) {
          continue;
        }
      }
    }

    results.push({
      job,
      distanceKm,
      distanceLabel,
      isReachable: true,
    });
  }

  return results;
}
