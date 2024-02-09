#!/usr/bin/env node

import { createJsonTranslator, createLanguageModel } from '@anaisbetts/typechat'
import { createTypeScriptJsonValidator } from '@anaisbetts/typechat/ts'

import dotenv from 'dotenv'
import fs from 'fs'
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
      return { filename: fs.realpathSync(inTxt), text: inputText }
    }
  } catch {}

  return { filename: null, text: inTxt }
}

export async function main(argv: string[]): Promise<number> {
  const useOllama = !!process.env.OLLAMA_ENDPOINT
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
      describe: 'The model to use. Defaults to GPT-4 (or llama2 on Ollama)',
      type: 'string',
      default: useOllama ? 'llama2' : 'gpt-4',
      demandOption: false,
    })
    .option('verbose', {
      describe:
        'Print verbose output, this may be more difficult to use as JSON',
      type: 'boolean',
      demandOption: false,
    })
    .option('with-file', {
      describe:
        'If true, JSON output will be wrapped in an object that gives the filename and original input text',
      type: 'boolean',
      default: false,
    })
    .usage(
      'Usage: typechat-cli -s [schema] [input 1] [input 2] ... - inputs can be raw text or a filename',
    )
    .help()
    .alias('help', 'h')
    .parse()

  const lm = createLanguageModel({
    OPENAI_MODEL: opts.model,
    OLLAMA_MODEL: opts.model,
    ...process.env,
  })
  const v = createTypeScriptJsonValidator(
    fs.readFileSync(opts.schema, 'utf8'),
    opts.type,
  )
  const translator = createJsonTranslator(lm, v)

  let allResults: object[] = []

  let inputs = opts._
  if (inputs.length === 0) {
    console.error('No input provided, reading from stdin...')
    inputs = [await readStreamToString(process.stdin)]
  }

  for (let { filename, text } of inputs.map(paramToTextPrompt)) {
    translator.attemptRepair = true
    const result = await translator.translate(text)

    if (!result.success) {
      console.error(result.message)
      return -1
    }

    if (opts.verbose) {
      console.log(`Using prompt: ${text}`)
    }

    if (opts.withFile) {
      allResults.push({
        filename: filename,
        input: text,
        data: result.data,
      })
    } else {
      allResults.push(result.data)
    }
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
