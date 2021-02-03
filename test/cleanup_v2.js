const tape = require('tape');
const analyzer = require('../lib/cleanup_v2').streetName;

tape('analyzer', (t) => {
  t.equal(typeof analyzer, 'function', 'analyzer is a function');
  t.equal(analyzer.length, 1, 'analyzer accepts body');
  t.end();
});

// --- Letter Casing ---

// fix casing on uppercased tokens
tape('casing - fix uppercased tokens', (t) => {
  t.equal(analyzer('MAIN STREET'), 'Main Street');
  t.equal(analyzer('DR M L KING JR BOULEVARD'), 'Dr M L King Jr Boulevard');

  // uppercase tokens ending with a period
  t.equal(analyzer('DR MLK. JR. BOULEVARD'), 'Dr MLK. JR. Boulevard');
  t.end();
});

// fix casing on lowercased tokens
tape('casing - fix lowercased tokens', (t) => {
  t.equal(analyzer('main street'), 'Main Street');
  t.equal(analyzer('dr m l king jr boulevard'), 'Dr M L King Jr Boulevard');

  // uppercase tokens ending with a period
  t.equal(analyzer('dr mlk. jr. boulevard'), 'Dr MLK. JR. Boulevard');
  t.end();
});

// ingore casing on mixedcase tokens
tape('casing - ingore casing on mixedcase tokens', (t) => {
  t.equal(analyzer('Willie Mc Donald Way'), 'Willie Mc Donald Way');
  t.equal(analyzer('McCallister Street'), 'McCallister Street');
  t.equal(analyzer('Mc Callister Street'), 'Mc Callister Street');
  t.end();
});

// --- Expanding the 'generic' part of the street name ---

// expand contracted 'generic' term
tape('generic expansion - final token position', (t) => {
  t.equal(analyzer('10 main street'), '10 Main Street');
  t.equal(analyzer('10 main St.'), '10 Main Street');
  t.equal(analyzer('10 main st.'), '10 Main Street');
  t.equal(analyzer('10 main str'), '10 Main Street');
  t.equal(analyzer('10 main st'), '10 Main Street');

  t.equal(analyzer('10 main road'), '10 Main Road');
  t.equal(analyzer('10 main Rd.'), '10 Main Road');
  t.equal(analyzer('10 main rd.'), '10 Main Road');
  t.equal(analyzer('10 main rd'), '10 Main Road');

  t.equal(analyzer('10 main avenue'), '10 Main Avenue');
  t.equal(analyzer('10 main Ave.'), '10 Main Avenue');
  t.equal(analyzer('10 main ave.'), '10 Main Avenue');
  t.equal(analyzer('10 main ave'), '10 Main Avenue');

  t.equal(analyzer('10 main avenue'), '10 Main Avenue');
  t.equal(analyzer('10 main Ave.'), '10 Main Avenue');
  t.equal(analyzer('10 main ave.'), '10 Main Avenue');
  t.equal(analyzer('10 main ave'), '10 Main Avenue');
  t.end();
});

// do not expand 'generic' term when not in final token position
tape('generic expansion - not final token position', (t) => {
  t.equal(analyzer('10 main st st'), '10 Main St Street');
  t.equal(analyzer('10 main st junction'), '10 Main St Junction');
  t.equal(analyzer('AVE ST RD ST PKWY ST'), 'Ave St Rd St Pkwy Street');
  t.end();
});

// we should expand the 'generic' when directly before a directional
tape('generic expansion - before directionals', (t) => {
  t.equal(analyzer('Main St N'), 'Main Street North');
  t.equal(analyzer('Main St S'), 'Main Street South');
  t.equal(analyzer('Main St E'), 'Main Street East');
  t.equal(analyzer('Main St W'), 'Main Street West');
  t.equal(analyzer('Main St North'), 'Main Street North');
  t.equal(analyzer('Main St South'), 'Main Street South');
  t.equal(analyzer('Main St East'), 'Main Street East');
  t.equal(analyzer('Main St West'), 'Main Street West');
  t.end();
});

