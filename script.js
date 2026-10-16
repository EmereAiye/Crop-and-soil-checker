// ===== CROP AND SOIL DOCTOR script.js =====

// ----- 1. SETTINGS -----
const CONFIG = {
  gridWidth: 128,
  maxUploadMB: 12,
  scanMs: 2600,
  aiEndpoint: null,   // photo-diagnosis server (optional, not used yet)
  chatEndpoint: 'https://emsagro.emmymasterwise.workers.dev'   // Ask EmsAgro + voice AI
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ----- 2. KNOWLEDGE BASE (crop problems, then soil problems) -----
const DISEASES = {
  healthy: {
    name: 'Healthy leaf',
    tone: 'ok',
    summary: 'No clear signs of disease or deficiency in this photo. The leaf colour looks even.',
    causes: [
      'Good light, water and nutrition are reaching the plant',
      'No visible fungal spots, powder or pustules'
    ],
    steps: [
      'Keep your normal watering and feeding routine.',
      'Check the underside of leaves once a week for insects or early spots.',
      'Scan again if you notice new colour changes.'
    ],
    prevent: [
      'Space plants so air can move between them',
      'Water at the base of the plant, in the morning',
      'Remove weeds that harbour pests'
    ]
  },

  nutrient: {
    name: 'Yellowing leaves (chlorosis)',
    tone: 'warn',
    summary: 'Large areas of the leaf are losing their green colour. This is usually hunger for nutrients, wet roots, or a virus.',
    causes: [
      'Nitrogen shortage: older, lower leaves turn evenly pale yellow first',
      'Waterlogged or compacted soil: roots cannot take up food',
      'Iron or magnesium shortage: yellow between the veins while the veins stay green',
      'Virus (for example mosaic): patchy light and dark green mottling, stunted plants, spread by whiteflies and aphids'
    ],
    steps: [
      'Push a finger 5 cm into the soil. If it is soggy, stop watering and open drainage channels.',
      'If the lower leaves are evenly yellow, side-dress with compost, well-rotted manure or an NPK/urea fertiliser. Keep it a hand-width from the stem and follow the label rate.',
      'If the yellow is patchy and plants are stunted, pull out and destroy a few affected plants and spray neem oil to control whiteflies and aphids.',
      'If only young leaves are yellow between the veins, apply a foliar feed that contains iron and magnesium.',
      'Take another photo in 7 days. New leaves should come out green if the fix is working.'
    ],
    prevent: [
      'Test your soil before planting',
      'Add compost every season',
      'Rotate with legumes such as cowpea or groundnut',
      'Plant on ridges or raised beds where water collects'
    ]
  },

  leafspot: {
    name: 'Fungal leaf spot',
    tone: 'warn',
    summary: 'Small brown spots, often with a darker edge, scattered over the leaf. They spread in humid weather and splashing water.',
    causes: [
      'Fungi such as Cercospora and Septoria',
      'Overhead watering and long periods of wet leaves',
      'Crowded plants with poor air flow',
      'Infected crop residue left in the field'
    ],
    steps: [
      'Pick off the worst leaves and bury or burn them. Do not put them on the compost heap.',
      'Water at the base of the plant, in the morning, so leaves dry fast.',
      'Spray a copper-based fungicide or mancozeb. Follow the label rate and wear gloves and a mask.',
      'Repeat after 7 to 10 days if the weather stays wet.',
      'Thin out crowded plants so air can move between them.'
    ],
    prevent: [
      'Rotate crops every season',
      'Mulch the soil to stop mud splashing onto leaves',
      'Clear and destroy crop residue after harvest'
    ]
  },

  bacterial: {
    name: 'Bacterial leaf spot',
    tone: 'bad',
    summary: 'Small dark, water-soaked spots, each surrounded by a yellow ring. Bacteria spread quickly through rain splash and dirty tools.',
    causes: [
      'Bacteria such as Xanthomonas and Pseudomonas',
      'Infected seed or seedlings',
      'Working in the field when leaves are wet',
      'Wind-driven rain'
    ],
    steps: [
      'Remove and destroy infected leaves. Do not touch plants when they are wet.',
      'Spray a copper-based product. Ordinary fungicides do not control bacteria.',
      'Wash or wipe tools and hands with soap or a bleach solution between plants.',
      'Stop overhead watering.',
      'If more than a third of the plants are affected, ask your extension officer for advice.'
    ],
    prevent: [
      'Buy clean, certified seed or seedlings',
      'Rotate away from the same crop for 2 to 3 seasons',
      'Do not work in the field while leaves are wet'
    ]
  },

  blight: {
    name: 'Leaf blight',
    tone: 'bad',
    summary: 'Large brown or black patches that grow quickly and can kill whole leaves. Blights can destroy a field within days in humid weather.',
    causes: [
      'Early blight (Alternaria) and late blight (Phytophthora) in tomato and potato',
      'Leaf blights in maize and other cereals',
      'Cool, humid or rainy weather',
      'Infected soil, seed or crop residue'
    ],
    steps: [
      'Act today. Remove and destroy badly affected leaves or whole plants.',
      'Spray a protectant fungicide such as mancozeb or copper. Ask an agro-dealer whether a systemic product is needed. Follow the label.',
      'Stop overhead watering and avoid walking through the crop when it is wet.',
      'Stake or prune plants so air and sun reach the lower leaves.',
      'Tell your extension officer if it is spreading across the field.'
    ],
    prevent: [
      'Plant resistant varieties',
      'Rotate crops for at least 2 to 3 seasons',
      'Mulch to keep soil off the leaves',
      'Remove crop residue after harvest'
    ]
  },

  rust: {
    name: 'Rust',
    tone: 'warn',
    summary: 'Orange to reddish-brown powdery bumps, often on the underside of leaves. The powder rubs off on your fingers.',
    causes: [
      'Rust fungi, spread by wind-blown spores',
      'Warm, humid weather with heavy dew',
      'Too much nitrogen fertiliser, which gives soft leaves'
    ],
    steps: [
      'Remove the most heavily infected leaves and destroy them.',
      'Spray sulphur or a rust fungicide recommended by your agro-dealer. Follow the label.',
      'Avoid wetting the leaves when you water.',
      'Cut back on nitrogen fertiliser until the outbreak is over.'
    ],
    prevent: [
      'Plant rust-resistant varieties',
      'Give plants wide spacing',
      'Scout the undersides of leaves every week in the wet season'
    ]
  },

  mildew: {
    name: 'Powdery mildew',
    tone: 'warn',
    summary: 'A white to grey powder on the leaf surface. It weakens leaves and slows growth.',
    causes: [
      'A fungus that likes warm days, cool nights and humid air',
      'Crowded plants with little air movement',
      'Shade and poor sunlight'
    ],
    steps: [
      'Prune crowded growth and remove badly coated leaves.',
      'Spray sulphur, neem oil or potassium bicarbonate. Spray in the cool of the evening, because sulphur can burn leaves in hot sun.',
      'Repeat every 7 to 10 days until new growth stays clean.',
      'Water at the soil level, not over the leaves.'
    ],
    prevent: [
      'Plant in full sun with room between plants',
      'Choose mildew-resistant varieties',
      'Avoid heavy nitrogen feeding'
    ]
  },

  blackspot: {
    name: 'Black spots or sooty mould',
    tone: 'warn',
    summary: 'Dark patches on the leaf. They are either a fungal spot disease or a sooty mould growing on sticky insect droppings.',
    causes: [
      'Sooty mould: grows on honeydew left by aphids, whiteflies or mealybugs',
      'Black spot fungus in warm, wet weather',
      'Overhead watering'
    ],
    steps: [
      'Rub a spot with a damp cloth. If the black wipes off like soot, it is sooty mould.',
      'For sooty mould: control the insects with neem oil or soapy water, then wash the leaves.',
      'If the spot does not wipe off, remove the leaves and spray copper fungicide.',
      'Check the underside of leaves and the stem tips for insects.'
    ],
    prevent: [
      'Scout weekly for aphids and whiteflies',
      'Keep ants away, because they protect sap-sucking insects',
      'Water at the base of the plant'
    ]
  },

  unclear: {
    name: 'Something is off, but it is not clear',
    tone: 'warn',
    summary: 'There are some colour changes, but not enough of a pattern to name the problem with confidence.',
    causes: [
      'Early stage of a disease',
      'Insect damage, sunburn or nutrient imbalance',
      'A photo that is too far away or in harsh light'
    ],
    steps: [
      'Retake the photo in daylight with one leaf filling the frame.',
      'Look at the underside of the leaf and the stem for insects, webbing or eggs.',
      'Compare with a healthy plant nearby and note what is different.',
      'Show the plant to your local agricultural extension officer.'
    ],
    prevent: [
      'Scout your field once a week',
      'Keep notes and photos so you can spot changes early'
    ]
  },

  curl: {
    name: 'Curling or twisted leaves',
    tone: 'warn',
    summary: 'Leaves roll, cup or twist. This is a stress signal, not one single disease.',
    causes: [
      'Sap-sucking pests: aphids, whiteflies, mites',
      'Leaf-curl virus, spread by whiteflies',
      'Heat or water stress',
      'Weedkiller drifting from a nearby field'
    ],
    steps: [
      'Turn leaves over and look for tiny insects or fine webbing.',
      'Spray neem oil or soapy water on the undersides of leaves in the evening.',
      'If new growth is twisted and stunted on many plants, remove the worst plants to protect the rest.',
      'Water deeply and regularly during hot spells.',
      'Ask neighbours whether anyone sprayed weedkiller nearby.'
    ],
    prevent: [
      'Control weeds that host whiteflies',
      'Use insect netting on seedbeds',
      'Mulch to keep roots cool and moist'
    ]
  },

  wilt: {
    name: 'Wilting plants',
    tone: 'bad',
    summary: 'The whole plant or a few branches droop even when there is enough water. This can mean root or stem disease.',
    causes: [
      'Dry soil or very hot weather (recovers at night)',
      'Root rot from waterlogged soil',
      'Fusarium or bacterial wilt',
      'Stem borers or root-knot nematodes'
    ],
    steps: [
      'Check soil moisture 5 cm down. If it is dry, water deeply and see if the plant recovers by morning.',
      'If the soil is wet and the plant still wilts, suspect root disease. Improve drainage.',
      'Cut a stem near the base. A brown ring inside or sticky white ooze points to bacterial wilt.',
      'Uproot and destroy infected plants. Do not replant the same crop in that spot.',
      'Ask your extension officer about resistant varieties and soil treatment.'
    ],
    prevent: [
      'Rotate with cereals for 3 or more seasons',
      'Use grafted or resistant seedlings',
      'Plant on raised beds in heavy soil'
    ]
  },

  soilRich: {
    name: 'Dark, humus-rich soil',
    tone: 'ok',
    clue: 85,
    summary: 'Dark brown to black soil usually means plenty of organic matter, which holds water and nutrients. Colour cannot show pH or nutrient levels, and wet soil also looks darker.',
    causes: [
      'Lots of decayed plant material (humus)',
      'Regular compost, manure or crop residue',
      'Or the soil is simply wet, which makes it look darker'
    ],
    steps: [
      'Keep adding compost, manure or crop residue every season.',
      'Do a soil test every one to two seasons to check pH and nutrients.',
      'Keep the soil covered with mulch or a cover crop.',
      'Avoid burning residues and avoid working the soil when it is wet.'
    ],
    prevent: [
      'Rotate crops, including legumes',
      'Limit tillage to protect soil structure',
      'Photograph dry soil for a fairer colour reading'
    ]
  },

  soilLoam: {
    name: 'Medium-brown, balanced-looking soil',
    tone: 'ok',
    clue: 68,
    summary: 'A mid-brown colour with no warning signs such as white crust, grey mottling or deep cracks. That is a good start, but colour cannot show pH or nutrient levels.',
    causes: [
      'A mix of sand, silt and clay with moderate organic matter',
      'No strong sign of waterlogging or salt'
    ],
    steps: [
      'Take a soil test to learn the real pH and nutrient levels.',
      'Squeeze a handful of slightly damp soil. It should hold together, then crumble when poked.',
      'Keep adding compost or manure to maintain structure.',
      'Rotate crops and mulch the surface.'
    ],
    prevent: [
      'Avoid leaving soil bare in the rainy or dry season',
      'Add organic matter every season',
      'Avoid working or walking on the soil when it is wet'
    ]
  },

  soilRed: {
    name: 'Red, iron-rich soil',
    tone: 'warn',
    clue: 45,
    summary: 'Red colour comes from iron oxides. These soils usually drain well but are often acidic, low in phosphorus and low in organic matter.',
    causes: [
      'Heavily weathered soil rich in iron',
      'Organic matter washed out by heat and heavy rain',
      'Acid conditions that lock up phosphorus'
    ],
    steps: [
      'Get a soil test for pH and phosphorus before buying inputs.',
      'If the pH is too low for your crop, apply agricultural lime or dolomite at the rate the test recommends.',
      'Mix in compost or manure to build organic matter.',
      'Apply a phosphorus fertiliser such as single superphosphate if the test shows a shortage.',
      'Grow legumes such as cowpea, groundnut or soybean and mulch the surface.'
    ],
    prevent: [
      'Make ridges across the slope to reduce erosion',
      'Keep the soil covered',
      'Retest every two to three seasons'
    ]
  },

  soilSandy: {
    name: 'Pale, sandy soil',
    tone: 'warn',
    clue: 38,
    summary: 'Light-coloured, loose soil that drains quickly. It holds little water or nutrients, so crops can dry out or go hungry.',
    causes: [
      'High sand content',
      'Low organic matter',
      'Nutrients washing down with rain or irrigation'
    ],
    steps: [
      'Mix in compost or well-rotted manure every season.',
      'Water little and often, and mulch to slow evaporation.',
      'Split fertiliser into several small doses instead of one large dose.',
      'Plant cover crops or legumes to build organic matter.',
      'Choose drought-tolerant crops such as cassava, millet or groundnut.'
    ],
    prevent: [
      'Never leave sandy soil bare',
      'Use windbreaks where wind blows the surface away',
      'Add organic matter every year'
    ]
  },

  soilWet: {
    name: 'Grey or bluish soil (waterlogged)',
    tone: 'warn',
    clue: 42,
    summary: 'Grey, bluish or mottled soil usually means water has sat in it for long periods, starving roots of air.',
    causes: [
      'Poor drainage or a high water table',
      'A compacted layer under the surface',
      'Flooding or heavy rain on clay soil'
    ],
    steps: [
      'Dig a hole about 30 cm deep. If water collects, or the soil smells like rotten eggs, drainage is the problem.',
      'Open drainage channels and plant on ridges or raised beds.',
      'Stay off the soil when it is wet to avoid compacting it more.',
      'Add organic matter to improve structure.',
      'If drainage cannot be fixed, grow water-tolerant crops such as rice or cocoyam.'
    ],
    prevent: [
      'Keep drains clear before the rains',
      'Avoid heavy machinery on wet ground',
      'Choose well-drained land for crops that hate wet roots'
    ]
  },

  soilSalt: {
    name: 'White crust (possible salt build-up)',
    tone: 'bad',
    clue: 25,
    summary: 'White crust or powder on the surface can be salts left behind when water evaporates. Too much salt stops roots taking up water. It can also be bright sand or fertiliser residue, so confirm with a test.',
    causes: [
      'Irrigating with salty water',
      'Poor drainage plus hot sun pulling salts to the surface',
      'Over-fertilising',
      'Coastal or low-lying land'
    ],
    steps: [
      'Ask an extension officer or lab to measure salinity (electrical conductivity) before you act.',
      'If the soil drains well, flush it with plenty of good-quality water.',
      'Mulch the surface to slow evaporation.',
      'Cut back on fertilisers that add salts.',
      'Grow salt-tolerant crops while you fix the problem.'
    ],
    prevent: [
      'Improve drainage',
      'Do not over-irrigate',
      'Use good-quality irrigation water'
    ]
  },

  soilCracked: {
    name: 'Cracked, hard-setting soil',
    tone: 'warn',
    clue: 40,
    summary: 'Wide cracks mean clay soil that shrinks as it dries, or a crusted and compacted surface. Cracks tear roots and let water escape.',
    causes: [
      'Clay-rich soil drying out',
      'Compaction from machinery, animals or tilling when wet',
      'Low organic matter',
      'A crust formed by heavy rain on bare soil'
    ],
    steps: [
      'Water deeply and slowly instead of light sprinkles.',
      'Mulch to stop the surface baking.',
      'Add compost or manure to loosen the structure.',
      'Do not till or walk on the soil when it is wet.',
      'Break a surface crust gently with a hoe before seedlings emerge.',
      'Ask your extension officer about gypsum if the soil may be sodic.'
    ],
    prevent: [
      'Keep the soil covered',
      'Grow deep-rooted cover crops',
      'Add organic matter every season'
    ]
  },

  soilAcid: {
    name: 'Acidic soil',
    tone: 'warn',
    summary: 'Low pH locks up phosphorus and other nutrients and can damage roots. Crops look yellow and stunted even when you fertilise.',
    causes: [
      'Heavy rain washing out calcium and magnesium',
      'Years of ammonium or urea fertilisers',
      'Naturally acid, weathered soils'
    ],
    steps: [
      'Test the pH with a kit or lab test.',
      'If it is too low for your crop, apply agricultural lime or dolomite as the test recommends and mix it into the top 15 cm.',
      'Wood ash raises pH slightly, but use it sparingly.',
      'Add compost and choose acid-tolerant crops such as cassava or cowpea while you correct it.'
    ],
    prevent: [
      'Retest the pH every two to three seasons',
      'Rotate with legumes',
      'Avoid using only acid-forming fertilisers'
    ]
  },

  soilCompact: {
    name: 'Compacted soil',
    tone: 'warn',
    summary: 'Soil packed so hard that roots and water cannot get through. Water ponds on the surface and roots stay shallow.',
    causes: [
      'Heavy machinery, animals or foot traffic',
      'Tilling or working the soil when it is wet',
      'Low organic matter'
    ],
    steps: [
      'Push a screwdriver or wire into the soil. If it stops at a hard layer, you have compaction.',
      'Loosen the layer with a fork or by deep ridging when the soil is moist, not wet.',
      'Grow deep-rooted cover crops to open the soil.',
      'Add compost and mulch.',
      'Keep traffic to fixed paths.'
    ],
    prevent: [
      'Avoid working wet soil',
      'Use permanent paths for animals and machines',
      'Keep organic matter high'
    ]
  },

  soilErosion: {
    name: 'Soil erosion and gullies',
    tone: 'bad',
    summary: 'Rain and wind are washing away the fertile topsoil. Once gullies start they grow fast.',
    causes: [
      'Bare soil on a slope',
      'Ploughing up and down the slope',
      'Burning or removing plant cover'
    ],
    steps: [
      'Make ridges and plant across the slope, not down it.',
      'Plant grass strips such as vetiver along the contour.',
      'Cover the soil with mulch or a cover crop.',
      'Fill small gullies with branches, stones and plants to slow the water.',
      'Stop burning residues.'
    ],
    prevent: [
      'Keep plant cover all year',
      'Terrace steep land',
      'Divert runoff water into safe channels'
    ]
  }
};


// ----- 3. COLOUR HELPERS -----
const C = { OTHER: 0, GREEN: 1, YELLOW: 2, BROWN: 3, RUST: 4, DARK: 5, WHITE: 6, SKIN: 7 };

const S = { OTHER: 0, DARK: 1, RED: 2, BROWN: 3, PALE: 4, GREY: 5, WHITE: 6, GREEN: 7 };
const CRACK_KIND = 9;

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: h, s: max ? d / max : 0, v: max };
}

