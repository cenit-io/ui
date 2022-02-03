#!/bin/sh
# line endings must be \n, not \r\n !
echo "window.appConfig = {" > ./config.js
awk -F '=' '{ print $1 ": \"" (ENVIRON[$1] ? ENVIRON[$1] : $2) "\"," }' ./.env >> ./config.js
echo "}" >> ./config.js
