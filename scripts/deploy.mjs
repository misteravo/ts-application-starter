#!/usr/bin/env -S zx --env=.env

useBash();
$.verbose = true;
$.quote = (str) => str;

console.log('Publishing application into production');

const isStart = Boolean(argv.start);
const isReload = Boolean(argv.reload);

if (isStart === isReload) throw new Error('Either --start or --reload must be provided');

const destination = process.env.PRODUCTION_DESTINATION;
const applicationName = 'ts-application-starter';

await $`pnpm build`;
await $`rsync -av --exclude-from=".rsyncignore" --delete-after application/nextjs/public ${destination}/`;
await $`rsync -av --exclude-from=".rsyncignore" --delete-after application/nextjs/.next/standalone/ ${destination}/`;
await $`rsync -av --exclude-from=".rsyncignore" --delete-after application/nextjs/.next/static ${destination}/.next/`;

if (isStart) {
  await $`rsync -av --delete-after .env ${destination}/`;
  await $`rsync -av --delete-after sqlite.db ${destination}/`;
}

if (isStart) {
  await $`cd ${destination} && pm2 start -i --time --name ${applicationName} node -- --env-file=.env application/nextjs/server.js`;
}

if (isReload) {
  await $`cd ${destination} && pm2 reload --time ${applicationName}`;
}