function classifyPixel(r, g, b) {
  const hsv = rgbToHsv(r, g, b);
  const h = hsv.h, s = hsv.s, v = hsv.v;

  if (v < 0.14) return C.DARK;
  if (s < 0.12) return v > 0.8 ? C.WHITE : C.OTHER;
  if (h >= 68 && h <= 170 && s >= 0.18) return C.GREEN;
  if (h >= 40 && h < 68 && s >= 0.3 && v >= 0.4) return C.YELLOW;

  if (h >= 5 && h < 40) {
    if (v >= 0.45 && s >= 0.18 && s <= 0.6 && r > g && g > b) return C.SKIN;
    if (s >= 0.6 && v >= 0.55 && h <= 30) return C.RUST;
    if (s >= 0.25) return C.BROWN;
  }
  return C.OTHER;
}

function classifySoil(h, s, v) {
  if (h >= 68 && h <= 170 && s >= 0.18 && v > 0.2) return S.GREEN;
  if (v < 0.3) return S.DARK;
  if (v > 0.88 && s < 0.1) return S.WHITE;
  if (s < 0.14) return v < 0.7 ? S.GREY : S.PALE;
  if (h <= 55 || h >= 345) {
    if (s >= 0.58 && h <= 28) return S.RED;
    if (s < 0.38 && v >= 0.62) return S.PALE;
    return S.BROWN;
  }
  if (h >= 170 && h <= 260 && s < 0.4) return S.GREY;
  return S.OTHER;
}

const KIND_INFO = {};
KIND_INFO[C.BROWN]  = { label: 'Brown lesion',   color: '#ff7a3d' };
KIND_INFO[C.RUST]   = { label: 'Rust pustules',  color: '#ffb020' };
KIND_INFO[C.DARK]   = { label: 'Dark spot',      color: '#ff4d6d' };
KIND_INFO[C.WHITE]  = { label: 'Powdery patch',  color: '#7dd3fc' };
KIND_INFO[C.YELLOW] = { label: 'Yellowing area', color: '#f0e33a' };

const SOIL_MARKS = {};
SOIL_MARKS[S.WHITE]  = { label: 'White crust',    color: '#7dd3fc' };
SOIL_MARKS[S.GREY]   = { label: 'Grey mottling',  color: '#c4b5fd' };
SOIL_MARKS[CRACK_KIND] = { label: 'Crack',        color: '#ff7a3d' };

const SOIL_DOMINANT = {};
SOIL_DOMINANT[S.DARK]  = 'Dark topsoil';
SOIL_DOMINANT[S.RED]   = 'Red iron-rich soil';
SOIL_DOMINANT[S.BROWN] = 'Brown loam';
SOIL_DOMINANT[S.PALE]  = 'Pale sandy soil';
SOIL_DOMINANT[S.GREY]  = 'Grey soil';


// ----- 4. IMAGE ANALYSIS -----
function buildIntegral(mask, w, h) {
  const I = new Uint32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      I[(y + 1) * (w + 1) + x + 1] =
        mask[y * w + x] + I[y * (w + 1) + x + 1] + I[(y + 1) * (w + 1) + x] - I[y * (w + 1) + x];
    }
  }
  return I;
}

function boxSum(I, w, h, x, y, r) {
  const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r);
  const x1 = Math.min(w, x + r + 1), y1 = Math.min(h, y + r + 1);
  return I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
}

function boxMean(I, w, h, x, y, r) {
  const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r);
  const x1 = Math.min(w, x + r + 1), y1 = Math.min(h, y + r + 1);
  return boxSum(I, w, h, x, y, r) / ((x1 - x0) * (y1 - y0));
}

function detailScore(lum, w, h) {
  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w];
      sum += l; sumSq += l * l; count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function findClusters(mask, kindOf, w, h) {
  const seen = new Uint8Array(w * h);
  const clusters = [];
  const stack = [];

  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue;

    let size = 0, sx = 0, sy = 0;
    const kinds = {};
    stack.push(start);
    seen[start] = 1;

    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      size++; sx += x; sy += y;
      kinds[kindOf[p]] = (kinds[kindOf[p]] || 0) + 1;

      const neighbours = [];
      if (x > 0) neighbours.push(p - 1);
      if (x < w - 1) neighbours.push(p + 1);
      if (y > 0) neighbours.push(p - w);
      if (y < h - 1) neighbours.push(p + w);
      for (let n = 0; n < neighbours.length; n++) {
        const q = neighbours[n];
        if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }

    if (size >= 4) {
      const kind = Number(Object.keys(kinds).sort(function (a, b) { return kinds[b] - kinds[a]; })[0]);
      clusters.push({ size: size, kind: kind, x: (sx / size + 0.5) / w, y: (sy / size + 0.5) / h });
    }
  }
  return clusters.sort(function (a, b) { return b.size - a.size; });
}

const clamp = function (n, lo, hi) { return Math.min(hi, Math.max(lo, n)); };

const REJECTIONS = {
  dark: {
    title: 'Too dark to read',
    message: 'The photo is too dark for me to see colours properly.',
    tip: 'Move into daylight or into the shade of your hand, and avoid flash.'
  },
  blank: {
    title: 'Nothing to look at',
    message: 'The photo is almost one flat colour.',
    tip: 'Check that your finger is not over the lens, then focus on a leaf or on bare soil.'
  },
  hand: {
    title: 'That looks like a hand, not a leaf or soil',
    message: 'Most of this photo looks like skin tone.',
    tip: 'Keep your hand out of the frame. Lay the leaf flat on a plain surface, or photograph the soil on the ground.'
  },
  notPlant: {
    title: "I can't see a plant leaf here",
    message: 'I could not find enough green leaf tissue in this photo.',
    tip: 'Fill the frame with one leaf in good light. If you are photographing soil, tap Soil above.'
  },
  plantsNotSoil: {
    title: 'That looks like plants, not soil',
    message: 'I can see a lot of green leaves in this photo.',
    tip: 'Push the leaves aside and photograph the bare ground, or tap Crop leaf above.'
  },
  notSoil: {
    title: "I can't see soil here",
    message: 'I could not find enough soil colours (brown, red, grey or sand) in this photo.',
    tip: 'Dig a small hole and photograph the fresh side, or a patch of bare ground, in daylight with nothing else in the frame.'
  },
  nothing: {
    title: "I can't see a leaf or soil",
    message: 'This photo does not look like a plant leaf or bare soil.',
    tip: 'For a leaf, fill the frame with one leaf. For soil, photograph a patch of bare ground in daylight.'
  }
};

function rejection(key) {
  const r = REJECTIONS[key];
  return { ok: false, code: key, title: r.title, message: r.message, tip: r.tip };
}

function makePhoto(data, w, h) {
  const n = w * h;
  const lum = new Float32Array(n);
  let brightness = 0;
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    brightness += Math.max(r, g, b) / 255;
  }
  brightness /= n;
  return { w: w, h: h, n: n, data: data, lum: lum, brightness: brightness, detail: detailScore(lum, w, h) };
}

function readPhoto(img) {
  const w = CONFIG.gridWidth;
  const h = Math.max(16, Math.round(w * img.naturalHeight / img.naturalWidth));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return makePhoto(ctx.getImageData(0, 0, w, h).data, w, h);
}

function leafClassify(p) {
  if (p.cls) return p;
  const cls = new Uint8Array(p.n);
  const counts = [0, 0, 0, 0, 0, 0, 0, 0];
  let yellowX = 0, yellowY = 0;
  for (let i = 0; i < p.n; i++) {
    const k = classifyPixel(p.data[i * 4], p.data[i * 4 + 1], p.data[i * 4 + 2]);
    cls[i] = k;
    counts[k]++;
    if (k === C.YELLOW) { yellowX += i % p.w; yellowY += (i / p.w) | 0; }
  }
  p.cls = cls; p.counts = counts; p.yellowX = yellowX; p.yellowY = yellowY;
  return p;
}

function analyseCrop(p) {
  leafClassify(p);
  const w = p.w, h = p.h, n = p.n, cls = p.cls, counts = p.counts;

  const greenShare = counts[C.GREEN] / n;
  const plantShare = (counts[C.GREEN] + counts[C.YELLOW]) / n;
  const skinShare = counts[C.SKIN] / n;

  if (greenShare < 0.05 || plantShare < 0.10) {
    return rejection(skinShare > 0.15 ? 'hand' : 'notPlant');
  }
  if (skinShare > 0.35 && greenShare < 0.15) return rejection('hand');

  const greenMask = new Uint8Array(n);
  for (let i = 0; i < n; i++) greenMask[i] = cls[i] === C.GREEN ? 1 : 0;
  const greenI = buildIntegral(greenMask, w, h);

  const lesionMask = new Uint8Array(n);
  const lesionCount = {};
  lesionCount[C.BROWN] = 0; lesionCount[C.RUST] = 0; lesionCount[C.DARK] = 0; lesionCount[C.WHITE] = 0;

  for (let i = 0; i < n; i++) {
    const k = cls[i];
    if (k !== C.BROWN && k !== C.RUST && k !== C.DARK && k !== C.WHITE) continue;
    if (boxSum(greenI, w, h, i % w, (i / w) | 0, 3) >= 3) {
      lesionMask[i] = 1;
      lesionCount[k]++;
    }
  }

  const lesionTotal = lesionCount[C.BROWN] + lesionCount[C.RUST] + lesionCount[C.DARK] + lesionCount[C.WHITE];
  const leaf = counts[C.GREEN] + counts[C.YELLOW] + lesionTotal;

  const share = {
    green: counts[C.GREEN] / leaf,
    yellow: counts[C.YELLOW] / leaf,
    brown: lesionCount[C.BROWN] / leaf,
    rust: lesionCount[C.RUST] / leaf,
    dark: lesionCount[C.DARK] / leaf,
    white: lesionCount[C.WHITE] / leaf
  };
  const lesionShare = lesionTotal / leaf;
  const affected = 1 - share.green;

  const clusters = findClusters(lesionMask, cls, w, h);
  const smallSpots = clusters.filter(function (c) { return c.size / leaf < 0.03; }).length;
  const biggest = clusters.length ? clusters[0].size / leaf : 0;

  const lesionI = buildIntegral(lesionMask, w, h);
  let yellowNearLesion = 0;
  for (let i = 0; i < n; i++) {
    if (cls[i] === C.YELLOW && boxSum(lesionI, w, h, i % w, (i / w) | 0, 2) > 0) yellowNearLesion++;
  }
  const halo = counts[C.YELLOW] ? yellowNearLesion / counts[C.YELLOW] : 0;

  const candidates = [];
  const add = function (id, score) {
    if (score > 0.15) candidates.push({ id: id, score: clamp(score, 0, 1) });
  };

  if (share.rust > 0.02) add('rust', share.rust * 9);
  if (share.white > 0.04) add('mildew', share.white * 7);
  if (share.dark > 0.03 && smallSpots >= 2) add('blackspot', share.dark * 8);
  if (share.brown + share.dark > 0.10 && biggest > 0.06) {
    add('blight', (share.brown + share.dark) * 3 + biggest * 2);
  }
  if (smallSpots >= 3 && share.brown > 0.02) {
    add(halo >= 0.5 ? 'bacterial' : 'leafspot', 0.4 + smallSpots * 0.05 + share.brown * 2);
  }
  if (share.yellow > 0.12) add('nutrient', share.yellow * 2.5 * (lesionShare < 0.05 ? 1 : 0.6));

  candidates.sort(function (a, b) { return b.score - a.score; });

  const isHealthy = affected < 0.06 && lesionShare < 0.03;
  let primary;
  if (isHealthy) primary = { id: 'healthy', score: 1 - affected * 5 };
  else if (candidates.length) primary = candidates[0];
  else primary = { id: 'unclear', score: 0.2 };

  const blurry = p.detail < 12;
  primary.confidence = clamp(0.40 + 0.5 * primary.score, 0.35, 0.93) * (blurry ? 0.85 : 1);

  const others = candidates.filter(function (c) { return c.id !== primary.id && c.score > 0.3; }).slice(0, 2);
  const severity = isHealthy ? 'none' : affected < 0.12 ? 'mild' : affected < 0.3 ? 'moderate' : 'severe';
  const health = clamp(Math.round((1 - affected * 1.5) * 100), 0, 100);

  const markers = clusters.slice(0, 7).map(function (c) {
    const info = KIND_INFO[c.kind];
    return { x: c.x, y: c.y, size: clamp(Math.sqrt(c.size / n) * 180, 7, 20), label: info.label, color: info.color };
  });
  if (share.yellow > 0.12 && counts[C.YELLOW] > 0) {
    const yi = KIND_INFO[C.YELLOW];
    markers.push({
      x: (p.yellowX / counts[C.YELLOW] + 0.5) / w,
      y: (p.yellowY / counts[C.YELLOW] + 0.5) / h,
      size: clamp(Math.sqrt(counts[C.YELLOW] / n) * 140, 12, 30),
      label: yi.label,
      color: yi.color
    });
  }

  return {
    ok: true, kind: 'crop', primary: primary, others: others, severity: severity,
    health: health, healthLabel: 'leaf health', markers: markers, blurry: blurry
  };
}

function analyseSoil(p) {
  const w = p.w, h = p.h, n = p.n;
  const cls = new Uint8Array(n);
  const counts = [0, 0, 0, 0, 0, 0, 0, 0];
  const sumX = [0, 0, 0, 0, 0, 0, 0, 0];
  const sumY = [0, 0, 0, 0, 0, 0, 0, 0];
  let skinTight = 0;

  for (let i = 0; i < n; i++) {
    const r = p.data[i * 4], g = p.data[i * 4 + 1], b = p.data[i * 4 + 2];
    const hsv = rgbToHsv(r, g, b);
    const k = classifySoil(hsv.h, hsv.s, hsv.v);
    cls[i] = k;
    counts[k]++;
    sumX[k] += i % w;
    sumY[k] += (i / w) | 0;
    if (hsv.h >= 8 && hsv.h <= 28 && hsv.s >= 0.2 && hsv.s <= 0.5 && hsv.v >= 0.62 && r > g && g > b) skinTight++;
  }

  const soilTotal = counts[S.DARK] + counts[S.RED] + counts[S.BROWN] + counts[S.PALE] + counts[S.GREY] + counts[S.WHITE];

  if (counts[S.GREEN] / n > 0.4) return rejection('plantsNotSoil');
  if (skinTight / n > 0.5 && p.detail < 8) return rejection('hand');
  if (soilTotal / n < 0.6) return rejection('notSoil');
  if ((counts[S.PALE] + counts[S.WHITE]) / n > 0.8 && p.detail < 8) return rejection('notSoil');

  const share = {
    dark: counts[S.DARK] / soilTotal,
    red: counts[S.RED] / soilTotal,
    brown: counts[S.BROWN] / soilTotal,
    pale: counts[S.PALE] / soilTotal,
    grey: counts[S.GREY] / soilTotal,
    white: counts[S.WHITE] / soilTotal
  };

  const lumInt = new Uint16Array(n);
  for (let i = 0; i < n; i++) lumInt[i] = Math.round(p.lum[i]);
  const lumI = buildIntegral(lumInt, w, h);

  const markMask = new Uint8Array(n);
  const markKind = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (cls[i] === S.WHITE || cls[i] === S.GREY) { markMask[i] = 1; markKind[i] = cls[i]; }
  }
  let crackCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (cls[i] === S.OTHER || cls[i] === S.GREEN) continue;
      const mean = boxMean(lumI, w, h, x, y, 4);
      if (mean > 60 && p.lum[i] < mean * 0.7) {
        markMask[i] = 1; markKind[i] = CRACK_KIND; crackCount++;
      }
    }
  }
  const crackShare = crackCount / soilTotal;

  const candidates = [];
  const add = function (id, score) {
    if (score > 0.15) candidates.push({ id: id, score: clamp(score, 0, 1) });
  };

  if (share.white > 0.04) add('soilSalt', share.white * 6);
  if (share.grey > 0.18) add('soilWet', share.grey * 3);
  if (share.red > 0.4) add('soilRed', share.red * 1.5);
  if (share.pale > 0.45) add('soilSandy', share.pale * 1.4);
  if (share.dark > 0.45) add('soilRich', share.dark * 1.5);
  if (crackShare > 0.07) add('soilCracked', crackShare * 6);
  if (share.brown > 0.35) add('soilLoam', 0.35 + share.brown * 0.5);

  candidates.sort(function (a, b) { return b.score - a.score; });

  const primary = candidates.length ? candidates[0] : { id: 'soilLoam', score: 0.3 };
  const blurry = p.detail < 12;
  primary.confidence = clamp(0.35 + 0.4 * primary.score, 0.35, 0.8) * (blurry ? 0.9 : 1);

  const others = candidates.filter(function (c) { return c.id !== primary.id && c.score > 0.3; }).slice(0, 2);

  const clusters = findClusters(markMask, markKind, w, h);
  const markers = clusters.slice(0, 5).map(function (c) {
    const info = SOIL_MARKS[c.kind];
    return { x: c.x, y: c.y, size: clamp(Math.sqrt(c.size / n) * 180, 7, 20), label: info.label, color: info.color };
  });

  let dominant = S.BROWN;
  [S.DARK, S.RED, S.BROWN, S.PALE, S.GREY].forEach(function (k) {
    if (counts[k] > counts[dominant]) dominant = k;
  });
  markers.push({
    x: (sumX[dominant] / counts[dominant] + 0.5) / w,
    y: (sumY[dominant] / counts[dominant] + 0.5) / h,
    size: 16,
    label: SOIL_DOMINANT[dominant],
    color: '#ffe066'
  });

  return {
    ok: true, kind: 'soil', primary: primary, others: others, severity: 'none',
    health: DISEASES[primary.id].clue, healthLabel: 'soil clue', markers: markers, blurry: blurry
  };
}

function analyse(img, mode) {
  const p = readPhoto(img);
  return analysePhoto(p, mode);
}

function analysePhoto(p, mode) {
  if (p.brightness < 0.12) return rejection('dark');
  if (p.detail < 2) return rejection('blank');

  if (mode === 'crop') return analyseCrop(p);
  if (mode === 'soil') return analyseSoil(p);

  leafClassify(p);
  const greenShare = p.counts[C.GREEN] / p.n;
  const plantShare = (p.counts[C.GREEN] + p.counts[C.YELLOW]) / p.n;
  if (greenShare >= 0.12 && plantShare >= 0.2) return analyseCrop(p);

  const soil = analyseSoil(p);
  if (soil.ok) return soil;
  if (greenShare >= 0.05 && plantShare >= 0.1) return analyseCrop(p);
  if (soil.code === 'notSoil') return rejection('nothing');
  return soil;
}

async function askServerModel(blob) {
  if (!CONFIG.aiEndpoint) return null;
  try {
    const form = new FormData();
    form.append('image', blob);
    const res = await fetch(CONFIG.aiEndpoint, { method: 'POST', body: form });
    if (!res.ok) return null;
    const json = await res.json();
    return DISEASES[json.diseaseId] ? json : null;
  } catch (err) {
    console.warn('AI server unavailable, using on-device analysis.', err);
    return null;
  }
}

