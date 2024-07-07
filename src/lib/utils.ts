import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const parseMessageContent = (rawContent:any) => {
  let content = rawContent;
  let lang;

  const tryParseJSON = (str:string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const parsed = tryParseJSON(content);
  if (parsed) {
    content = parsed.content || parsed;
    lang = parsed.lang;
  }

  if (typeof content === 'string') {
    const nestedParsed = tryParseJSON(content);
    if (nestedParsed) {
      content = nestedParsed.content || content;
      lang = nestedParsed.lang || lang;
    }
  }

  return { content: content || rawContent, lang };
};