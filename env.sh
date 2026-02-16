#!/bin/sh
echo "window.appConfig = {" > ./config.js
awk -F '=' '!/^[[:space:]]*#/ && NF { print $1 ": \"" (ENVIRON[$1] ? ENVIRON[$1] : $2) "\"," }' ./.env >> ./config.js
echo "}" >> ./config.js