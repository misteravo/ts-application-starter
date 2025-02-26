#!/usr/bin/env -S zx --env=.env --verbose

$.quote = (str) => str;

await main();

async function main() {
  try {
    if (argv.build === undefined) throw new Error('One of --build or --no-build is required');
    if (argv.start === undefined) throw new Error('One of --start or --no-start is required');

    if (!process.env.APPLICATION_PATH) throw new Error('APPLICATION_PATH is not set');
    if (!process.env.PRODUCTION_DESTINATION) throw new Error('PRODUCTION_DESTINATION is not set');

    const applicationPath = process.env.APPLICATION_PATH;
    const [server, destinationPath] = process.env.PRODUCTION_DESTINATION.split(':');

    if (Boolean(argv.build)) await build();

    await deployFiles({ server, destinationPath, applicationPath });

    if (Boolean(argv.start)) await startServer({ server, destinationPath });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
}

async function build() {
  await $`pnpm build`;
}

async function deployFiles({ server, destinationPath, applicationPath }) {
  await $`rsync -av --exclude-from=".rsyncignore" --delete-after pm2/ecosystem.config.js ${applicationPath}/.next/standalone/ ${applicationPath}/public  ${server}:${destinationPath}/`;
  await $`rsync -av --exclude-from=".rsyncignore" --delete-after ${applicationPath}/.next/static ${server}:${destinationPath}/${applicationPath}/.next/`;
}

async function startServer({ server, destinationPath }) {
  const command = `pm2 start ecosystem.config.js --env production`;
  await $`ssh ${server} "cd ${destinationPath} && ${command}"`;
}
