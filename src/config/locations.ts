/**
 * Broad-area reference data for location fit (POPIA: no precise GPS).
 * South African suburb and township centroids for privacy-safe distance estimates.
 */

export interface AreaCentroid {
  id: string;
  name: string;
  province: string;
  metroCluster?: string;
  lat: number;
  lng: number;
}

export const METRO_CLUSTERS: Record<string, readonly string[]> = {
  gauteng: [
    'Soweto',
    'Johannesburg CBD',
    'Alexandra',
    'Midrand',
    'Sandton',
    'Pretoria Central',
    'Mamelodi',
    'Tembisa',
    'Centurion',
    'Randburg',
    'Roodepoort',
  ],
  western_cape: [
    'Khayelitsha',
    'Cape Town CBD',
    'Mitchells Plain',
    'Bellville',
    'Gugulethu',
    'Stellenbosch',
    'Paarl',
  ],
  kzn: [
    'Umlazi',
    'Durban Central',
    'Pinetown',
    'KwaMashu',
    'Pietermaritzburg',
  ],
  eastern_cape: [
    'Gqeberha (PE)',
    'Mdantsane',
    'East London',
  ],
  free_state: ['Bloemfontein'],
  limpopo: ['Polokwane'],
  mpumalanga: ['Nelspruit (Mbombela)'],
  north_west: ['Rustenburg'],
  northern_cape: ['Kimberley'],
};

