const { logger } = require('just-task');
const shell = require("shelljs");
const path = require('path')
const fs = require('fs')

module.exports = ({
  nodeVersion = '8.1.1',
  runtime = 'electron',
  platform = process.platform,
  debug = false,
  silent = false,
  msvsVersion = '2015',
  arch = 'ia32',
  distUrl = 'https://electronjs.org/headers'
}) => {
  logger.info("Platform:", platform, "\n");
  logger.info("Runtime:", runtime, "\n");
  logger.info("Arch:", arch, "\n");
  logger.info("Debug:", debug, "\n");

  if (runtime === 'electron') {
    let electron_gyp_exec = `${path.resolve(__dirname, '../../.bin/electron-rebuild')}` + process.platform === 'win32' ? '.cmd ' : ' '
    if (!fs.existsSync(electron_gyp_exec)) {
      logger.info(`electron-gyp_exec not found at ${electron_gyp_exec}, switch`)
      electron_gyp_exec = `${path.resolve(__dirname, '../node_modules/.bin/electron-rebuild')}` + process.platform === 'win32' ? '.cmd ' : ' '
    }
    let sdk_path = `${path.resolve(__dirname, '../../nertc-electron-sdk')}`
    if (!fs.existsSync(sdk_path)) {
      logger.info(`sdk_path not found at ${sdk_path}, switch`)
      sdk_path = `${path.resolve(__dirname, '../node_modules/nertc-electron-sdk')}`
    }
    const command = [`${electron_gyp_exec} --module-dir=${sdk_path}`];
    // check platform
    if (platform === 'win32') {
      command.push(`--arch=${arch}`)
    }
    // check debug
    if (debug) {
      command.push('--debug');
    }
    const commandStr = command.join(' ')

    /** start build */
    logger.info(commandStr, '\n');
    logger.info("Building...\n")

    shell.exec(`${commandStr}`, { silent }, (code, stdout, stderr) => {
      // handle error
      if (code !== 0) {
        logger.error('build error!!!!!');
        logger.error(stderr);
        process.exit(1)
      }

      // handle success
      logger.info('Build complete')
      process.exit(0)
    })
  } else {
    logger.info("Node Version:", nodeVersion, "\n");
    logger.info("MSVS Version:", msvsVersion, "\n");
    // workaround to find executable when install as dependency
    let gyp_path = `${path.resolve(__dirname, '../../node-gyp/bin/node-gyp.js')}`

    if (!fs.existsSync(gyp_path)) {
      logger.info(`gyp_exec not found at ${gyp_path}, switch`)
      gyp_path = `${path.resolve(__dirname, '../node_modules/node-gyp/bin/node-gyp.js')}`
    }
    const gyp_exec = `node ${gyp_path}`

    /** get command string */
    const command = [`${gyp_exec} configure`];
    // check platform
    if (platform === 'win32') {
      // command.push(`--arch=${arch} --msvs_version=${msvsVersion}`)
      command.push(`--arch=${arch} --msvs_version=${msvsVersion}`)
    }
    command.push(`--target=${electronVersion} --dist-url=${distUrl}`)
    // check debug
    if (debug) {
      command.push('--debug');
      if (platform === 'darwin') {
        // MUST AT THE END OF THE COMMAND ARR
        command.push('-- -f xcode')
      }
    }
    const commandStr = command.join(' ')

    /** start build */
    logger.info(commandStr, '\n');
    logger.info("Building...\n")

    shell.exec(`${gyp_exec} clean`, { silent }, (code, stdout, stderr) => {
      // handle error
      logger.info(`clean done ${stdout}`)
      if (code !== 0) {
        logger.error(stderr);
        process.exit(1)
      }

      shell.exec(commandStr, { silent }, (code, stdout, stderr) => {
        // handle error
        logger.info(`configure done ${stdout}`)
        if (code !== 0) {
          logger.error(stderr);
          process.exit(1)
        }

        if (debug) {
          // handle success
          logger.info('Complete, please go to `/build` and build manually')
          process.exit(0)
        } else {
          shell.exec(`${gyp_exec} build`, { silent }, (code, stdout, stderr) => {
            // handle error
            if (code !== 0) {
              logger.error('build error!!!!!');
              logger.error(stderr);
              process.exit(1)
            }

            // handle success
            logger.info('Build complete')
            process.exit(0)
          })
        }
      })
    })
  }
}