// ----- 5. ACCOUNT & TRIAL LOCKING CONTROLS -----
const LIMITS = { guestScans: 2, guestChats: 2, historyMax: 20, maxAttempts: 5, lockSeconds: 30 };
const KEYS = {
  users: 'csd_users',
  session: 'csd_session',
  guestScans: 'csd_guest_scans',
  guestChats: 'csd_guest_chats',
  history: 'csd_history_'
};

const memoryStore = {};
const store = {
  get: function (key, fallback) {
    if (Object.prototype.hasOwnProperty.call(memoryStore, key)) return memoryStore[key];
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  },
  set: function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      delete memoryStore[key];
    } catch (err) {
      memoryStore[key] = value;
    }
  },
  remove: function (key) {
    delete memoryStore[key];
    try { localStorage.removeItem(key); } catch (err) { /* ignore */ }
  }
};

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function newSalt() {
  const bytes = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytesToB64(bytes);
}

function bestAlgo() {
  return window.crypto && window.crypto.subtle ? 'pbkdf2' : 'basic';
}

async function hashPassword(password, salt, algo) {
  if (algo === 'pbkdf2') {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await window.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: b64ToBytes(salt), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return bytesToB64(new Uint8Array(bits));
  }
  let h1 = 5381, h2 = 52711;
  const text = salt + password;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = ((h1 * 33) ^ code) >>> 0;
    h2 = ((h2 * 33) ^ code) >>> 0;
  }
  return h1.toString(16) + h2.toString(16);
}

function sameText(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function normEmail(email) { return String(email || '').trim().toLowerCase(); }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email); }
function passwordProblem(pw) {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Use both letters and numbers.';
  return '';
}

function getUsers() { return store.get(KEYS.users, {}); }

function currentUser() {
  const email = store.get(KEYS.session, null);
  if (!email) return null;
  const user = getUsers()[email];
  if (!user) { store.remove(KEYS.session); return null; }
  return user;
}

function isSignedIn() { return currentUser() !== null; }

// Interface locks ONLY after non-signed-in users exhaust their 2 free trials
function isLocked() {
  return !isSignedIn() && guestScansLeft() <= 0;
}

async function signUp(name, email, password, confirm) {
  name = String(name || '').trim();
  email = normEmail(email);
  if (name.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (!validEmail(email)) return { ok: false, error: 'Please enter a valid email address.' };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };
  if (password !== confirm) return { ok: false, error: 'The two passwords do not match.' };

  const users = getUsers();
  if (users[email]) return { ok: false, error: 'An account with this email already exists. Try signing in.' };

  const algo = bestAlgo();
  const salt = newSalt();
  users[email] = {
    name: name,
    email: email,
    salt: salt,
    algo: algo,
    hash: await hashPassword(password, salt, algo),
    created: Date.now()
  };
  store.set(KEYS.users, users);
  store.set(KEYS.session, email);
  return { ok: true, user: users[email] };
}

const loginAttempts = {};

async function signIn(email, password) {
  email = normEmail(email);
  const now = Date.now();
  const tries = loginAttempts[email] || { count: 0, until: 0 };
  if (tries.until > now) {
    return { ok: false, error: 'Too many tries. Wait ' + Math.ceil((tries.until - now) / 1000) + ' seconds and try again.' };
  }

  const user = getUsers()[email];
  let good = false;
  if (user) {
    const hash = await hashPassword(String(password || ''), user.salt, user.algo);
    good = sameText(hash, user.hash);
  }

  if (!good) {
    tries.count++;
    if (tries.count >= LIMITS.maxAttempts) { tries.count = 0; tries.until = now + LIMITS.lockSeconds * 1000; }
    loginAttempts[email] = tries;
    return { ok: false, error: 'Email or password is not right.' };
  }

  loginAttempts[email] = { count: 0, until: 0 };
  store.set(KEYS.session, email);
  return { ok: true, user: user };
}

function signOutUser() { store.remove(KEYS.session); }

function guestScansUsed() { return Number(store.get(KEYS.guestScans, 0)) || 0; }
function guestScansLeft() { return Math.max(0, LIMITS.guestScans - guestScansUsed()); }
function addGuestScan() { store.set(KEYS.guestScans, guestScansUsed() + 1); }

// Free questions for Ask EmsAgro and the voice assistant (separate from scans)
function guestChatsUsed() { return Number(store.get(KEYS.guestChats, 0)) || 0; }
function guestChatsLeft() { return Math.max(0, LIMITS.guestChats - guestChatsUsed()); }
function addGuestChat() { store.set(KEYS.guestChats, guestChatsUsed() + 1); }
function isChatLocked() { return !isSignedIn() && guestChatsLeft() <= 0; }

function updateAskQuota() {
  const n = document.getElementById('askQuota');
  if (!n) return;
  if (isSignedIn()) { n.hidden = true; return; }
  const left = guestChatsLeft();
  n.hidden = false;
  n.textContent = left > 0
    ? left + ' free question' + (left === 1 ? '' : 's') + ' left. Join free to keep asking.'
    : 'You have used your ' + LIMITS.guestChats + ' free questions. Join free to keep asking.';
}
function refreshAskGate() {
  try {
    updateAskQuota();
    if (isSignedIn() && ASK.locked) { ASK.locked = false; ASK.q = ''; renderAsk(); }
  } catch (e) { /* Ask panel not built yet */ }
}

function getHistory(email) { return store.get(KEYS.history + email, []); }

function saveHistoryEntry(email, entry) {
  const list = getHistory(email).filter(function (e) { return e.id !== entry.id; });
  list.unshift(entry);
  store.set(KEYS.history + email, list.slice(0, LIMITS.historyMax));
}

function makeThumb(img) {
  const w = 96;
  const h = Math.max(24, Math.round(w * img.naturalHeight / img.naturalWidth));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.6);
}

function saveCurrentScan() {
  const user = currentUser();
  if (!user || !lastScan) return;
  saveHistoryEntry(user.email, {
    id: lastScan.id,
    time: lastScan.id,
    kind: lastScan.res.kind,
    diseaseId: lastScan.res.primary.id,
    confidence: lastScan.res.primary.confidence,
    health: lastScan.res.health,
    healthLabel: lastScan.res.healthLabel,
    severity: lastScan.res.severity,
    thumb: lastScan.thumb
  });
  renderHistory();
}

const $ = function (id) { return document.getElementById(id); };

const el = {
  stage: $('stage'), status: $('status'), tag: $('stageTag'),
  modes: $('modes'),
  fileInput: $('fileInput'), captureInput: $('captureInput'),
  openCamera: $('openCamera'), pickFile: $('pickFile'),
  video: $('video'), snap: $('snap'), closeCamera: $('closeCamera'),
  preview: $('preview'), markers: $('markers'), again: $('again'),
  rejectThumb: $('rejectThumb'), rejectTitle: $('rejectTitle'),
  rejectMsg: $('rejectMsg'), rejectTip: $('rejectTip'), tryAgain: $('tryAgain'),
  results: $('results'), toast: $('toast'),
  tabs: $('guideTabs'), chips: $('symptomChips'), detail: $('symptomDetail'),
  account: $('account'), historyBody: $('historyBody'), historySub: $('historySub'),
  overlay: $('authOverlay'), authForm: $('authForm'), authTitle: $('authTitle'),
  authReason: $('authReason'), authClose: $('authClose'), authError: $('authError'),
  authTabs: $('authTabs'), fName: $('fName'), fEmail: $('fEmail'), fPass: $('fPass'),
  fConfirm: $('fConfirm'), fSubmit: $('fSubmit'), togglePass: $('togglePass')
};

let scanMode = 'auto';
let lastBlob = null;
let blobCounted = false;
let lastScan = null;
let guideSelected = null;

function statusFor(state) {
  if (state === 'idle') {
    if (scanMode === 'crop') return 'Waiting for a leaf photo';
    if (scanMode === 'soil') return 'Waiting for a soil photo';
    return 'Waiting for a leaf or soil photo';
  }
  const text = {
    camera: 'Camera on. Line up your leaf or soil and snap.',
    scanning: 'Scanning...',
    done: 'Scan complete. Tap a ring to see what it is.',
    rejected: "Couldn't read that photo"
  };
  return text[state];
}

function setState(state) {
  el.stage.dataset.state = state;
  el.status.textContent = statusFor(state);
}

function setKind(kind) {
  el.stage.dataset.kind = kind || '';
  el.tag.textContent = kind === 'soil' ? 'Soil sample' : kind === 'crop' ? 'Leaf specimen' : 'Specimen';
}

let toastTimer;
function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.toast.classList.remove('show'); }, 3500);
}

const sleep = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };

function resetScanner() {
  stopCamera();
  lastBlob = null;
  lastScan = null;
  blobCounted = false;
  el.markers.innerHTML = '';
  el.results.hidden = true;
  el.results.innerHTML = '';
  el.fileInput.value = '';
  el.captureInput.value = '';
  setKind(null);
  setState('idle');
}

function setMode(mode) {
  scanMode = mode;
  // Apply data-mode to document.body for full page visual and color transformations
  document.body.dataset.mode = mode;

  el.modes.querySelectorAll('.mode').forEach(function (b) {
    b.setAttribute('aria-checked', b.dataset.mode === mode ? 'true' : 'false');
  });
  const state = el.stage.dataset.state;
  if (state === 'idle') setState('idle');
  if (lastBlob && (state === 'done' || state === 'rejected')) handleBlob(lastBlob, true);
}

let stream = null;
let currentUrl = null;

async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    el.captureInput.click();
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false
    });
    el.video.srcObject = stream;
    await el.video.play();
    setState('camera');
  } catch (err) {
    toast('Camera is blocked. Choose a photo instead.');
    el.captureInput.click();
  }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
  stream = null;
  el.video.srcObject = null;
}

function snapPhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = el.video.videoWidth;
  canvas.height = el.video.videoHeight;
  canvas.getContext('2d').drawImage(el.video, 0, 0);
  canvas.toBlob(function (blob) {
    stopCamera();
    if (blob) handleBlob(blob);
  }, 'image/jpeg', 0.92);
}

function loadImage(url) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

async function handleBlob(blob, rerun) {
  // If non-signed-in guest attempts a 3rd scan, show signup popup
  if (!rerun && !isSignedIn() && guestScansLeft() <= 0) {
    openAuth('signup', 'You have used your ' + LIMITS.guestScans + ' free scans. Create a free account to keep scanning.');
    return;
  }
  el.markers.innerHTML = '';
  el.results.hidden = true;
  setKind(null);

  if (!blob.type.startsWith('image/')) {
    showRejection({
      title: 'That is not a photo',
      message: 'I can only read image files such as JPG or PNG.',
      tip: 'Choose a picture of a leaf or soil from your gallery or take a new one.'
    }, null);
    return;
  }
  if (blob.size > CONFIG.maxUploadMB * 1024 * 1024) {
    showRejection({
      title: 'Photo is too large',
      message: 'Please use a photo under ' + CONFIG.maxUploadMB + ' MB.',
      tip: 'Take the photo again at a lower quality, or crop it first.'
    }, null);
    return;
  }

  if (!rerun) { blobCounted = false; lastScan = null; }
  lastBlob = blob;
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(blob);

  let img;
  try {
    img = await loadImage(currentUrl);
  } catch (err) {
    showRejection({
      title: "I can't open that image",
      message: 'The file may be damaged or in a format this browser cannot show (some phones save HEIC).',
      tip: 'Take a new photo with the camera button, or save the picture as JPG.'
    }, null);
    return;
  }

  el.preview.src = currentUrl;
  el.stage.style.setProperty('--scan-ms', (reduceMotion ? 300 : CONFIG.scanMs) + 'ms');
  setState('scanning');

  const started = performance.now();
  const result = analyse(img, scanMode);
  const server = result.ok && result.kind === 'crop' ? await askServerModel(blob) : null;

  const wait = (reduceMotion ? 300 : CONFIG.scanMs) - (performance.now() - started);
  if (wait > 0) await sleep(wait);

  if (!result.ok) {
    showRejection(result, currentUrl);
    return;
  }

  if (server) {
    result.primary = { id: server.diseaseId, confidence: clamp(server.confidence || 0.8, 0.3, 0.99) };
    result.others = [];
  }

  if (!lastScan) lastScan = { id: Date.now(), thumb: makeThumb(img), res: result };
  else lastScan.res = result;
  if (!isSignedIn() && !blobCounted) { addGuestScan(); blobCounted = true; renderAccount(); }
  saveCurrentScan();

  setKind(result.kind);
  setState('done');
  drawMarkers(result.markers);
  renderResult(result);
}

function showRejection(info, thumbUrl) {
  stopCamera();
  el.rejectTitle.textContent = info.title;
  el.rejectMsg.textContent = info.message;
  el.rejectTip.textContent = info.tip;
  if (thumbUrl) { el.rejectThumb.src = thumbUrl; el.rejectThumb.hidden = false; }
  else { el.rejectThumb.hidden = true; }
  setKind(null);
  setState('rejected');
}

function drawMarkers(markers) {
  el.markers.innerHTML = '';
  markers.forEach(function (m, i) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'marker';
    btn.style.left = (m.x * 100) + '%';
    btn.style.top = (m.y * 100) + '%';
    btn.style.width = m.size + '%';
    btn.style.setProperty('--c', m.color);
    btn.style.setProperty('--d', (reduceMotion ? 0 : 0.15 * i) + 's');
    btn.setAttribute('aria-label', m.label);
    btn.innerHTML = '<span class="label">' + m.label + '</span>';
    el.markers.appendChild(btn);
  });
}

function lockedBlock(title, lines, extraClass) {
  let bars = '';
  for (let i = 0; i < lines; i++) bars += '<span class="ghost-line"></span>';
  return '' +
    '<div class="block locked ' + extraClass + '">' +
      '<h3>' + title + '</h3>' +
      '<div class="ghost">' + bars + '</div>' +
      '<div class="lock-cta">' +
        '<strong>Free account needed</strong>' +
        '<p>Sign up in under a minute to unlock this part and save your scans.</p>' +
        '<button type="button" class="btn primary" data-auth="signup">Unlock the full plan</button>' +
      '</div>' +
    '</div>';
}

function adviceHTML(d, locked) {
  const causes = d.causes.map(function (c) { return '<li>' + c + '</li>'; }).join('');
  const causesBlock = '<div class="block"><h3>Likely causes</h3><ul>' + causes + '</ul></div>';

  if (locked) {
    return '<div class="advice">' + causesBlock +
      lockedBlock('What to do now', d.steps.length, '') +
      lockedBlock('Keep it from coming back', d.prevent.length, 'prevent') +
      '</div>';
  }

  const steps = d.steps.map(function (s) {
    return '<li><label><input type="checkbox"><span>' + s + '</span></label></li>';
  }).join('');
  const prevent = d.prevent.map(function (p) { return '<li>' + p + '</li>'; }).join('');

  return '' +
    '<div class="advice">' + causesBlock +
      '<div class="block"><h3>What to do now</h3>' +
        '<ul class="todo">' + steps + '</ul>' +
        '<div class="progress">' +
          '<span><b data-done>0</b> of ' + d.steps.length + ' steps done</span>' +
          '<div class="track"><span class="fill"></span></div>' +
        '</div>' +
      '</div>' +
      '<div class="block prevent"><h3>Keep it from coming back</h3><ul>' + prevent + '</ul></div>' +
    '</div>';
}

function renderResult(res, opts) {
  opts = opts || {};
  const d = DISEASES[res.primary.id];
  const isSoil = res.kind === 'soil';
  const pct = Math.round(res.primary.confidence * 100);

  // Check locking state dynamically based on guest limits
  const locked = isLocked();

  const kindPill = '<span class="pill">' + (isSoil ? 'Soil scan' : 'Crop scan') + '</span>';
  const savedPill = opts.savedTime
    ? '<span class="pill">Saved ' + new Date(opts.savedTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + '</span>'
    : '';
  const estPill = isSoil ? '<span class="pill">Colour-based estimate</span>' : '';
  const severityPill = res.severity === 'none' ? '' : '<span class="pill">Severity: ' + res.severity + '</span>';
  const blurryPill = res.blurry ? '<span class="pill">Photo is a bit blurry</span>' : '';
  const others = res.others.length
    ? '<p class="also"><strong>Also possible:</strong> ' +
      res.others.map(function (o) { return DISEASES[o.id].name; }).join(', ') + '</p>'
    : '';

  const disclaimer = isSoil
    ? 'Soil colour is only a clue. It cannot show pH, nutrients or salt levels, and wet soil looks darker than dry soil. ' +
      'Take a soil test or ask your extension officer before buying lime or fertiliser.'
    : 'This is a first guess from the colours and patterns in your photo. Confirm with a local extension officer ' +
      'before spraying a large area. When you use chemicals, wear gloves and a mask, follow the label, and keep ' +
      'them away from children, animals and water sources.';

  el.results.dataset.kind = res.kind;
  
  // Set data-locked attribute to control the blur overlay conditionally in CSS
  el.results.dataset.locked = locked ? 'true' : 'false';

  el.results.innerHTML = '' +
    '<div class="verdict" data-tone="' + d.tone + '">' +
      '<div class="ring" role="img" aria-label="' + res.healthLabel + ' ' + res.health + ' percent">' +
        '<svg viewBox="0 0 120 120">' +
          '<circle class="track" cx="60" cy="60" r="52"></circle>' +
          '<circle class="bar" cx="60" cy="60" r="52"></circle>' +
        '</svg>' +
        '<div class="num"><span id="healthNum">0</span><small>' + res.healthLabel + '</small></div>' +
      '</div>' +
      '<div>' +
        '<h2>' + d.name + '</h2>' +
        '<p class="summary">' + d.summary + '</p>' +
        '<div class="pills">' +
          kindPill + '<span class="pill">Confidence ' + pct + '%</span>' + estPill + severityPill + blurryPill + savedPill +
        '</div>' +
      '</div>' +
    '</div>' +
    others +
    adviceHTML(d, locked) +
    weatherNote(res.primary.id) +
    '<p class="disclaimer">' + disclaimer + '</p>';

  el.results.hidden = false;

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      const bar = el.results.querySelector('.bar');
      bar.style.strokeDashoffset = 327 * (1 - res.health / 100);
      countUp($('healthNum'), res.health);
    });
  });

  if (!opts.noScroll) {
    el.results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    el.results.focus({ preventScroll: true });
  }
}

function countUp(node, target) {
  if (reduceMotion) { node.textContent = target; return; }
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    node.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.addEventListener('change', function (event) {
  if (!event.target.matches('.todo input')) return;
  const advice = event.target.closest('.advice');
  const boxes = advice.querySelectorAll('.todo input');
  const done = advice.querySelectorAll('.todo input:checked').length;
  advice.querySelector('[data-done]').textContent = done;
  advice.querySelector('.fill').style.width = (done / boxes.length * 100) + '%';
});

function escapeHTML(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, function (c) { return map[c]; });
}

function firstName(name) { return String(name).trim().split(' ')[0]; }

function renderAccount() {
  refreshAskGate();
  const user = currentUser();
  if (user) {
    el.account.innerHTML =
      '<span class="hello">Hi, ' + escapeHTML(firstName(user.name)) + '</span>' +
      '<a class="mini-link" href="#history">My scans</a>' +
      '<button type="button" class="btn ghost small" id="signOutBtn">Sign out</button>';
    return;
  }
  const left = guestScansLeft();
  el.account.innerHTML =
    '<span class="quota' + (left === 0 ? ' empty' : '') + '">' + left + ' free scan' + (left === 1 ? '' : 's') + ' left</span>' +
    '<button type="button" class="btn ghost small" data-auth="signin">Sign in</button>' +
    '<button type="button" class="btn primary small" data-auth="signup">Join free</button>';
}

