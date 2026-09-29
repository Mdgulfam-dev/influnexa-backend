/**
 * designationNormalizer.js
 *
 * Drop this into your MERN backend (e.g. /utils/designationNormalizer.js).
 * Use it in TWO places:
 *
 *   1. A Mongoose pre-save hook / route validator, so every NEW designation
 *      gets normalized before it's written to the DB (stops new duplicates
 *      from ever appearing).
 *
 *   2. A one-off cleanup script (see generateDesignationList.js) that reads
 *      your existing collection, cleans every value, and gives you a
 *      canonical list + a bulk mongo update to fix what's already there.
 *
 * Usage:
 *   const { cleanDesignation } = require('./designationNormalizer');
 *   cleanDesignation("marketing maneger")   -> "Marketing Manager"
 *   cleanDesignation("CEO")                 -> "Chief Executive Officer"
 *   cleanDesignation("co founder")          -> "Co-Founder"
 */

// Acronyms that should stay upper-case instead of being Title-Cased
const ACRONYMS = new Set([
  'ceo', 'cto', 'coo', 'cfo', 'cmo', 'cro', 'cio', 'ciso', 'cpo', 'cxo',
  'chro', 'cbo', 'vp', 'avp', 'svp', 'evp', 'gm', 'agm', 'dgm', 'hr', 'pr',
  'it', 'seo', 'sem', 'smo', 'smm', 'ppc', 'crm', 'd2c', 'b2b', 'b2c',
  'kpi', 'kam', 'mba', 'llp', 'pvt', 'ltd', 'hod', 'md', 'ncr', 'apac',
  'emea', 'usa', 'uk', 'uae', 'gcc',
]);

// Exact-phrase canonical mapping (checked before word-level typo correction,
// case-insensitive, punctuation-stripped). Extend this list as you find more
// common exact synonyms in your review sheet.
const CANONICAL_MAP = {
  'cofounder': 'Co-Founder',
  'co founder': 'Co-Founder',
  'co-founder': 'Co-Founder',
    'admission counselor': 'Admissions Counselor',
  'admissions counselor': 'Admissions Counselor',
  
  'founder': 'Founder',
  'founders': 'Founder',
  'ceo': 'Chief Executive Officer',
  'chief executive officer': 'Chief Executive Officer',
  'coo': 'Chief Operating Officer',
  'chief operating officer': 'Chief Operating Officer',
  'cfo': 'Chief Financial Officer',
  'chief financial officer': 'Chief Financial Officer',
  'cmo': 'Chief Marketing Officer',
  'chief marketing officer': 'Chief Marketing Officer',
  'cto': 'Chief Technology Officer',
  'chief technology officer': 'Chief Technology Officer',
  'md': 'Managing Director',
  'managing director': 'Managing Director',
  'director': 'Director',
  'vp': 'Vice President',
  'vice president': 'Vice President',
  'marketing manager': 'Marketing Manager',
  'digital marketing manager': 'Digital Marketing Manager',
  'brand manager': 'Brand Manager',
  'ecommerce manager': 'Ecommerce Manager',
  'e commerce manager': 'Ecommerce Manager',
  'e-commerce manager': 'Ecommerce Manager',
  'social media manager': 'Social Media Manager',
  'business owner': 'Business Owner',
  'owner': 'Owner',
  'proprietor': 'Proprietor',
};

// Common job-title words, spelled correctly. Any single word that's a
// near-miss of one of these (typo, missing/extra/transposed letter) gets
// corrected to the word on the left. Extend this list with any other
// frequently-misspelled words you spot in your data.
const ROLE_WORD_DICTIONARY = [
  'Manager', 'Director', 'Executive', 'Marketing', 'Digital', 'Founder',
  'President', 'Assistant', 'Associate', 'Senior', 'Officer', 'Chief',
  'Operations', 'Sales', 'Business', 'Brand', 'Ecommerce', 'Content',
  'Social', 'Media', 'Partner', 'Consultant', 'Strategist', 'Specialist',
  'Head', 'Growth', 'Communications', 'Development', 'Regional', 'Global',
  'National', 'General', 'Product', 'Project', 'Account', 'Retail',
  'Performance', 'Analyst', 'Coordinator', 'Supervisor', 'Trainer',
  'Recruiter', 'Financial', 'Technical', 'Creative', 'Design', 'Customer',
];
const ROLE_WORD_LOOKUP = new Map(
  ROLE_WORD_DICTIONARY.map((w) => [w.toLowerCase(), w])
);

function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

function stripCompanySuffix(s) {
  // remove " at CompanyName" / " @ CompanyName" tails
  return s.split(/\s+(?:at|@)\s+/i)[0];
}


