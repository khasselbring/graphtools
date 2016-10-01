
import fs from 'fs'
import {join} from 'path'

const version = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'))).version

export function packageVersion () {
  return version
}
