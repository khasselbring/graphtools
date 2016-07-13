
import fs from 'fs'

const version = JSON.parse(fs.readFileSync('./package.json')).version

export function packageVersion () {
  return version
}
