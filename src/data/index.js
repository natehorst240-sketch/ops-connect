// Real IHC data — aircraft roster, personnel, inspections, requests, crew shifts
// Extracted from MASTER_BASE_MECHANIC_CONTACT_LIST.csv, Workday_Direct_Report_List.csv,
// Due_List_2026-04-24.csv, and Connect___Protean_Connect.pdf
//
// INSPECTIONS_DUE and OPEN_SHIFTS are demo fallback only — replaced by live
// Veryon/Dataverse data in production. Dates are computed relative to
// DEMO_TODAY_ISO so the demo always shows a realistic near-future window.

import { DEMO_TODAY_ISO } from './mxOncallSchedule';

// d(n) → ISO date n days from demo today; dMDY(n) → MM/DD/YYYY for Veryon-style display
function d(n) {
  const dt = new Date(DEMO_TODAY_ISO + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt;
}
function dISO(n) { return d(n).toISOString().slice(0, 10); }
function dMDY(n) {
  const dt = d(n);
  return `${String(dt.getUTCMonth() + 1).padStart(2, '0')}/${String(dt.getUTCDate()).padStart(2, '0')}/${dt.getUTCFullYear()}`;
}

export const AIRCRAFT = [
  // AW109SP helicopters (9)
  { tail: 'N251HC', type: 'AW109SP', base: 'St. George IH-09', region: '109 UT', status: 'IN_SERVICE' },
  { tail: 'N261HC', type: 'AW109SP', base: 'Cedar City IH-10', region: '109 UT', status: 'IN_SERVICE' },
  { tail: 'N271HC', type: 'AW109SP', base: 'Roosevelt IH-19', region: '109 UT', status: 'IN_SERVICE' },
  { tail: 'N281HC', type: 'AW109SP', base: 'IMED IH-14', region: '109 UT', status: 'IN_SERVICE' },
  { tail: 'N291HC', type: 'AW109SP', base: 'McKay IH-13', region: '109 UT', status: 'AOG' },
  { tail: 'N431HC', type: 'AW109SP', base: 'Logan IH-15', region: '109 UT', status: 'IN_SERVICE' },
  { tail: 'N531HC', type: 'AW109SP', base: 'UVRMC IH-16', region: '109 UT', status: 'IN_SERVICE' },
  { tail: 'N631HC', type: 'AW109SP', base: 'KSLC Hangar', region: '109 UT', status: 'MAINTENANCE' },
  { tail: 'N731HC', type: 'AW109SP', base: 'KSLC Hangar', region: '109 UT', status: 'IN_SERVICE' },
  // EC135P3H (3)
  { tail: 'N362AH', type: 'EC135P3H', base: 'Rock Hill', region: 'NC', status: 'IN_SERVICE' },
  { tail: 'N363AH', type: 'EC135P3H', base: 'Hickory', region: 'NC', status: 'IN_SERVICE' },
  { tail: 'N366AH', type: 'EC135P3H', base: 'Concord', region: 'NC', status: 'IN_SERVICE' },
  // King Air B200 (4)
  { tail: 'N381HC', type: 'KingAir B200', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE' },
  { tail: 'N481HC', type: 'KingAir B200', base: 'St. George IH-71', region: 'SLC FW', status: 'IN_SERVICE' },
  { tail: 'N781HC', type: 'KingAir B200', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE' },
  { tail: 'N981HC', type: 'KingAir B200', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE' },
  // King Air C90 (2)
  { tail: 'N904KS', type: 'KingAir C90', base: 'Riverton IH-80', region: 'WY/MT', status: 'IN_SERVICE' },
  { tail: 'N90HG', type: 'KingAir C90', base: 'Riverton IH-80', region: 'WY/MT', status: 'IN_SERVICE' },
  // Cessna jets (3) — N/S America capable
  { tail: 'N581HC', type: 'Cessna 525C', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE', intl: 'N/S America' },
  { tail: 'N301HC', type: 'Cessna 560XLS', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE', intl: 'N/S America' },
  { tail: 'N346CC', type: 'Cessna 560XLS', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE', intl: 'N/S America' },
  // CL604 (1) — unrestricted international
  { tail: 'N681HC', type: 'Bombardier CL604', base: 'SLC IH 72-76', region: 'SLC FW', status: 'IN_SERVICE', intl: 'Unrestricted' },
  // Bell 407 (19)
  { tail: 'N407BY', type: 'Bell 407', base: 'Burley IH-08', region: 'ID/NV', status: 'IN_SERVICE' },
  { tail: 'N407CH', type: 'Bell 407', base: 'Page IH-17-18', region: 'PAGE', status: 'MAINTENANCE' },
  { tail: 'N407CN', type: 'Bell 407', base: 'Vernal IH-78', region: 'WY/MT', status: 'IN_SERVICE' },
  { tail: 'N407CP', type: 'Bell 407', base: 'Rexburg IH-11', region: 'ID/NV', status: 'IN_SERVICE' },
  { tail: 'N407CZ', type: 'Bell 407', base: 'Fort Mohave IH-06', region: 'UT/AZ', status: 'IN_SERVICE' },
  { tail: 'N407FC', type: 'Bell 407', base: 'Lander IH-21', region: 'WY/MT', status: 'IN_SERVICE' },
  { tail: 'N407FM', type: 'Bell 407', base: 'Kingman IH-07', region: 'UT/AZ', status: 'IN_SERVICE' },
  { tail: 'N407JM', type: 'Bell 407', base: 'Glenwood Springs IH-24', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N407LF', type: 'Bell 407', base: 'Ely IH-05', region: 'ID/NV', status: 'IN_SERVICE' },
  { tail: 'N407LP', type: 'Bell 407', base: 'Woodscross', region: 'WOODSCROSS', status: 'IN_SERVICE' },
  { tail: 'N407MZ', type: 'Bell 407', base: 'Los Alamos IH-27-28', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N407NW', type: 'Bell 407', base: 'Page IH-17-18', region: 'PAGE', status: 'IN_SERVICE' },
  { tail: 'N407PW', type: 'Bell 407', base: 'Woodscross', region: 'WOODSCROSS', status: 'IN_SERVICE' },
  { tail: 'N407RU', type: 'Bell 407', base: 'Richfield IH-12', region: 'UT/AZ', status: 'IN_SERVICE' },
  { tail: 'N407SL', type: 'Bell 407', base: 'Cortez IH-22', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N407TH', type: 'Bell 407', base: 'Moab IH-20', region: 'UT/AZ', status: 'IN_SERVICE' },
  { tail: 'N407TK', type: 'Bell 407', base: 'Rawlins IH-25', region: 'WY/MT', status: 'IN_SERVICE' },
  { tail: 'N407ZM', type: 'Bell 407', base: 'Steamboat Springs IH-26', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N307KH', type: 'Bell 407', base: 'Page IH-17-18', region: 'PAGE', status: 'IN_SERVICE' },
  { tail: 'N466GH', type: 'Bell 407', base: 'Winnemucca IH-03', region: 'ID/NV', status: 'IN_SERVICE' },
  { tail: 'N469JX', type: 'Bell 407', base: 'Elko IH-04', region: 'ID/NV', status: 'IN_SERVICE' },
  { tail: 'N862YB', type: 'Bell 407', base: 'Los Alamos IH-27-28', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N39KM', type: 'Bell 407', base: 'Greybull IH-23', region: 'WY/MT', status: 'IN_SERVICE' },
  // Single prop airplanes (5)
  { tail: 'N241H', type: 'Single Prop', base: 'Vernal IH-78', region: 'WY/MT', status: 'IN_SERVICE' },
  { tail: 'N207NX', type: 'Single Prop', base: 'Pagosa Springs IH-81', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N315NG', type: 'Single Prop', base: 'Cortez IH-79', region: 'CO/NM', status: 'IN_SERVICE' },
  { tail: 'N775CC', type: 'Single Prop', base: 'Elko IH-70', region: 'ID/NV', status: 'IN_SERVICE' },
  { tail: 'N868PE', type: 'Single Prop', base: 'Page IH-77', region: 'PAGE', status: 'IN_SERVICE' },
];

export const PERSONAS = [
  { id: 'director', name: 'Billy Ortega',   initials: 'BO', role: 'DIRECTOR',       roleTitle: 'Director of Maintenance Operations',    base: 'SLC',                region: 'ALL',    onShift: true },
  { id: 'rmm',      name: 'Tevita Silatolu',initials: 'TS', role: 'RMM',            roleTitle: 'Regional Maintenance Manager',           base: 'Billings, MT',       region: 'WY/MT',  onShift: true },
  { id: 'amt',      name: 'Nathan Anderson',initials: 'NA', role: 'AMT',            roleTitle: 'Aviation Maintenance Technician',        base: 'Greybull IH-23',     region: 'WY/MT',  onShift: true },
  { id: 'qa',       name: 'Ryan Taul',      initials: 'RT', role: 'ADOM',           roleTitle: 'Assistant Director of Maintenance Operations', base: 'SLC',         region: 'ALL',    onShift: true },
  { id: 'mx_sched', name: 'Carla Weir',     initials: 'CW', role: 'MX_SCHEDULER',   roleTitle: 'Maintenance Scheduler',                 base: 'SLC',                region: 'ALL',    onShift: true },
  { id: 'nurse',    name: 'M. Bryce',       initials: 'MB', role: 'FLIGHT_NURSE',   roleTitle: 'Flight Nurse — Urban',                  base: 'Cedar City Hospital', region: '109 UT', onShift: false },
  { id: 'bom',      name: 'BOM — 109 UT',   initials: 'BOM', role: 'BOM',           roleTitle: 'Base Operations Manager',               base: 'IMED IH-14',         region: '109 UT', onShift: true },
];

export const BULLETINS = [
  { level: 'ALERT', title: 'N291HC AOG — McKay Base', message: 'Tail rotor gearbox chip light. Awaiting parts ETA. Regional coverage from N431HC (Logan).', postedBy: 'Nate Horstmeier' },
  { level: 'ADVISORY', title: 'Veryon System Maintenance Window', message: 'Veryon unavailable 04/26 02:00-04:00 MT for scheduled updates.', postedBy: 'Ryan Taul' },
  { level: 'INFO', title: 'AW109SP Q2 Inspection Cycle Starts 05/01', message: 'Review inspection intervals per aircraft. Coordinate with Carla/Rachel.', postedBy: 'Ryan Taul' },
];

// Demo fallback — production reads from Veryon via Dataverse (cr463_inspection_due entity)
export const INSPECTIONS_DUE = [
  { tail: 'N281HC', desc: 'Monthly oxygen bottle exchange',    due: dMDY(1),  days: 1,  level: 'red'   },
  { tail: 'N291HC', desc: 'Tail rotor pitch change — grease', due: dMDY(3),  days: 3,  level: 'red'   },
  { tail: 'N271HC', desc: '90-degree gearbox oil change',     due: dMDY(5),  days: 5,  level: 'amber' },
  { tail: 'N531HC', desc: 'Port FX 30-day inspection',        due: dMDY(7),  days: 7,  level: 'amber' },
  { tail: 'N581HC', desc: 'Landing gear inspection',          due: dMDY(8),  days: 8,  level: 'amber' },
  { tail: 'N251HC', desc: 'Non-rotating scissors exam',       due: dMDY(10), days: 10, level: 'amber' },
  { tail: 'N261HC', desc: 'Rotating scissors exam',           due: dMDY(11), days: 11, level: 'amber' },
  { tail: 'N431HC', desc: 'Cockpit fire extinguisher monthly',due: dMDY(12), days: 12, level: 'amber' },
  { tail: 'N481HC', desc: 'AAIP LifePort 12-month inspection',due: dMDY(14), days: 14, level: 'amber' },
  { tail: 'N381HC', desc: 'Hydraulic fluid drain & replace',  due: dMDY(16), days: 16, level: 'amber' },
  { tail: 'N781HC', desc: 'Airfoil de-icer application',      due: dMDY(21), days: 21, level: 'green' },
  { tail: 'N251HC', desc: 'Power assurance check',            due: dMDY(30), days: 30, level: 'green' },
];

export const PENDING_REQUESTS = [
  { id: 'r1', type: 'MX Schedule', submitter: 'Nathan Anderson', detail: 'N39KM 100-hr inspection window', submitted: '4h ago', region: 'WY/MT' },
  { id: 'r2', type: 'Time Off', submitter: 'Michael Deal', detail: '3 days · 05/02–05/04', submitted: '1d ago', region: 'ID/NV' },
  { id: 'r3', type: 'Ask Leadership', submitter: 'Kelby Kalbach', detail: 'Training budget question', submitted: '2d ago', region: 'WY/MT' },
  { id: 'r4', type: 'PR Movement', submitter: 'PR Team', detail: 'N251HC media flight — 05/08', submitted: '3h ago', region: '109 UT' },
  { id: 'r5', type: 'Safety Report', submitter: 'Anonymous', detail: 'Tool control concern at IH-72', submitted: '6h ago', region: 'SLC' },
];

// Demo fallback — production reads from Protean Hub via Dataverse (cr463_open_shift entity)
export const OPEN_SHIFTS = [
  { id: 'os1', date: dISO(5),  time: '19:00-07:00', role: 'FN - URBAN', specialty: 'flight_nurse',    base: 'Intermountain Medical Center', region: '109 UT', fatigueRisk: false, differential: '$8/hr' },
  { id: 'os2', date: dISO(6),  time: '19:00-07:00', role: 'RT ADULT',   specialty: 'respiratory',     base: 'McKay Dee',                    region: '109 UT', fatigueRisk: false, differential: '$6/hr' },
  { id: 'os3', date: dISO(7),  time: '06:00-18:00', role: 'FN - URBAN', specialty: 'flight_nurse',    base: 'St. George Hospital',          region: '109 UT', fatigueRisk: true,  differential: '$8/hr' },
  { id: 'os4', date: dISO(8),  time: '19:00-07:00', role: 'PEDS',       specialty: 'pediatric',       base: 'Primary Childrens Hospital',   region: '109 UT', fatigueRisk: false, differential: '$10/hr' },
  { id: 'os5', date: dISO(10), time: '07:00-19:00', role: 'FP - URBAN', specialty: 'flight_paramedic',base: 'Utah Valley Hospital',         region: '109 UT', fatigueRisk: false, differential: '$6/hr' },
  { id: 'os6', date: dISO(11), time: '09:00-09:00', role: 'FN - URBAN', specialty: 'flight_nurse',    base: 'Cedar City Hospital',          region: '109 UT', fatigueRisk: false, differential: '$12/hr (24hr)' },
  { id: 'os7', date: dISO(13), time: '19:00-07:00', role: 'NEO',        specialty: 'neonatal',        base: 'Primary Childrens Hospital',   region: '109 UT', fatigueRisk: false, differential: '$10/hr' },
];

export const CREW_REQUESTS = [
  { id: 'cr1', type: 'Shift Swap', submitter: 'A. Vander Werff', detail: 'Trade 05/03 PCH with B. Bunker', submitted: '2h ago', region: '109 UT' },
  { id: 'cr2', type: 'Time Off', submitter: 'T. Harris', detail: '4 days · 05/15–05/18', submitted: '1d ago', region: '109 UT' },
  { id: 'cr3', type: 'Cert Renewal', submitter: 'System', detail: 'R. Linsler PALS expires 05/30', submitted: '3h ago', region: '109 UT' },
  { id: 'cr4', type: 'Training Request', submitter: 'M. Bryce', detail: 'STABLE course attendance 06/10', submitted: '4h ago', region: '109 UT' },
];

export const FLOWS = {
  flowA: {
    title: 'MX Request → Approval → Teams Sync',
    desc: 'AMT submits a maintenance window; RMM approves; event syncs to Outlook and Teams.',
    steps: [
      { actor: 'AMT · Nathan Anderson', action: 'Submits MX Schedule request', detail: 'N39KM · 100-hr inspection · 05/02 08:00 → 05/03 17:00 · Greybull IH-23' },
      { actor: 'MX Connect', action: 'Routes to RMM approval queue', detail: 'Tevita Silatolu (WY/MT) notified. Entry pending on resource timeline.' },
      { actor: 'RMM · Tevita Silatolu', action: 'Reviews on hover card', detail: 'Countdown, conflict check, region coverage. Taps Approve with note.' },
      { actor: 'MX Connect', action: 'Fires approval → Edge Function', detail: 'Postgres row.status = approved. Trigger calls Microsoft Graph API.' },
      { actor: 'Microsoft Graph', action: 'Publishes to shared Outlook calendar', detail: 'Event created on IHC MX Schedule calendar. Category: WY/MT.' },
      { actor: 'Microsoft Graph', action: 'Posts to Teams channel', detail: '#mx-ops-wymt: "Approved: N39KM 100-hr 05/02–05/03 · Greybull"' },
      { actor: 'AMT · Nathan Anderson', action: 'Receives confirmation', detail: 'Email + in-app toast. Event visible on MX Tracking calendar.' },
    ],
  },
  flowB: {
    title: 'Open Shift Claim',
    desc: 'Crew Scheduler publishes open shift; Flight Nurse claims it; calendar updates; payroll sees coverage.',
    steps: [
      { actor: 'MX Scheduler · Carla Weir', action: 'Publishes open shift', detail: 'FN-URBAN · 04/30 19:00–07:00 · Intermountain Medical Center' },
      { actor: 'MX Connect', action: 'Notifies eligible nurses', detail: 'Filters by cert (CompleteFlight API), region, on-shift. 14 eligible.' },
      { actor: 'Flight Nurse · M. Bryce', action: 'Views open shift board', detail: 'Sees shift card with differential, base, crew composition.' },
      { actor: 'Flight Nurse · M. Bryce', action: 'Taps Claim Shift', detail: 'Requires supervisor ack on shifts creating fatigue risk (warn only).' },
      { actor: 'MX Connect', action: 'Validates + books', detail: 'Duty-time check: warn (28h cumulative). Supervisor notified. Booked.' },
      { actor: 'Microsoft Graph', action: 'Syncs to Outlook + Teams', detail: 'Shift on shared crew calendar. Payroll feed updated.' },
    ],
  },
  flowC: {
    title: 'Ask Leadership · Director Routing',
    desc: 'Same MX Request flow, same Adaptive Card pattern — but the Routing column on the form sends the card to the Director channel instead of the regional RMM. Used for budget questions, policy exceptions, anything that needs a leadership call.',
    steps: [
      { actor: 'AMT · Kelby Kalbach', action: 'Opens MX Request form', detail: 'Toggles "Ask Leadership" on — form switches Routing field to Director and hides aircraft-specific fields.' },
      { actor: 'AMT · Kelby Kalbach', action: 'Submits the question', detail: 'Subject: "Training budget — IA renewal course Q3?" Routing = Director. Status = Submitted.' },
      { actor: 'SharePoint Lists', action: 'New row in MX Requests', detail: 'Same list as every other request. Routing = Director, Audit Correlation stamped.' },
      { actor: 'Power Automate', action: 'mxr-approval-flow-sharepoint fires', detail: 'Trigger condition matches Status=Submitted. Audit row written: mx_request.submitted.' },
      { actor: 'Power Automate', action: 'Composes Adaptive Card', detail: 'Header reads "ASK LEADERSHIP · DECISION NEEDED". Same Approve/Deny/comment shape as RMM cards.' },
      { actor: 'Power Automate', action: 'Posts to Director channel', detail: 'channelId resolves to mx_director_channel_id (not the regional RMM channel). Director group is notified.' },
      { actor: 'Director · Billy Ortega', action: 'Reads card on phone, responds', detail: 'Taps Approve with comment "Yes — submit course catalog by 05/15." Decision recorded.' },
      { actor: 'Power Automate', action: 'Updates request + audit', detail: 'Status = Approved, Approver = Director claims, Decision Comment captured. Audit row: mx_request.approved, Actor Role = Director.' },
      { actor: 'Microsoft Teams', action: 'DM back to Kelby', detail: '"Your Ask Leadership request was approved by Billy Ortega. Comment: Yes — submit course catalog by 05/15."' },
      { actor: 'SharePoint Audit Log', action: 'Full trail retained', detail: 'Two audit rows (submit + approve) tied by Audit Correlation. 7-year retention per HIPAA.' },
    ],
  },
  flowD: {
    title: 'Time Off → Coverage Gap',
    desc: 'Pilot submits time-off; Chief Pilot approves; Crew Scheduler sees gap, posts open shift.',
    steps: [
      { actor: 'Pilot · B. Maynard', action: 'Submits time-off request', detail: '3 days · 05/12–05/14 · Family event' },
      { actor: 'Chief Pilot', action: 'Approves in one tap', detail: 'Hover card shows no coverage conflicts at Logan during window.' },
      { actor: 'MX Connect', action: 'Calculates coverage gap', detail: 'Logan base needs 24/7. Gap: 3 shifts × 12h = 36h unassigned.' },
      { actor: 'MX Scheduler · Carla Weir', action: 'Sees gap alert on timeline', detail: 'Red band on pilot row. Publish as Open Shift for each.' },
      { actor: 'Eligible Pilots', action: 'Receive open shift notification', detail: '7 pilots with Logan auth and no conflicts get in-app + email.' },
      { actor: 'Microsoft Graph', action: 'Outlook updated for time-off', detail: 'Personal + team availability calendars reflect dates.' },
    ],
  },
};
