## TypeChat for the command line

This is a utility application that wraps the [TypeChat](https://github.com/microsoft/typechat) library and puts it in a command-line convenient for doing various repetitive AI-based tasks. Here's an example:

```bash
$ npx typechat-cli@beta -s ./example/sentiment-schema.ts "This is cool and you are cool too"
{
  "sentiment": "positive"
}
```

The output of the command is a JSON object that conforms to the schema you give. Here's an example schema:

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
$ npx typechat-cli -s ./example/links-schema.ts ./file1.md ./file2.md ./file3.md
```

typechat-cli will dump a single JSON array out containing all of the results, in the same order as the files given.

### What model does this use?

By default, this uses `gpt-4` though you can override it with the `-m` parameter. For many tasks, `gpt-3.5-turbo` will work and is _much_ cheaper!
