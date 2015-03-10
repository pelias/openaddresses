# OpenAddresses import pipeline
[![Build Status](https://travis-ci.org/pelias/openaddresses.svg?branch=master)](https://travis-ci.org/pelias/openaddresses)

A tool for importing [OpenAddresses](http://openaddresses.io/) data into Pelias.

## installation
```
git clone https://github.com/pelias/openaddresses
cd openaddresses
npm install
```

## usage
```
node import.js --help
```

## configuration
This importer can be configured in [pelias-config](https://github.com/pelias/config), in the `imports.openaddresses`
hash. A sample configuration file might look like:

```javascript
{
	"imports": {
		"openaddresses": {
			"datapath": "/tmp/oa-data",
			"files": ["us-ny-nyc.csv"]
		}
	}
}
```

The following properties are recognized:

  * `datapath`: The absolute path of the directory containing OpenAddresses files. Must be specified if no directory is
    given as a command-line argument.
  * `files`: An array of the names of the files to import. If specified, *only* these files will be imported, rather
    than *all* `.csv` files in the given directory.
