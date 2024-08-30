<p align="center">
  <img height="100" src="https://raw.githubusercontent.com/pelias/design/master/logo/pelias_github/Github_markdown_hero.png">
</p>
<h3 align="center">A modular, open-source search engine for our world.</h3>
<p align="center">Pelias is a geocoder powered completely by open data, available freely to everyone.</p>
<p align="center">
<a href="https://en.wikipedia.org/wiki/MIT_License"><img src="https://img.shields.io/github/license/pelias/api?style=flat&color=orange" /></a>
<a href="https://hub.docker.com/u/pelias"><img src="https://img.shields.io/docker/pulls/pelias/api?style=flat&color=informational" /></a>
<a href="https://gitter.im/pelias/pelias"><img src="https://img.shields.io/gitter/room/pelias/pelias?style=flat&color=yellow" /></a>
</p>
<p align="center">
	<a href="https://github.com/pelias/docker">Local Installation</a> ·
        <a href="https://geocode.earth">Cloud Webservice</a> ·
	<a href="https://github.com/pelias/documentation">Documentation</a> ·
	<a href="https://gitter.im/pelias/pelias">Community Chat</a>
</p>
<details open>
<summary>What is Pelias?</summary>
<br />
Pelias is a search engine for places worldwide, powered by open data. It turns addresses and place names into geographic coordinates, and turns geographic coordinates into places and addresses. With Pelias, you’re able to turn your users’ place searches into actionable geodata and transform your geodata into real places.
<br /><br />
We think open data, open source, and open strategy win over proprietary solutions at any part of the stack and we want to ensure the services we offer are in line with that vision. We believe that an open geocoder improves over the long-term only if the community can incorporate truly representative local knowledge.
</details>

# Pelias OpenAddresses importer

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/openaddresses.svg)](https://greenkeeper.io/)

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

### `imports.openaddresses.missingFilesAreFatal`

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

S3 buckets are supported. Files will be downloaded using aws-cli.

For example: `s3://data.openaddresses.io`.

Note: When using s3, you might need authentcation (IAM instance role, env vars, etc.)

### `imports.openaddresses.s3Options`

* Required: no

If `imports.openaddresses.dataHost` is an s3 bucket, this will add options to the command.
For example: `--profile my-profile`

This is useful, for example, when downloading from `s3://data.openaddresses.io`,
as they require the requester to pay for data transfer.
You can then use the following option: `--request-payer`

### `imports.openaddresses.token`
* Required: no
* Default: Shared token for the pelias project

Since openaddresses moved from [results.openaddresses.io](https://results.openaddresses.io) to [batch.openaddresses.org](https://batch.openaddresses.org), you need a token to access the data. There is a default shared token for the Pelias project, but if you want to use it seriously, create your own account and token on [batch.openaddresses.org. ](https://batch.openaddresses.org) to avaoid possible throttling/bandwidth limit or (temporary) suspension.


## Parallel Importing

Because OpenAddresses consists of many small files, this importer can be configured to run several instances in parallel that coordinate to import all the data.

To use this functionality, replace calls to `npm start` with

```bash
npm run parallel 3 # replace 3 with your desired level of paralellism
```

Generally, a parallelism of 2 or 3 is suitable for most tasks.