// do not expand a 'generic' term when there is only one token
// this is logical as the 'generic' should always be paired with
// a 'specific'.
// note: this is likely not nessesary but adds a little more safety
// feel free to remove this restriction later if it doesn't make sense.
tape('generic expansion - single token', (t) => {
  t.equal(analyzer('st'), 'St');
  t.equal(analyzer('espl'), 'Espl');
  t.end();
});

// @todo: what should we do when there are multiple 'generic' tokens?
tape('generic expansion - multiple generic tokens', (t) => {
  t.equal(analyzer('W FARMS SQ PLZ'), 'West Farms Sq Plaza');
  t.end();
});

// @todo: what should we do when the 'generic' preceeds the 'specific'?
// @note: currently this expands 'Ave S' but not 'Ave X' because it thinks
// that S refers to a diagonal.
tape('generic expansion - multiple generic tokens', (t) => {
  t.equal(analyzer('AVE X'), 'Ave X');
  t.equal(analyzer('AVE S'), 'Avenue S');
  t.end();
});

// --- Expanding the 'directional' part of the street name ---

// expand directionals
// note: one issue with contracting directionals is getting
// something like 'East Coast Road' to not change.
tape('expand directionals - first token position', (t) => {
  t.equal(analyzer('N Main Street'), 'North Main Street');
  t.equal(analyzer('S Main Street'), 'South Main Street');
  t.equal(analyzer('E Main Street'), 'East Main Street');
  t.equal(analyzer('W Main Street'), 'West Main Street');
  t.end();
});
tape('expand directionals - last token position', (t) => {
  t.equal(analyzer('Main Street N'), 'Main Street North');
  t.equal(analyzer('Main Street S'), 'Main Street South');
  t.equal(analyzer('Main Street E'), 'Main Street East');
  t.equal(analyzer('Main Street W'), 'Main Street West');
  t.end();
});

// ignore diagonals
// note: for now we will ignore diagonals since the expanded
// for can we quite long.
tape('expand directionals - first token position', (t) => {
  t.equal(analyzer('NE Main Street'), 'NE Main Street');
  t.equal(analyzer('SE Main Street'), 'SE Main Street');
  t.equal(analyzer('NW Main Street'), 'NW Main Street');
  t.equal(analyzer('SW Main Street'), 'SW Main Street');
  t.end();
});
tape('expand directionals - last token position', (t) => {
  t.equal(analyzer('Main Street NE'), 'Main Street NE');
  t.equal(analyzer('Main Street SE'), 'Main Street SE');
  t.equal(analyzer('Main Street NW'), 'Main Street NW');
  t.equal(analyzer('Main Street SW'), 'Main Street SW');
  t.end();
});

// do not expand directionals unless 3 or more tokens present
tape('expand directionals - only when 3 or more tokens', (t) => {
  t.equal(analyzer('N Street'), 'N Street');
  t.equal(analyzer('S Street'), 'S Street');
  t.equal(analyzer('E Street'), 'E Street');
  t.equal(analyzer('W Street'), 'W Street');
  t.end();
});

// do not expand directionals when followed by a 'generic'
tape('expand directionals - unless followed by a generic', (t) => {
  t.equal(analyzer('N St Station'), 'N St Station');
  t.equal(analyzer('N Street Station'), 'N Street Station');
  t.equal(analyzer('N Ave Junction'), 'N Ave Junction');
  t.equal(analyzer('N Avenue Junction'), 'N Avenue Junction');
  t.end();
});

// --- NOOP inputs which should never change ---

