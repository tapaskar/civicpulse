import type { Category } from './types';

export interface Authority {
  department: string;
  twitter?: string;
  email?: string;
  phone?: string;
  helpline?: string;
  whatsapp?: string;
  website?: string;
}

export interface CityAuthorities {
  name: string;
  /** Bounding box: [minLng, minLat, maxLng, maxLat] */
  bounds: [number, number, number, number];
  /** Category → responsible authority */
  contacts: Partial<Record<Category | '_police' | '_emergency', Authority>>;
}

// National-level fallbacks
export const NATIONAL_CONTACTS: Partial<Record<Category | '_police' | '_emergency', Authority>> = {
  pothole: {
    department: 'NHAI (National Highways)',
    twitter: '@NHAI_Official',
    helpline: '1033',
    website: 'https://complaint.nhai.org/',
  },
  garbage: {
    department: 'Swachh Bharat Mission',
    twitter: '@SwachhBharatGov',
    email: 'support@sbmurban.org',
    helpline: '1969',
  },
  noise: {
    department: 'Central Pollution Control Board',
    twitter: '@CPCB_OFFICIAL',
    email: 'cpcb@envis.nic.in',
    website: 'https://cpcb.nic.in/',
  },
  _emergency: {
    department: 'Emergency Services',
    helpline: '112',
    phone: '100 (Police) / 101 (Fire) / 108 (Ambulance)',
  },
};

