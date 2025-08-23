export interface ContentTypeParser {
  add(contentType: string, parser: (payload: any) => any): void
  remove(contentType: string): void
  parse(contentType: string, payload: any): any
  hasParser(contentType: string): boolean
  getParser(contentType: string): ((payload: any) => any) | null
}

export const contentTypeParser: ContentTypeParser
