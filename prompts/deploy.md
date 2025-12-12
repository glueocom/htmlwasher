write a .sh script called `packto.sh` (or find a better name) in the root.
it will have one argument - it will be the path where the npm package output will be directed or copied, e.g. `/Users/miroslavsekera/r/test-project.playwright-camoufox-crawler/packages/htmlsanitization-server/`
and
`/Users/miroslavsekera/r/tools/packages/htmlsanitization-server/`

that script will run the package.json s "pack:folder" script, then it will otput it to the folder

then, in 
`/Users/miroslavsekera/r/test-project.playwright-camoufox-crawler/package.json` 
and
`/Users/miroslavsekera/r/tools/src/htmlwasher-site/package.json`
add scripts which will using relative path call the `packto.sh` (make sure there wont be the need to use the chmod)




ask questions if you nee dto