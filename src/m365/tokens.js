// Fluent / Microsoft design tokens for the M365 Build mockup.
// Importing these consistently across screens makes the whole environment
// feel like Power Apps, not like our custom MX Connect demo.

export const FLUENT = {
  // Primary brand
  brand:       '#0078d4',  // Microsoft / Power Platform blue
  brandHover:  '#106ebe',
  brandDeep:   '#005a9e',
  brandSoft:   '#deecf9',  // Light tint for selected backgrounds
  brandLine:   '#c7e0f4',

  // Surfaces
  bg:          '#faf9f8',  // Power Apps canvas background
  bgAlt:       '#f3f2f1',  // Side rails, headers
  surface:     '#ffffff',  // Card / panel
  surfaceAlt:  '#fafafa',
  border:      '#edebe9',
  borderStrong:'#d2d0ce',

  // Text
  text:        '#323130',
  textSub:     '#605e5c',
  textDim:     '#a19f9d',

  // Status
  good:        '#107c10',
  goodSoft:    '#dff6dd',
  warn:        '#797673',
  warnAccent:  '#ca5010',
  warnSoft:    '#fed9b8',
  bad:         '#a4262c',
  badSoft:     '#fde7e9',
  info:        '#0078d4',
  infoSoft:    '#deecf9',

  // Specific UI elements
  approve:     '#107c10',
  deny:        '#a4262c',
  pending:     '#ca5010',

  // PCF custom-control highlighting
  pcfBadge:    '#5c2d91',   // Power Platform purple
  pcfBadgeSoft:'#e9defa',
};

// Standard Fluent typography stack — Segoe UI is Microsoft's flagship font.
export const FLUENT_FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// Helpers for Power Apps-style buttons and controls
export const fluentButton = {
  primary: {
    background: FLUENT.brand,
    color: '#fff',
    border: `1px solid ${FLUENT.brand}`,
    padding: '6px 16px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: FLUENT_FONT,
  },
  secondary: {
    background: FLUENT.surface,
    color: FLUENT.text,
    border: `1px solid ${FLUENT.borderStrong}`,
    padding: '6px 16px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: FLUENT_FONT,
  },
};
