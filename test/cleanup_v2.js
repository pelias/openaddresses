const tape = require('tape');
const analyzer = require('../lib/cleanup_v2').streetName;

tape('analyzer', (t) => {
  t.equal(typeof analyzer, 'function', 'analyzer is a function');
  t.equal(analyzer.length, 1, 'analyzer accepts body');
  t.end();
});

tape('street', (t) => {
  t.equal(analyzer('10 main street'), '10 Main Street');
  t.equal(analyzer('10 main St.'), '10 Main Street');
  t.equal(analyzer('10 main st.'), '10 Main Street');
  t.equal(analyzer('10 main str'), '10 Main Street');
  t.equal(analyzer('10 main st'), '10 Main Street');
  t.end();
});

tape('road', (t) => {
  t.equal(analyzer('10 main road'), '10 Main Road');
  t.equal(analyzer('10 main Rd.'), '10 Main Road');
  t.equal(analyzer('10 main rd.'), '10 Main Road');
  t.equal(analyzer('10 main rd'), '10 Main Road');
  t.end();
});

tape('avenue', (t) => {
  t.equal(analyzer('10 main avenue'), '10 Main Avenue');
  t.equal(analyzer('10 main Ave.'), '10 Main Avenue');
  t.equal(analyzer('10 main ave.'), '10 Main Avenue');
  t.equal(analyzer('10 main ave'), '10 Main Avenue');
  t.end();
});

tape('misc', (t) => {
  t.equal(analyzer('YELLOWSTONE BLVD'), 'Yellowstone Boulevarde');
  t.equal(analyzer('YESHIVA LN'), 'Yeshiva Lane');
  t.equal(analyzer('WYGANT PL'), 'Wygant Place');
  t.equal(analyzer('THROGS NECK EXPY SR'), 'Throgs Neck Expressway State Route');
  t.equal(analyzer('W  FARMS SQ PLAZA'), 'West Farms Square Plaza');
  t.equal(analyzer('W  262 ST'), 'West 262 Street');
  t.equal(analyzer('W 26TH ST'), 'West 26th Street');
  t.equal(analyzer('WILLIE MC DONALD WAY'), 'Willie Mc Donald Way');
  t.equal(analyzer('West 93rd Street'), 'West 93rd Street');
  t.equal(analyzer('McCallister Street'), 'McCallister Street'); //already capitalized street should be unchanged
  t.equal(analyzer('Mc Callister Street'), 'Mc Callister Street'); // should not capitalize 'MC'
  t.equal(analyzer('La Bamba Rd'), 'La Bamba Road'); // should not expand 'La' to 'Lane'
  t.equal(analyzer('JFK AIRPORT'), 'JFK Airport');
  t.end();
});

tape('multiple tokens for the street generic', (t) => {
  t.equal(analyzer('ST AVE ST RD ST PKWY ST'), 'Saint Ave ST RD ST PKWY Street');
  t.equal(analyzer('Foo ST South East'), 'Foo Street South East');
  t.end();
});

tape('directionals', (t) => {
  t.equal(analyzer('W  KINGSBRIDGE RD'), 'West Kingsbridge Road');
  t.equal(analyzer('W  MOSHOLU PKWY  S'), 'West Mosholu Parkway South');
  t.equal(analyzer('WILLIAMSBURG ST   E'), 'Williamsburg Street East');
  t.equal(analyzer('W  MOSHOLU PKWY  N'), 'West Mosholu Parkway North');
  t.equal(analyzer('W  MOSHOLU PKWY  SE'), 'West Mosholu Parkway South East');
  t.equal(analyzer('S  WILLIAM ST'), 'South William Street');
  t.end();
});

tape('prefix expansions', (t) => {
  t.equal(analyzer('ST JAMES AVE'), 'Saint James Avenue');
  t.equal(analyzer('ST. JAMES AVE'), 'Saint James Avenue');
  t.equal(analyzer('ST NICHOLAS TER'), 'Saint Nicholas Terrasse');
  t.end();
});
