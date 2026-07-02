import { randomUUID } from 'node:crypto';

export type UniqueEntityIDLike = string | UniqueEntityID;

export class UniqueEntityID {
  private readonly value: string;

  constructor(value?: string) {
    const normalizedValue = value?.trim() ?? randomUUID();

    if (normalizedValue.length === 0) {
      throw new Error('Unique entity id cannot be empty.');
    }

    this.value = normalizedValue;
  }

  equals(id?: UniqueEntityID | null): boolean {
    if (!id) {
      return false;
    }

    return id.toValue() === this.value;
  }

  toString(): string {
    return this.value;
  }

  toValue(): string {
    return this.value;
  }
}

export function resolveUniqueEntityID(
  value?: UniqueEntityIDLike,
): UniqueEntityID | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value instanceof UniqueEntityID ? value : new UniqueEntityID(value);
}

export function resolveOptionalUniqueEntityID(
  value?: UniqueEntityIDLike | null,
): UniqueEntityID | null {
  if (value === null || value === undefined) {
    return null;
  }

  return resolveUniqueEntityID(value) ?? null;
}
