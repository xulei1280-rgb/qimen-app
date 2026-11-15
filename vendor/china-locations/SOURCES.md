# Offline place centres

`china-locations.js` contains a derived, bundled province/city/county table. Search
and nearby-centre matching run in the browser without a network request.

- Mainland: [88250/city-geo data.json](https://github.com/88250/city-geo/blob/master/data.json), 3337 source rows, retrieved in the task folder and checked 2026-11-15. Mulan PSL v2; the complete upstream license is `city-geo-LICENSE`.
- Hong Kong and Macao supplement: [pyecharts/geo-region-coords](https://github.com/pyecharts/geo-region-coords/blob/master/coords.json). Only the first three hierarchy levels are retained. Also supplies the four blank Xinjiang county-city centres in the mainland source; the blank administrative grouping row is omitted. MIT, Copyright (c) 2017 chenjiandongx; the complete license is `pyecharts-LICENSE`.
- Taiwan: [g0v/twgeojson](https://github.com/g0v/twgeojson), `twCounty2010.geo.json` and `twTown1982.geo.json`. CC0 1.0 waiver by Chia-liang Kao; retained in `twgeojson-README.md`. Each centre is the planar centroid of its largest outer polygon. Names are converted to common simplified forms and the five merged/renamed counties are mapped to their city names. This replaces the zero and repeated city coordinates in the older supplemental coordinate table.

The names reflect the upstream snapshots, including historical administrative
names. Coordinates are approximate place centres collected by the upstreams
(the mainland source credits Baidu Maps); they are not precise birth addresses
or administrative polygons. Nearby matching names the nearest centre only
within 30 km, preserves the actual browser longitude, and otherwise says
“当前位置”. No runtime map provider or key is used.