function renderHistory() {
  const user = currentUser();
  el.historyBody.innerHTML = '';

  if (!user) {
    el.historySub.textContent = 'Create a free account and every scan is saved here.';
    const teaser = document.createElement('div');
    teaser.className = 'teaser';
    teaser.innerHTML =
      '<p>Your scan history is private to your account. Sign up to keep a record of what you found, ' +
      'compare fields over time, and revisit treatment plans.</p>' +
      '<button type="button" class="btn primary" data-auth="signup">Create free account</button>';
    el.historyBody.appendChild(teaser);
    return;
  }

  const list = getHistory(user.email).filter(function (e) { return DISEASES[e.diseaseId]; });
  if (!list.length) {
    el.historySub.textContent = 'Nothing saved yet.';
    const empty = document.createElement('p');
    empty.className = 'placeholder';
    empty.textContent = 'Scan a leaf or some soil and it will appear here.';
    el.historyBody.appendChild(empty);
    return;
  }

  el.historySub.textContent = list.length + ' saved scan' + (list.length === 1 ? '' : 's') + ' on this device.';
  const grid = document.createElement('div');
  grid.className = 'history-grid';

  list.forEach(function (entry) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'hcard';

    const img = document.createElement('img');
    img.alt = '';
    img.src = String(entry.thumb || '');

    const name = document.createElement('span');
    name.className = 'hname';
    name.textContent = DISEASES[entry.diseaseId].name;

    const meta = document.createElement('span');
    meta.className = 'hmeta';
    meta.textContent = (entry.kind === 'soil' ? 'Soil' : 'Crop') + ' \u00b7 ' +
      new Date(entry.time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' \u00b7 ' +
      Math.round(entry.confidence * 100) + '%';

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(meta);
    card.addEventListener('click', function () { viewHistory(entry); });
    grid.appendChild(card);
  });

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'btn ghost small';
  clear.id = 'clearHistory';
  clear.textContent = 'Clear history';

  el.historyBody.appendChild(grid);
  el.historyBody.appendChild(clear);
}

function viewHistory(entry) {
  renderResult({
    ok: true,
    kind: entry.kind,
    primary: { id: entry.diseaseId, confidence: entry.confidence },
    others: [],
    severity: entry.severity || 'none',
    health: entry.health,
    healthLabel: entry.healthLabel,
    markers: [],
    blurry: false
  }, { savedTime: entry.time });
}

let authMode = 'signup';
let lastFocus = null;

function setAuthMode(mode) {
  authMode = mode;
  el.authForm.dataset.mode = mode;
  el.authTabs.querySelectorAll('.auth-tab').forEach(function (t) {
    t.setAttribute('aria-selected', t.dataset.tab === mode ? 'true' : 'false');
  });
  el.authTitle.textContent = mode === 'signup' ? 'Create your free account' : 'Welcome back';
  el.fSubmit.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  el.fPass.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  el.authError.textContent = '';
}

function openAuth(mode, reason) {
  setAuthMode(mode === 'signin' ? 'signin' : 'signup');
  el.authReason.textContent = reason || '';
  el.authReason.hidden = !reason;
  lastFocus = document.activeElement;
  el.overlay.hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(function () {
    (authMode === 'signup' ? el.fName : el.fEmail).focus();
  }, 50);
}

function closeAuth() {
  el.overlay.hidden = true;
  document.body.classList.remove('modal-open');
  el.authError.textContent = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function refreshLocks() {
  if (lastScan && !el.results.hidden && el.results.dataset.kind) {
    renderResult(lastScan.res, { noScroll: true });
  }
  renderGuideDetail();
}

function afterAuthChange(user, isNew) {
  saveCurrentScan();
  renderAccount();
  renderHistory();
  refreshLocks();
  toast(isNew ? 'Welcome, ' + firstName(user.name) + '! Your account is ready.' : 'Welcome back, ' + firstName(user.name) + '.');
}

function doSignOut() {
  signOutUser();
  resetScanner();
  renderAccount();
  renderHistory();
  renderGuideDetail();
  toast('You are signed out.');
}

const SYMPTOMS = [
  { group: 'crop', label: 'Yellow leaves', id: 'nutrient' },
  { group: 'crop', label: 'Brown spots', id: 'leafspot' },
  { group: 'crop', label: 'Spots with yellow rings', id: 'bacterial' },
  { group: 'crop', label: 'Large brown or black patches', id: 'blight' },
  { group: 'crop', label: 'Orange powder', id: 'rust' },
  { group: 'crop', label: 'White powder', id: 'mildew' },
  { group: 'crop', label: 'Black sooty film', id: 'blackspot' },
  { group: 'crop', label: 'Curling leaves', id: 'curl' },
  { group: 'crop', label: 'Wilting plant', id: 'wilt' },

  { group: 'soil', label: 'Dry, cracked ground', id: 'soilCracked' },
  { group: 'soil', label: 'Water stands after rain', id: 'soilWet' },
  { group: 'soil', label: 'Hard soil, roots cannot enter', id: 'soilCompact' },
  { group: 'soil', label: 'Pale sand that dries fast', id: 'soilSandy' },
  { group: 'soil', label: 'White crust on the ground', id: 'soilSalt' },
  { group: 'soil', label: 'Red soil with poor yields', id: 'soilRed' },
  { group: 'soil', label: 'Yellow, stunted crops', id: 'soilAcid' },
  { group: 'soil', label: 'Topsoil washing away', id: 'soilErosion' }
];

let guideGroup = 'crop';

function renderGuideDetail() {
  if (!guideSelected) {
    el.detail.innerHTML = '<p class="placeholder">Choose a symptom above.</p>';
    return;
  }
  const d = DISEASES[guideSelected];
  el.detail.innerHTML = '<h3>' + d.name + '</h3><p>' + d.summary + '</p>' + adviceHTML(d, isLocked());
}

function showSymptoms(group) {
  guideGroup = group;
  el.tabs.querySelectorAll('.tab').forEach(function (t) {
    t.setAttribute('aria-selected', t.dataset.group === group ? 'true' : 'false');
  });
  el.chips.innerHTML = '';
  guideSelected = null;
  renderGuideDetail();

  SYMPTOMS.filter(function (s) { return s.group === group; }).forEach(function (s) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = s.label;
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', function () {
      el.chips.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      guideSelected = s.id;
      renderGuideDetail();
    });
    el.chips.appendChild(chip);
  });
}

el.openCamera.addEventListener('click', openCamera);
el.pickFile.addEventListener('click', function () { el.fileInput.click(); });
el.snap.addEventListener('click', snapPhoto);
el.closeCamera.addEventListener('click', function () { stopCamera(); setState('idle'); });
el.again.addEventListener('click', resetScanner);
el.tryAgain.addEventListener('click', resetScanner);

el.modes.querySelectorAll('.mode').forEach(function (b) {
  b.addEventListener('click', function () { setMode(b.dataset.mode); });
});

el.tabs.querySelectorAll('.tab').forEach(function (t) {
  t.addEventListener('click', function () { showSymptoms(t.dataset.group); });
});

[el.fileInput, el.captureInput].forEach(function (input) {
  input.addEventListener('change', function () {
    if (input.files && input.files[0]) handleBlob(input.files[0]);
  });
});

el.stage.addEventListener('dragover', function (e) { e.preventDefault(); el.stage.classList.add('dragging'); });
el.stage.addEventListener('dragleave', function () { el.stage.classList.remove('dragging'); });
el.stage.addEventListener('drop', function (e) {
  e.preventDefault();
  el.stage.classList.remove('dragging');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) handleBlob(e.dataTransfer.files[0]);
});

if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
  el.stage.addEventListener('pointermove', function (e) {
    if (el.stage.dataset.state !== 'idle') return;
    const box = el.stage.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    el.stage.style.setProperty('--ry', (x * 6) + 'deg');
    el.stage.style.setProperty('--rx', (-y * 6) + 'deg');
  });
  el.stage.addEventListener('pointerleave', function () {
    el.stage.style.setProperty('--rx', '0deg');
    el.stage.style.setProperty('--ry', '0deg');
  });
}

window.addEventListener('pagehide', stopCamera);

document.addEventListener('click', function (e) {
  const trigger = e.target.closest('[data-auth]');
  if (trigger) {
    e.preventDefault();
    openAuth(trigger.dataset.auth, '');
    return;
  }
  if (e.target.id === 'signOutBtn') { doSignOut(); return; }
  if (e.target.id === 'clearHistory') {
    const user = currentUser();
    if (user && window.confirm('Delete all saved scans on this device?')) {
      store.set(KEYS.history + user.email, []);
      renderHistory();
    }
  }
});

el.authClose.addEventListener('click', closeAuth);
el.overlay.addEventListener('click', function (e) { if (e.target === el.overlay) closeAuth(); });

el.authTabs.querySelectorAll('.auth-tab').forEach(function (t) {
  t.addEventListener('click', function () { setAuthMode(t.dataset.tab); });
});

el.togglePass.addEventListener('click', function () {
  const show = el.fPass.type === 'password';
  el.fPass.type = show ? 'text' : 'password';
  el.fConfirm.type = show ? 'text' : 'password';
  el.togglePass.textContent = show ? 'Hide password' : 'Show password';
});

el.authForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  el.authError.textContent = '';
  el.fSubmit.disabled = true;
  const result = authMode === 'signup'
    ? await signUp(el.fName.value, el.fEmail.value, el.fPass.value, el.fConfirm.value)
    : await signIn(el.fEmail.value, el.fPass.value);
  el.fSubmit.disabled = false;

  if (!result.ok) { el.authError.textContent = result.error; return; }
  const wasSignup = authMode === 'signup';
  el.authForm.reset();
  closeAuth();
  afterAuthChange(result.user, wasSignup);
});

document.addEventListener('keydown', function (e) {
  if (el.overlay.hidden) return;
  if (e.key === 'Escape') { closeAuth(); return; }
  if (e.key !== 'Tab') return;
  const items = Array.prototype.filter.call(
    el.overlay.querySelectorAll('button, input, a[href]'),
    function (n) { return !n.disabled && n.offsetParent !== null; }
  );
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

renderAccount();
renderHistory();
showSymptoms('crop');
setKind(null);
setState('idle');


// ===== WEATHER + NEWS =====
// Put your own GNews key here (https://gnews.io). The page still shows news without it.
const GNEWS_KEY = 'd7e062a8e3e48ebf3c8c1b3b22b428b3';
const WX_TTL = 10 * 60 * 1000;
const NEWS_TTL = 30 * 60 * 1000;
const WXK = { loc: 'csd_wx_loc', data: 'csd_wx_data', news: 'csd_news_' };
const WX = { loc: null, data: null };
let newsTopic = 'latest';
const NEWS_TOPICS = {
  latest: '(farming OR agriculture) AND Nigeria',
  weather: '(rainfall OR drought OR flood) AND farming',
  markets: '(fertilizer OR "food prices" OR "crop prices") AND Nigeria',
  tips: '("crop disease" OR "soil health" OR "farming tips")'
};
const NEWS_RSS = {
  latest: 'farming OR agriculture Nigeria',
  weather: 'rainfall OR drought OR flood farming',
  markets: 'fertilizer OR "food prices" OR "crop prices" Nigeria',
  tips: '"crop disease" OR "soil health" OR "farming tips"'
};
const NEWS_GDELT = {
  latest: '(farming OR agriculture) Nigeria sourcelang:english',
  weather: '(rainfall OR drought OR flood) farming sourcelang:english',
  markets: '(fertilizer OR "food prices" OR "crop prices") Nigeria sourcelang:english',
  tips: '("crop disease" OR "soil health" OR "farming tips") sourcelang:english'
};
let lastGdelt = 0;
const NEWS_WHY = [];

function skyOf(c) {
  if (c === 0 || c === 1) return 'clear';
  if (c === 45 || c === 48) return 'fog';
  if (c >= 95) return 'storm';
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
  return 'cloud';
}
function codeLabel(c) {
  if (c === 0) return 'Clear sky';
  if (c === 1) return 'Mostly clear';
  if (c === 2) return 'Partly cloudy';
  if (c === 3) return 'Overcast';
  if (c === 45 || c === 48) return 'Fog';
  if (c >= 51 && c <= 57) return 'Drizzle';
  if (c >= 61 && c <= 67) return 'Rain';
  if (c >= 80 && c <= 82) return 'Rain showers';
  if (c >= 95) return 'Thunderstorm';
  return 'Cloudy';
}
function iconFor(c, day) {
  const s = skyOf(c);
  if (s === 'clear') return day ? '☀️' : '🌙';
  if (s === 'fog') return '🌫️';
  if (s === 'rain') return '🌧️';
  if (s === 'storm') return '⛈️';
  return c === 2 && day ? '⛅' : '☁️';
}
function wxMsg(t) { $('wxMsg').textContent = t; }
function locKey(l) { return l.lat + ',' + l.lon; }

async function fetchWeather(loc) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon +
    '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
    '&hourly=soil_moisture_0_to_1cm,soil_temperature_0cm' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=auto&forecast_days=5';
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather');
  const j = await res.json();
  let i = j.hourly.time.indexOf(String(j.current.time).slice(0, 13) + ':00');
  if (i < 0) i = 0;
  return {
    t: Math.round(j.current.temperature_2m),
    rh: Math.round(j.current.relative_humidity_2m),
    wind: Math.round(j.current.wind_speed_10m),
    code: j.current.weather_code,
    day: j.current.is_day === 1,
    soilM: j.hourly.soil_moisture_0_to_1cm[i],
    soilT: j.hourly.soil_temperature_0cm[i],
    days: j.daily.time.map(function (d, k) {
      return { date: d, code: j.daily.weather_code[k], hi: Math.round(j.daily.temperature_2m_max[k]),
        lo: Math.round(j.daily.temperature_2m_min[k]), pop: j.daily.precipitation_probability_max[k] };
    }),
    at: Date.now()
  };
}

function rainSoon(w) {
  const s = skyOf(w.code);
  return s === 'rain' || s === 'storm' || (w.days[0].pop || 0) >= 60 || (w.days[1] && (w.days[1].pop || 0) >= 60);
}

function fieldAdvice(w) {
  const s = skyOf(w.code), tmr = w.days[1] || w.days[0];
  if (s === 'storm') return 'Thunderstorm now. Stay out of the open field and do not spray or apply fertiliser.';
  if (s === 'rain') return 'It is raining. Do not spray or spread fertiliser now, because rain washes it away. Check drainage on low ground.';
  if (w.wind >= 20) return 'It is windy (' + w.wind + ' km/h). Spray would drift, so wait for calmer air.';
  if ((tmr.pop || 0) >= 60) return 'Rain is likely tomorrow (' + tmr.pop + '% chance). Finish spraying or fertiliser today, or hold off until it passes.';
  if (w.t >= 34) return 'Very hot. Water early in the morning or evening, and spray only in the cool of the evening.';
  if (w.rh >= 80) return 'The air is very humid, so fungal diseases spread easily. Scout your leaves and keep them dry.';
  return 'Calm and fairly dry. A good window for field work or spraying, ideally early morning or evening.';
}

function weatherNote(id) {
  const w = WX.data;
  if (!w) return '';
  const fungal = { leafspot: 1, bacterial: 1, blight: 1, rust: 1, mildew: 1, blackspot: 1 };
  const wetSoil = { soilWet: 1, soilCompact: 1, soilErosion: 1 };
  const dryIssue = { soilSandy: 1, soilCracked: 1, wilt: 1, curl: 1 };
  const wet = rainSoon(w) || w.rh >= 80;
  let msg = '';
  if (fungal[id]) {
    msg = wet ? 'Wet, humid weather helps this spread. Treat as soon as the leaves are dry and repeat if rain returns.'
              : 'The weather is fairly dry, which slows the spread. Still treat early and keep the leaves dry.';
  } else if (wetSoil[id]) {
    msg = rainSoon(w) ? 'Rain is coming. Open drainage channels and make ridges before it arrives.'
                      : 'No heavy rain is due soon, so use this window to fix drainage and structure.';
  } else if (dryIssue[id]) {
    msg = rainSoon(w) ? 'Rain is due soon, so hold off on watering and plan mulching and compost for right after it.'
                      : 'Little rain is expected. Mulch and water deeply in the morning or evening.';
  }
  return msg ? '<p class="wx-note"><strong>Weather right now:</strong> ' + msg + '</p>' : '';
}

function paintWeather() {
  const w = WX.data, chip = $('wxChip'), body = $('wxBody');
  document.body.dataset.sky = w ? skyOf(w.code) : '';
  document.body.dataset.night = w && !w.day ? '1' : '0';
  if (!w) {
    chip.hidden = true;
    $('wxPlace').textContent = 'See what the sky means for your crops and soil.';
    body.innerHTML = '<p class="placeholder">Use your location or type a town to see your field weather.</p>';
    return;
  }
  const place = WX.loc.name;
  chip.hidden = false;
  chip.textContent = iconFor(w.code, w.day) + ' ' + w.t + '°C · ' + place.split(',')[0];
  $('wxPlace').textContent = 'Weather for ' + place + ' · updated ' +
    new Date(w.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const stat = function (label, value) { return '<div class="wx-stat"><b>' + value + '</b><small>' + label + '</small></div>'; };
  const days = w.days.map(function (d) {
    return '<div class="wx-day"><b>' + new Date(d.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }) +
      '</b><span class="wx-ico">' + iconFor(d.code, true) + '</span><span>' + d.hi + '° / ' + d.lo + '°</span><small>' +
      (d.pop == null ? '' : d.pop + '% rain') + '</small></div>';
  }).join('');
  body.innerHTML = '<div class="wx-card">' +
    '<div class="wx-now"><span class="wx-ico">' + iconFor(w.code, w.day) + '</span><span class="wx-big">' + w.t + '°C</span><span>' + codeLabel(w.code) + '</span></div>' +
    '<div class="wx-stats">' +
      stat('Humidity', w.rh + '%') + stat('Wind', w.wind + ' km/h') +
      stat('Rain chance today', (w.days[0].pop == null ? '--' : w.days[0].pop + '%')) +
      stat('Topsoil moisture (model estimate)', w.soilM == null ? '--' : Math.round(w.soilM * 100) + '%') +
      stat('Soil temperature', w.soilT == null ? '--' : Math.round(w.soilT) + '°C') +
    '</div>' +
    '<div class="wx-days">' + days + '</div>' +
    '<p class="wx-advice"><strong>Field advice:</strong> ' + fieldAdvice(w) + '</p>' +
  '</div>';
}

async function loadWeather(force) {
  if (!WX.loc) return;
  const cached = store.get(WXK.data, null);
  if (!force && cached && cached.key === locKey(WX.loc) && Date.now() - cached.w.at < WX_TTL) {
    WX.data = cached.w; paintWeather(); return;
  }
  try {
    WX.data = await fetchWeather(WX.loc);
    store.set(WXK.data, { key: locKey(WX.loc), w: WX.data });
    wxMsg('');
  } catch (err) {
    if (!WX.data || Date.now() - WX.data.at > 60 * 60 * 1000) { WX.data = null; wxMsg('Weather is unavailable right now. Please try again shortly.'); }
    else wxMsg('Could not refresh. Showing the last reading.');
  }
  paintWeather();
}

async function setLocation(loc) {
  WX.loc = loc;
  store.set(WXK.loc, loc);
  wxMsg('Loading weather...');
  await loadWeather(true);
}

function useGps() {
  if (!navigator.geolocation) { wxMsg('Location is not available here. Type your town instead.'); return; }
  wxMsg('Finding your location...');
  navigator.geolocation.getCurrentPosition(function (pos) {
    setLocation({ lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), name: 'Your location' });
  }, function () {
    wxMsg('Location was blocked. Type your town instead.');
  }, { timeout: 10000, maximumAge: 600000 });
}

