const fs = require('fs');
const path = require('path');
const ROOT = path.dirname(__dirname);
const { results } = require('./audit-results.json');

const EXPECTED = {
  name: 'VideoSonic',
  telephone: '+63-927-884-5028',
  email: 'salesandproduction@video-sonic.com',
  streetAddress: 'Warehouse 5, Lagsa Compound',
  addressLocality: 'San Pedro',
  addressRegion: 'Laguna',
  facebook: 'https://www.facebook.com/videosonicph',
};

const BANNED_KEYS = ['aggregateRating', 'review', 'ratingValue', 'priceRange', 'offers', 'award'];

let totalBlocks = 0;
const problems = [];

for (const r of results) {
  const html = fs.readFileSync(r.file, 'utf-8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1].trim());
  for (const block of blocks) {
    totalBlocks++;
    let json;
    try {
      json = JSON.parse(block);
    } catch (e) {
      problems.push(`${r.route}: INVALID JSON (${e.message})`);
      continue;
    }
    const str = JSON.stringify(json);
    for (const banned of BANNED_KEYS) {
      if (str.includes(`"${banned}"`)) problems.push(`${r.route}: contains banned/unsupported field "${banned}" in @type ${json['@type']}`);
    }
    if (json['@type'] === 'Organization' || json['@type'] === 'LocalBusiness') {
      if (json.name !== EXPECTED.name) problems.push(`${r.route}: Organization/LocalBusiness name mismatch: ${json.name}`);
      if (json.telephone && json.telephone !== EXPECTED.telephone) problems.push(`${r.route}: telephone mismatch: ${json.telephone}`);
      if (json.email && json.email !== EXPECTED.email) problems.push(`${r.route}: email mismatch: ${json.email}`);
      if (json.address) {
        if (json.address.streetAddress !== EXPECTED.streetAddress) problems.push(`${r.route}: streetAddress mismatch`);
        if (json.address.addressLocality !== EXPECTED.addressLocality) problems.push(`${r.route}: addressLocality mismatch`);
        if (json.address.addressRegion !== EXPECTED.addressRegion) problems.push(`${r.route}: addressRegion mismatch`);
      }
      if (json.sameAs && !json.sameAs.includes(EXPECTED.facebook)) problems.push(`${r.route}: sameAs missing/mismatched Facebook URL`);
    }
  }
}

console.log('Total JSON-LD blocks found:', totalBlocks);
console.log('Problems:', problems.length ? problems : 'none');
