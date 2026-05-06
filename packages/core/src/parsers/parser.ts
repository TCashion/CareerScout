import type { JobParser, ParserRegistry, ParserType } from "../types.js";
import { GenericHtmlParser } from "./genericHtml.js";
import { GreenhouseParser } from "./greenhouse.js";
import { LeverParser } from "./lever.js";

const parserRegistry: ParserRegistry = {
  greenhouse: new GreenhouseParser(),
  lever: new LeverParser(),
  genericHtml: new GenericHtmlParser()
};

export function getParserForType(type: ParserType): JobParser {
  return parserRegistry[type];
}