async function searchTown(q) {
  q = String(q || '').trim();
  if (q.length < 2) { wxMsg('Type a town name.'); return; }
  wxMsg('Searching...');
  try {
    const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=' + encodeURIComponent(q));
    const j = await res.json();
    if (!j.results || !j.results.length) { wxMsg('Could not find that town. Try another spelling.'); return; }
    const p = j.results[0];
    setLocation({ lat: p.latitude, lon: p.longitude, name: p.name + (p.country ? ', ' + p.country : '') });
  } catch (err) {
    wxMsg('Could not search right now. Check your connection.');
  }
}

function paintNews(items) {
  const box = $('newsBody');
  if (!items.length) { box.innerHTML = '<p class="placeholder">No stories found for this topic right now.</p>'; return; }
  box.innerHTML = '<div class="news-grid">' + items.map(function (a) {
    const d = new Date(a.time);
    const when = isNaN(d) ? '' : ' · ' + d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const pic = a.image
      ? '<img src="' + escapeHTML(a.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">'
      : '';
    return '<a class="ncard" href="' + escapeHTML(a.url) + '" target="_blank" rel="noopener noreferrer">' + pic +
      '<div><b>' + escapeHTML(a.title) + '</b><small>' + escapeHTML(a.src) + when + '</small></div></a>';
  }).join('') + '</div>';
}

function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(function () { c.abort(); }, ms);
  return { signal: c.signal, done: function () { clearTimeout(t); } };
}

async function newsFromGdelt(topic) {
  // GDELT allows about one request every 5 seconds, so skip it if we asked very recently.
  if (Date.now() - lastGdelt < 5500) throw new Error('throttled');
  lastGdelt = Date.now();
  const t = withTimeout(12000);
  try {
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?mode=ArtList&format=json&maxrecords=25&sort=DateDesc&timespan=14d&query=' +
      encodeURIComponent(NEWS_GDELT[topic]);
    const res = await fetch(url, { signal: t.signal });
    if (!res.ok) throw new Error('gdelt ' + res.status);
    const raw = await res.text();
    let j;
    try { j = JSON.parse(raw); } catch (e) { throw new Error('gdelt bad reply'); }
    return (j.articles || []).map(function (a) {
      const d = String(a.seendate || '');
      const iso = /^\d{8}T\d{6}Z$/.test(d)
        ? d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8) + 'T' + d.slice(9, 11) + ':' + d.slice(11, 13) + ':' + d.slice(13, 15) + 'Z' : '';
      return { title: a.title, url: a.url, image: /^https:/.test(a.socialimage || '') ? a.socialimage : '',
        src: a.domain || 'GDELT', time: iso };
    });
  } finally { t.done(); }
}

async function newsFromGNews(topic) {
  if (!GNEWS_KEY || GNEWS_KEY.indexOf('PASTE') === 0) throw new Error('nokey');
  const t = withTimeout(10000);
  try {
    const res = await fetch('https://gnews.io/api/v4/search?q=' + encodeURIComponent(NEWS_TOPICS[topic]) +
      '&lang=en&max=10&apikey=' + encodeURIComponent(GNEWS_KEY), { signal: t.signal });
    if (!res.ok) throw new Error('gnews ' + res.status);
    const j = await res.json();
    return (j.articles || []).map(function (a) {
      return { title: a.title, url: a.url, image: /^https:/.test(a.image || '') ? a.image : '',
        src: (a.source && a.source.name) || '', time: a.publishedAt };
    });
  } finally { t.done(); }
}

async function newsFromRss(topic) {
  const t = withTimeout(12000);
  try {
    const feed = 'https://news.google.com/rss/search?q=' + encodeURIComponent(NEWS_RSS[topic] + ' when:14d') +
      '&hl=en-NG&gl=NG&ceid=NG:en';
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed), { signal: t.signal });
    if (!res.ok) throw new Error('rss ' + res.status);
    const j = await res.json();
    if (j.status !== 'ok') throw new Error('rss bad');
    return (j.items || []).map(function (a) {
      const title = String(a.title || '');
      const cut = title.lastIndexOf(' - ');
      return {
        title: cut > 0 ? title.slice(0, cut) : title,
        url: a.link,
        image: /^https:/.test(a.thumbnail || '') ? a.thumbnail : '',
        src: cut > 0 ? title.slice(cut + 3) : 'Google News',
        time: String(a.pubDate || '').replace(' ', 'T') + 'Z'
      };
    });
  } finally { t.done(); }
}

async function newsViaProxy(topic) {
  const feed = 'https://news.google.com/rss/search?q=' + encodeURIComponent(NEWS_RSS[topic] + ' when:14d') +
    '&hl=en-NG&gl=NG&ceid=NG:en';
  const proxies = [
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(feed),
    'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(feed)
  ];
  for (let i = 0; i < proxies.length; i++) {
    const t = withTimeout(12000);
    try {
      const res = await fetch(proxies[i], { signal: t.signal });
      if (!res.ok) throw new Error('status ' + res.status);
      const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
      const out = [];
      xml.querySelectorAll('item').forEach(function (n) {
        const get = function (tag) { const x = n.querySelector(tag); return x ? x.textContent : ''; };
        const title = get('title'), cut = title.lastIndexOf(' - ');
        out.push({ title: cut > 0 ? title.slice(0, cut) : title, url: get('link'), image: '',
          src: get('source') || (cut > 0 ? title.slice(cut + 3) : 'Google News'), time: get('pubDate') });
      });
      if (out.length) return out;
      NEWS_WHY.push('proxy ' + (i + 1) + ': no stories');
    } catch (e) {
      NEWS_WHY.push('proxy ' + (i + 1) + ': ' + (e.name === 'AbortError' ? 'timeout' : e.message));
    } finally { t.done(); }
  }
  return null;
}

async function loadNews(topic, force) {
  const box = $('newsBody');
  const cached = store.get(WXK.news + topic, null);
  if (!force && cached && cached.items && cached.items.length && Date.now() - cached.at < NEWS_TTL) { paintNews(cached.items); return; }
  box.innerHTML = '<p class="placeholder">Loading news...</p>';
  NEWS_WHY.length = 0;
  const steps = [newsFromGdelt, newsFromGNews, newsFromRss, newsViaProxy];
  let items = null;
  for (let i = 0; i < steps.length && (!items || !items.length); i++) {
    try { items = await steps[i](topic); }
    catch (e) { NEWS_WHY.push(steps[i].name + ': ' + (e.name === 'AbortError' ? 'timeout' : e.message)); items = null; }
  }
  if (!items || !items.length) {
    box.innerHTML = '<div class="teaser"><p>News is unavailable right now.</p><p><small>' +
      escapeHTML(NEWS_WHY.join(' | ') || 'No stories came back.') + '</small></p>' +
      '<button type="button" class="btn ghost small" id="newsRetry">Try again</button></div>';
    return;
  }
  const seen = {};
  items = items.filter(function (a) {
    if (!a.title || !/^https?:/.test(a.url || '') || seen[a.title]) return false;
    seen[a.title] = 1;
    return true;
  }).slice(0, 6);
  if (items.length) store.set(WXK.news + topic, { at: Date.now(), items: items });
  paintNews(items);
}

$('wxForm').addEventListener('submit', function (e) { e.preventDefault(); searchTown($('wxTown').value); });
$('wxGps').addEventListener('click', useGps);
$('newsBody').addEventListener('click', function (e) { if (e.target.id === 'newsRetry') loadNews(newsTopic, true); });
$('newsTabs').querySelectorAll('.tab').forEach(function (t) {
  t.addEventListener('click', function () {
    newsTopic = t.dataset.topic;
    $('newsTabs').querySelectorAll('.tab').forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
    loadNews(newsTopic);
  });
});

const savedLoc = store.get(WXK.loc, null);
if (savedLoc) {
  WX.loc = savedLoc;
  const c = store.get(WXK.data, null);
  if (c && c.key === locKey(savedLoc) && c.w) WX.data = c.w;
  paintWeather();
  loadWeather();
} else {
  paintWeather();
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then(function (p) { if (p.state === 'granted') useGps(); }).catch(function () {});
  }
}
setInterval(function () { loadWeather(true); }, WX_TTL);

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { loadNews(newsTopic); io.disconnect(); }
  }, { rootMargin: '300px' });
  io.observe($('news'));
} else {
  loadNews(newsTopic);
}


// ===== SKY SCENE (sun, moon, stars, clouds) =====
(function () {
  const sky = $('sky');
  if (!sky) return;
  let h = '<div class="orb sun"></div><div class="orb moon"></div>';
  for (let i = 0; i < 4; i++) h += '<div class="cl c' + i + '"></div>';
  for (let i = 0; i < 40; i++) {
    h += '<i class="star" style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' +
      (Math.random() * 65).toFixed(1) + '%;animation-delay:' + (Math.random() * 4).toFixed(1) + 's"></i>';
  }
  sky.insertAdjacentHTML('beforeend', h);
  function paint() {
    const d = new Date(), hr = d.getHours() + d.getMinutes() / 60, devDay = hr >= 6 && hr < 18;
    const day = (typeof WX !== 'undefined' && WX.data) ? WX.data.day : devDay;
    let p = day ? (hr - 6) / 12 : (hr >= 18 ? (hr - 18) / 12 : (hr + 6) / 12);
    if (day !== devDay) p = 0.5;
    p = Math.min(1, Math.max(0, p));
    sky.style.setProperty('--ox', (6 + 88 * p).toFixed(1) + '%');
    sky.style.setProperty('--oy', (80 - Math.sin(Math.PI * p) * 64).toFixed(1) + '%');
    document.body.dataset.phase = day ? 'day' : 'night';
  }
  paint();
  setInterval(paint, 60000);
  new MutationObserver(paint).observe(document.body, { attributes: true, attributeFilter: ['data-sky', 'data-night'] });
})();


// ===== ASK EMSAGRO (research / practical / community) =====
const TOPICS = [
  { id: 'amend', re: /stud(y|ies)|paper|evidence|trial|investigat|literature/,
    title: 'Finding studies on a soil amendment',
    science: ['Studies of amendments such as lime, gypsum, compost, manure and biochar differ in soil type, climate, crop, rate and length of trial, so a result in one place may not apply in another.',
      'Look for field trials in soils and climate similar to yours, and check how many seasons the trial lasted.',
      'Review papers and meta-analyses combine many trials and give a broader picture than a single study.'],
    practical: ['Search with the amendment name plus your crop, soil type and country, for example "biochar maize Nigeria".',
      'Prefer peer-reviewed papers and publications from agricultural research institutes.',
      'Discuss promising findings with your extension officer before changing your practice.'] },
  { id: 'maize', re: /(maize|corn).*(yellow|chlorosis|pale)|(yellow|chlorosis|pale).*(maize|corn)/,
    title: 'What causes yellowing in maize leaves?',
    science: ['Nitrogen shortage usually shows first on older, lower leaves as a yellow V-shape starting at the leaf tip along the midrib.',
      'Magnesium shortage causes yellow stripes between the veins, mostly on older leaves. Sulphur shortage tends to yellow the young upper leaves.',
      'Zinc shortage can cause pale or whitish bands on young leaves. Maize streak virus, spread by leafhoppers, causes broken yellow streaks along the veins.',
      'Waterlogging, drought, compaction and root damage can also yellow leaves because roots cannot take up nutrients.'],
    practical: ['Check which leaves are affected: older lower leaves point to nitrogen or magnesium, young upper leaves point to sulphur, zinc or iron.',
      'Look for broken yellow streaks and leafhoppers. If present, suspect maize streak virus and remove badly affected plants.',
      'For nitrogen hunger, side-dress with compost, manure or a nitrogen fertiliser at the label rate, split into two doses.',
      'Fix drainage or compaction if the soil is wet or hard, and confirm with a soil test or your extension officer.'] },
  { id: 'acid', re: /acid|\bph\b|lime\b|liming/,
    title: 'Why do some soils become acidic?',
    science: ['Heavy rain washes calcium, magnesium and potassium out of the topsoil, and acidic hydrogen and aluminium take their place on soil particles.',
      'Ammonium and urea fertilisers release acidity when soil microbes convert them to nitrate.',
      'Crops remove calcium, magnesium and potassium at harvest, and decaying organic matter releases organic acids.',
      'Old, highly weathered tropical soils have few reserves of these nutrients, so acidity builds up more easily.'],
    practical: ['Measure the pH with a kit or lab test before acting.',
      'If the pH is too low for your crop, apply agricultural lime or dolomite at the rate the test recommends.',
      'Add compost or manure, which helps buffer acidity.',
      'Rotate with legumes and avoid relying only on acid-forming fertilisers.'] },
  { id: 'om', re: /organic matter|humus|fertility/,
    title: 'How does organic matter influence soil fertility?',
    science: ['Organic matter binds soil particles into stable crumbs, which improves air movement, drainage and resistance to erosion.',
      'It holds water and increases the soil\'s ability to hold nutrients such as calcium, magnesium and potassium. This matters most in sandy and highly weathered soils.',
      'As microbes break it down they release nitrogen, phosphorus and sulphur in forms plants can use.',
      'Fresh residues with lots of carbon and little nitrogen, such as dry stalks, can temporarily tie up soil nitrogen while they decompose.'],
    practical: ['Return crop residues, compost or well-rotted manure every season.',
      'Keep the soil covered with mulch or a cover crop.',
      'Grow legumes in rotation to add nitrogen.',
      'Reduce tillage and avoid burning residues.',
      'On very poor soils organic matter may not replace fertiliser completely, so use a soil test.'] },
  { id: 'waste', re: /waste|residue|manure|compost|recycl|reuse|biochar|husk/,
    title: 'Benefits and risks of reusing agricultural waste',
    science: ['Benefits: it recycles nutrients and carbon into the soil, improves soil structure, reduces burning and dumping, and can cut fertiliser costs.',
      'Risks: fresh or poorly composted material can carry plant disease organisms and weed seeds, and can tie up soil nitrogen.',
      'Some wastes contain contaminants such as heavy metals, salts, or residues of veterinary drugs and pesticides, which can build up if applied repeatedly.',
      'Immature compost can harm seedlings, and uncontrolled heaps can attract pests and give off smells.'],
    practical: ['Compost residues and manure properly: mix green and dry material, keep it moist, and turn the heap so it heats up.',
      'Use only mature, dark, earthy-smelling compost near seedlings.',
      'Avoid waste from unknown or industrial sources unless it has been tested.',
      'Apply moderate amounts and watch how crops and soil respond.',
      'Do not put untreated manure on vegetables that are eaten raw.'] }
];

const DKEYS = [
  ['nutrient', ['yellow', 'chlorosis', 'pale leaf', 'no green']],
  ['leafspot', ['brown spot', 'spots', 'small spot']],
  ['bacterial', ['yellow ring', 'ring around', 'water soaked', 'water-soaked', 'bacteria']],
  ['blight', ['blight', 'black patch', 'large patch', 'brown patch', 'scorch']],
  ['rust', ['rust', 'orange powder', 'orange spot']],
  ['mildew', ['white powder', 'mildew', 'powdery', 'white coating']],
  ['blackspot', ['sooty', 'black film', 'soot', 'black spot']],
  ['curl', ['curl', 'twisted', 'leaf roll']],
  ['wilt', ['wilt', 'droop', 'dey die', 'dying plant']],
  ['soilCracked', ['crack']],
  ['soilWet', ['water stand', 'waterlog', 'flood', 'grey soil', 'bluish']],
  ['soilCompact', ['compact', 'hard soil', 'soil hard', 'roots cannot']],
  ['soilSandy', ['sandy', 'sand soil', 'dries fast', 'pale soil']],
  ['soilSalt', ['salt', 'white crust']],
  ['soilRed', ['red soil', 'laterite']],
  ['soilAcid', ['acid', 'low ph', 'stunted']],
  ['soilErosion', ['erosion', 'washing away', 'wash away', 'gully', 'topsoil', 'rain wash']]
];