export const CITY_AUTHORITIES: CityAuthorities[] = [
  // ── GURUGRAM ──────────────────────────────────────────
  {
    name: 'Gurugram',
    bounds: [76.85, 28.35, 77.15, 28.55],
    contacts: {
      pothole: {
        department: 'MCG (Municipal Corp Gurugram)',
        twitter: '@MunCorpGurugram',
        helpline: '1800-180-1817',
        phone: '0124-4753555',
      },
      road: {
        department: 'GMDA',
        twitter: '@OfficialGMDA',
        email: 'services.gmda@gmail.com',
        website: 'https://services.gmda.gov.in/',
      },
      streetlight: {
        department: 'MCG (Street Lighting)',
        twitter: '@MunCorpGurugram',
        helpline: '1800-180-1817',
      },
      water: {
        department: 'GMDA (Water Supply)',
        twitter: '@OfficialGMDA',
        email: 'services.gmda@gmail.com',
      },
      garbage: {
        department: 'MCG (Sanitation)',
        twitter: '@MunCorpGurugram',
        helpline: '1800-180-1817',
      },
      traffic: {
        department: 'Gurugram Traffic Police',
        twitter: '@TrafficGGM',
        helpline: '1095',
        phone: '0124-2386000',
      },
      accident: {
        department: 'Gurugram Police',
        twitter: '@gurgaonpolice',
        helpline: '112',
      },
      noise: {
        department: 'HSPCB (Haryana Pollution Board)',
        email: 'hqhspcb@hspcb.org.in',
        phone: '0172-2577872',
      },
      safety: {
        department: 'Gurugram Police',
        twitter: '@gurgaonpolice',
        helpline: '112',
      },
    },
  },

  // ── DELHI ─────────────────────────────────────────────
  {
    name: 'Delhi',
    bounds: [76.84, 28.40, 77.35, 28.88],
    contacts: {
      pothole: {
        department: 'Delhi PWD',
        twitter: '@DelhiPwd',
        email: 'complaint@pwddelhi.com',
        helpline: '1908',
        whatsapp: '8130188222',
      },
      road: {
        department: 'MCD Delhi',
        twitter: '@MCD_Delhi',
        helpline: '155305',
      },
      streetlight: {
        department: 'MCD Delhi',
        twitter: '@MCD_Delhi',
        helpline: '155305',
      },
      water: {
        department: 'Delhi Jal Board',
        twitter: '@DelhiJalBoard',
        email: 'grievances-djb@delhi.gov.in',
        helpline: '1916',
        whatsapp: '9650291021',
      },
      garbage: {
        department: 'MCD Delhi',
        twitter: '@MCD_Delhi',
        helpline: '155305',
      },
      traffic: {
        department: 'Delhi Traffic Police',
        twitter: '@dtptraffic',
        phone: '011-25844444',
        helpline: '1095',
        whatsapp: '8750871493',
      },
      accident: {
        department: 'Delhi Police',
        twitter: '@DelhiPolice',
        helpline: '112',
      },
      noise: {
        department: 'DPCC (Delhi Pollution Control)',
        twitter: '@DPCC_pollution',
        email: 'srscitdpcc.delhi@nic.in',
        phone: '011-49878310',
      },
      safety: {
        department: 'Delhi Police',
        twitter: '@DelhiPolice',
        email: 'delpol.service@delhipolice.gov.in',
        helpline: '112',
      },
    },
  },

  // ── NOIDA ─────────────────────────────────────────────
  {
    name: 'Noida',
    bounds: [77.28, 28.45, 77.55, 28.68],
    contacts: {
      pothole: {
        department: 'Noida Authority',
        twitter: '@noida_authority',
        email: 'noida@noidaauthorityonline.com',
        phone: '0120-2425025',
      },
      road: {
        department: 'Noida Authority',
        twitter: '@noida_authority',
        phone: '0120-2425025',
      },
      streetlight: {
        department: 'Noida Authority (LED)',
        twitter: '@noida_authority',
        helpline: '1800-102-9574',
      },
      water: {
        department: 'Noida Authority',
        twitter: '@noida_authority',
        helpline: '14420',
      },
      garbage: {
        department: 'Noida Authority',
        twitter: '@noida_authority',
        phone: '0120-2425025',
      },
      traffic: {
        department: 'Noida Traffic Police',
        helpline: '112',
      },
      accident: {
        department: 'Noida Police',
        helpline: '112',
      },
      safety: {
        department: 'Noida Police',
        helpline: '112',
      },
    },
  },

  // ── FARIDABAD ─────────────────────────────────────────
  {
    name: 'Faridabad',
    bounds: [77.20, 28.30, 77.45, 28.50],
    contacts: {
      pothole: {
        department: 'MCF (Municipal Corp Faridabad)',
        twitter: '@MCF_Faridabad',
        helpline: '1800-419-0219',
      },
      garbage: {
        department: 'MCF / Ecogreen',
        twitter: '@MCF_Faridabad',
        helpline: '1800-102-5953',
        email: 'cr.faridabad@ecogreenwtc.com',
      },
      water: {
        department: 'MCF',
        twitter: '@MCF_Faridabad',
        helpline: '14420',
      },
      traffic: {
        department: 'Faridabad Traffic Police',
        helpline: '1095',
      },
      accident: {
        department: 'Faridabad Police',
        helpline: '112',
      },
      safety: {
        department: 'Faridabad Police',
        helpline: '112',
      },
    },
  },

  // ── MUMBAI ────────────────────────────────────────────
  {
    name: 'Mumbai',
    bounds: [72.75, 18.85, 73.05, 19.30],
    contacts: {
      pothole: {
        department: 'BMC (Brihanmumbai MC)',
        twitter: '@mybmc',
        helpline: '1916',
        whatsapp: '8999228999',
      },
      road: {
        department: 'BMC',
        twitter: '@mybmc',
        helpline: '1916',
      },
      streetlight: {
        department: 'BMC',
        twitter: '@mybmc',
        helpline: '1916',
      },
      water: {
        department: 'BMC (Hydraulic)',
        twitter: '@mybmc',
        helpline: '1916',
      },
      garbage: {
        department: 'BMC (SWM)',
        twitter: '@mybmc',
        email: 'cleanmumbai.report@gmail.com',
        helpline: '1916',
      },
      traffic: {
        department: 'Mumbai Traffic Police',
        twitter: '@MTPHereToHelp',
        phone: '84-54-999-999',
        email: 'mumtraffic@mahapolice.gov.in',
      },
      accident: {
        department: 'Mumbai Police',
        twitter: '@MumbaiPolice',
        helpline: '112',
        whatsapp: '8454999999',
      },
      noise: {
        department: 'MPCB (Maharashtra)',
        twitter: '@mpcb_official',
        phone: '022-24010437',
      },
      safety: {
        department: 'Mumbai Police',
        twitter: '@MumbaiPolice',
        helpline: '112',
      },
    },
  },

  // ── BANGALORE ─────────────────────────────────────────
  {
    name: 'Bangalore',
    bounds: [77.45, 12.85, 77.75, 13.15],
    contacts: {
      pothole: {
        department: 'BBMP',
        twitter: '@BBMPCares',
        helpline: '1533',
        whatsapp: '9480685700',
      },
      road: {
        department: 'BBMP',
        twitter: '@BBMPCares',
        helpline: '1533',
      },
      streetlight: {
        department: 'BESCOM',
        twitter: '@NammaBESCOM',
        helpline: '1912',
        whatsapp: '9449844640',
      },
      water: {
        department: 'BWSSB',
        twitter: '@chairmanbwssb',
        email: 'callcenter@bwssb.gov.in',
        helpline: '1916',
        whatsapp: '87622 28888',
      },
      garbage: {
        department: 'BBMP (SWM)',
        twitter: '@BBMPCares',
        helpline: '1533',
      },
      traffic: {
        department: 'Bangalore Traffic Police',
        twitter: '@blrcitytraffic',
        helpline: '1073',
        whatsapp: '94808 01800',
      },
      accident: {
        department: 'Bangalore City Police',
        twitter: '@BlrCityPolice',
        helpline: '112',
      },
      noise: {
        department: 'KSPCB (Karnataka)',
        twitter: '@karnatakakspcb',
        email: 'ho@kspcb.gov.in',
        phone: '080-25581383',
      },
      safety: {
        department: 'Bangalore City Police',
        twitter: '@BlrCityPolice',
        helpline: '112',
      },
    },
  },

  // ── CHENNAI ───────────────────────────────────────────
  {
    name: 'Chennai',
    bounds: [80.10, 12.90, 80.35, 13.20],
    contacts: {
      pothole: {
        department: 'GCC (Greater Chennai Corp)',
        twitter: '@chennaicorp',
        helpline: '1913',
      },
      road: {
        department: 'GCC',
        twitter: '@chennaicorp',
        helpline: '1913',
      },
      streetlight: {
        department: 'GCC',
        twitter: '@chennaicorp',
        helpline: '1913',
      },
      water: {
        department: 'CMWSSB (Chennai Metro Water)',
        twitter: '@CHN_Metro_Water',
        email: 'cmwssb@tn.gov.in',
        helpline: '1916',
        whatsapp: '8144930308',
      },
      garbage: {
        department: 'GCC',
        twitter: '@chennaicorp',
        helpline: '1913',
      },
      traffic: {
        department: 'Chennai Traffic Police',
        twitter: '@ChennaiTraffic',
        whatsapp: '9003130103',
      },
      accident: {
        department: 'Chennai Police',
        helpline: '112',
      },
      noise: {
        department: 'TNPCB (Tamil Nadu)',
        email: 'complaint@tnpcb.gov.in',
        helpline: '1800-425-6750',
      },
      safety: {
        department: 'Chennai Police',
        helpline: '112',
      },
    },
  },

  // ── HYDERABAD ─────────────────────────────────────────
  {
    name: 'Hyderabad',
    bounds: [78.30, 17.30, 78.60, 17.55],
    contacts: {
      pothole: {
        department: 'GHMC',
        twitter: '@GHMCOnline',
        helpline: '040-21111111',
        whatsapp: '9848021665',
      },
      road: {
        department: 'GHMC',
        twitter: '@GHMCOnline',
        helpline: '040-21111111',
      },
      streetlight: {
        department: 'GHMC',
        twitter: '@GHMCOnline',
        helpline: '040-21111111',
      },
      water: {
        department: 'HMWSSB',
        twitter: '@HMWSSBOnline',
        email: 'customer-support@hyderabadwater.gov.in',
        helpline: '155313',
        whatsapp: '9154170968',
      },
      garbage: {
        department: 'GHMC (SWM)',
        twitter: '@GHMCOnline',
        helpline: '040-21111111',
      },
      traffic: {
        department: 'Hyderabad Traffic Police',
        twitter: '@HYDTP',
        whatsapp: '9010203626',
      },
      accident: {
        department: 'Hyderabad Police',
        helpline: '112',
      },
      noise: {
        department: 'TSPCB (Telangana)',
        twitter: '@telanganapcb',
        helpline: '10741',
      },
      safety: {
        department: 'Hyderabad Police',
        helpline: '112',
      },
    },
  },

  // ── PUNE ──────────────────────────────────────────────
  {
    name: 'Pune',
    bounds: [73.75, 18.45, 73.95, 18.65],
    contacts: {
      pothole: {
        department: 'PMC (Pune Municipal Corp)',
        twitter: '@PMCPune',
        helpline: '1800-103-0222',
        whatsapp: '8888251001',
        website: 'https://complaint.pmc.gov.in/',
      },
      road: {
        department: 'PMC',
        twitter: '@PMCPune',
        helpline: '1800-103-0222',
      },
      streetlight: {
        department: 'PMC',
        twitter: '@PMCPune',
        helpline: '1800-103-0222',
      },
      water: {
        department: 'PMC (Water Supply)',
        twitter: '@PMCPune',
        helpline: '1800-103-0222',
      },
      garbage: {
        department: 'PMC (SWM)',
        twitter: '@PMCPune',
        helpline: '1800-103-0222',
      },
      traffic: {
        department: 'Pune Traffic Police',
        twitter: '@punecitytraffic',
        helpline: '112',
      },
      accident: {
        department: 'Pune City Police',
        twitter: '@PuneCityPolice',
        helpline: '112',
      },
      noise: {
        department: 'MPCB (Maharashtra)',
        twitter: '@mpcb_official',
        phone: '022-24010437',
      },
      safety: {
        department: 'Pune City Police',
        twitter: '@PuneCityPolice',
        helpline: '112',
      },
    },
  },

  // ── KOLKATA ───────────────────────────────────────────
  {
    name: 'Kolkata',
    bounds: [88.25, 22.45, 88.45, 22.65],
    contacts: {
      pothole: {
        department: 'KMC (Kolkata Municipal Corp)',
        twitter: '@kmc_kolkata',
        helpline: '1800-345-3375',
        whatsapp: '8335999111',
      },
      road: {
        department: 'KMC',
        twitter: '@kmc_kolkata',
        helpline: '1800-345-3375',
      },
      streetlight: {
        department: 'KMC',
        twitter: '@kmc_kolkata',
        helpline: '1800-345-3375',
      },
      water: {
        department: 'KMC (Water Supply)',
        twitter: '@kmc_kolkata',
        helpline: '1800-345-3375',
      },
      garbage: {
        department: 'KMC (SWM)',
        twitter: '@kmc_kolkata',
        helpline: '1800-345-3375',
      },
      traffic: {
        department: 'Kolkata Traffic Police',
        twitter: '@KPTrafficDept',
        helpline: '2000',
        phone: '033-2250-5134',
      },
      accident: {
        department: 'Kolkata Police',
        twitter: '@KolkataPolice',
        helpline: '112',
      },
      noise: {
        department: 'WBPCB',
        twitter: '@WBPCB',
        email: 'wbpcbnet@wbpcb.gov.in',
        helpline: '1800-345-3390',
      },
      safety: {
        department: 'Kolkata Police',
        twitter: '@KolkataPolice',
        helpline: '112',
      },
    },
  },
];

/** City name → center coordinates derived from bounding boxes */
export const CITY_CENTERS: Record<string, { lng: number; lat: number; zoom: number }> = Object.fromEntries(
  CITY_AUTHORITIES.map(c => [
    c.name,
    {
      lng: (c.bounds[0] + c.bounds[2]) / 2,
      lat: (c.bounds[1] + c.bounds[3]) / 2,
      zoom: 13,
    },
  ])
);

/** Find city authorities for a given map center coordinate */
export function getAuthoritiesForLocation(lng: number, lat: number): CityAuthorities | null {
  return CITY_AUTHORITIES.find(city => {
    const [minLng, minLat, maxLng, maxLat] = city.bounds;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  }) ?? null;
}

/** Get the responsible authority for a category in a city, falling back to national */
export function getAuthorityForCategory(
  city: CityAuthorities | null,
  category: Category,
): Authority | null {
  return city?.contacts[category] ?? NATIONAL_CONTACTS[category] ?? null;
}
