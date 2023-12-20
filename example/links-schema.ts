// An extracted http or https link from the supplied input. If text does not have a link, it should be ignored.
export interface LinkInformation {
  url: string // The URL of the link. Ignore lines that do not have a link. Links must start with http:// or https://
  description: string // The description of the link given in the text. If no description is given, try to infer one from the URL
  category: string // The general category of the description, given as a single word
}

export interface ResponseShape {
  links: LinkInformation[]
}
