>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias OpenAddresses importer

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/openaddresses.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/pelias/openaddresses.svg?branch=master)](https://travis-ci.org/pelias/openaddresses)

## Overview

The OpenAddresses importer is used to process data from [OpenAddresses](http://openaddresses.io/)
for import into the Pelias geocoder.

## Requirements

Node.js 6 or higher is required.

## Installation

> For instructions on setting up Pelias as a whole, see our [getting started guide](https://github.com/pelias/documentation/blob/master/getting_started_install.md). Further instructions here pertain to the OpenAddresses importer only

```bash
git clone https://github.com/pelias/openaddresses
cd openaddresses
npm install
```

## Data Download
Use the `imports.openaddresses.files` configuration option to limit the download to just the OpenAddresses files of interest.
Refer to the [OpenAddresses data listing]( http://results.openaddresses.io/?runs=all#runs) for file names.

> see the 'Configuration' section below for a more detailed example of how to use `imports.openaddresses.files`

```bash
npm run download
```

## Usage
```bash
# show full command line options
node import.js --help

# run an import
npm start
```

## Admin Lookup
OpenAddresses records do not contain information about which city, state (or
other region like province), or country that they belong to. Pelias has the
ability to compute these values from [Who's on First](http://whosonfirst.mapzen.com/) data.
For more info on how admin lookup works, see the documentation for
[pelias/wof-admin-lookup](https://github.com/pelias/wof-admin-lookup). By default,
adminLookup is enabled.  To disable, set `imports.adminLookup.enabled` to `false` in Pelias config.

**Note:** Admin lookup requires loading around 5GB of data into memory.

## Configuration
This importer can be configured in [pelias-config](https://github.com/pelias/config), in the `imports.openaddresses`
hash. A sample configuration file might look like:

```javascript
{
  "esclient": {
    "hosts": [
      {
        "env": "development",
        "protocol": "http",
        "host": "localhost",
        "port": 9200
      }
    ]
  },
  "logger": {
    "level": "debug"
  },
  "imports": {
    "whosonfirst": {
      "datapath": "/mnt/data/whosonfirst/",
      "importPostalcodes": false,
      "importVenues": false
    },
    "openaddresses": {
      "datapath": "/mnt/data/openaddresses/",
      "files": [ "us/ny/city_of_new_york.csv" ]
    }
  }
}
```

The following properties are recognized:

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module.
The following configuration options are supported by this importer.

| key | required | default | description |
| --- | --- | --- | --- |
| `datapath` | yes | | The absolute path of the directory containing OpenAddresses files. Must be specified if no directory is given as a command-line argument. |
| `files` | no | | An array of the names of the files to download/import. If specified, *only* these files will be downloaded and imported, rather than *all* `.csv` files in the given directory. **If the array is empty, all files will be downloaded and imported.** Refer to the [OpenAddresses data listing]( http://results.openaddresses.io/?runs=all#runs) for file names.|

## Parallel Importing

Because OpenAddresses consists of many small files, this importer can be configured to run several instances in parallel that coordinate to import all the data.

To use this functionality, replace calls to `npm start` with

```bash
npm run parallel 3 # replace 3 with your desired level of paralellism
```

Generally, a paralellism of 2 or 3 is suitable for most tasks.
