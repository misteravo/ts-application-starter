#!/usr/bin/env -S zx --env=.env

useBash();
$.verbose = true;
$.quote = (str) => str;

console.log('Publishing application into production');

const isStart = Boolean(argv.start);
const isReload = Boolean(argv.reload);

if (isStart === isReload) throw new Error('Either --start or --reload must be provided');

if (!process.env.PRODUCTION_DESTINATION) throw new Error('PRODUCTION_DESTINATION is not set');

const destinationTab = process.env.PRODUCTION_DESTINATION.split(':');
const fullDestinationPath = process.env.PRODUCTION_DESTINATION;

const server = destinationTab.length == 2 ? destinationTab[0] : null;
const destinationPath = destinationTab.length == 2 ? destinationTab[1] : fullDestinationPath;

const nextJsPath = 'application/nextjs';
const applicationName = 'ts-application-starter';

await $`pnpm build`;
await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${nextJsPath}/public ${fullDestinationPath}/`;
await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${nextJsPath}/.next/standalone/ ${fullDestinationPath}/`;
await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${nextJsPath}/.next/static ${fullDestinationPath}/.next/`;

if (isStart) {
  await $`rsync -av --delete-after .env ${fullDestinationPath}/`;
  await $`rsync -av --delete-after sqlite.db ${fullDestinationPath}/`;
}

if (isStart) {
  const command = `cd ${destinationPath} && pm2 start -i --time --name ${applicationName} node -- --env-file=.env ${nextJsPath}/server.js`;
  if (server) await $`ssh ${server} "${command}"`;
  else await $`${command}`;
}

if (isReload) {
  const command = `cd ${destinationPath} && pm2 reload --time ${applicationName}`;
  if (server) await $`ssh ${server} "${command}"`;
  else await $`${command}`;
}
