#/bin/bash
cd static
rm -rf node_modules
npm i
cd ../
rm -rf node_modules
npm i ./static
npm i
npm start
