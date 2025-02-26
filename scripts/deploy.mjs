#!/usr/bin/env -S zx --env=.env --verbose

$.quote = (str) => str;

await main();

async function main() {
  try {
    if (argv.build === undefined) throw new Error('One of --build or --no-build is required');
    if (argv.start === undefined && argv.reload === undefined)
      throw new Error('One of --start, --reload, --no-start or --no-reload is required');

    if (!process.env.APPLICATION_NAME) throw new Error('APPLICATION_NAME is not set');
    if (!process.env.APPLICATION_PATH) throw new Error('APPLICATION_PATH is not set');
    if (!process.env.PRODUCTION_DESTINATION) throw new Error('PRODUCTION_DESTINATION is not set');

    const applicationName = process.env.APPLICATION_NAME;
    const applicationPath = process.env.APPLICATION_PATH;
    const [server, destinationPath] = process.env.PRODUCTION_DESTINATION.split(':');

    if (Boolean(argv.build)) await build();

    await deployFiles({ server, destinationPath, applicationPath });

    if (Boolean(argv.start)) await startServer({ server, destinationPath, applicationName, applicationPath });
    else if (Boolean(argv.reload)) await reloadServer({ server, applicationName });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
}

async function build() {
  await $`pnpm build`;
}

async function deployFiles({ server, destinationPath, applicationPath }) {
  await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${applicationPath}/.next/standalone/ ${server}:${destinationPath}/`;
  await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${applicationPath}/public ${server}:${destinationPath}/`;
  await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${applicationPath}/.next/static ${server}:${destinationPath}/${applicationPath}/.next/`;
}

async function startServer({ server, destinationPath, applicationName, applicationPath }) {
  const command = `pm2 start --time --name ${applicationName} ${applicationPath}/server.js`;
  await $`ssh ${server} "cd ${destinationPath} && ${command}"`;
}

async function reloadServer({ server, applicationName }) {
  await $`ssh ${server} "pm2 reload --time ${applicationName}"`;
}