// ----- Glossary: plain-language meanings so "what is X?" gets a real answer -----
const GLOSSARY = [
  { id: 'photosynthesis', terms: ['photosynthesis', 'photosynthesize', 'photosynthesise'], title: 'Photosynthesis',
    meaning: 'Photosynthesis is how plants make their own food. Leaves use chlorophyll to capture sunlight, then combine carbon dioxide from the air with water from the soil to make sugar (energy for growth) and release oxygen.',
    farm: 'Healthy green leaves, enough sunlight, water and nutrients such as nitrogen and magnesium keep photosynthesis strong. Yellow, spotted or shaded leaves make less food, so yields drop.' },
  { id: 'respiration', terms: ['respiration', 'plant respiration'], title: 'Respiration (in plants)',
    meaning: 'Respiration is how plants burn the sugar made in photosynthesis to release energy for growing, taking in oxygen and giving off carbon dioxide. It goes on day and night, in leaves and roots.',
    farm: 'Roots need air to respire. Waterlogged or compacted soil starves roots of oxygen, so they cannot take up water and nutrients. Good drainage and loose soil help.' },
  { id: 'transpiration', terms: ['transpiration', 'transpire'], title: 'Transpiration',
    meaning: 'Transpiration is water moving up through the plant and escaping as vapour through tiny pores (stomata) in the leaves. It pulls water and dissolved nutrients up from the roots and cools the leaf.',
    farm: 'Hot, dry, windy weather speeds it up, so plants can wilt even when soil is moist. Mulch and watering in the morning reduce water stress.' },
  { id: 'chlorophyll', terms: ['chlorophyll'], title: 'Chlorophyll',
    meaning: 'Chlorophyll is the green pigment in leaves that captures sunlight for photosynthesis. It needs nitrogen, magnesium and iron to be made.',
    farm: 'Pale or yellow leaves often mean less chlorophyll, which points to hunger for nitrogen, magnesium or iron, or to root or virus problems.' },
  { id: 'chlorosis', terms: ['chlorosis', 'chlorotic'], title: 'Chlorosis (yellowing)',
    meaning: 'Chlorosis is when leaves lose their green colour and turn pale or yellow because they are not making enough chlorophyll.',
    farm: 'Check which leaves yellow first. Old lower leaves usually mean nitrogen or magnesium, young leaves mean iron, sulphur or zinc. Wet soil and viruses can also cause it. Scan the leaf for a closer look.' },
  { id: 'nitrogen', terms: ['nitrogen', 'urea'], title: 'Nitrogen (N)',
    meaning: 'Nitrogen is the nutrient plants need most for leafy green growth. It is a building block of chlorophyll and proteins. Plants take it up from the soil as nitrate and ammonium.',
    farm: 'Shortage shows as even pale yellowing of the older, lower leaves and slow growth. Compost, manure, legumes in rotation, or split doses of fertiliser (such as urea) at the label rate supply it.' },
  { id: 'phosphorus', terms: ['phosphorus', 'phosphate'], title: 'Phosphorus (P)',
    meaning: 'Phosphorus helps roots grow, plants flower and seeds form, and moves energy around inside the plant.',
    farm: 'Shortage gives stunted plants, dark green or purplish leaves and poor flowering. It is locked up in very acid soils, so fix pH and add compost or a phosphate fertiliser near the roots.' },
  { id: 'potassium', terms: ['potassium', 'potash'], title: 'Potassium (K)',
    meaning: 'Potassium controls how plants use water and helps them resist disease and drought. It also improves fruit and grain quality.',
    farm: 'Shortage appears as yellow, then brown, scorched edges on older leaves. Wood ash, compost, manure or potash fertiliser can help.' },
  { id: 'npk', terms: ['npk', 'macronutrient', 'macronutrients'], title: 'NPK and macronutrients',
    meaning: 'NPK stands for nitrogen (N), phosphorus (P) and potassium (K), the three main nutrients plants need in large amounts. Calcium, magnesium and sulphur are also needed in fairly large amounts.',
    farm: 'The three numbers on a fertiliser bag, such as 15-15-15, show the percentage of each. Choose by soil test and crop stage rather than guessing.' },
  { id: 'micronutrient', terms: ['micronutrient', 'micronutrients', 'trace element', 'trace elements'], title: 'Micronutrients',
    meaning: 'Micronutrients such as iron, zinc, manganese, boron, copper and molybdenum are needed in very small amounts, but plants cannot grow well without them.',
    farm: 'Shortages show on young leaves as yellow between veins, pale bands or distorted growth. Compost and a soil test are the safest way to keep them in balance.' },
  { id: 'deficiency', terms: ['deficiency', 'nutrient deficiency', 'nutrient hunger'], title: 'Nutrient deficiency',
    meaning: 'A deficiency is when a plant cannot get enough of a nutrient it needs, either because the soil lacks it or because pH, waterlogging or damaged roots stop uptake.',
    farm: 'Look at where on the plant the symptom starts, old or young leaves, then match it to the nutrient. Confirm with a soil test before buying fertiliser.' },
  { id: 'ph', terms: ['ph', 'soil ph', 'ph level'], title: 'Soil pH',
    meaning: 'pH measures how acidic or alkaline the soil is on a scale of 0 to 14. Below 7 is acid, 7 is neutral, above 7 is alkaline. Most crops grow best between about 5.5 and 7.',
    farm: 'Wrong pH locks nutrients in the soil even when they are present. Test with a kit, then use lime to raise low pH or organic matter and sulphur-based products to lower high pH.' },
  { id: 'lime', terms: ['lime', 'liming', 'dolomite', 'agricultural lime'], title: 'Agricultural lime',
    meaning: 'Lime is crushed limestone (calcium carbonate, or dolomite with magnesium) spread on acid soil to raise its pH. It also supplies calcium.',
    farm: 'Apply only after a soil test tells you how much, and mix it into the topsoil a few weeks before planting. Too much lime causes its own nutrient problems.' },
  { id: 'gypsum', terms: ['gypsum'], title: 'Gypsum',
    meaning: 'Gypsum is calcium sulphate. It adds calcium and sulphur without changing pH much, and it can help loosen sodic soils where sodium makes the soil seal and crack.',
    farm: 'Useful for hard, crusting soils with too much sodium. Confirm sodic soil with a lab test first.' },
  { id: 'organicmatter', terms: ['organic matter', 'humus'], title: 'Organic matter',
    meaning: 'Organic matter is the part of the soil made from rotting plant and animal material. It feeds soil life, holds water and nutrients, and binds soil into crumbs.',
    farm: 'Return residues, compost or manure every season, mulch the soil and avoid burning. It is the cheapest long-term way to improve soil.' },
  { id: 'compost', terms: ['compost', 'composting'], title: 'Compost',
    meaning: 'Compost is plant and animal waste that has been rotted down by microbes into dark, crumbly, earthy-smelling material that feeds the soil.',
    farm: 'Mix green material (leaves, weeds, manure) with dry material (stalks, straw), keep the heap damp and turn it. Use it only when mature, especially near seedlings.' },
  { id: 'mulch', terms: ['mulch', 'mulching'], title: 'Mulch',
    meaning: 'Mulch is a layer of straw, dry grass, leaves or similar material laid on the soil surface.',
    farm: 'It keeps soil cool and moist, suppresses weeds, stops rain from splashing mud onto leaves and slowly adds organic matter. Keep it a few centimetres off the stems.' },
  { id: 'vermicompost', terms: ['vermicompost', 'worm compost', 'vermiculture'], title: 'Vermicompost',
    meaning: 'Vermicompost is compost made by earthworms (usually red wigglers) eating organic waste. Their casts are rich in nutrients and soil life.',
    farm: 'Good for nurseries and vegetable beds. Keep the bin moist, shaded and free of oily or salty waste.' },
  { id: 'biochar', terms: ['biochar'], title: 'Biochar',
    meaning: 'Biochar is charcoal made by heating plant waste with very little air. Added to soil it can hold water and nutrients and last for many years.',
    farm: 'Results depend on soil, crop and biochar type. Mix it with compost before applying and try a small plot first.' },
  { id: 'fertilizer', terms: ['fertilizer', 'fertiliser', 'fertilizers', 'fertilisers'], title: 'Fertiliser',
    meaning: 'Fertiliser is any material added to soil to supply plant nutrients. It can be organic (compost, manure) or manufactured (NPK, urea).',
    farm: 'Match it to a soil test and crop stage, split nitrogen into two doses, keep it a hand-width from the stem and follow the label rate to avoid burning plants or wasting money.' },
  { id: 'soilstructure', terms: ['soil structure', 'soil crumb', 'crumb structure', 'aggregate', 'aggregates'], title: 'Soil structure',
    meaning: 'Soil structure is how soil particles clump together into crumbs and the pore spaces between them. Good structure lets air, water and roots move through.',
    farm: 'Organic matter, mulch, less tillage and avoiding heavy machinery on wet soil build structure. Poor structure means crusting, runoff and weak roots.' },
  { id: 'texture', terms: ['soil texture', 'loam', 'clay', 'silt', 'sandy soil', 'sand'], title: 'Soil texture (sand, silt, clay, loam)',
    meaning: 'Soil texture is the mix of sand, silt and clay particles. Sand drains fast but holds little; clay holds water and nutrients but can waterlog; loam is a balanced mix.',
    farm: 'Rub a moist pinch between your fingers: gritty is sandy, smooth and sticky is clay. Sandy soils need more organic matter and smaller, more frequent feeds; clay soils need drainage and careful timing of tillage.' },
  { id: 'cec', terms: ['cec', 'cation exchange', 'cation exchange capacity'], title: 'Cation exchange capacity (CEC)',
    meaning: 'CEC is the soil\'s ability to hold positively charged nutrients such as calcium, magnesium, potassium and ammonium on clay and organic matter, so rain does not wash them away.',
    farm: 'Sandy and highly weathered soils have low CEC. Adding organic matter raises it and makes fertiliser work better.' },
  { id: 'leaching', terms: ['leaching', 'leach'], title: 'Leaching',
    meaning: 'Leaching is when rain or irrigation washes dissolved nutrients, especially nitrate, down below the reach of roots.',
    farm: 'Common in sandy soil and heavy rain. Split fertiliser into smaller doses, add organic matter and keep the soil covered.' },
  { id: 'erosion', terms: ['soil erosion', 'erosion'], title: 'Soil erosion',
    meaning: 'Erosion is the loss of topsoil, the fertile top layer, carried away by running water or wind.',
    farm: 'Plant across the slope, use ridges and contour bunds, mulch, keep ground covered with crops or cover crops and plant grass strips.' },
  { id: 'topsoil', terms: ['topsoil'], title: 'Topsoil',
    meaning: 'Topsoil is the dark, top layer of soil rich in organic matter and life, where most roots and nutrients are found.',
    farm: 'It forms very slowly but washes away quickly, so protect it with cover and mulch.' },
  { id: 'compaction', terms: ['compaction', 'compacted soil', 'hardpan'], title: 'Soil compaction',
    meaning: 'Compaction is when soil particles are pressed tightly together by feet, machines or rain, closing the air and water spaces.',
    farm: 'Roots struggle and water runs off. Avoid working wet soil, add organic matter, loosen with a fork or hoe and keep to fixed paths.' },
  { id: 'drainage', terms: ['drainage', 'waterlogging', 'waterlogged'], title: 'Drainage and waterlogging',
    meaning: 'Drainage is how quickly extra water leaves the soil. Waterlogging is when soil stays saturated so roots cannot get oxygen.',
    farm: 'Use ridges, raised beds and drainage channels on heavy soil. Yellowing and wilting in wet soil often come from waterlogging.' },
  { id: 'salinity', terms: ['salinity', 'saline soil', 'salty soil', 'sodic', 'sodic soil'], title: 'Soil salinity',
    meaning: 'Salinity is too much salt in the soil, which pulls water out of roots. Sodic soil has too much sodium, which makes it seal and crack.',
    farm: 'Signs are white crusts, scorched leaf edges and patchy growth. Improve drainage, leach with good-quality water and ask for a lab test before using gypsum.' },
  { id: 'irrigation', terms: ['irrigation', 'irrigate'], title: 'Irrigation',
    meaning: 'Irrigation is supplying water to crops by means other than rain, for example furrows, sprinklers or drip lines.',
    farm: 'Water deeply but less often, in the early morning, at the base of the plant. Drip saves the most water and keeps leaves dry, which lowers disease.' },
  { id: 'rotation', terms: ['crop rotation', 'rotation', 'rotate crops'], title: 'Crop rotation',
    meaning: 'Crop rotation means growing different crops in turn on the same land season after season instead of the same crop every time.',
    farm: 'It breaks pest and disease cycles and balances nutrient use. Follow a hungry crop such as maize with a legume such as cowpea or groundnut.' },
  { id: 'intercropping', terms: ['intercropping', 'intercrop', 'mixed cropping'], title: 'Intercropping',
    meaning: 'Intercropping is growing two or more crops together in the same field, such as maize with cowpea.',
    farm: 'It uses space and light well, spreads risk and can cut pests. Choose partners that do not compete for the same resources.' },
  { id: 'monoculture', terms: ['monoculture', 'monocropping'], title: 'Monoculture',
    meaning: 'Monoculture is growing a single crop on the same land year after year.',
    farm: 'It is simple to manage but lets pests, diseases and nutrient shortages build up. Rotation or intercropping reduces the risk.' },
  { id: 'covercrop', terms: ['cover crop', 'cover crops', 'green manure'], title: 'Cover crops and green manure',
    meaning: 'A cover crop is grown to protect and feed the soil rather than to harvest. A green manure is a cover crop dug back into the soil.',
    farm: 'Legumes such as mucuna or lablab add nitrogen, cover the soil against erosion and suppress weeds. Cut and incorporate before they set seed.' },
  { id: 'legume', terms: ['legume', 'legumes', 'nitrogen fixation', 'nitrogen fixing', 'rhizobia', 'rhizobium'], title: 'Legumes and nitrogen fixation',
    meaning: 'Legumes such as cowpea, soybean and groundnut host Rhizobium bacteria in root nodules. The bacteria turn nitrogen from the air into a form the plant can use.',
    farm: 'That is why legumes enrich the soil in rotation. Leave their roots and residues in the field and avoid heavy nitrogen fertiliser on them.' },
  { id: 'mycorrhiza', terms: ['mycorrhiza', 'mycorrhizae', 'mycorrhizal'], title: 'Mycorrhiza',
    meaning: 'Mycorrhizae are helpful fungi that live on or in plant roots. They extend the root system and help plants take up water and phosphorus in return for sugar.',
    farm: 'Protect them by avoiding over-tillage, heavy phosphorus fertiliser and bare fallow, and by keeping living roots in the soil.' },
  { id: 'microbes', terms: ['soil microbes', 'microbes', 'microorganism', 'microorganisms', 'soil biology', 'soil life'], title: 'Soil microbes',
    meaning: 'Soil microbes are the bacteria, fungi and other tiny organisms in soil. They break down residues, release nutrients and help form soil structure.',
    farm: 'Feed them with organic matter, keep soil covered and moist and avoid overuse of chemicals.' },
  { id: 'decomposition', terms: ['decomposition', 'decompose', 'decay'], title: 'Decomposition',
    meaning: 'Decomposition is the breakdown of dead plant and animal material by microbes and soil animals into simpler nutrients and humus.',
    farm: 'It needs moisture, air and a balance of carbon and nitrogen. Dry stalks rot faster when mixed with green material or manure.' },
  { id: 'pathogen', terms: ['pathogen', 'pathogens', 'plant disease', 'plant diseases'], title: 'Pathogens and plant disease',
    meaning: 'A pathogen is an organism that causes disease. In crops they are fungi, bacteria, viruses and nematodes. They spread by wind, water splash, insects, tools and infected seed.',
    farm: 'Use clean seed, rotate crops, avoid working wet plants, remove sick plants and keep leaves dry. Scan a leaf to see which problem you may have.' },
  { id: 'fungus', terms: ['fungus', 'fungi', 'fungal', 'fungal disease'], title: 'Fungal disease',
    meaning: 'Fungi are living organisms that feed on plants and spread by tiny spores. They cause spots, rusts, mildews, blights and wilts, mostly in warm humid weather.',
    farm: 'Space plants, water at the base in the morning, remove infected leaves and use copper or other fungicides according to the label if needed.' },
  { id: 'virus', terms: ['plant virus', 'virus', 'mosaic'], title: 'Plant virus',
    meaning: 'Plant viruses are tiny particles that live inside plant cells and cannot be cured with sprays. Many are spread by insects such as whiteflies, aphids and leafhoppers. A common sign is a light and dark green mosaic pattern.',
    farm: 'Remove and destroy infected plants, control the insect carriers, use clean planting material and grow resistant varieties.' },
  { id: 'bacteria', terms: ['bacteria', 'bacterial', 'bacterial disease'], title: 'Bacterial disease',
    meaning: 'Bacterial plant diseases cause water-soaked spots, often with a yellow ring, and spread quickly in rain and splashing water.',
    farm: 'Avoid overhead watering, do not handle wet plants, rotate crops and use clean seed. Copper sprays may slow spread.' },
  { id: 'nematode', terms: ['nematode', 'nematodes', 'root knot'], title: 'Nematodes',
    meaning: 'Nematodes are microscopic worms in the soil. Root-knot nematodes feed on roots and cause swollen galls, stunted plants and wilting.',
    farm: 'Rotate with non-host crops, add organic matter, remove infested roots and grow tolerant varieties.' },
  { id: 'pesticide', terms: ['pesticide', 'pesticides', 'insecticide', 'fungicide', 'herbicide'], title: 'Pesticides, fungicides, insecticides and herbicides',
    meaning: 'Pesticide is the general word for products that kill pests. Insecticides target insects, fungicides target fungi and herbicides target weeds.',
    farm: 'Always read and follow the label, wear gloves and a mask, never spray near water or food and observe the waiting period before harvest. Use them only when needed.' },
  { id: 'ipm', terms: ['ipm', 'integrated pest management'], title: 'Integrated pest management (IPM)',
    meaning: 'IPM is a way of controlling pests that combines prevention, regular scouting, natural enemies, crop hygiene and, only if needed, targeted chemicals.',
    farm: 'Check fields weekly, act at a threshold rather than by calendar and choose the least harmful option first.' },
  { id: 'weed', terms: ['weed', 'weeds', 'weeding'], title: 'Weeds',
    meaning: 'Weeds are plants growing where they are not wanted. They compete with crops for light, water and nutrients and can harbour pests.',
    farm: 'Weed early, when the crop is young, mulch to suppress them and remove weeds before they set seed.' },
  { id: 'germination', terms: ['germination', 'germinate'], title: 'Germination',
    meaning: 'Germination is when a seed wakes up and starts to grow into a seedling. It needs water, warmth and air.',
    farm: 'Use fresh, clean seed, plant at the right depth in moist soil and avoid waterlogging or crusting that stops seedlings emerging.' },
  { id: 'pollination', terms: ['pollination', 'pollinate', 'pollinators'], title: 'Pollination',
    meaning: 'Pollination is the transfer of pollen to the female part of a flower so it can set fruit and seed. Bees, other insects, wind and sometimes people do it.',
    farm: 'Protect bees by not spraying open flowers and by leaving flowering plants or hedges nearby.' },
  { id: 'yield', terms: ['yield', 'crop yield'], title: 'Yield',
    meaning: 'Yield is the amount of crop harvested from a given area, for example tonnes per hectare.',
    farm: 'It is limited by water, light, nutrients, pests and variety. Fix the factor in shortest supply first.' },
  { id: 'fallow', terms: ['fallow'], title: 'Fallow',
    meaning: 'Fallow is leaving land uncropped for a time to rest and recover.',
    farm: 'Bare fallow exposes soil to erosion. A cover crop or planted fallow restores the soil faster.' },
  { id: 'drought', terms: ['drought', 'water stress', 'drought stress'], title: 'Drought and water stress',
    meaning: 'Drought is a long dry spell. Water stress is when a plant loses more water than its roots can supply, so it wilts, rolls its leaves and grows slowly.',
    farm: 'Mulch, add organic matter, plant early, use drought-tolerant varieties and irrigate at critical stages such as flowering.' },
  { id: 'humidity', terms: ['humidity', 'relative humidity'], title: 'Humidity',
    meaning: 'Humidity is the amount of water vapour in the air. High humidity keeps leaves wet and favours fungal disease.',
    farm: 'In humid weather improve air flow, avoid overhead watering and scout for spots and mildew more often.' },
  { id: 'agroforestry', terms: ['agroforestry', 'alley cropping'], title: 'Agroforestry',
    meaning: 'Agroforestry is growing trees together with crops or livestock on the same land.',
    farm: 'Trees give shade, fruit, fuel and leaf litter, hold soil in place and can fix nitrogen. Space them so crops still get light.' },
  { id: 'hydroponics', terms: ['hydroponics', 'hydroponic'], title: 'Hydroponics',
    meaning: 'Hydroponics is growing plants in a nutrient-rich water solution instead of soil.',
    farm: 'It saves water and space but needs careful nutrient and pH control and a steady power and water supply.' }
];

