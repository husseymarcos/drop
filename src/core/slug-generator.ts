import { defaultSuffix, generate } from 'memorable-ids';

export class SlugGenerator {
  next(): string {
    return generate({
      components: 2,
      suffix: defaultSuffix,
      separator: '-',
    });
  }
}
