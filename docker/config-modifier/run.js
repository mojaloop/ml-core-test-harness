#!/usr/bin/env node

'use-strict'
const util = require('util')
const fs = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
/**
 * @file config-modifier/run.js
 * @description Modifies the `default.json` file by overriding the configuration specified in `config.js`
 *
 *  Usage: ./run.js <original_file> <override_file> <new_file>
 *  To keep the script code simple, we drop any validation, so the format of config file must be perfect!
 *
 */

// Validate command line arguments
if (process.argv.length != 5) {
  console.log('Usage: ./run.js <original_file> <override_file> <new_file>')
  process.exit(1)
}
const myArgs = process.argv.slice(2);
const ORIGINAL_FILE = myArgs[0]
const OVERRIDE_FILE = myArgs[1]
const NEW_FILE = myArgs[2]

async function main () {
  try {
    // Read the Json file `default.json`
    const origFile = await readFileAsync(ORIGINAL_FILE)
    const origConfig = JSON.parse(origFile)

    // Read the Json file `default.json`
    const overrideConfig = require(OVERRIDE_FILE)
    
    // Merge the config in config/central-ledger.js into default.json
    const newConfig = deepMerge(origConfig,overrideConfig)
    // Write the new default.json
    await writeFileAsync(NEW_FILE, JSON.stringify(newConfig, null, 2))

    console.info(`config-modifier Success. Written to file ${NEW_FILE}:\n${JSON.stringify(newConfig, null, 2)}`)
    process.exit(0)
  } catch (error) {
    console.error(`config-modifier Error: ${error}`)
    process.exit(1)
  }
}

main()

/**
 * @function deepMerge
 * @description - merges two objects recursively. Its a replacement function for lodash merge with plain javascript.
 * @param {object} object1 - object1
 * @param {object} object2 - object2
 * @param {object} object3 - and so on ...
 */
const deepMerge = function () {
	// Setup merged object
	const newObj = {}
	// Merge the object into the newObj object
	const merge = function (obj) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				// If property is an object, merge properties
				if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
					newObj[prop] = deepMerge(newObj[prop], obj[prop])
				} else {
					newObj[prop] = obj[prop]
				}
			}
		}
	};
	// Loop through each object and conduct a merge
	for (var i = 0; i < arguments.length; i++) {
		merge(arguments[i])
	}
	return newObj
}
