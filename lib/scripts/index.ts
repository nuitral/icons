import { FontAssetType, generateFonts, OtherAssetType } from 'fantasticon'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import * as path from 'path'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.resolve(__dirname, '../../dist')
const distIconsDir = path.resolve(__dirname, '../../dist/icons')
const iconsDir = path.resolve(__dirname, '../icons')
const tempCjsDir = path.resolve(__dirname, '../../temp/cjs')

const removeDirectory = async (dir: string) => {
  try {
    await fs.rm(dir, { recursive: true, force: true })
    console.log(`Directory ${dir} removed`)
  } catch (err) {
    console.error(`Error removing directory ${dir}:`, err)
  }
}

const createDirectory = async (dir: string) => {
  try {
    await fs.mkdir(dir, { recursive: true })
    console.log(`Directory ${dir} created`)
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err)
  }
}

const copyFiles = async (sourceDir: string, destDir: string): Promise<void> => {
  try {
    const files = await fs.readdir(sourceDir)
    await Promise.all(
      files.map(async (file) => {
        const sourceFile = path.join(sourceDir, file)
        const destFile = path.join(destDir, file)
        await fs.copyFile(sourceFile, destFile)
        console.log(`Copied ${file} to ${destDir}`)
      })
    )
  } catch (err) {
    console.error(`Error copying files from ${sourceDir} to ${destDir}:`, err)
  }
}

const renameFiles = async (dir: string) => {
  try {
    const files = await fs.readdir(dir)
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file)
        if (path.extname(file) === '.js') {
          const newFilePath = path.join(dir, path.basename(file, '.js') + '.cjs')
          await fs.rename(filePath, newFilePath)
          console.log(`Renamed ${file} to ${path.basename(newFilePath)}`)
        }
      })
    )
  } catch (err) {
    console.error(`Error renaming files in ${dir}:`, err)
  }
}

const main = async () => {
  await removeDirectory(distDir)
  await removeDirectory(tempCjsDir)

  await createDirectory(distDir)
  await createDirectory(distIconsDir)
  await createDirectory(tempCjsDir)

  generateFonts({
    name: 'nuitral-icons',
    fontHeight: 1000,
    tag: 'div',
    prefix: 'nuitral-icon',
    fontTypes: [FontAssetType.WOFF2],
    templates: {
      css: path.resolve(__dirname, '../templates/css.hbs'),
      scss: path.resolve(__dirname, '../templates/scss.hbs'),
      sass: path.resolve(__dirname, '../templates/sass.hbs'),
      html: path.resolve(__dirname, '../templates/html.hbs')
    },
    assetTypes: [
      OtherAssetType.SCSS,
      OtherAssetType.CSS,
      OtherAssetType.JSON,
      OtherAssetType.HTML,
      OtherAssetType.TS
    ],
    inputDir: path.resolve(__dirname, '../icons'),
    outputDir: path.resolve(__dirname, '../../dist')
  })
    .then((results) => console.log('Done', results))
    .catch((err) => console.error('Error generating fonts:', err))
    .finally(async () => {
      await copyFiles(iconsDir, distIconsDir)

      const tscTypesCommand = `tsc`
      exec(tscTypesCommand, async (err, stdout, stderr) => {
        if (err) {
          console.error('Error compiling TypeScript declarations:', stderr)
          console.log(err)
          process.exit(1)
        }
        console.log('TypeScript declarations compilation done:', stdout)

        await copyFiles(tempCjsDir, path.join(distDir, 'cjs'))
        await renameFiles(path.join(distDir, 'cjs'))

        const tscESMCommand = `tsc --project tsconfig.esm.json`
        exec(tscESMCommand, async (err, stdout, stderr) => {
          if (err) {
            console.error('Error compiling ESM TypeScript:', stderr)
            console.log(err)
            process.exit(1)
          }
          console.log('ESM TypeScript compilation done:', stdout)


          await removeDirectory(tempCjsDir)
        })
      })
    })
}

main()