export const SA_AREA_CENTROIDS: readonly AreaCentroid[] = [
  // Gauteng (Johannesburg / Tshwane / Ekurhuleni)
  { id: 'area_soweto', name: 'Soweto', province: 'Gauteng', metroCluster: 'gauteng', lat: -26.2678, lng: 27.8585 },
  { id: 'area_jhb_cbd', name: 'Johannesburg CBD', province: 'Gauteng', metroCluster: 'gauteng', lat: -26.2041, lng: 28.0473 },
  { id: 'area_alexandra', name: 'Alexandra', province: 'Gauteng', metroCluster: 'gauteng', lat: -26.1027, lng: 28.0933 },
  { id: 'area_sandton', name: 'Sandton', province: 'Gauteng', metroCluster: 'gauteng', lat: -26.1076, lng: 28.0567 },
  { id: 'area_midrand', name: 'Midrand', province: 'Gauteng', metroCluster: 'gauteng', lat: -25.9992, lng: 28.1263 },
  { id: 'area_randburg', name: 'Randburg', province: 'Gauteng', metroCluster: 'gauteng', lat: -26.0936, lng: 27.9947 },
  { id: 'area_roodepoort', name: 'Roodepoort', province: 'Gauteng', metroCluster: 'gauteng', lat: -26.1625, lng: 27.8725 },
  { id: 'area_tembisa', name: 'Tembisa', province: 'Gauteng', metroCluster: 'gauteng', lat: -25.9964, lng: 28.2268 },
  { id: 'area_centurion', name: 'Centurion', province: 'Gauteng', metroCluster: 'gauteng', lat: -25.8603, lng: 28.1895 },
  { id: 'area_pta_central', name: 'Pretoria Central', province: 'Gauteng', metroCluster: 'gauteng', lat: -25.7479, lng: 28.1878 },
  { id: 'area_mamelodi', name: 'Mamelodi', province: 'Gauteng', metroCluster: 'gauteng', lat: -25.7107, lng: 28.3492 },

  // Western Cape (Cape Town metro & surrounds)
  { id: 'area_cpt_cbd', name: 'Cape Town CBD', province: 'Western Cape', metroCluster: 'western_cape', lat: -33.9249, lng: 18.4241 },
  { id: 'area_khayelitsha', name: 'Khayelitsha', province: 'Western Cape', metroCluster: 'western_cape', lat: -34.0371, lng: 18.6756 },
  { id: 'area_mitchells_plain', name: 'Mitchells Plain', province: 'Western Cape', metroCluster: 'western_cape', lat: -34.0485, lng: 18.6225 },
  { id: 'area_bellville', name: 'Bellville', province: 'Western Cape', metroCluster: 'western_cape', lat: -33.8943, lng: 18.6294 },
  { id: 'area_gugulethu', name: 'Gugulethu', province: 'Western Cape', metroCluster: 'western_cape', lat: -33.9786, lng: 18.5727 },
  { id: 'area_stellenbosch', name: 'Stellenbosch', province: 'Western Cape', metroCluster: 'western_cape', lat: -33.9321, lng: 18.8602 },
  { id: 'area_paarl', name: 'Paarl', province: 'Western Cape', metroCluster: 'western_cape', lat: -33.7258, lng: 18.9667 },

  // KwaZulu-Natal (Durban / eThekwini & surrounds)
  { id: 'area_dbn_central', name: 'Durban Central', province: 'KwaZulu-Natal', metroCluster: 'kzn', lat: -29.8587, lng: 31.0218 },
  { id: 'area_umlazi', name: 'Umlazi', province: 'KwaZulu-Natal', metroCluster: 'kzn', lat: -29.9678, lng: 30.8833 },
  { id: 'area_pinetown', name: 'Pinetown', province: 'KwaZulu-Natal', metroCluster: 'kzn', lat: -29.8167, lng: 30.8500 },
  { id: 'area_kwamashu', name: 'KwaMashu', province: 'KwaZulu-Natal', metroCluster: 'kzn', lat: -29.7431, lng: 30.9833 },
  { id: 'area_pmb', name: 'Pietermaritzburg', province: 'KwaZulu-Natal', metroCluster: 'kzn', lat: -29.6006, lng: 30.3794 },

  // Eastern Cape
  { id: 'area_gqeberha', name: 'Gqeberha (PE)', province: 'Eastern Cape', metroCluster: 'eastern_cape', lat: -33.9608, lng: 25.6022 },
  { id: 'area_east_london', name: 'East London', province: 'Eastern Cape', metroCluster: 'eastern_cape', lat: -33.0153, lng: 27.9116 },
  { id: 'area_mdantsane', name: 'Mdantsane', province: 'Eastern Cape', metroCluster: 'eastern_cape', lat: -32.9367, lng: 27.7289 },

  // Free State
  { id: 'area_bloem', name: 'Bloemfontein', province: 'Free State', metroCluster: 'free_state', lat: -29.0852, lng: 26.1596 },

  // Limpopo
  { id: 'area_polokwane', name: 'Polokwane', province: 'Limpopo', metroCluster: 'limpopo', lat: -23.9045, lng: 29.4688 },

  // Mpumalanga
  { id: 'area_nelspruit', name: 'Nelspruit (Mbombela)', province: 'Mpumalanga', metroCluster: 'mpumalanga', lat: -25.4753, lng: 30.9694 },

  // North West
  { id: 'area_rustenburg', name: 'Rustenburg', province: 'North West', metroCluster: 'north_west', lat: -25.6676, lng: 27.2421 },

  // Northern Cape
  { id: 'area_kimberley', name: 'Kimberley', province: 'Northern Cape', metroCluster: 'northern_cape', lat: -28.7282, lng: 24.7499 },
];

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

export function findAreaCentroid(query: string | undefined | null): AreaCentroid | null {
  if (!query) return null;
  const norm = query.toLowerCase().trim();
  if (!norm) return null;

  // Exact match first
  const exact = SA_AREA_CENTROIDS.find(
    (a) => a.name.toLowerCase() === norm || a.id.toLowerCase() === norm
  );
  if (exact) return exact;

  // Partial match (e.g. "Soweto, Johannesburg" matches "Soweto")
  const partial = SA_AREA_CENTROIDS.find(
    (a) => norm.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(norm)
  );
  return partial || null;
}
