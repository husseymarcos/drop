import { generate } from 'memorable-ids';

const TOKEN_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const TOKEN_LENGTH = 8;

export class SlugGenerator {
  next(): string {
    const words = generate({ components: 2, separator: '-' });
    return `${words}-${randomToken()}`;
  }
}

function randomToken(): string {
  const limit = 256 - (256 % TOKEN_ALPHABET.length);
  let token = '';
  while (token.length < TOKEN_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH * 2))) {
      if (byte < limit && token.length < TOKEN_LENGTH) {
        token += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
      }
    }
  }
  return token;
}
