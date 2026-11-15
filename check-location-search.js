'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const places = require('./china-locations.js');
assert.equal(new Set(places.locations.map(place=>place.province)).size,34);
assert.ok(places.locations.filter(place=>place.district).length>3000);
assert.ok(places.locations.every(place=>Number.isFinite(place.lng)&&Number.isFinite(place.lat)&&place.lng>70&&place.lng<140&&place.lat>0&&place.lat<60));
for(const query of ['长汀县','温县','安溪县','香格里拉','海淀','师宗','麒麟','南山区','香港','澳门','台北'])assert.ok(places.search(query).length,query);
assert.ok(places.search('广东 南山').every(place=>place.name.includes('广东')&&place.name.includes('南山')));
assert.ok(places.nearest(103.991556,24.827995).name.includes('师宗'));
assert.equal(places.nearest(0,0),null);
for(const file of ['bazi.html','ziwei.html','index.html']) {
  const html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes('china-locations.js?v=20261115.1'));
  assert.doesNotMatch(html,/<input\b(?=[^>]*(?:customLongitude|qimenBaziLongitude))[^>]*>/);
}
const qimen=fs.readFileSync('index.html','utf8');
assert.ok(qimen.includes('function useBrowserLocation()')&&qimen.includes('navigator.geolocation.getCurrentPosition'));
assert.doesNotMatch(qimen,/id="locationPreset"/);
assert.match(qimen,/<input type="hidden" id="longitude"/);
console.log('PASS offline location table/search, counties, 34 regions, no manual longitude, Qimen geolocation retained.');