// Turn a spoken or typed question into its core subject and whether it asks "what is / explain".
function parseQ(t) {
  let core = String(t || '').toLowerCase().replace(/[^a-z0-9\s\-']/g, ' ').replace(/\s+/g, ' ').trim();
  let def = /\bmean(s|ing)?\b/.test(core);
  core = core.replace(/^((please|abeg|hey|ok|okay|emsagro|can you|could you|i want to know|i wan know)\s+)+/, '');
  const lead = /^(what is|what's|whats|what are|what does|what do you mean by|what do we mean by|define|definition of|the meaning of|meaning of|explain to me|explain|tell me about|tell me|describe|wetin be|wetin na|wetin dey mean|how does|how do|why is|why does|role of)\s+/;
  if (lead.test(core)) { def = true; core = core.replace(lead, ''); }
  core = core.replace(/\s+(mean|means|meaning|work|works|do|is|be|for plants|in plants)$/, '').replace(/^(a|an|the)\s+/, '').trim();
  return { core: core, def: def, words: core ? core.split(' ').length : 0 };
}

function findGloss(t, q) {
  if (!(q.def || q.words <= 5)) return null;
  let best = null, bestLen = 0;
  GLOSSARY.forEach(function (g) {
    g.terms.forEach(function (term) {
      const re = new RegExp('(^|[^a-z])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es)?([^a-z]|$)');
      if (re.test(t) && term.length > bestLen) { best = g; bestLen = term.length; }
    });
  });
  return best;
}

// Free general reference lookup (Wikipedia) for terms not in the built-in glossary.
const WIKI_CACHE = {};
function fetchWiki(term) {
  const key = term.toLowerCase();
  if (WIKI_CACHE[key] !== undefined) return Promise.resolve(WIKI_CACHE[key]);
  if (typeof fetch !== 'function') return Promise.resolve(null);
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : null;
  const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=1' +
    '&prop=extracts&exintro=1&explaintext=1&exsentences=3&redirects=1&gsrsearch=' + encodeURIComponent(term);
  return fetch(url, ctl ? { signal: ctl.signal } : undefined)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (timer) clearTimeout(timer);
      const pages = data && data.query && data.query.pages;
      const p = pages ? pages[Object.keys(pages)[0]] : null;
      const text = p && p.extract ? p.extract.trim() : '';
      const out = text && !/may refer to|may also refer to/.test(text)
        ? { title: p.title, text: text, url: 'https://en.wikipedia.org/?curid=' + p.pageid } : null;
      WIKI_CACHE[key] = out;
      return out;
    })
    .catch(function () { if (timer) clearTimeout(timer); return null; });
}

const ASK = { q: '', topic: null, did: null, gloss: null, wiki: null, ai: null, locked: false, ctx: 'general', cat: 'research' };
// ----- Open questions: send to your AI endpoint (see worker.js) -----
const AI_CACHE = {};
function askAI(question) {
  if (!CONFIG.chatEndpoint) return Promise.resolve(null);
  const key = question.toLowerCase();
  if (AI_CACHE[key]) return Promise.resolve(AI_CACHE[key]);
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(function () { ctl.abort(); }, 25000) : null;
  return fetch(CONFIG.chatEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: question, lang: VOICE.lang }),
    signal: ctl ? ctl.signal : undefined
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (timer) clearTimeout(timer);
      const a = d && d.answer ? String(d.answer).trim() : '';
      if (a) AI_CACHE[key] = a;
      return a || null;
    })
    .catch(function () { if (timer) clearTimeout(timer); return null; });
}
function aiHTML(text) {
  return text.split(/\n{2,}/).map(function (para) { return '<p>' + escapeHTML(para).replace(/\n/g, '<br>') + '</p>'; }).join('');
}
function wikiFallback(pq, qText, opts) {
  ASK.wiki = { state: 'loading' };
  renderAsk();
  return fetchWiki(pq.core).then(function (r) {
    if (ASK.q !== qText) return;
    ASK.wiki = r ? { state: 'ok', title: r.title, text: r.text, url: r.url } : { state: 'none' };
    renderAsk();
    if (opts.onLate) opts.onLate(r ? r.title + '. ' + r.text : say('unk'));
  });
}

const ASK_EXAMPLES = ['What is photosynthesis?', 'What is nitrogen fixation?', 'Why do some soils become acidic?', 'What causes yellowing in maize leaves?',
  'How does organic matter influence soil fertility?', 'What are the benefits and risks of agricultural waste reuse?',
  'Which studies have investigated biochar?'];

function goTo(id) {
  const n = $(id);
  if (n) n.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
function ul(a) { return '<ul>' + a.map(function (x) { return '<li>' + escapeHTML(x) + '</li>'; }).join('') + '</ul>'; }
function communityGet() { return store.get('csd_community', []); }

function matchDisease(t) {
  let best = null, bestScore = 0;
  DKEYS.forEach(function (row) {
    let s = 0;
    row[1].forEach(function (k) { if (t.indexOf(k) >= 0) s++; });
    if (s > bestScore) { best = row[0]; bestScore = s; }
  });
  return best;
}

function searchLinks(q) {
  const e = encodeURIComponent(q);
  return '<a href="https://scholar.google.com/scholar?q=' + e + '" target="_blank" rel="noopener noreferrer">Google Scholar</a> · ' +
    '<a href="https://core.ac.uk/search?q=' + e + '" target="_blank" rel="noopener noreferrer">CORE</a> · ' +
    '<a href="https://www.semanticscholar.org/search?q=' + e + '" target="_blank" rel="noopener noreferrer">Semantic Scholar</a>';
}

function renderAsk() {
  const box = $('askBody');
  if (!box) return;
  if (ASK.locked) {
    box.innerHTML = '<div class="ask-card"><h3>Create a free account to keep asking</h3>' +
      '<p>You have used your ' + LIMITS.guestChats + ' free questions. Registering is free and gives you unlimited questions, the full scan plans and saved scan history.</p>' +
      '<button type="button" class="btn primary" data-auth="signup">Create free account</button> ' +
      '<button type="button" class="btn ghost" data-auth="signin">Sign in</button></div>';
    return;
  }
  document.querySelectorAll('#askTabs .tab').forEach(function (t) {
    t.setAttribute('aria-selected', t.dataset.cat === ASK.cat ? 'true' : 'false');
  });
  if (!ASK.q) {
    box.innerHTML = '<p class="placeholder">Ask a question or tap an example. Answers are kept in three separate tabs so opinions are not mistaken for scientific findings.</p>' +
      '<div class="chips">' + ASK_EXAMPLES.map(function (x) {
        return '<button type="button" class="chip" data-q="' + escapeHTML(x) + '">' + escapeHTML(x) + '</button>';
      }).join('') + '</div>';
    return;
  }
  const topic = ASK.topic, d = ASK.did ? DISEASES[ASK.did] : null, plan = !isLocked();
  let html = '<p class="ask-q">You asked: <strong>' + escapeHTML(ASK.q) + '</strong></p>';

  if (ASK.cat === 'research') {
    html += '<div class="ask-card r"><span class="badge r">Research evidence</span>';
    if (ASK.ai && ASK.ai.state === 'loading') html += '<p>Thinking...</p>';
    else if (ASK.ai && ASK.ai.state === 'ok') html += '<h3>EmsAgro answer</h3>' + aiHTML(ASK.ai.text) + '<p class="ask-note">AI-written answer on crop and soil science. It can make mistakes and does not know your exact field, so confirm with your extension officer before spraying or applying lime or fertiliser.</p>';
    else if (ASK.gloss) html += '<h3>' + escapeHTML(ASK.gloss.title) + '</h3><p>' + escapeHTML(ASK.gloss.meaning) + '</p><p class="ask-note">Plain-language explanation of a standard crop and soil science term.</p>';
    else if (ASK.wiki && ASK.wiki.state === 'loading') html += '<p>Looking that up...</p>';
    else if (ASK.wiki && ASK.wiki.state === 'ok') html += '<h3>' + escapeHTML(ASK.wiki.title) + '</h3><p>' + escapeHTML(ASK.wiki.text) + '</p><p class="ask-note">From Wikipedia, a general reference. It is not checked for your crop, soil or climate. <a href="' + escapeHTML(ASK.wiki.url) + '" target="_blank" rel="noopener noreferrer">Read more</a></p>';
    else if (topic) html += '<h3>' + escapeHTML(topic.title) + '</h3><p class="ask-note">General scientific understanding from soil and crop science. It is not a citation of any one study.</p>' + ul(topic.science);
    else if (d) html += '<h3>' + escapeHTML(d.name) + '</h3><p class="ask-note">Commonly reported causes in crop and soil science.</p>' + ul(d.causes);
    else html += '<p>I do not have a built-in explanation for this yet. Use the search links below to find published studies.</p>';
    html += '<p><strong>Find the studies:</strong> ' + searchLinks(ASK.q) + '</p>' +
      '<p class="ask-note">These links open a search. This app does not list or vouch for any specific study, so check the source, year, soil and climate before relying on a result.</p></div>';
  } else if (ASK.cat === 'practical') {
    html += '<div class="ask-card p"><span class="badge">Practical guidance</span>';
    if (ASK.gloss) html += '<h3>Why it matters on your farm</h3><p>' + escapeHTML(ASK.gloss.farm) + '</p>';
    else if (topic) html += '<h3>' + escapeHTML(topic.title) + '</h3>' + ul(topic.practical);
    else if (d) {
      html += '<h3>' + escapeHTML(d.name) + '</h3>';
      html += plan
        ? ul(d.steps) + '<p><button type="button" class="btn ghost small" data-open-guide="' + ASK.did + '">Open in symptom guide</button></p>'
        : '<p>The step-by-step plan needs a free account.</p><button type="button" class="btn primary small" data-auth="signup">Unlock the full plan</button>';
    } else if (ASK.ai && ASK.ai.state === 'ok') html += '<p>The steps are included in the answer on the Research evidence tab.</p>';
    else html += '<p>No practical guide matched. Try describing the symptom, for example "leaves turning yellow" or "soil cracks when dry".</p>';
    html += '<p class="ask-note">This is general advice. Confirm with your local extension officer before spraying or applying lime or fertiliser.</p></div>';
  } else {
    const posts = communityGet().filter(function (p) { return p.ctx === ASK.ctx; });
    html += '<div class="ask-card c"><span class="badge c">Community experience</span><h3>What others have seen or tried</h3>' +
      '<p class="ask-note">Shared by users. Not verified and not research: treat these as ideas to test, not proven facts. Posts are saved on this device only for now.</p>';
    html += posts.length ? posts.map(function (p) {
      return '<div class="post"><p>' + escapeHTML(p.text) + '</p><small>' + escapeHTML(p.name || 'Anonymous') + ' · ' +
        new Date(p.t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + '</small></div>';
    }).join('') : '<p>No experiences shared on this topic yet.</p>';
    html += '<form class="comm-form" id="commForm"><textarea id="commText" maxlength="400" rows="3" placeholder="Share what you saw or tried. Please leave out phone numbers and personal details."></textarea>' +
      '<input id="commName" maxlength="30" placeholder="Name or nickname (optional)"><button type="submit" class="btn primary small">Share</button></form></div>';
  }
  box.innerHTML = html;
}

function answer(q, opts) {
  opts = opts || {};
  const t = String(q || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (t.length < 3) return '';
  if (isChatLocked()) {
    ASK.q = String(q).trim(); ASK.locked = true; ASK.topic = null; ASK.did = null; ASK.gloss = null; ASK.wiki = null; ASK.ai = null;
    renderAsk(); updateAskQuota();
    if (!opts.noScroll) goTo('ask');
    openAuth('signup', 'You have used your ' + LIMITS.guestChats + ' free questions. Create a free account to keep asking.');
    return say('chatLocked');
  }
  if (!isSignedIn()) addGuestChat();
  ASK.locked = false;
  updateAskQuota();
  const pq = parseQ(t);
  let gloss = findGloss(t, pq), topic = null, did = null;
  if (!(gloss && pq.def)) {
    for (let i = 0; i < TOPICS.length; i++) if (TOPICS[i].re.test(t)) { topic = TOPICS[i]; break; }
    did = topic ? null : matchDisease(t);
    if (topic || did) gloss = null;
  }
  const qText = String(q).trim();
  ASK.q = qText; ASK.topic = topic; ASK.did = did; ASK.gloss = gloss; ASK.wiki = null; ASK.ai = null; ASK.cat = 'research';
  ASK.ctx = gloss ? gloss.id : topic ? topic.id : (did || 'general');
  const open = !gloss && !topic && !did && pq.core.length >= 4;
  const useAI = open && !!CONFIG.chatEndpoint;
  const useWiki = open && !useAI && (pq.def || pq.words <= 3);
  ASK.ai = useAI ? { state: 'loading' } : null;
  ASK.wiki = useWiki ? { state: 'loading' } : null;
  renderAsk();
  if (!opts.noScroll) goTo('ask');
  if (gloss) return gloss.title + '. ' + gloss.meaning + ' ' + gloss.farm;
  if (topic) return topic.title + '. ' + topic.science[0] + ' ' + topic.practical[0];
  if (did) {
    const d = DISEASES[did];
    return d.name + '. ' + d.summary + (isLocked() ? ' ' + say('lockd') : ' First step: ' + d.steps[0]);
  }
  if (useAI) {
    askAI(qText).then(function (a) {
      if (ASK.q !== qText) return;
      if (a) {
        ASK.ai = { state: 'ok', text: a };
        renderAsk();
        if (opts.onLate) opts.onLate(a.split(/\n{2,}/)[0]);
        return;
      }
      ASK.ai = null;
      if (pq.def || pq.words <= 3) return wikiFallback(pq, qText, opts);
      renderAsk();
      if (opts.onLate) opts.onLate(say('unk'));
    });
    return say('look');
  }
  if (useWiki) { wikiFallback(pq, qText, opts); return say('look'); }
  return say('unk');
}

function openGuide(id) {
  const s = SYMPTOMS.filter(function (x) { return x.id === id; })[0];
  if (!s) return;
  showSymptoms(s.group);
  document.querySelectorAll('#symptomChips .chip').forEach(function (c) { if (c.textContent === s.label) c.click(); });
  goTo('symptoms');
}

(function buildAsk() {
  const news = $('news');
  if (!news) return;
  news.insertAdjacentHTML('beforebegin',
    '<section class="ask" id="ask"><div class="section-head"><h2>Ask EmsAgro</h2>' +
    '<p>Research, practical guides and farmer experience, kept separate.</p></div>' +
    '<form class="ask-form" id="askForm"><input type="text" id="askQ" placeholder="e.g. Why do some soils become acidic?" autocomplete="off" aria-label="Your question">' +
    '<button type="submit" class="btn primary small">Ask</button>' +
    '<button type="button" class="btn ghost small" id="askMic">🎙 Speak</button></form>' +
    '<p class=\"ask-note\" id=\"askQuota\"></p>' +
    '<div class="tabs" id="askTabs" role="tablist" aria-label="Answer type">' +
    '<button type="button" class="tab" role="tab" aria-selected="true" data-cat="research">Research evidence</button>' +
    '<button type="button" class="tab" role="tab" aria-selected="false" data-cat="practical">Practical guidance</button>' +
    '<button type="button" class="tab" role="tab" aria-selected="false" data-cat="community">Community experience</button></div>' +
    '<div id="askBody"></div></section>');
  const nav = document.querySelector('.top nav');
  if (nav) nav.insertAdjacentHTML('beforeend', '<a href="#ask">Ask</a>');
  renderAsk();
  updateAskQuota();

  $('askForm').addEventListener('submit', function (e) { e.preventDefault(); answer($('askQ').value, { noScroll: true }); });
  $('ask').addEventListener('click', function (e) {
    const tab = e.target.closest('#askTabs .tab');
    if (tab) { ASK.cat = tab.dataset.cat; renderAsk(); return; }
    const chip = e.target.closest('[data-q]');
    if (chip) { $('askQ').value = chip.dataset.q; answer(chip.dataset.q, { noScroll: true }); return; }
    const og = e.target.closest('[data-open-guide]');
    if (og) openGuide(og.dataset.openGuide);
  });
  $('askBody').addEventListener('submit', function (e) {
    if (e.target.id !== 'commForm') return;
    e.preventDefault();
    const text = $('commText').value.trim();
    if (text.length < 5) return;
    const list = communityGet();
    list.unshift({ ctx: ASK.ctx, text: text.slice(0, 400), name: $('commName').value.trim().slice(0, 30), t: Date.now() });
    store.set('csd_community', list.slice(0, 50));
    renderAsk();
    toast('Thanks for sharing.');
  });
})();


// ===== TALK TO EMSAGRO (voice assistant) =====
const VOICE = { lang: 'en', speak: true, rec: null, err: '' };
const VLANGS = {
  en:  { label: 'English', rec: 'en-NG', ready: true },
  pcm: { label: 'Nigerian Pidgin', rec: 'en-NG', ready: true },
  ha:  { label: 'Hausa (coming soon)', rec: 'ha-NG', ready: false },
  yo:  { label: 'Yoruba (coming soon)', rec: 'yo-NG', ready: false },
  ig:  { label: 'Igbo (coming soon)', rec: 'ig-NG', ready: false }
};
const SAY = {
  en: {
    hi: 'I am listening. Describe the problem, ask a question, or say a command like weather or open camera.',
    cam: 'Opening the camera.', up: 'Tap Upload a photo to choose an image.',
    crop: 'Crop leaf mode.', soil: 'Soil mode.', auto: 'Auto mode.',
    wxNone: 'I need your location first. Asking for it now.', noNews: 'News is still loading. Please try again in a moment.',
    go: 'Going there.', noScan: 'You have not scanned anything yet. Say scan to start.', stop: 'Okay, stopped.',
    lockd: 'The full plan needs a free account. Please sign up.',
    look: 'Let me look that up.',
    chatLocked: 'You have used your free questions. Please create a free account to keep asking.',
    unk: 'I did not find a built-in answer. I opened research search links for you.',
    help: 'You can say: scan, crop mode, soil mode, weather, news, symptoms, my scans, sign in, read result, or just describe your problem.',
    nosr: 'Voice input is not supported or is blocked here. Type your question instead.',
    denied: 'The microphone is blocked. Allow microphone access, or type instead.',
    none: 'I did not hear anything. Tap the mic and try again.'
  },
  pcm: {
    hi: 'I dey hear you. Talk wetin dey worry your crop or soil, ask question, or tell me wetin you want do, like weather or open camera.',
    cam: 'I dey open camera.', up: 'Tap "Upload a photo" make you pick image.',
    crop: 'Crop leaf mode don set.', soil: 'Soil mode don set.', auto: 'Auto mode don set.',
    wxNone: 'I need your location first. I dey ask for am now.', noNews: 'News never load finish. Try again small time.',
    go: 'I dey go there.', noScan: 'You never scan anything. Talk "scan" make we start.', stop: 'Ok, I don stop.',
    lockd: 'You need free account to see the full plan. Abeg sign up.',
    look: 'Make I check am small.',
    chatLocked: 'Your free questions don finish. Abeg create free account to continue.',
    unk: 'I no see ready answer for this one. I don open research search links for you.',
    help: 'You fit talk: scan, crop mode, soil mode, weather, news, symptoms, my scans, sign in, read result, or just tell me wetin dey happen.',
    nosr: 'Voice no work or dem block am for here. Type your question instead.',
    denied: 'Dem block the microphone. Allow microphone, or type am.',
    none: 'I no hear anything. Tap the mic make you try again.'
  }
};
function say(key) { return (SAY[VOICE.lang] || SAY.en)[key]; }

const CMDS = [
  { re: /\b(stop|cancel|quiet|silence|shut up)\b/, run: function () { if (window.speechSynthesis) speechSynthesis.cancel(); return say('stop'); } },
  { re: /\b(help|commands|what can i say|wetin i fit say)\b/, run: function () { return say('help'); } },
  { re: /\b(my scans|history|saved scans|past scans)\b/, run: function () { goTo('history'); return say('go'); } },
  { re: /\b(sign in|log in|login)\b/, run: function () { openAuth('signin', ''); return say('go'); } },
  { re: /\b(sign up|join|create account|register)\b/, run: function () { openAuth('signup', ''); return say('go'); } },
  { re: /\b(read|speak|tell)\b.*\b(result|diagnosis)\b|\bwetin you see\b|\bwhat did you find\b|\bread it\b/, run: function () {
    if (!lastScan) return say('noScan');
    const d = DISEASES[lastScan.res.primary.id];
    return d.name + '. ' + d.summary + (isLocked() ? ' ' + say('lockd') : ' First steps: ' + d.steps.slice(0, 3).join(' '));
  } },
  { re: /\b(crop|leaf)\s+(mode|scan)\b|\bscan\s+(a\s+|the\s+|my\s+)?(leaf|crop)\b/, run: function () { goTo('scan'); setMode('crop'); return say('crop'); } },
  { re: /\bsoil\s+(mode|scan)\b|\bscan\s+(a\s+|the\s+|my\s+)?soil\b/, run: function () { goTo('scan'); setMode('soil'); return say('soil'); } },
  { re: /\bauto(matic)?\s+mode\b/, run: function () { goTo('scan'); setMode('auto'); return say('auto'); } },
  { re: /\bupload\b|\bgallery\b/, run: function () { goTo('scan'); return say('up'); } },
  { re: /\bcamera\b|\b(take|snap)\s+(a\s+)?(photo|picture)\b|\bscan\b/, run: function () { goTo('scan'); openCamera(); return say('cam'); } },
  { re: /\b(weather|forecast|temperature|will it rain|rain dey come|climate)\b/, run: function () {
    goTo('weather');
    if (!WX.data) { useGps(); return say('wxNone'); }
    const w = WX.data;
    return WX.loc.name + ': ' + w.t + ' degrees Celsius, ' + codeLabel(w.code).toLowerCase() + '. ' + fieldAdvice(w);
  } },
  { re: /\b(news|headlines|stories)\b/, run: function () {
    goTo('news');
    const heads = Array.prototype.slice.call(document.querySelectorAll('#newsBody .ncard b')).slice(0, 3).map(function (n) { return n.textContent; });
    if (!heads.length) { loadNews(newsTopic); return say('noNews'); }
    return heads.join('. ');
  } },
  { re: /\b(symptom|symptoms|guide)\b/, run: function () { goTo('symptoms'); return say('go'); } },
  { re: /\bask emsagro\b|\bknowledge\b/, run: function () { goTo('ask'); return say('go'); } },
  { re: /\b(go to top|go home|top of page)\b/, run: function () { goTo('top'); return say('go'); } }
];

function runCommand(t) {
  if (t.split(/\s+/).length > 8) return null;
  for (let i = 0; i < CMDS.length; i++) if (CMDS[i].re.test(t)) return CMDS[i].run(t) || '';
  return null;
}

function speakNow(text) {
  if (!VOICE.speak || !window.speechSynthesis || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).slice(0, 600));
  const vs = speechSynthesis.getVoices();
  const v = vs.filter(function (x) { return x.lang === 'en-NG'; })[0] || vs.filter(function (x) { return /^en/.test(x.lang); })[0];
  if (v) u.voice = v;
  u.lang = v ? v.lang : 'en-US';
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
function vSay(text) { $('vReply').textContent = text || ''; speakNow(text); }

function handleSpeech(text) {
  $('vHeard').textContent = '“' + text + '”';
  const t = text.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  const pq = parseQ(t);
  const isDefinition = pq.def && findGloss(t, pq);
  let reply = isDefinition ? null : runCommand(t);
  if (reply === null) reply = answer(text, { onLate: vSay });
  vSay(reply);
}

function setMic(on) {
  const b = $('vMic');
  b.classList.toggle('listening', on);
  b.textContent = on ? '⏹ Listening... tap to stop' : '🎙 Tap and speak';
}

function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { vSay(say('nosr')); return; }
  if (VOICE.rec) { try { VOICE.rec.stop(); } catch (e) { /* ignore */ } return; }
  if (window.speechSynthesis) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance('')); }
  const r = new SR();
  r.lang = VLANGS[VOICE.lang].rec;
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.continuous = false;
  let finalText = '';
  r.onresult = function (e) {
    let s = '';
    for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
    $('vHeard').textContent = '“' + s + '”';
    if (e.results[e.results.length - 1].isFinal) finalText = s;
  };
  r.onerror = function (e) { VOICE.err = e.error; };
  r.onend = function () {
    VOICE.rec = null; setMic(false);
    if (finalText) handleSpeech(finalText);
    else vSay(VOICE.err === 'not-allowed' || VOICE.err === 'service-not-allowed' ? say('denied') : say('none'));
    VOICE.err = '';
  };
  VOICE.rec = r;
  try { r.start(); setMic(true); } catch (e) { VOICE.rec = null; vSay(say('nosr')); }
}

