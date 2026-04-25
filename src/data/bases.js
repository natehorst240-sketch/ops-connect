// Base locations with coordinates, operational status, and weather.
// Statuses: AVAILABLE | AWAY_FROM_BASE | OUT_OF_SERVICE | UNAVAILABLE
// Weather: green (VFR) | yellow (MVFR/IFR) | red (LIFR/no-go)
//
// Coordinates are [longitude, latitude] for MapLibre (note the order).

export const BASES = [
  // ====================== 109 UT (rotor) ======================
  {
    id: 'st-george', name: 'St. George', codes: ['IH-09', 'IH-71'],
    coords: [-113.5684, 37.0965], region: '109 UT',
    aircraft: ['N251HC', 'N481HC'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'cedar-city', name: 'Cedar City', codes: ['IH-10'],
    coords: [-113.0619, 37.6775], region: '109 UT',
    aircraft: ['N261HC'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · few @ 12,000',
  },
  {
    id: 'roosevelt', name: 'Roosevelt', codes: ['IH-19'],
    coords: [-109.9888, 40.2994], region: '109 UT',
    aircraft: ['N271HC'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'imed', name: 'Intermountain MC', codes: ['IH-14'],
    coords: [-111.8911, 40.6602], region: '109 UT',
    aircraft: ['N281HC'],
    status: 'AWAY_FROM_BASE', statusReason: 'En route — scene call',
    weather: 'yellow', weatherDetail: 'MVFR · 5SM BR · BKN 3,500',
  },
  {
    id: 'mckay', name: 'McKay-Dee', codes: ['IH-13'],
    coords: [-111.9610, 41.1675], region: '109 UT',
    aircraft: ['N291HC'],
    status: 'OUT_OF_SERVICE', statusReason: 'N291HC AOG · awaiting parts',
    weather: 'green', weatherDetail: 'VFR · 10SM · scattered',
  },
  {
    id: 'logan', name: 'Logan', codes: ['IH-15'],
    coords: [-111.8338, 41.7370], region: '109 UT',
    aircraft: ['N431HC'],
    status: 'AWAY_FROM_BASE', statusReason: 'Covering McKay region',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'uvrmc', name: 'Utah Valley RMC', codes: ['IH-16'],
    coords: [-111.6620, 40.2479], region: '109 UT',
    aircraft: ['N531HC'],
    status: 'AVAILABLE',
    weather: 'yellow', weatherDetail: 'MVFR · 4SM HZ · BKN 4,000',
  },
  {
    id: 'kslc', name: 'KSLC Hangar', codes: ['IH 72-76'],
    coords: [-111.9791, 40.7899], region: 'SLC FW + 109',
    aircraft: ['N631HC', 'N731HC', 'N381HC', 'N781HC', 'N981HC', 'N581HC', 'N301HC', 'N346CC', 'N681HC'],
    status: 'AVAILABLE',
    weather: 'yellow', weatherDetail: 'MVFR · BKN 3,500 · 6SM',
  },

  // ====================== NC region (EC135) ======================
  {
    id: 'rock-hill', name: 'Rock Hill', codes: [],
    coords: [-81.0251, 34.9249], region: 'NC',
    aircraft: ['N362AH'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'hickory', name: 'Hickory', codes: [],
    coords: [-81.3414, 35.7344], region: 'NC',
    aircraft: ['N363AH'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · few',
  },
  {
    id: 'concord', name: 'Concord', codes: [],
    coords: [-80.5795, 35.4087], region: 'NC',
    aircraft: ['N366AH'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },

  // ====================== WY/MT ======================
  {
    id: 'riverton', name: 'Riverton', codes: ['IH-80'],
    coords: [-108.3801, 43.0246], region: 'WY/MT',
    aircraft: ['N904KS', 'N90HG'],
    status: 'UNAVAILABLE', statusReason: 'Crew rest period',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'greybull', name: 'Greybull', codes: ['IH-23'],
    coords: [-108.0531, 44.4886], region: 'WY/MT',
    aircraft: ['N39KM'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · scattered',
  },
  {
    id: 'vernal', name: 'Vernal', codes: ['IH-78'],
    coords: [-109.5288, 40.4555], region: 'WY/MT',
    aircraft: ['N407CN', 'N241H'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'lander', name: 'Lander', codes: ['IH-21'],
    coords: [-108.7307, 42.8330], region: 'WY/MT',
    aircraft: ['N407FC'],
    status: 'AWAY_FROM_BASE', statusReason: 'Inter-facility transport',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'rawlins', name: 'Rawlins', codes: ['IH-25'],
    coords: [-107.2384, 41.7910], region: 'WY/MT',
    aircraft: ['N407TK'],
    status: 'UNAVAILABLE', statusReason: 'Weather hold — winter storm',
    weather: 'red', weatherDetail: 'LIFR · 1/2SM SN · OVC 200',
  },

  // ====================== ID/NV ======================
  {
    id: 'burley', name: 'Burley', codes: ['IH-08'],
    coords: [-113.7929, 42.5358], region: 'ID/NV',
    aircraft: ['N407BY'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'rexburg', name: 'Rexburg', codes: ['IH-11'],
    coords: [-111.7897, 43.8260], region: 'ID/NV',
    aircraft: ['N407CP'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · few',
  },
  {
    id: 'ely', name: 'Ely', codes: ['IH-05'],
    coords: [-114.8819, 39.2466], region: 'ID/NV',
    aircraft: ['N407LF'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'winnemucca', name: 'Winnemucca', codes: ['IH-03'],
    coords: [-117.7355, 40.9730], region: 'ID/NV',
    aircraft: ['N466GH'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'elko', name: 'Elko', codes: ['IH-04', 'IH-70'],
    coords: [-115.7631, 40.8324], region: 'ID/NV',
    aircraft: ['N469JX', 'N775CC'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },

  // ====================== CO/NM ======================
  {
    id: 'glenwood', name: 'Glenwood Springs', codes: ['IH-24'],
    coords: [-107.3248, 39.5505], region: 'CO/NM',
    aircraft: ['N407JM'],
    status: 'AVAILABLE',
    weather: 'yellow', weatherDetail: 'MVFR · BKN 4,500 · mountain obscuration',
  },
  {
    id: 'los-alamos', name: 'Los Alamos', codes: ['IH-27-28'],
    coords: [-106.3031, 35.8881], region: 'CO/NM',
    aircraft: ['N407MZ', 'N862YB'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'cortez', name: 'Cortez', codes: ['IH-22', 'IH-79'],
    coords: [-108.5859, 37.3489], region: 'CO/NM',
    aircraft: ['N407SL', 'N315NG'],
    status: 'AWAY_FROM_BASE', statusReason: 'Inter-facility transport',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'steamboat', name: 'Steamboat Springs', codes: ['IH-26'],
    coords: [-106.8317, 40.4849], region: 'CO/NM',
    aircraft: ['N407ZM'],
    status: 'UNAVAILABLE', statusReason: 'Weather hold',
    weather: 'red', weatherDetail: 'LIFR · 3/4SM SN · OVC 400',
  },
  {
    id: 'pagosa', name: 'Pagosa Springs', codes: ['IH-81'],
    coords: [-107.0098, 37.2695], region: 'CO/NM',
    aircraft: ['N207NX'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · few',
  },

  // ====================== UT/AZ ======================
  {
    id: 'fort-mohave', name: 'Fort Mohave', codes: ['IH-06'],
    coords: [-114.5836, 35.0301], region: 'UT/AZ',
    aircraft: ['N407CZ'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'kingman', name: 'Kingman', codes: ['IH-07'],
    coords: [-114.0530, 35.1894], region: 'UT/AZ',
    aircraft: ['N407FM'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'richfield', name: 'Richfield', codes: ['IH-12'],
    coords: [-112.0844, 38.7714], region: 'UT/AZ',
    aircraft: ['N407RU'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },
  {
    id: 'moab', name: 'Moab', codes: ['IH-20'],
    coords: [-109.5498, 38.5733], region: 'UT/AZ',
    aircraft: ['N407TH'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },

  // ====================== PAGE ======================
  {
    id: 'page', name: 'Page', codes: ['IH-17-18', 'IH-77'],
    coords: [-111.4558, 36.9147], region: 'PAGE',
    aircraft: ['N407CH', 'N407NW', 'N307KH', 'N868PE'],
    status: 'AVAILABLE',
    weather: 'green', weatherDetail: 'VFR · 10SM · clear',
  },

  // ====================== Woods Cross ======================
  {
    id: 'woodscross', name: 'Woods Cross', codes: [],
    coords: [-111.9027, 40.8716], region: 'WOODSCROSS',
    aircraft: ['N407LP', 'N407PW'],
    status: 'AVAILABLE',
    weather: 'yellow', weatherDetail: 'MVFR · BKN 3,500 · 6SM HZ',
  },
];

// Mock aircraft in flight — in production these come from SkyRouter API.
// Coords are approximate positions between bases for demo purposes.
// bearing in degrees (0=N, 90=E, 180=S, 270=W)
export const LIVE_FLEET = [
  {
    tail: 'N431HC', type: 'AW109SP',
    coords: [-111.95, 41.45], bearing: 195,
    altitude: 8500, speed: 152,
    status: 'IN_FLIGHT', mission: 'Inter-facility · LGU → MCK',
    crew: 'Pilot: J. Provost · FN: M. Bryce · FP: A. Vander Werff',
    eta: '14 min',
  },
  {
    tail: 'N281HC', type: 'AW109SP',
    coords: [-112.15, 40.55], bearing: 245,
    altitude: 6500, speed: 138,
    status: 'IN_FLIGHT', mission: 'Scene call · I-80 MVA',
    crew: 'Pilot: B. Maynard · FN: J. Bergk · FP: T. Norton',
    eta: '6 min',
  },
  {
    tail: 'N407FC', type: 'Bell 407',
    coords: [-108.45, 42.68], bearing: 70,
    altitude: 9200, speed: 128,
    status: 'IN_FLIGHT', mission: 'IFT · Lander → Casper',
    crew: 'Pilot: K. Carpenter · FN: A. Black · FP: M. Hickman',
    eta: '22 min',
  },
  {
    tail: 'N407SL', type: 'Bell 407',
    coords: [-108.25, 37.55], bearing: 110,
    altitude: 8800, speed: 132,
    status: 'IN_FLIGHT', mission: 'IFT · Cortez → Durango',
    crew: 'Pilot: T. Dallin · FN: H. Kiser · FP: F. Kesler',
    eta: '8 min',
  },
  {
    tail: 'N681HC', type: 'CL604',
    coords: [-105.5, 41.2], bearing: 95,
    altitude: 35000, speed: 425,
    status: 'IN_FLIGHT', mission: 'Long-range transport · SLC → DEN',
    crew: 'Capt: T. Harris · FO: K. Lavender',
    eta: '18 min',
  },
];

// Status visual config — used by Map markers and popups.
export const STATUS_CONFIG = {
  AVAILABLE:       { label: 'AVAILABLE',       color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: '#22c55e' },
  AWAY_FROM_BASE:  { label: 'AWAY FROM BASE',  color: '#eab308', bg: 'rgba(234,179,8,0.10)',  border: '#eab308' },
  OUT_OF_SERVICE:  { label: 'OUT OF SERVICE',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: '#ef4444' },
  UNAVAILABLE:     { label: 'UNAVAILABLE',     color: '#a3a3a3', bg: 'rgba(163,163,163,0.10)', border: '#737373' },
};

export const WEATHER_CONFIG = {
  green:  { color: '#22c55e', label: 'VFR' },
  yellow: { color: '#eab308', label: 'MVFR/IFR' },
  red:    { color: '#ef4444', label: 'LIFR' },
};
