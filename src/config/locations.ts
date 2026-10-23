/**
 * Broad-area reference data for location fit (POPIA: no precise GPS).
 * Keyed by metro cluster. Extend this list or move it to Firestore as coverage grows.
 */
export const METRO_CLUSTERS: Record<string, readonly string[]> = {
  gauteng: ['Soweto', 'Johannesburg CBD', 'Alexandra', 'Midrand', 'Sandton', 'Pretoria Central', 'Mamelodi', 'Tembisa'],
  western_cape: ['Khayelitsha', 'Cape Town CBD', 'Mitchells Plain', 'Bellville', 'Gugulethu'],
  kzn: ['Umlazi', 'Durban Central', 'Pinetown', 'KwaMashu'],
  eastern_cape: ['Gqeberha (PE)', 'Mdantsane', 'East London'],
};

export function getMetroCluster(location: string): string | null {
  const norm = location.toLowerCase().trim();
  if (!norm) return null;
  for (const [cluster, towns] of Object.entries(METRO_CLUSTERS)) {
    if (towns.some((t) => norm.includes(t.toLowerCase()) || t.toLowerCase().includes(norm))) {
      return cluster;
    }
  }
  return null;
}