// no-ops, these inputs should not change regardless of the algorithm used
tape('no-ops', (t) => {

  // street names composed entirely of 'generic' tokens
  t.equal(analyzer('Esplanade'), 'Esplanade');
  t.equal(analyzer('Park Road'), 'Park Road');

  // do not contract directionals which are part of the name
  t.equal(analyzer('East Coast Road'), 'East Coast Road');

  // number prefix
  t.equal(analyzer('No 1 Road'), 'No 1 Road');

  // spanish prefix 'la' should never be expanded to 'lane'
  t.equal(analyzer('La Bamba Road'), 'La Bamba Road');

  // directional as street name
  t.equal(analyzer('N Street'), 'N Street');
  t.equal(analyzer('No Street'), 'No Street');
  t.equal(analyzer('North Street'), 'North Street');
  t.equal(analyzer('Northe Street'), 'Northe Street');

  // do not anglicise/de-anglicise names
  t.equal(analyzer('Centre Road'), 'Centre Road');
  t.equal(analyzer('Center Road'), 'Center Road');
  t.equal(analyzer('Annex Road'), 'Annex Road');
  t.equal(analyzer('Anex Road'), 'Anex Road');

  // personal title in middle of name
  t.equal(analyzer('Main Road St Arnaud'), 'Main Road St Arnaud');
  t.equal(analyzer('Mount St John Avenue'), 'Mount St John Avenue');

  t.end();
});


tape('misc', (t) => {
  t.equal(analyzer('YELLOWSTONE BLVD'), 'Yellowstone Boulevard');
  t.equal(analyzer('YESHIVA LN'), 'Yeshiva Lane');
  t.equal(analyzer('WYGANT PL'), 'Wygant Place');
  t.equal(analyzer('W  262 ST'), 'West 262 Street');
  t.equal(analyzer('W 26TH ST'), 'West 26th Street');
  t.equal(analyzer('WILLIE MC DONALD WAY'), 'Willie Mc Donald Way');
  t.equal(analyzer('West 93rd Street'), 'West 93rd Street');
  t.equal(analyzer('JFK AIRPORT'), 'Jfk Airport'); // this should really uppercase JFK
  t.equal(analyzer('DR M L KING JR BLVD'), 'Dr M L King Jr Boulevard'); // not perfect
  t.equal(analyzer('E  HAMPTON BLVD'), 'East Hampton Boulevard');
  t.equal(analyzer('MARATHON PKWY'), 'Marathon Parkway');
  t.equal(analyzer('ANDREWS AVE  S'), 'Andrews Avenue South');
  t.equal(analyzer('W  13 ST'), 'West 13 Street');
  t.end();
});

tape('misc directionals', (t) => {
  t.equal(analyzer('W  KINGSBRIDGE RD'), 'West Kingsbridge Road');
  t.equal(analyzer('W  MOSHOLU PKWY  S'), 'West Mosholu Parkway South');
  t.equal(analyzer('WILLIAMSBURG ST   E'), 'Williamsburg Street East');
  t.equal(analyzer('W  MOSHOLU PKWY  N'), 'West Mosholu Parkway North');
  t.equal(analyzer('W  MOSHOLU PKWY  SE'), 'West Mosholu Parkway SE');
  t.equal(analyzer('S  WILLIAM ST'), 'South William Street');
  t.equal(analyzer('Foo ST South East'), 'Foo Street South East');
  t.end();
});

// tape('prefix expansions', (t) => {
//   t.equal(analyzer('ST JAMES ST'), 'Saint James Street');
//   t.equal(analyzer('ST JAMES AVE'), 'Saint James Avenue');
//   t.equal(analyzer('ST. JAMES AVE'), 'Saint James Avenue');
//   t.equal(analyzer('ST NICHOLAS TER'), 'Saint Nicholas Terrace');
//   t.equal(analyzer('MT DOOM CRES'), 'Mount Doom Crescent');
//   t.equal(analyzer('MT. DOOM CRES'), 'Mount Doom Crescent');
//   t.equal(analyzer('FT IMPENETRABLE ROW'), 'Fort Impenetrable Row');
//   t.equal(analyzer('FT. IMPENETRABLE ROW'), 'Fort Impenetrable Row');
//   t.equal(analyzer('St Leonards Drive'), 'Saint Leonards Drive');
//   t.equal(analyzer('St Andrew Street'), 'Saint Andrew Street');
//   t.end();
// });
