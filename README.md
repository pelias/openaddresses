# OpenAddresses import pipeline
[![Build Status](https://travis-ci.org/pelias/openaddresses.svg?branch=master)](https://travis-ci.org/pelias/openaddresses)

A pipeline for importing OpenAddresses data into Pelias.

## installation
```
git clone https://github.com/pelias/openaddresses
npm install
```

## usage

A tool for importing OpenAddresses data into Pelias. Usage:

```
node import.js [--deduplicate] [--admin-values] OPENADDRESSES_DIR


OPENADDRESSES_DIR: A directory containing OpenAddresses CSV files.

--deduplicate: (advanced use) Deduplicate addresses using the
	OpenVenues deduplicator: https://github.com/openvenues/address_deduper.
	It must be running at localhost:5000.

--admin-values: (advanced use) OpenAddresses records lack admin values
	(country, state, city, etc., names), so auto-fill them
	by querying the Quattroshapes types in the Pelias
	elasticsearch index. You must have imported these using
	https://github.com/pelias/quattroshapes-pipeline.
```
