## TypeChat for the command line, on OpenAI, Ollama, and Anthropic

This is a utility application that wraps the [TypeChat](https://github.com/microsoft/typechat) library and puts it in a command-line convenient for doing various repetitive AI-based tasks. Here's an example:

```bash
$ npx typechat-cli -s ./example/sentiment-schema.ts "This is cool and you are cool too"
{
  "sentiment": "positive"
}
```

The output of the command is a JSON object that conforms to the schema you give. Here's the example schema above, `sentiment-schema.ts`:

```ts
export interface ResponseShape {
  sentiment: 'positive' | 'negative' | 'neutral' // The sentiment of the input text, with positive, negative, and neutral as the only options
}
```

Note that the comments are **very important!** They are effectively your Prompt to OpenAI and it will be used to effectively process the input and generate the output. The schema is also used to validate the output of the OpenAI API. By default, typechat-cli will look for the root interface `ResponseShape`, though you can override this with the `-t` parameter.

Here's another example for extracting links found in a Markdown document:

```ts
// An extracted http or https link from the supplied input. If text does not have a link, it should be ignored.
export interface LinkInformation {
  url: string // The URL of the link. Ignore lines that do not have a link. Links must start with http:// or https://
  description: string // The description of the link given in the text. If no description is given, try to infer one from the URL
  category: string // The general category of the link and description, given as a single word
}

export interface ResponseShape {
  links: LinkInformation[]
}
```

You might use it like this:

```bash
## Extract all of the links from our docs
$ npx typechat-cli -s ./example/links-schema.ts ./docs/**/*.md
```

typechat-cli will dump a single JSON array out containing all of the results, in the same order as the files given.

### A More Complex Example

This example from the TypeChat repo, shows just how complex you can make schemas and still get usable output. This example typically will have issues on less capable LLMs but works with GPT-4:

```sh
$ npx typechat-cli -s ./example/pizza-shop-schema.ts "I want three pizzas, one with mushrooms and the other two with sausage. Make one sausage a small. And give me a whole Greek and a Pale Ale. And give me a Mack and Jacks."
```

Output:

```json
{
  "items": [
    { "itemType": "pizza", "addedToppings": ["mushrooms"], "quantity": 1 },
    { "itemType": "pizza", "addedToppings": ["sausage"], "quantity": 1 },
    {
      "itemType": "pizza",
      "size": "small",
      "addedToppings": ["sausage"],
      "quantity": 1
    },
    {
      "itemType": "salad",
      "portion": "whole",
      "style": "Greek",
      "quantity": 1
    },
    { "itemType": "beer", "kind": "Pale Ale", "quantity": 1 },
    { "itemType": "beer", "kind": "Mack and Jacks", "quantity": 1 }
  ]
}
```

### How do I choose which AI service to use?

typechat-cli works with OpenAI, Anthropic's Claude, as well as [Ollama](https://ollama.ai/). Setting the appropriate environment variable will choose which one to use:

- `OLLAMA_ENDPOINT` - the base URL to use for Ollama, `http://localhost:11434` is the usual one that Ollama runs on
- `OPENAI_API_KEY` - the API key to use for OpenAI
- `ANTHROPIC_API_KEY` - the API key to use for Claude

### What model does this use?

By default, this uses `gpt-4` for OpenAI, `llama2` for Ollama, and `claude-2.1` for Anthropic, though you can override it with the `-m` parameter. For many tasks, `gpt-3.5-turbo` will work and is _much_ cheaper if using OpenAI!

### Getting more verbose information

Sometimes when operating with an entire directory of files, it can be convenient to get the input file alongside the data. If the `--with-text` flag is passed in, the data will be returned in the form:

```ts
interface ReturnedData {
  filename: string | null // The fully qualified path to the input file, or null if prompt text was directly given
  input: string // The contents of the input file or prompt text
  data: ResponseShape // The data returned
}
```

### Piping data in from stdin

You can also pipe data in from stdin, which will be used as the input text. For example:

```bash
$ echo "Yes this is very cool" | npx ts-node ./src/index.ts -s ./example/sentiment-schema.ts

No input provided, reading from stdin...
{
  "sentiment": "positive"
}
```

### How do I run this from the Git repo?

```bash
$ npx ts-node ./src/index.ts -s ./example/sentiment-schema.ts "This is cool and you are cool too"
```
