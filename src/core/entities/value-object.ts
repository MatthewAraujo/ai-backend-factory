import { isDeepStrictEqual } from 'node:util';

export abstract class ValueObject<Props extends Record<string, unknown>> {
  protected readonly props: Props;

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props });
  }

  equals(valueObject?: ValueObject<Props> | null): boolean {
    if (!valueObject) {
      return false;
    }

    if (valueObject === this) {
      return true;
    }

    return isDeepStrictEqual(valueObject.props, this.props);
  }
}
