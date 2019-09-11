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

Node.js is required. See [Pelias software requirements](https://github.com/pelias/documentation/blob/master/requirements.md) for supported versions.

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
hash. A sample configuration file might look like this:

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

The following configuration options are supported by this importer.

### `imports.openaddresses.datapath`

* Required: yes
* Default: ``

The absolute path to a directory where OpenAddresses data is located. The download command will also automatically place downloaded files in this directory.

### `imports.openaddresses.files`

* Required: no
* Default: `[]`

An array of OpenAddresses files to be downloaded (full list can be found on the
[OpenAddresses results site](http://results.openaddresses.io/?runs=all#runs)).
If no files are specified, the full planet data files (11GB+) will be
downloaded.

### `imports.openaddresses.missingFilesAreFatal

* Required: no
* Default: `false`

If set to true, any missing files will immediately halt the importer with an
error. Otherwise, the importer will continue processing with a warning. The
data downloader will also continue if any download errors were encountered with this set to false.

### `imports.openaddresses.dataHost`

* Required: no
* Default: `https://data.openaddresses.io`

The location from which to download OpenAddresses data from. By default, the
primary OpenAddresses servers will be used. This can be overrriden to allow
downloading customized data. Paths are supported (for example,
`https://yourhost.com/path/to/your/data`), but must not end with a trailing
slash.

## Parallel Importing

Because OpenAddresses consists of many small files, this importer can be configured to run several instances in parallel that coordinate to import all the data.

To use this functionality, replace calls to `npm start` with

```bash
npm run parallel 3 # replace 3 with your desired level of paralellism
```

Generally, a paralellism of 2 or 3 is suitable for most tasks.
