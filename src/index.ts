import dotenv from 'dotenv'
import fs from 'fs'
import { createJsonTranslator, createLanguageModel } from 'typechat'
import yargs from 'yargs'

dotenv.config()

function readStreamToString(stream: NodeJS.ReadStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''

    stream.on('data', (chunk) => {
      data += chunk
    })

    stream.on('end', () => {
      resolve(data)
    })

    stream.on('error', (error) => {
      reject(error)
    })
  })
}

function paramToTextPrompt(input: string | number) {
  const inTxt = input.toString()
  let inputText = inTxt
  try {
    if (fs.existsSync(inTxt)) {
      inputText = fs.readFileSync(inTxt, 'utf8')
    }
  } catch {}

  return inputText
}

export async function main(argv: string[]): Promise<number> {
  const opts = await yargs(argv)
    .option('schema', {
      alias: 's',
      describe: 'The filename of the TypeScript schema to match to',
      type: 'string',
      demandOption: true,
    })
    .option('type', {
      alias: 't',
      describe:
        'The type to use inside the schema file. Defaults to "ResponseShape"',
      type: 'string',
      default: 'ResponseShape',
      demandOption: false,
    })
    .option('model', {
      alias: 'm',
      describe: 'The model to use. Defaults to GPT-4',
      type: 'string',
      default: 'gpt-4',
      demandOption: false,
    })
    .option('verbose', {
      describe:
        'Print verbose output, this may be more difficult to use as JSON',
      type: 'boolean',
      demandOption: false,
    })
    .usage(
      'Usage: $0 -s [schema] [input 1] [input 2] ... - input can be raw text, or a filename',
    )
    .help()
    .alias('help', 'h')
    .parse()

  const lm = createLanguageModel({ OPENAI_MODEL: opts.model, ...process.env })
  const translator = createJsonTranslator(
    lm,
    fs.readFileSync(opts.schema, 'utf8'),
    opts.type,
  )

  let allResults: object[] = []

  for (const prompt of opts._.map(paramToTextPrompt)) {
    if (opts.verbose) {
      console.log(`Using prompt: ${prompt}`)
    }

    translator.attemptRepair = true
    const result = await translator.translate(prompt)

    if (!result.success) {
      console.error(result.message)
      return -1
    }

    allResults.push(result.data)
  }

  if (allResults.length === 1) {
    console.log(JSON.stringify(allResults[0], null, 2))
  } else {
    console.log(JSON.stringify(allResults, null, 2))
  }

  return 0
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (x: number) => process.exit(x),
    (ex: any) => {
      console.error(ex)
      process.exit(1)
    },
  )
}