function basicClean(raw) {
  let s = String(raw ?? "").trim();

  if (!s) return "";

  // Remove quotes
  s = s.replace(/["']/g, "");

  // Remove emojis
  s = s.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    ""
  );

  /*
   * Treat hyphen, underscore and slash as separators.
   *
   * AGM-marketing
   * AGM_marketing
   * AGM/marketing
   *
   * all become:
   *
   * AGM marketing
   */
  s = s.replace(/[-_/]+/g, " ");

  // Normalize spaces
  s = s.replace(/\s+/g, " ").trim();

  // Remove unwanted punctuation from beginning/end
  s = s.replace(/^[\s.,|]+|[\s.,|]+$/g, "");

  return s;
}


function titleCaseKeepAcronyms(s) {
  return s
    .split(" ")
    .map((word) => {
      const core = word
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      // Keep known acronyms uppercase
      if (core && ACRONYMS.has(core)) {
        return core.toUpperCase();
      }

      return word
        ? word[0].toUpperCase() +
            word.slice(1).toLowerCase()
        : word;
    })
    .join(" ");
}



function correctRoleWordTypos(s) {
  return s
    .split(' ')
    .map((tok) => {
      const m = tok.match(/^([^a-zA-Z]*)([a-zA-Z]+)([^a-zA-Z]*)$/);
      if (!m) return tok;
      const [, lead, core, trail] = m;
      const coreLower = core.toLowerCase();

      if (ROLE_WORD_LOOKUP.has(coreLower)) {
        return lead + ROLE_WORD_LOOKUP.get(coreLower) + trail;
      }

      if (coreLower.length >= 4 && coreLower.length <= 14) {
        const maxAllowed = coreLower.length <= 4 ? 1 : 2;
        let bestWord = null;
        let bestDist = Infinity;
        for (const [dictLower, dictWord] of ROLE_WORD_LOOKUP) {
          if (Math.abs(dictLower.length - coreLower.length) > maxAllowed) continue;
          const d = levenshtein(coreLower, dictLower);
          if (d < bestDist) {
            bestDist = d;
            bestWord = dictWord;
          }
        }
        if (bestWord && bestDist <= maxAllowed) {
          return lead + bestWord + trail;
        }
      }
      return tok;
    })
    .join(' ');
}



function normalizeDesignationAcronyms(s) {
  return s
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();

      // Generic acronym handling
      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase();
      }

      return word;
    })
    .join(" ");
}

/**
 * Clean + canonicalize a single raw designation string.
 * Returns '' for empty/blank input.
 */
function cleanDesignation(raw) {
  if (raw === null || raw === undefined) {
    return "";
  }

  let s = basicClean(raw);

  if (!s) return "";

  // Remove "at Company" / "@ Company"
  s = stripCompanySuffix(s);

  s = basicClean(s);

  if (!s) return "";

  // Correct common spelling mistakes
  s = correctRoleWordTypos(s);

  // Convert AGM / DGM / GM / CEO etc. automatically
  s = normalizeDesignationAcronyms(s);

  /*
   * Canonical key.
   *
   * AGM Marketing
   * agm marketing
   * AGM-marketing
   *
   * all resolve to:
   *
   * agm marketing
   */
  const key = s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Exact canonical mappings first
  if (CANONICAL_MAP[key]) {
    return CANONICAL_MAP[key];
  }

  /*
   * Final display formatting.
   *
   * AGM marketing -> AGM Marketing
   * DGM sales     -> DGM Sales
   * GM hr         -> GM HR
   */
  return s
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();

      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase();
      }

      return (
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      );
    })
    .join(" ");
}


/** Aggressive key used only to group near-duplicate labels, never for display. */
function normalizeKey(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Merge near-identical CLEANED labels that basicClean/correctRoleWordTypos
 * didn't already collapse (e.g. leftover minor variants). Keeps the most
 * frequent variant in each group as canonical.
 * `countsMap`: Map<string label, number count>
 * Returns: Map<string originalLabel, string canonicalLabel>
 */
function fuzzyGroup(countsMap, threshold = 0.93) {
  const items = [...countsMap.entries()].sort((a, b) => b[1] - a[1]);
  const used = new Array(items.length).fill(false);
  const canonicalFor = new Map();

  const similarity = (a, b) => {
    if (a === b) return 1;
    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - dist / maxLen;
  };

  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue;
    const group = [i];
    used[i] = true;
    const keyI = normalizeKey(items[i][0]);
    for (let j = i + 1; j < items.length; j++) {
      if (used[j]) continue;
      const keyJ = normalizeKey(items[j][0]);
      if (similarity(keyI, keyJ) >= threshold) {
        group.push(j);
        used[j] = true;
      }
    }
    const canonicalLabel = items[group[0]][0]; // most frequent in group
    for (const idx of group) canonicalFor.set(items[idx][0], canonicalLabel);
  }
  return canonicalFor;
}

export {
  cleanDesignation,
  normalizeKey,
  fuzzyGroup,
  levenshtein,
  ROLE_WORD_DICTIONARY,
  CANONICAL_MAP,
};
