
import * as fs from 'fs'
import {join} from 'path'

const version = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'), 'utf8')).version

export function packageVersion () {
  return version
}
