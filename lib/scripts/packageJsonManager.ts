import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageJsonPath = path.resolve(__dirname, '../../package.json')
const packageJsonBackupPath = path.resolve(
  __dirname,
  '../../package.json.backup'
)

const backupPackageJson = (): void => {
  if (!fs.existsSync(packageJsonBackupPath)) {
    fs.copyFileSync(packageJsonPath, packageJsonBackupPath)
  }
}

const restorePackageJson = (): void => {
  if (fs.existsSync(packageJsonBackupPath)) {
    fs.copyFileSync(packageJsonBackupPath, packageJsonPath)
    fs.unlinkSync(packageJsonBackupPath)
  }
}

const modifyPackageJson = (): void => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  const fieldsToRemove = ['devDependencies', 'scripts', 'private', 'jest']
  fieldsToRemove.forEach((field) => delete packageJson[field])

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

const action = process.argv[2]
if (action === 'backup') {
  backupPackageJson()
} else if (action === 'restore') {
  restorePackageJson()
} else if (action === 'modify') {
  modifyPackageJson()
} else {
  console.error('Unknown action. Use "backup", "restore", or "modify".')
  process.exit(1)
}