function togglePanel(open) {
  const p = $('vPanel');
  p.hidden = !open;
  $('vFab').setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open && !$('vReply').textContent) $('vReply').textContent = say('hi');
}

(function buildVoice() {
  const opts = Object.keys(VLANGS).map(function (k) {
    return '<option value="' + k + '"' + (VLANGS[k].ready ? '' : ' disabled') + '>' + VLANGS[k].label + '</option>';
  }).join('');
  const wrap = document.createElement('div');
  wrap.className = 'voice';
  wrap.innerHTML =
    '<button type="button" class="voice-fab" id="vFab" aria-expanded="false">🎙 Talk to EmsAgro</button>' +
    '<div class="voice-panel" id="vPanel" hidden>' +
      '<div class="v-head"><strong>Talk to EmsAgro</strong><button type="button" class="v-x" id="vClose" aria-label="Close">&times;</button></div>' +
      '<label class="v-row">Language <select id="vLang">' + opts + '</select></label>' +
      '<button type="button" class="btn primary wide" id="vMic">🎙 Tap and speak</button>' +
      '<p class="v-heard" id="vHeard" aria-live="polite">Try: "weather", "open camera", or "my maize leaves are turning yellow".</p>' +
      '<p class="v-reply" id="vReply" aria-live="polite"></p>' +
      '<form class="v-type" id="vForm"><input id="vText" placeholder="Or type here" autocomplete="off" aria-label="Type instead"><button type="submit" class="btn ghost small">Send</button></form>' +
      '<label class="v-row"><input type="checkbox" id="vSpeak" checked> Speak replies</label>' +
      '<p class="v-note">Your browser\'s speech service turns your voice into text. Pidgin is understood by phrase, and long guides are read in English. Hausa, Yoruba and Igbo are coming soon.</p>' +
    '</div>';
  document.body.appendChild(wrap);

  $('vFab').addEventListener('click', function () { togglePanel($('vPanel').hidden); });
  $('vClose').addEventListener('click', function () { togglePanel(false); if (window.speechSynthesis) speechSynthesis.cancel(); });
  $('vMic').addEventListener('click', startListening);
  $('vLang').addEventListener('change', function () { VOICE.lang = this.value; $('vReply').textContent = say('hi'); });
  $('vSpeak').addEventListener('change', function () { VOICE.speak = this.checked; if (!this.checked && window.speechSynthesis) speechSynthesis.cancel(); });
  $('vForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const v = $('vText').value.trim();
    if (!v) return;
    $('vText').value = '';
    handleSpeech(v);
  });
  const askMic = $('askMic');
  if (askMic) askMic.addEventListener('click', function () { togglePanel(true); startListening(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('vPanel').hidden) togglePanel(false); });
  if (window.speechSynthesis) speechSynthesis.getVoices();
})();


// ===== 9. CROP DIARY =====
(function cropDiary() {
  const DK = 'csd_diary_';
  const WEEKS = [2, 4, 6, 8];
  const D = { crop: null, photoData: '' };
  const root = $('diaryBody');
  if (!root) return;

  const user = currentUser;
  const load = function (u) { return store.get(DK + u.email, { crops: [], entries: [] }); };
  const save = function (u, d) { store.set(DK + u.email, d); };
  const today = function () { return new Date().toISOString().slice(0, 10); };
  const days = function (a, b) { return Math.floor((new Date(b) - new Date(a)) / 864e5); };
  const num = function (v) { return v === '' || v == null || isNaN(v) ? null : Number(v); };
  const uid = function () { return Date.now() + Math.floor(Math.random() * 1000); };
  const E = escapeHTML;

  function field(id, label, type, extra) {
    return '<label class="field"><span>' + label + '</span><input id="' + id + '" type="' + (type || 'text') + '" ' + (extra || '') + '></label>';
  }

  function compress(file, cb) {
    const r = new FileReader();
    r.onload = function () {
      const im = new Image();
      im.onload = function () {
        const s = Math.min(1, 480 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.6));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function chart(title, pts, unit, kind) {
    if (pts.length < 2) return '<div class="dy-chart"><h4>' + title + '</h4><p class="placeholder">Add at least 2 entries to see this chart.</p></div>';
    const W = 320, H = 150, P = 28, max = Math.max.apply(null, pts.map(function (p) { return p.v; })) || 1;
    const bw = (W - P * 2) / pts.length;
    const x = function (i) { return P + (kind === 'bar' ? bw * i + bw / 2 : i * (W - P * 2) / (pts.length - 1)); };
    const y = function (v) { return H - P - (v / max) * (H - P * 2); };
    let g = '';
    if (kind === 'bar') pts.forEach(function (p, i) { g += '<rect x="' + (x(i) - bw * 0.35) + '" y="' + y(p.v) + '" width="' + bw * 0.7 + '" height="' + (H - P - y(p.v)) + '" fill="#2fa84f" rx="3"/>'; });
    else g = '<polyline fill="none" stroke="#12663a" stroke-width="2.5" points="' + pts.map(function (p, i) { return x(i) + ',' + y(p.v); }).join(' ') + '"/>' +
      pts.map(function (p, i) { return '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="3.5" fill="#12663a"/>'; }).join('');
    return '<div class="dy-chart"><h4>' + title + ' <small>(' + unit + ')</small></h4><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + title + '">' +
      '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P) + '" y2="' + (H - P) + '" stroke="#b9dcae"/>' +
      '<text x="2" y="' + (P - 8) + '" font-size="10" fill="#3f6150">' + Math.round(max) + '</text>' + g +
      '<text x="' + P + '" y="' + (H - 8) + '" font-size="10" fill="#3f6150">' + pts[0].d.slice(5) + '</text>' +
      '<text x="' + (W - P) + '" y="' + (H - 8) + '" font-size="10" fill="#3f6150" text-anchor="end">' + pts[pts.length - 1].d.slice(5) + '</text></svg></div>';
  }

  function weekly(entries, key) {
    const m = {};
    entries.forEach(function (e) { if (e[key] != null) { const w = e.week; m[w] = (m[w] || 0) + e[key]; } });
    return Object.keys(m).sort(function (a, b) { return a - b; }).map(function (w) { return { v: m[w], d: 'W' + w }; });
  }

  function render() {
    const u = user();
    if (!u) {
      root.innerHTML = '<p class="placeholder">Create a free account to keep a diary for each crop. Entries are saved on this device.</p><button type="button" class="btn primary" data-auth="signup">Join free</button>';
      return;
    }
    const d = load(u);
    let h = '<details class="dy-card"' + (d.crops.length ? '' : ' open') + '><summary>Add a crop</summary><div class="dy-form">' +
      field('dyCrop', 'Crop', 'text', 'placeholder="Maize"') + field('dyVar', 'Variety', 'text') +
      field('dySize', 'Field size (hectares)', 'number', 'step="0.01" min="0"') + field('dyPlant', 'Planting date', 'date', 'value="' + today() + '"') +
      '<button type="button" class="btn primary" id="dyAddCrop">Save crop</button></div></details>';
    if (!d.crops.length) { root.innerHTML = h; bind(); return; }
    if (!D.crop || !d.crops.some(function (c) { return c.id === D.crop; })) D.crop = d.crops[0].id;
    const c = d.crops.filter(function (x) { return x.id === D.crop; })[0];
    const es = d.entries.filter(function (e) { return e.crop === c.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    es.forEach(function (e) { e.week = Math.max(0, Math.floor(days(c.planted, e.date) / 7)); });
    const last = es.length ? es[es.length - 1].date : c.planted;
    const idle = days(last, today());
    h += '<div class="tabs" id="dyTabs">' + d.crops.map(function (x) {
      return '<button type="button" class="tab" aria-selected="' + (x.id === c.id) + '" data-crop="' + x.id + '">' + E(x.crop) + '</button>';
    }).join('') + '</div>';
    h += '<p class="dy-meta">' + E(c.crop) + (c.variety ? ' (' + E(c.variety) + ')' : '') + ' · ' + (c.size || '?') + ' ha · planted ' + c.planted +
      ' · week ' + Math.max(0, Math.floor(days(c.planted, today()) / 7)) + ' <button type="button" class="link-btn" id="dyDelCrop">Delete crop</button></p>';
    if (idle >= 7) h += '<p class="dy-nudge">Time for a check-in. Your last entry was ' + idle + ' days ago.</p>';
    const due = WEEKS.filter(function (w) { return days(c.planted, today()) >= w * 7 && !es.some(function (e) { return e.photo && e.week === w; }); });
    if (due.length) h += '<p class="dy-nudge">Photo reminder: add a photo for week ' + due.join(', ') + '.</p>';
    h += '<details class="dy-card"><summary>Add an entry</summary><div class="dy-form">' + field('dyDate', 'Date', 'date', 'value="' + today() + '"') +
      field('dyFert', 'Fertiliser (type and amount)') + field('dyRain', 'Rain (mm)', 'number', 'min="0" step="any"') +
      field('dyIrr', 'Irrigation (mm)', 'number', 'min="0" step="any"') + field('dyHt', 'Plant height (cm)', 'number', 'min="0" step="any"') +
      field('dyDis', 'Disease seen') + field('dyTrt', 'Treatment given') + field('dyHarv', 'Harvest (kg, whole field)', 'number', 'min="0" step="any"') +
      field('dyNote', 'Notes') + '<label class="field"><span>Photo</span><input id="dyPhoto" type="file" accept="image/*"></label>' +
      '<button type="button" class="btn primary" id="dyAddEntry">Save entry</button></div></details>';
    h += '<div class="dy-charts">' + chart('Plant height', es.filter(function (e) { return e.height != null; }).map(function (e) { return { v: e.height, d: e.date }; }), 'cm', 'line') +
      chart('Water per week (rain + irrigation)', weekly(es.map(function (e) { return { week: e.week, w: (e.rain || 0) + (e.irr || 0) }; }), 'w'), 'mm', 'bar') + '</div>';
    const ph = es.filter(function (e) { return e.photo; });
    if (ph.length >= 2) {
      const opt = ph.map(function (e, i) { return '<option value="' + i + '">Week ' + e.week + ' · ' + e.date + '</option>'; }).join('');
      h += '<div class="dy-card"><strong>Compare photos</strong><div class="dy-cmp"><div><select id="dyA">' + opt + '</select><img id="dyImgA" alt="Earlier photo" src="' + ph[0].photo + '"></div>' +
        '<div><select id="dyB">' + opt + '</select><img id="dyImgB" alt="Later photo" src="' + ph[ph.length - 1].photo + '"></div></div></div>';
      D.ph = ph;
    }
    h += '<div class="dy-list">' + es.slice().reverse().map(function (e) {
      const yph = e.harvest != null && c.size ? ' · yield ' + (e.harvest / c.size / 1000).toFixed(2) + ' t/ha (' + Math.round(e.harvest / c.size) + ' kg/ha)' : '';
      const bits = [e.fert && 'Fertiliser: ' + e.fert, e.rain != null && 'Rain ' + e.rain + ' mm', e.irr != null && 'Irrigation ' + e.irr + ' mm', e.height != null && 'Height ' + e.height + ' cm',
        e.disease && 'Disease: ' + e.disease, e.treat && 'Treatment: ' + e.treat, e.note].filter(Boolean).map(E).join(' · ');
      return '<div class="dy-item">' + (e.photo ? '<img src="' + e.photo + '" alt="Week ' + e.week + ' photo">' : '') + '<div><strong>' + e.date + ' · week ' + e.week + '</strong>' +
        (e.harvest != null ? '<span class="pill">Harvest ' + e.harvest + ' kg' + yph + '</span>' : '') + '<p>' + bits + '</p>' +
        '<button type="button" class="link-btn" data-del="' + e.id + '">Delete</button></div></div>';
    }).join('') + '</div>';
    h += '<button type="button" class="btn ghost small" id="dyCsv">Export CSV</button>';
    root.innerHTML = h;
    bind();
  }

  function bind() {
    const u = user(); if (!u) return;
    const v = function (id) { return $(id) ? $(id).value.trim() : ''; };
    if ($('dyAddCrop')) $('dyAddCrop').onclick = function () {
      if (!v('dyCrop') || !v('dyPlant')) { toast('Enter a crop and planting date.'); return; }
      const d = load(u), id = uid();
      d.crops.push({ id: id, crop: v('dyCrop'), variety: v('dyVar'), size: num(v('dySize')), planted: v('dyPlant') });
      save(u, d); D.crop = id; render();
    };
    if (!$('dyAddEntry')) return;
    $('dyAddEntry').onclick = function () {
      const f = $('dyPhoto').files[0];
      const go = function (photo) {
        const d = load(u);
        d.entries.push({ id: uid(), crop: D.crop, date: v('dyDate') || today(), fert: v('dyFert'), rain: num(v('dyRain')), irr: num(v('dyIrr')),
          height: num(v('dyHt')), disease: v('dyDis'), treat: v('dyTrt'), harvest: num(v('dyHarv')), note: v('dyNote'), photo: photo || '' });
        save(u, d); toast('Entry saved.'); render();
      };
      if (f) compress(f, go); else go('');
    };
    $('dyTabs').onclick = function (e) { const b = e.target.closest('[data-crop]'); if (b) { D.crop = Number(b.dataset.crop); render(); } };
    $('dyDelCrop').onclick = function () {
      if (!confirm('Delete this crop and all its entries?')) return;
      const d = load(u); d.crops = d.crops.filter(function (c) { return c.id !== D.crop; });
      d.entries = d.entries.filter(function (e) { return e.crop !== D.crop; }); save(u, d); D.crop = null; render();
    };
    root.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () { const d = load(u); d.entries = d.entries.filter(function (e) { return String(e.id) !== b.dataset.del; }); save(u, d); render(); };
    });
    if ($('dyA')) {
      $('dyB').value = D.ph.length - 1;
      $('dyA').onchange = function () { $('dyImgA').src = D.ph[this.value].photo; };
      $('dyB').onchange = function () { $('dyImgB').src = D.ph[this.value].photo; };
    }
    $('dyCsv').onclick = function () {
      const d = load(u), c = d.crops.filter(function (x) { return x.id === D.crop; })[0];
      const q = function (s) { s = String(s == null ? '' : s); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
      const rows = [['Crop', 'Variety', 'Field ha', 'Date', 'Fertiliser', 'Rain mm', 'Irrigation mm', 'Height cm', 'Disease', 'Treatment', 'Harvest kg', 'Yield kg/ha', 'Notes']];
      d.entries.filter(function (e) { return e.crop === D.crop; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (e) {
        rows.push([c.crop, c.variety, c.size, e.date, e.fert, e.rain, e.irr, e.height, e.disease, e.treat, e.harvest, e.harvest != null && c.size ? Math.round(e.harvest / c.size) : '', e.note]);
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv' }));
      a.download = 'crop-diary-' + c.crop.replace(/\W+/g, '-') + '.csv'; a.click();
    };
  }

  const baseRender = renderHistory;
  renderHistory = function () { baseRender(); render(); };
  render();
})();
