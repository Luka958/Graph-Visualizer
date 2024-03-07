cd ..
npm i
if ($LASTEXITCODE -eq 0) { npm run seed }
if ($LASTEXITCODE -eq 0) { npm run start }
