# Pelias OpenAddresses importer

This repository is part of the [Pelias](https://github.com/pelias/pelias)
project. Pelias is an open-source, open-data geocoder built by
[Mapzen](https://www.mapzen.com/) that also powers [Mapzen Search](https://mapzen.com/projects/search). Our
official user documentation is [here](https://mapzen.com/documentation/search/).
[![Build Status](https://travis-ci.org/pelias/openaddresses.svg?branch=master)](https://travis-ci.org/pelias/openaddresses)

## Overview

The OpenAddresses importer is used to process data from
[OpenAddresses](http://openaddresses.io/) for import into the Pelias geocoder.

## Installation
```
git clone https://github.com/pelias/openaddresses
cd openaddresses
npm install
```

## Usage
```
# show full command line options
node import.js --help

# run a basic import
node import.js

# run with admin lookup
node import.js --admin-values

# run with admin lookup and deduplicator
node import.js --deduplicate
```

## Admin Lookup
Openaddresses records do not contain information about which city, state (or
other region like province), or country that they belong to. Pelias has the
ability to compute these values from [Who's on First](http://whosonfirst.mapzen.com/) data.
For more info on how admin lookup works, see the documentation for
[pelias/wof-admin-lookup](https://github.com/pelias/wof-admin-lookup).

**Note:** Admin lookup requires loading around 5GB of data into memory, and even
then, it's much slower. All the Pelias importers default to turning off admin
lookup to be considerate of environments that are memory constrained (like the
[vagrant](https://github.com/pelias/vagrant) image).

## Deduplication

Openaddresses data tends to contain lots of duplicate records. In order to avoid
inserting this duplicate data into Pelias, the importer can optionally run all
records through the [openvenues](https://github.com/openvenues) [address
deduplicator](https://github.com/openvenues/address_deduper).

The address deduplicator will filter out records that are both nearby, and have
nearly identical values. The deduplicator knows to expand common abbreviations,
so `123 Main Street` and `123 Main St` would be matched as duplicates.

Like admin lookup, this process slows down the importer quite a bit, and
requires a large amount of disk space (it uses a LevelDB store to track which
addresses it has seen), so it defaults to off.

## Configuration
This importer can be configured in [pelias-config](https://github.com/pelias/config), in the `imports.openaddresses`
hash. A sample configuration file might look like:

```javascript
{
	"imports": {
		"openaddresses": {
			"datapath": "/tmp/oa-data",
			"files": ["us/ny/city_of_new_york.csv"]
		}
	}
}
```

The following properties are recognized:

  * `datapath`: The absolute path of the directory containing OpenAddresses files. Must be specified if no directory is
    given as a command-line argument.
  * `files`: An array of the names of the files to import. If specified, *only* these files will be imported, rather
    than *all* `.csv` files in the given directory. **If the array is empty, all files will be imported.**
