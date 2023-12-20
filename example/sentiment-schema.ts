export interface ResponseShape {
  sentiment: 'positive' | 'negative' | 'neutral' // The sentiment of the text, with positive, negative, and neutral as the only options
  hasTheWordGoose: boolean // Whether the text contains the word "goose"
}
