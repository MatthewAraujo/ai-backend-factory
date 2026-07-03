declare module 'bcryptjs' {
  export function compare(plain: string, hash: string): Promise<boolean>;

  export function hash(plain: string, saltRounds: number): Promise<string>;
}
