import { SkillDefinition } from './types';

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // ==========================================
  // 1. HOSPITALITY & FOOD SERVICES
  // ==========================================
  {
    id: 'skill-barista',
    name: 'Barista & Espresso Calibration',
    category: 'Hospitality & Retail',
    description: 'Espresso extraction, grind adjustment, milk texturing, flat whites, beverage prep and commercial machine backflushing.',
    active: true,
  },
  {
    id: 'skill-kitchen-prep',
    name: 'Commercial Kitchen Prep & Knife Skills',
    category: 'Hospitality & Retail',
    description: 'Food hygiene standards, mise en place, vegetable prep, portion control, safe knife handling, and station sanitation.',
    active: true,
  },
  {
    id: 'skill-baking',
    name: 'Commercial Baking & Pastry Prep',
    category: 'Hospitality & Retail',
    description: 'Dough kneading, proofing, oven temperature calibration, artisan breads, pies, pastries, and bakery clean-down.',
    active: true,
  },
  {
    id: 'skill-waitron',
    name: 'Waitron & Table Hospitality',
    category: 'Hospitality & Retail',
    description: 'Order taking, tray balance, table service etiquette, guest bill handling, customer communication and station clearing.',
    active: true,
  },
  {
    id: 'skill-bartender',
    name: 'Beverage Dispensing & Bar Service',
    category: 'Hospitality & Retail',
    description: 'Draught beer pouring, cocktail and beverage mixing, glassware polishing, cellar inventory and till handling.',
    active: true,
  },

  // ==========================================
  // 2. TECHNICAL, TRADES & CONSTRUCTION
  // ==========================================
  {
    id: 'skill-solar',
    name: 'Solar PV Rooftop Mounting & DC Wiring',
    category: 'Technical & Trades',
    description: 'Rooftop mounting rails, inverter DC cabling, battery connections, ladder safety and multimeter voltage testing.',
    active: true,
  },
  {
    id: 'skill-phone-repair',
    name: 'Cellphone Screen & Hardware Repair',
    category: 'Technical & Trades',
    description: 'Smartphone screen replacement, charging port micro-soldering, battery replacement and fault diagnostics.',
    active: true,
  },
  {
    id: 'skill-plumbing',
    name: 'Basic Domestic Plumbing & Pipework',
    category: 'Technical & Trades',
    description: 'Tap washer replacement, PVC waste pipe fittings, geyser drainage valves, unblocking drains and leak isolation.',
    active: true,
  },
  {
    id: 'skill-electrical',
    name: 'Domestic Electrical Wiring & Socket Fitting',
    category: 'Technical & Trades',
    description: 'Single-phase wiring, DB board isolation, light switch and plug socket termination, wire stripping and continuity checks.',
    active: true,
  },
  {
    id: 'skill-welding',
    name: 'Metal Fabrication & Arc/MIG Welding',
    category: 'Technical & Trades',
    description: 'Shielded metal arc welding, angle grinding, burr removal, steel frame measurement, and protective welding PPE.',
    active: true,
  },
  {
    id: 'skill-carpentry',
    name: 'Carpentry, Joinery & Furniture Assembly',
    category: 'Technical & Trades',
    description: 'Timber cutting, drywall framing, door hanging, cabinet mounting, flat-pack assembly and cordless tool care.',
    active: true,
  },
  {
    id: 'skill-painting',
    name: 'Surface Prep & Architectural Painting',
    category: 'Technical & Trades',
    description: 'Crack filling, sanding, primer application, roller and brush cutting-in, tape masking, and clean drop-sheet layout.',
    active: true,
  },
  {
    id: 'skill-tiling',
    name: 'Wall & Floor Tiling & Grouting',
    category: 'Technical & Trades',
    description: 'Surface leveling, tile cutting, adhesive combing, spacing spacers, sponge clean-up and waterproof grouting.',
    active: true,
  },
  {
    id: 'skill-auto-mechanic',
    name: 'Basic Automotive Servicing & Brake Fitting',
    category: 'Technical & Trades',
    description: 'Oil and filter changes, spark plug checks, brake pad replacement, jack stand safety, and diagnostic fluid top-ups.',
    active: true,
  },
  {
    id: 'skill-motorcycle-repair',
    name: 'Motorcycle & Delivery Scooter Maintenance',
    category: 'Technical & Trades',
    description: 'Drive belt replacement, chain tensioning, carburetor/EFI cleaning, 2-stroke/4-stroke servicing, and tire patching.',
    active: true,
  },
  {
    id: 'skill-aircon-refrig',
    name: 'Air Conditioning & Refrigeration Maintenance',
    category: 'Technical & Trades',
    description: 'Filter cleaning, refrigerant pressure checks, coil de-icing, condensate drain clearing and thermostat checks.',
    active: true,
  },

  // ==========================================
  // 3. RETAIL, MERCHANDISING & CUSTOMER SERVICE
  // ==========================================
  {
    id: 'skill-retail',
    name: 'Retail POS & Cash Up',
    category: 'Hospitality & Retail',
    description: 'Point of sale barcode scanning, cash register float balancing, card speed-point operation and customer checkout.',
    active: true,
  },
  {
    id: 'skill-stock-inventory',
    name: 'Stock Receiving, Auditing & Merchandising',
    category: 'Hospitality & Retail',
    description: 'Delivery stock counting against invoices, shelf restocking, FIFO rotation, price tag labeling and shrinkage checks.',
    active: true,
  },
  {
    id: 'skill-customer-support',
    name: 'Inbound Customer Service & Helpdesk',
    category: 'Hospitality & Retail',
    description: 'Telephonic query handling, complaint escalation, CRM ticket updates, polite communication and resolution follow-through.',
    active: true,
  },
  {
    id: 'skill-promoter',
    name: 'Brand Promotion & Direct Customer Engagement',
    category: 'Hospitality & Retail',
    description: 'Product sampling, flyer distribution, event booth representation, foot-traffic engagement and lead sheet logging.',
    active: true,
  },

  // ==========================================
  // 4. DIGITAL, MEDIA & OFFICE ADMINISTRATION
  // ==========================================
  {
    id: 'skill-digital-admin',
    name: 'Digital Admin & Google Sheets',
    category: 'Digital & Admin',
    description: 'Spreadsheet data entry, formula lookups, WhatsApp business catalog setup, document formatting and email correspondence.',
    active: true,
  },
  {
    id: 'skill-social-media',
    name: 'Social Media Content & Community Management',
    category: 'Digital & Admin',
    description: 'Instagram and TikTok post scheduling, responding to direct messages, caption drafting and basic engagement tracking.',
    active: true,
  },
  {
    id: 'skill-graphic-design',
    name: 'Canva & Basic Graphic Design',
    category: 'Digital & Admin',
    description: 'Flyer design, promotional price posters, digital price lists, brand color templates and export formatting for print.',
    active: true,
  },
  {
    id: 'skill-data-entry',
    name: 'Accurate Data Entry & Document Scanning',
    category: 'Digital & Admin',
    description: 'High-speed keyboard input, paper invoice scanning, PDF archiving, indexing records and eliminating duplicate entries.',
    active: true,
  },
  {
    id: 'skill-web-basics',
    name: 'WordPress & Basic Website Maintenance',
    category: 'Digital & Admin',
    description: 'WordPress page updates, plugin updating, blog posting, broken link checks and image compression.',
    active: true,
  },

  // ==========================================
  // 5. LOGISTICS, DELIVERY & DRIVING
  // ==========================================
  {
    id: 'skill-scooter-delivery',
    name: 'Delivery Scooter Rider & Route Navigation',
    category: 'Logistics & Driving',
    description: 'Two-wheel defensive driving (Code A1), Google Maps route optimization, thermal bag food handling and on-time drop-off.',
    active: true,
  },
  {
    id: 'skill-warehouse-pack',
    name: 'Warehouse Picking, Packing & Dispatch',
    category: 'Logistics & Driving',
    description: 'Pick-slip reading, barcode handheld scanning, bubble wrap packaging, parcel box taping and courier bay staging.',
    active: true,
  },
  {
    id: 'skill-courier-driving',
    name: 'Light Delivery Vehicle Driving (Code 8/B)',
    category: 'Logistics & Driving',
    description: 'Light vehicle parcel delivery, pre-trip vehicle safety inspection, waybill proof of delivery and urban navigation.',
    active: true,
  },
  {
    id: 'skill-heavy-vehicle-driving',
    name: 'Medium & Heavy Vehicle Driving (Code 10/C1 & PrDP)',
    category: 'Logistics & Driving',
    description: 'Medium rigid truck driving (up to 16,000 kg GVM), air brake safety checks, cargo securing, delivery logbooks and defensive driving with PrDP.',
    active: true,
  },
  {
    id: 'skill-extra-heavy-driving',
    name: 'Extra-Heavy Articulated Truck Driving (Code 14/EC)',
    category: 'Logistics & Driving',
    description: 'Heavy articulated vehicle combination, coupling/uncoupling semi-trailers, reverse docking, load distribution and long-haul journey compliance.',
    active: true,
  },

  // ==========================================
  // 6. CARE, COMMUNITY & BEAUTY SERVICES
  // ==========================================
  {
    id: 'skill-childcare',
    name: 'Early Childhood Care & Play Assistant',
    category: 'Care & Community',
    description: 'Supervised child play facilitation, basic first-aid awareness, snack preparation, hygiene routines and storytelling.',
    active: true,
  },
  {
    id: 'skill-home-care',
    name: 'Home Care & Elderly Support Assistant',
    category: 'Care & Community',
    description: 'Assisting with daily mobility, meal prep, companion walking, medication reminder support and respectful communication.',
    active: true,
  },
  {
    id: 'skill-first-aid',
    name: 'First Aid & Workplace Safety (Level 1)',
    category: 'Care & Community',
    description: 'CPR, choking response, wound dressing, burn treatment, emergency calling protocol and first aid box maintenance.',
    active: true,
  },
  {
    id: 'skill-hair-braiding',
    name: 'Hair Braiding, Cornrows & Styling',
    category: 'Creative & Beauty',
    description: 'Box braids, knotless braids, cornrows, scalp parting accuracy, synthetic hair tucking and salon workstation hygiene.',
    active: true,
  },
  {
    id: 'skill-barbering',
    name: 'Barbering, Fade Cuts & Equipment Hygiene',
    category: 'Creative & Beauty',
    description: 'Clipper guard fading, taper cuts, line-ups, blade disinfection, cape sanitation and client grooming consultation.',
    active: true,
  },

  // ==========================================
  // 7. AGRICULTURE & ENVIRONMENTAL SERVICES
  // ==========================================
  {
    id: 'skill-urban-farming',
    name: 'Urban Agriculture & Vegetable Gardening',
    category: 'Agriculture & Environment',
    description: 'Seed germination, soil mulching, drip irrigation, pest scouting, organic composting and vegetable harvesting.',
    active: true,
  },
  {
    id: 'skill-landscaping',
    name: 'Landscaping, Lawn Care & Brush-Cutting',
    category: 'Agriculture & Environment',
    description: 'Petrol lawnmower operation, weed-eater line trimming, hedge shaping, garden debris clearing and rake edging.',
    active: true,
  },
  {
    id: 'skill-waste-sorting',
    name: 'Materials Recycling & Waste Sorting',
    category: 'Agriculture & Environment',
    description: 'Plastic polymer separation (PET/HDPE), cardboard baling, scrap metal sorting, PPE handling and weighing log records.',
    active: true,
  },
];
