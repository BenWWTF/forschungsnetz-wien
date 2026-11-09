#!/bin/sh
# District borders and waters from the City of Vienna's open data WFS (CC BY 4.0).
# curl, because Node's fetch trips over this server's HTTP/2 responses.
set -eu
cd "$(dirname "$0")"
wfs='https://data.wien.gv.at/daten/geo?service=WFS&version=1.1.0&request=GetFeature&srsName=EPSG:4326&outputFormat=json&typeName=ogdwien:'
curl -fsS "${wfs}BEZIRKSGRENZEOGD" -o bezirke.geojson
curl -fsS "${wfs}FLIESSGEWOGD" -o FLIESSGEWOGD.geojson
curl -fsS "${wfs}STEHENDEGEWOGD" -o STEHENDEGEWOGD.geojson
