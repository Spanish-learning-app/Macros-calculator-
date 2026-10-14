// Prices for items not bought at Mercadona (halal butcher, Pakistani/Moroccan grocery).
// Owner: Yusuf Benali. Mercadona prices are NOT typed here: calc.mjs reads them from the live shop cache
// (research/yusuf/mercadona.mjs fetch). Every number below was read on the page named, on the date given.
// eurPerKg null = no current price found; the cost per box then says what is missing.

export const PRICE_DATE = '2026-10-13';

export const BUTCHER = {
  source: 'Carne Halal Online (carnehalalonline.com), online halal butcher in the province of Barcelona; prices for the 1 kg option, read from the product pages on 2026-10-13',
  crossCheck: 'Halal Empordà (halalemporda.com, Girona), read 2026-10-13: pechuga de pollo 8.95 €/kg (4 × 250 g), carne picada de vacuno 6.65 € per 0.5 kg = 13.30 €/kg, muslos de pollo 4.90 € per 600 g',
  items: {
    'chicken-breast': { eurPerKg: 7.49, name: 'Pechuga de pollo halal (fileteada)', url: 'https://carnehalalonline.com/pollo-halal/pechuga-de-pollo-halal/', note: 'sale price; regular 7.99 €/kg' },
    'chicken-mince': { eurPerKg: 9.9, name: 'Carne picada de pollo halal', url: 'https://carnehalalonline.com/pollo-halal/carne-picada-de-pollo-halal/' },
    'beef-mince': { eurPerKg: 11.99, name: 'Carne picada de ternera halal (ask for magra, about 10% fat)', url: 'https://carnehalalonline.com/ternera-halal/carne-picada-de-ternera-halal/' },
    'beef-boneless': { eurPerKg: 15.95, name: 'Carne sin hueso de ternera halal, cortada a tacos (boneless beef, cubed)', url: 'https://carnehalalonline.com/ternera-halal/carne-sin-hueso-de-halal/', note: '1 kg option; 7.99 € per 0.5 kg', date: '2026-10-14' },
    'chicken-thigh-boneless': {
      eurPerKg: null,
      name: 'Contramuslo de pollo halal, deshuesado y sin piel',
      url: 'https://carnehalalonline.com/pollo-halal/',
      note: 'not available: neither online halal shop lists boneless thigh (Carne Halal Online sells bone-in "muslos" at 2.05 € per 0.5 kg). For scale only, Mercadona\'s non-halal boneless thighs (product 2789) are 6.80 €/kg: that is not a halal price.',
    },
  },
};

export const DESI = {
  source: 'Pakistani or Moroccan grocery shelf at or next to the halal butcher (Raval, Sant Antoni). No online price list found on 2026-10-13.',
  items: {
    'chana-dal': { eurPerKg: null, name: 'Chana dal' },
    'masoor-dal': { eurPerKg: null, name: 'Masoor dal (red lentils)', note: 'not sold by Mercadona Barcelona on 2026-10-14 (only lentil pasta and pardina lentils)' },
    bulgur: { eurPerKg: null, name: 'Bulgur (burghul), fine or medium', note: 'not sold by Mercadona Barcelona on 2026-10-13; no Spanish online price found' },
    'green-chilli': { eurPerKg: null, name: 'Green chillies (hari mirch)' },
    'coriander-seed': { eurPerKg: null, name: 'Coriander seeds or ground coriander (dhania)' },
    cardamom: { eurPerKg: null, name: 'Green cardamom (elaichi)' },
    'garam-masala': { eurPerKg: null, name: 'Garam masala' },
    'chaat-masala': { eurPerKg: null, name: 'Chaat masala' },
    'ras-el-hanout': { eurPerKg: null, name: 'Ras el hanout', note: 'Halal Empordà lists it at 1.49 € without a pack size' },
  },
};
