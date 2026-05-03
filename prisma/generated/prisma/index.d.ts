
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Room
 * 
 */
export type Room = $Result.DefaultSelection<Prisma.$RoomPayload>
/**
 * Model RoomPlayer
 * 
 */
export type RoomPlayer = $Result.DefaultSelection<Prisma.$RoomPlayerPayload>
/**
 * Model GameRecord
 * 
 */
export type GameRecord = $Result.DefaultSelection<Prisma.$GameRecordPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const GameType: {
  AVALON: 'AVALON',
  SGS: 'SGS'
};

export type GameType = (typeof GameType)[keyof typeof GameType]


export const RoomStatus: {
  WAITING: 'WAITING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED'
};

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus]

}

export type GameType = $Enums.GameType

export const GameType: typeof $Enums.GameType

export type RoomStatus = $Enums.RoomStatus

export const RoomStatus: typeof $Enums.RoomStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.room`: Exposes CRUD operations for the **Room** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Rooms
    * const rooms = await prisma.room.findMany()
    * ```
    */
  get room(): Prisma.RoomDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.roomPlayer`: Exposes CRUD operations for the **RoomPlayer** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RoomPlayers
    * const roomPlayers = await prisma.roomPlayer.findMany()
    * ```
    */
  get roomPlayer(): Prisma.RoomPlayerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.gameRecord`: Exposes CRUD operations for the **GameRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GameRecords
    * const gameRecords = await prisma.gameRecord.findMany()
    * ```
    */
  get gameRecord(): Prisma.GameRecordDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Room: 'Room',
    RoomPlayer: 'RoomPlayer',
    GameRecord: 'GameRecord'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "room" | "roomPlayer" | "gameRecord"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Room: {
        payload: Prisma.$RoomPayload<ExtArgs>
        fields: Prisma.RoomFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RoomFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RoomFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          findFirst: {
            args: Prisma.RoomFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RoomFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          findMany: {
            args: Prisma.RoomFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>[]
          }
          create: {
            args: Prisma.RoomCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          createMany: {
            args: Prisma.RoomCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RoomCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>[]
          }
          delete: {
            args: Prisma.RoomDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          update: {
            args: Prisma.RoomUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          deleteMany: {
            args: Prisma.RoomDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RoomUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RoomUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>[]
          }
          upsert: {
            args: Prisma.RoomUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          aggregate: {
            args: Prisma.RoomAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRoom>
          }
          groupBy: {
            args: Prisma.RoomGroupByArgs<ExtArgs>
            result: $Utils.Optional<RoomGroupByOutputType>[]
          }
          count: {
            args: Prisma.RoomCountArgs<ExtArgs>
            result: $Utils.Optional<RoomCountAggregateOutputType> | number
          }
        }
      }
      RoomPlayer: {
        payload: Prisma.$RoomPlayerPayload<ExtArgs>
        fields: Prisma.RoomPlayerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RoomPlayerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RoomPlayerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>
          }
          findFirst: {
            args: Prisma.RoomPlayerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RoomPlayerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>
          }
          findMany: {
            args: Prisma.RoomPlayerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>[]
          }
          create: {
            args: Prisma.RoomPlayerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>
          }
          createMany: {
            args: Prisma.RoomPlayerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RoomPlayerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>[]
          }
          delete: {
            args: Prisma.RoomPlayerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>
          }
          update: {
            args: Prisma.RoomPlayerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>
          }
          deleteMany: {
            args: Prisma.RoomPlayerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RoomPlayerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RoomPlayerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>[]
          }
          upsert: {
            args: Prisma.RoomPlayerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPlayerPayload>
          }
          aggregate: {
            args: Prisma.RoomPlayerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRoomPlayer>
          }
          groupBy: {
            args: Prisma.RoomPlayerGroupByArgs<ExtArgs>
            result: $Utils.Optional<RoomPlayerGroupByOutputType>[]
          }
          count: {
            args: Prisma.RoomPlayerCountArgs<ExtArgs>
            result: $Utils.Optional<RoomPlayerCountAggregateOutputType> | number
          }
        }
      }
      GameRecord: {
        payload: Prisma.$GameRecordPayload<ExtArgs>
        fields: Prisma.GameRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>
          }
          findFirst: {
            args: Prisma.GameRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>
          }
          findMany: {
            args: Prisma.GameRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>[]
          }
          create: {
            args: Prisma.GameRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>
          }
          createMany: {
            args: Prisma.GameRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameRecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>[]
          }
          delete: {
            args: Prisma.GameRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>
          }
          update: {
            args: Prisma.GameRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>
          }
          deleteMany: {
            args: Prisma.GameRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameRecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>[]
          }
          upsert: {
            args: Prisma.GameRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GameRecordPayload>
          }
          aggregate: {
            args: Prisma.GameRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGameRecord>
          }
          groupBy: {
            args: Prisma.GameRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameRecordCountArgs<ExtArgs>
            result: $Utils.Optional<GameRecordCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    room?: RoomOmit
    roomPlayer?: RoomPlayerOmit
    gameRecord?: GameRecordOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    hostedRooms: number
    roomPlayers: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hostedRooms?: boolean | UserCountOutputTypeCountHostedRoomsArgs
    roomPlayers?: boolean | UserCountOutputTypeCountRoomPlayersArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountHostedRoomsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoomWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRoomPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoomPlayerWhereInput
  }


  /**
   * Count Type RoomCountOutputType
   */

  export type RoomCountOutputType = {
    players: number
    games: number
  }

  export type RoomCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    players?: boolean | RoomCountOutputTypeCountPlayersArgs
    games?: boolean | RoomCountOutputTypeCountGamesArgs
  }

  // Custom InputTypes
  /**
   * RoomCountOutputType without action
   */
  export type RoomCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomCountOutputType
     */
    select?: RoomCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RoomCountOutputType without action
   */
  export type RoomCountOutputTypeCountPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoomPlayerWhereInput
  }

  /**
   * RoomCountOutputType without action
   */
  export type RoomCountOutputTypeCountGamesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameRecordWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    openId: string | null
    nickName: string | null
    avatarUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    openId: string | null
    nickName: string | null
    avatarUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    openId: number
    nickName: number
    avatarUrl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    openId?: true
    nickName?: true
    avatarUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    openId?: true
    nickName?: true
    avatarUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    openId?: true
    nickName?: true
    avatarUrl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    openId: string
    nickName: string
    avatarUrl: string
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    openId?: boolean
    nickName?: boolean
    avatarUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostedRooms?: boolean | User$hostedRoomsArgs<ExtArgs>
    roomPlayers?: boolean | User$roomPlayersArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    openId?: boolean
    nickName?: boolean
    avatarUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    openId?: boolean
    nickName?: boolean
    avatarUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    openId?: boolean
    nickName?: boolean
    avatarUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "openId" | "nickName" | "avatarUrl" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hostedRooms?: boolean | User$hostedRoomsArgs<ExtArgs>
    roomPlayers?: boolean | User$roomPlayersArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      hostedRooms: Prisma.$RoomPayload<ExtArgs>[]
      roomPlayers: Prisma.$RoomPlayerPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      openId: string
      nickName: string
      avatarUrl: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    hostedRooms<T extends User$hostedRoomsArgs<ExtArgs> = {}>(args?: Subset<T, User$hostedRoomsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    roomPlayers<T extends User$roomPlayersArgs<ExtArgs> = {}>(args?: Subset<T, User$roomPlayersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly openId: FieldRef<"User", 'String'>
    readonly nickName: FieldRef<"User", 'String'>
    readonly avatarUrl: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.hostedRooms
   */
  export type User$hostedRoomsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    where?: RoomWhereInput
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    cursor?: RoomWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * User.roomPlayers
   */
  export type User$roomPlayersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    where?: RoomPlayerWhereInput
    orderBy?: RoomPlayerOrderByWithRelationInput | RoomPlayerOrderByWithRelationInput[]
    cursor?: RoomPlayerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RoomPlayerScalarFieldEnum | RoomPlayerScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Room
   */

  export type AggregateRoom = {
    _count: RoomCountAggregateOutputType | null
    _avg: RoomAvgAggregateOutputType | null
    _sum: RoomSumAggregateOutputType | null
    _min: RoomMinAggregateOutputType | null
    _max: RoomMaxAggregateOutputType | null
  }

  export type RoomAvgAggregateOutputType = {
    maxPlayers: number | null
  }

  export type RoomSumAggregateOutputType = {
    maxPlayers: number | null
  }

  export type RoomMinAggregateOutputType = {
    id: string | null
    code: string | null
    hostId: string | null
    status: $Enums.RoomStatus | null
    gameType: $Enums.GameType | null
    maxPlayers: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RoomMaxAggregateOutputType = {
    id: string | null
    code: string | null
    hostId: string | null
    status: $Enums.RoomStatus | null
    gameType: $Enums.GameType | null
    maxPlayers: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RoomCountAggregateOutputType = {
    id: number
    code: number
    hostId: number
    status: number
    gameType: number
    roleConfig: number
    maxPlayers: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RoomAvgAggregateInputType = {
    maxPlayers?: true
  }

  export type RoomSumAggregateInputType = {
    maxPlayers?: true
  }

  export type RoomMinAggregateInputType = {
    id?: true
    code?: true
    hostId?: true
    status?: true
    gameType?: true
    maxPlayers?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RoomMaxAggregateInputType = {
    id?: true
    code?: true
    hostId?: true
    status?: true
    gameType?: true
    maxPlayers?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RoomCountAggregateInputType = {
    id?: true
    code?: true
    hostId?: true
    status?: true
    gameType?: true
    roleConfig?: true
    maxPlayers?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RoomAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Room to aggregate.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Rooms
    **/
    _count?: true | RoomCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RoomAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RoomSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RoomMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RoomMaxAggregateInputType
  }

  export type GetRoomAggregateType<T extends RoomAggregateArgs> = {
        [P in keyof T & keyof AggregateRoom]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRoom[P]>
      : GetScalarType<T[P], AggregateRoom[P]>
  }




  export type RoomGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoomWhereInput
    orderBy?: RoomOrderByWithAggregationInput | RoomOrderByWithAggregationInput[]
    by: RoomScalarFieldEnum[] | RoomScalarFieldEnum
    having?: RoomScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RoomCountAggregateInputType | true
    _avg?: RoomAvgAggregateInputType
    _sum?: RoomSumAggregateInputType
    _min?: RoomMinAggregateInputType
    _max?: RoomMaxAggregateInputType
  }

  export type RoomGroupByOutputType = {
    id: string
    code: string
    hostId: string
    status: $Enums.RoomStatus
    gameType: $Enums.GameType
    roleConfig: JsonValue
    maxPlayers: number
    createdAt: Date
    updatedAt: Date
    _count: RoomCountAggregateOutputType | null
    _avg: RoomAvgAggregateOutputType | null
    _sum: RoomSumAggregateOutputType | null
    _min: RoomMinAggregateOutputType | null
    _max: RoomMaxAggregateOutputType | null
  }

  type GetRoomGroupByPayload<T extends RoomGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RoomGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RoomGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RoomGroupByOutputType[P]>
            : GetScalarType<T[P], RoomGroupByOutputType[P]>
        }
      >
    >


  export type RoomSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    hostId?: boolean
    status?: boolean
    gameType?: boolean
    roleConfig?: boolean
    maxPlayers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
    players?: boolean | Room$playersArgs<ExtArgs>
    games?: boolean | Room$gamesArgs<ExtArgs>
    _count?: boolean | RoomCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["room"]>

  export type RoomSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    hostId?: boolean
    status?: boolean
    gameType?: boolean
    roleConfig?: boolean
    maxPlayers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["room"]>

  export type RoomSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    hostId?: boolean
    status?: boolean
    gameType?: boolean
    roleConfig?: boolean
    maxPlayers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["room"]>

  export type RoomSelectScalar = {
    id?: boolean
    code?: boolean
    hostId?: boolean
    status?: boolean
    gameType?: boolean
    roleConfig?: boolean
    maxPlayers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RoomOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "code" | "hostId" | "status" | "gameType" | "roleConfig" | "maxPlayers" | "createdAt" | "updatedAt", ExtArgs["result"]["room"]>
  export type RoomInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
    players?: boolean | Room$playersArgs<ExtArgs>
    games?: boolean | Room$gamesArgs<ExtArgs>
    _count?: boolean | RoomCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RoomIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RoomIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RoomPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Room"
    objects: {
      host: Prisma.$UserPayload<ExtArgs>
      players: Prisma.$RoomPlayerPayload<ExtArgs>[]
      games: Prisma.$GameRecordPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      code: string
      hostId: string
      status: $Enums.RoomStatus
      gameType: $Enums.GameType
      roleConfig: Prisma.JsonValue
      maxPlayers: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["room"]>
    composites: {}
  }

  type RoomGetPayload<S extends boolean | null | undefined | RoomDefaultArgs> = $Result.GetResult<Prisma.$RoomPayload, S>

  type RoomCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RoomFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RoomCountAggregateInputType | true
    }

  export interface RoomDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Room'], meta: { name: 'Room' } }
    /**
     * Find zero or one Room that matches the filter.
     * @param {RoomFindUniqueArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RoomFindUniqueArgs>(args: SelectSubset<T, RoomFindUniqueArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Room that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RoomFindUniqueOrThrowArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RoomFindUniqueOrThrowArgs>(args: SelectSubset<T, RoomFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Room that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomFindFirstArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RoomFindFirstArgs>(args?: SelectSubset<T, RoomFindFirstArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Room that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomFindFirstOrThrowArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RoomFindFirstOrThrowArgs>(args?: SelectSubset<T, RoomFindFirstOrThrowArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Rooms that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Rooms
     * const rooms = await prisma.room.findMany()
     * 
     * // Get first 10 Rooms
     * const rooms = await prisma.room.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const roomWithIdOnly = await prisma.room.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RoomFindManyArgs>(args?: SelectSubset<T, RoomFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Room.
     * @param {RoomCreateArgs} args - Arguments to create a Room.
     * @example
     * // Create one Room
     * const Room = await prisma.room.create({
     *   data: {
     *     // ... data to create a Room
     *   }
     * })
     * 
     */
    create<T extends RoomCreateArgs>(args: SelectSubset<T, RoomCreateArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Rooms.
     * @param {RoomCreateManyArgs} args - Arguments to create many Rooms.
     * @example
     * // Create many Rooms
     * const room = await prisma.room.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RoomCreateManyArgs>(args?: SelectSubset<T, RoomCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Rooms and returns the data saved in the database.
     * @param {RoomCreateManyAndReturnArgs} args - Arguments to create many Rooms.
     * @example
     * // Create many Rooms
     * const room = await prisma.room.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Rooms and only return the `id`
     * const roomWithIdOnly = await prisma.room.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RoomCreateManyAndReturnArgs>(args?: SelectSubset<T, RoomCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Room.
     * @param {RoomDeleteArgs} args - Arguments to delete one Room.
     * @example
     * // Delete one Room
     * const Room = await prisma.room.delete({
     *   where: {
     *     // ... filter to delete one Room
     *   }
     * })
     * 
     */
    delete<T extends RoomDeleteArgs>(args: SelectSubset<T, RoomDeleteArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Room.
     * @param {RoomUpdateArgs} args - Arguments to update one Room.
     * @example
     * // Update one Room
     * const room = await prisma.room.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RoomUpdateArgs>(args: SelectSubset<T, RoomUpdateArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Rooms.
     * @param {RoomDeleteManyArgs} args - Arguments to filter Rooms to delete.
     * @example
     * // Delete a few Rooms
     * const { count } = await prisma.room.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RoomDeleteManyArgs>(args?: SelectSubset<T, RoomDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rooms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Rooms
     * const room = await prisma.room.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RoomUpdateManyArgs>(args: SelectSubset<T, RoomUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rooms and returns the data updated in the database.
     * @param {RoomUpdateManyAndReturnArgs} args - Arguments to update many Rooms.
     * @example
     * // Update many Rooms
     * const room = await prisma.room.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Rooms and only return the `id`
     * const roomWithIdOnly = await prisma.room.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RoomUpdateManyAndReturnArgs>(args: SelectSubset<T, RoomUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Room.
     * @param {RoomUpsertArgs} args - Arguments to update or create a Room.
     * @example
     * // Update or create a Room
     * const room = await prisma.room.upsert({
     *   create: {
     *     // ... data to create a Room
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Room we want to update
     *   }
     * })
     */
    upsert<T extends RoomUpsertArgs>(args: SelectSubset<T, RoomUpsertArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Rooms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomCountArgs} args - Arguments to filter Rooms to count.
     * @example
     * // Count the number of Rooms
     * const count = await prisma.room.count({
     *   where: {
     *     // ... the filter for the Rooms we want to count
     *   }
     * })
    **/
    count<T extends RoomCountArgs>(
      args?: Subset<T, RoomCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RoomCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Room.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RoomAggregateArgs>(args: Subset<T, RoomAggregateArgs>): Prisma.PrismaPromise<GetRoomAggregateType<T>>

    /**
     * Group by Room.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RoomGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RoomGroupByArgs['orderBy'] }
        : { orderBy?: RoomGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RoomGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoomGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Room model
   */
  readonly fields: RoomFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Room.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RoomClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    host<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    players<T extends Room$playersArgs<ExtArgs> = {}>(args?: Subset<T, Room$playersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    games<T extends Room$gamesArgs<ExtArgs> = {}>(args?: Subset<T, Room$gamesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Room model
   */
  interface RoomFieldRefs {
    readonly id: FieldRef<"Room", 'String'>
    readonly code: FieldRef<"Room", 'String'>
    readonly hostId: FieldRef<"Room", 'String'>
    readonly status: FieldRef<"Room", 'RoomStatus'>
    readonly gameType: FieldRef<"Room", 'GameType'>
    readonly roleConfig: FieldRef<"Room", 'Json'>
    readonly maxPlayers: FieldRef<"Room", 'Int'>
    readonly createdAt: FieldRef<"Room", 'DateTime'>
    readonly updatedAt: FieldRef<"Room", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Room findUnique
   */
  export type RoomFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room findUniqueOrThrow
   */
  export type RoomFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room findFirst
   */
  export type RoomFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rooms.
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rooms.
     */
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * Room findFirstOrThrow
   */
  export type RoomFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rooms.
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rooms.
     */
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * Room findMany
   */
  export type RoomFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Rooms to fetch.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Rooms.
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rooms.
     */
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * Room create
   */
  export type RoomCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * The data needed to create a Room.
     */
    data: XOR<RoomCreateInput, RoomUncheckedCreateInput>
  }

  /**
   * Room createMany
   */
  export type RoomCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Rooms.
     */
    data: RoomCreateManyInput | RoomCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Room createManyAndReturn
   */
  export type RoomCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * The data used to create many Rooms.
     */
    data: RoomCreateManyInput | RoomCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Room update
   */
  export type RoomUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * The data needed to update a Room.
     */
    data: XOR<RoomUpdateInput, RoomUncheckedUpdateInput>
    /**
     * Choose, which Room to update.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room updateMany
   */
  export type RoomUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Rooms.
     */
    data: XOR<RoomUpdateManyMutationInput, RoomUncheckedUpdateManyInput>
    /**
     * Filter which Rooms to update
     */
    where?: RoomWhereInput
    /**
     * Limit how many Rooms to update.
     */
    limit?: number
  }

  /**
   * Room updateManyAndReturn
   */
  export type RoomUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * The data used to update Rooms.
     */
    data: XOR<RoomUpdateManyMutationInput, RoomUncheckedUpdateManyInput>
    /**
     * Filter which Rooms to update
     */
    where?: RoomWhereInput
    /**
     * Limit how many Rooms to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Room upsert
   */
  export type RoomUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * The filter to search for the Room to update in case it exists.
     */
    where: RoomWhereUniqueInput
    /**
     * In case the Room found by the `where` argument doesn't exist, create a new Room with this data.
     */
    create: XOR<RoomCreateInput, RoomUncheckedCreateInput>
    /**
     * In case the Room was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RoomUpdateInput, RoomUncheckedUpdateInput>
  }

  /**
   * Room delete
   */
  export type RoomDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter which Room to delete.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room deleteMany
   */
  export type RoomDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Rooms to delete
     */
    where?: RoomWhereInput
    /**
     * Limit how many Rooms to delete.
     */
    limit?: number
  }

  /**
   * Room.players
   */
  export type Room$playersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    where?: RoomPlayerWhereInput
    orderBy?: RoomPlayerOrderByWithRelationInput | RoomPlayerOrderByWithRelationInput[]
    cursor?: RoomPlayerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RoomPlayerScalarFieldEnum | RoomPlayerScalarFieldEnum[]
  }

  /**
   * Room.games
   */
  export type Room$gamesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    where?: GameRecordWhereInput
    orderBy?: GameRecordOrderByWithRelationInput | GameRecordOrderByWithRelationInput[]
    cursor?: GameRecordWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameRecordScalarFieldEnum | GameRecordScalarFieldEnum[]
  }

  /**
   * Room without action
   */
  export type RoomDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
  }


  /**
   * Model RoomPlayer
   */

  export type AggregateRoomPlayer = {
    _count: RoomPlayerCountAggregateOutputType | null
    _avg: RoomPlayerAvgAggregateOutputType | null
    _sum: RoomPlayerSumAggregateOutputType | null
    _min: RoomPlayerMinAggregateOutputType | null
    _max: RoomPlayerMaxAggregateOutputType | null
  }

  export type RoomPlayerAvgAggregateOutputType = {
    seatNo: number | null
  }

  export type RoomPlayerSumAggregateOutputType = {
    seatNo: number | null
  }

  export type RoomPlayerMinAggregateOutputType = {
    id: string | null
    roomId: string | null
    userId: string | null
    seatNo: number | null
    role: string | null
    joinedAt: Date | null
  }

  export type RoomPlayerMaxAggregateOutputType = {
    id: string | null
    roomId: string | null
    userId: string | null
    seatNo: number | null
    role: string | null
    joinedAt: Date | null
  }

  export type RoomPlayerCountAggregateOutputType = {
    id: number
    roomId: number
    userId: number
    seatNo: number
    role: number
    joinedAt: number
    _all: number
  }


  export type RoomPlayerAvgAggregateInputType = {
    seatNo?: true
  }

  export type RoomPlayerSumAggregateInputType = {
    seatNo?: true
  }

  export type RoomPlayerMinAggregateInputType = {
    id?: true
    roomId?: true
    userId?: true
    seatNo?: true
    role?: true
    joinedAt?: true
  }

  export type RoomPlayerMaxAggregateInputType = {
    id?: true
    roomId?: true
    userId?: true
    seatNo?: true
    role?: true
    joinedAt?: true
  }

  export type RoomPlayerCountAggregateInputType = {
    id?: true
    roomId?: true
    userId?: true
    seatNo?: true
    role?: true
    joinedAt?: true
    _all?: true
  }

  export type RoomPlayerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RoomPlayer to aggregate.
     */
    where?: RoomPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RoomPlayers to fetch.
     */
    orderBy?: RoomPlayerOrderByWithRelationInput | RoomPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RoomPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RoomPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RoomPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RoomPlayers
    **/
    _count?: true | RoomPlayerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RoomPlayerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RoomPlayerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RoomPlayerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RoomPlayerMaxAggregateInputType
  }

  export type GetRoomPlayerAggregateType<T extends RoomPlayerAggregateArgs> = {
        [P in keyof T & keyof AggregateRoomPlayer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRoomPlayer[P]>
      : GetScalarType<T[P], AggregateRoomPlayer[P]>
  }




  export type RoomPlayerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoomPlayerWhereInput
    orderBy?: RoomPlayerOrderByWithAggregationInput | RoomPlayerOrderByWithAggregationInput[]
    by: RoomPlayerScalarFieldEnum[] | RoomPlayerScalarFieldEnum
    having?: RoomPlayerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RoomPlayerCountAggregateInputType | true
    _avg?: RoomPlayerAvgAggregateInputType
    _sum?: RoomPlayerSumAggregateInputType
    _min?: RoomPlayerMinAggregateInputType
    _max?: RoomPlayerMaxAggregateInputType
  }

  export type RoomPlayerGroupByOutputType = {
    id: string
    roomId: string
    userId: string
    seatNo: number
    role: string | null
    joinedAt: Date
    _count: RoomPlayerCountAggregateOutputType | null
    _avg: RoomPlayerAvgAggregateOutputType | null
    _sum: RoomPlayerSumAggregateOutputType | null
    _min: RoomPlayerMinAggregateOutputType | null
    _max: RoomPlayerMaxAggregateOutputType | null
  }

  type GetRoomPlayerGroupByPayload<T extends RoomPlayerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RoomPlayerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RoomPlayerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RoomPlayerGroupByOutputType[P]>
            : GetScalarType<T[P], RoomPlayerGroupByOutputType[P]>
        }
      >
    >


  export type RoomPlayerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomId?: boolean
    userId?: boolean
    seatNo?: boolean
    role?: boolean
    joinedAt?: boolean
    room?: boolean | RoomDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["roomPlayer"]>

  export type RoomPlayerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomId?: boolean
    userId?: boolean
    seatNo?: boolean
    role?: boolean
    joinedAt?: boolean
    room?: boolean | RoomDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["roomPlayer"]>

  export type RoomPlayerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomId?: boolean
    userId?: boolean
    seatNo?: boolean
    role?: boolean
    joinedAt?: boolean
    room?: boolean | RoomDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["roomPlayer"]>

  export type RoomPlayerSelectScalar = {
    id?: boolean
    roomId?: boolean
    userId?: boolean
    seatNo?: boolean
    role?: boolean
    joinedAt?: boolean
  }

  export type RoomPlayerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "roomId" | "userId" | "seatNo" | "role" | "joinedAt", ExtArgs["result"]["roomPlayer"]>
  export type RoomPlayerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    room?: boolean | RoomDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RoomPlayerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    room?: boolean | RoomDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RoomPlayerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    room?: boolean | RoomDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RoomPlayerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RoomPlayer"
    objects: {
      room: Prisma.$RoomPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      roomId: string
      userId: string
      seatNo: number
      role: string | null
      joinedAt: Date
    }, ExtArgs["result"]["roomPlayer"]>
    composites: {}
  }

  type RoomPlayerGetPayload<S extends boolean | null | undefined | RoomPlayerDefaultArgs> = $Result.GetResult<Prisma.$RoomPlayerPayload, S>

  type RoomPlayerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RoomPlayerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RoomPlayerCountAggregateInputType | true
    }

  export interface RoomPlayerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RoomPlayer'], meta: { name: 'RoomPlayer' } }
    /**
     * Find zero or one RoomPlayer that matches the filter.
     * @param {RoomPlayerFindUniqueArgs} args - Arguments to find a RoomPlayer
     * @example
     * // Get one RoomPlayer
     * const roomPlayer = await prisma.roomPlayer.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RoomPlayerFindUniqueArgs>(args: SelectSubset<T, RoomPlayerFindUniqueArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RoomPlayer that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RoomPlayerFindUniqueOrThrowArgs} args - Arguments to find a RoomPlayer
     * @example
     * // Get one RoomPlayer
     * const roomPlayer = await prisma.roomPlayer.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RoomPlayerFindUniqueOrThrowArgs>(args: SelectSubset<T, RoomPlayerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RoomPlayer that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerFindFirstArgs} args - Arguments to find a RoomPlayer
     * @example
     * // Get one RoomPlayer
     * const roomPlayer = await prisma.roomPlayer.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RoomPlayerFindFirstArgs>(args?: SelectSubset<T, RoomPlayerFindFirstArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RoomPlayer that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerFindFirstOrThrowArgs} args - Arguments to find a RoomPlayer
     * @example
     * // Get one RoomPlayer
     * const roomPlayer = await prisma.roomPlayer.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RoomPlayerFindFirstOrThrowArgs>(args?: SelectSubset<T, RoomPlayerFindFirstOrThrowArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RoomPlayers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RoomPlayers
     * const roomPlayers = await prisma.roomPlayer.findMany()
     * 
     * // Get first 10 RoomPlayers
     * const roomPlayers = await prisma.roomPlayer.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const roomPlayerWithIdOnly = await prisma.roomPlayer.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RoomPlayerFindManyArgs>(args?: SelectSubset<T, RoomPlayerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RoomPlayer.
     * @param {RoomPlayerCreateArgs} args - Arguments to create a RoomPlayer.
     * @example
     * // Create one RoomPlayer
     * const RoomPlayer = await prisma.roomPlayer.create({
     *   data: {
     *     // ... data to create a RoomPlayer
     *   }
     * })
     * 
     */
    create<T extends RoomPlayerCreateArgs>(args: SelectSubset<T, RoomPlayerCreateArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RoomPlayers.
     * @param {RoomPlayerCreateManyArgs} args - Arguments to create many RoomPlayers.
     * @example
     * // Create many RoomPlayers
     * const roomPlayer = await prisma.roomPlayer.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RoomPlayerCreateManyArgs>(args?: SelectSubset<T, RoomPlayerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RoomPlayers and returns the data saved in the database.
     * @param {RoomPlayerCreateManyAndReturnArgs} args - Arguments to create many RoomPlayers.
     * @example
     * // Create many RoomPlayers
     * const roomPlayer = await prisma.roomPlayer.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RoomPlayers and only return the `id`
     * const roomPlayerWithIdOnly = await prisma.roomPlayer.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RoomPlayerCreateManyAndReturnArgs>(args?: SelectSubset<T, RoomPlayerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RoomPlayer.
     * @param {RoomPlayerDeleteArgs} args - Arguments to delete one RoomPlayer.
     * @example
     * // Delete one RoomPlayer
     * const RoomPlayer = await prisma.roomPlayer.delete({
     *   where: {
     *     // ... filter to delete one RoomPlayer
     *   }
     * })
     * 
     */
    delete<T extends RoomPlayerDeleteArgs>(args: SelectSubset<T, RoomPlayerDeleteArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RoomPlayer.
     * @param {RoomPlayerUpdateArgs} args - Arguments to update one RoomPlayer.
     * @example
     * // Update one RoomPlayer
     * const roomPlayer = await prisma.roomPlayer.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RoomPlayerUpdateArgs>(args: SelectSubset<T, RoomPlayerUpdateArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RoomPlayers.
     * @param {RoomPlayerDeleteManyArgs} args - Arguments to filter RoomPlayers to delete.
     * @example
     * // Delete a few RoomPlayers
     * const { count } = await prisma.roomPlayer.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RoomPlayerDeleteManyArgs>(args?: SelectSubset<T, RoomPlayerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RoomPlayers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RoomPlayers
     * const roomPlayer = await prisma.roomPlayer.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RoomPlayerUpdateManyArgs>(args: SelectSubset<T, RoomPlayerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RoomPlayers and returns the data updated in the database.
     * @param {RoomPlayerUpdateManyAndReturnArgs} args - Arguments to update many RoomPlayers.
     * @example
     * // Update many RoomPlayers
     * const roomPlayer = await prisma.roomPlayer.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RoomPlayers and only return the `id`
     * const roomPlayerWithIdOnly = await prisma.roomPlayer.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RoomPlayerUpdateManyAndReturnArgs>(args: SelectSubset<T, RoomPlayerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RoomPlayer.
     * @param {RoomPlayerUpsertArgs} args - Arguments to update or create a RoomPlayer.
     * @example
     * // Update or create a RoomPlayer
     * const roomPlayer = await prisma.roomPlayer.upsert({
     *   create: {
     *     // ... data to create a RoomPlayer
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RoomPlayer we want to update
     *   }
     * })
     */
    upsert<T extends RoomPlayerUpsertArgs>(args: SelectSubset<T, RoomPlayerUpsertArgs<ExtArgs>>): Prisma__RoomPlayerClient<$Result.GetResult<Prisma.$RoomPlayerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RoomPlayers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerCountArgs} args - Arguments to filter RoomPlayers to count.
     * @example
     * // Count the number of RoomPlayers
     * const count = await prisma.roomPlayer.count({
     *   where: {
     *     // ... the filter for the RoomPlayers we want to count
     *   }
     * })
    **/
    count<T extends RoomPlayerCountArgs>(
      args?: Subset<T, RoomPlayerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RoomPlayerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RoomPlayer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RoomPlayerAggregateArgs>(args: Subset<T, RoomPlayerAggregateArgs>): Prisma.PrismaPromise<GetRoomPlayerAggregateType<T>>

    /**
     * Group by RoomPlayer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomPlayerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RoomPlayerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RoomPlayerGroupByArgs['orderBy'] }
        : { orderBy?: RoomPlayerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RoomPlayerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoomPlayerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RoomPlayer model
   */
  readonly fields: RoomPlayerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RoomPlayer.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RoomPlayerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    room<T extends RoomDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RoomDefaultArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RoomPlayer model
   */
  interface RoomPlayerFieldRefs {
    readonly id: FieldRef<"RoomPlayer", 'String'>
    readonly roomId: FieldRef<"RoomPlayer", 'String'>
    readonly userId: FieldRef<"RoomPlayer", 'String'>
    readonly seatNo: FieldRef<"RoomPlayer", 'Int'>
    readonly role: FieldRef<"RoomPlayer", 'String'>
    readonly joinedAt: FieldRef<"RoomPlayer", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RoomPlayer findUnique
   */
  export type RoomPlayerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * Filter, which RoomPlayer to fetch.
     */
    where: RoomPlayerWhereUniqueInput
  }

  /**
   * RoomPlayer findUniqueOrThrow
   */
  export type RoomPlayerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * Filter, which RoomPlayer to fetch.
     */
    where: RoomPlayerWhereUniqueInput
  }

  /**
   * RoomPlayer findFirst
   */
  export type RoomPlayerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * Filter, which RoomPlayer to fetch.
     */
    where?: RoomPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RoomPlayers to fetch.
     */
    orderBy?: RoomPlayerOrderByWithRelationInput | RoomPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RoomPlayers.
     */
    cursor?: RoomPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RoomPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RoomPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RoomPlayers.
     */
    distinct?: RoomPlayerScalarFieldEnum | RoomPlayerScalarFieldEnum[]
  }

  /**
   * RoomPlayer findFirstOrThrow
   */
  export type RoomPlayerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * Filter, which RoomPlayer to fetch.
     */
    where?: RoomPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RoomPlayers to fetch.
     */
    orderBy?: RoomPlayerOrderByWithRelationInput | RoomPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RoomPlayers.
     */
    cursor?: RoomPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RoomPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RoomPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RoomPlayers.
     */
    distinct?: RoomPlayerScalarFieldEnum | RoomPlayerScalarFieldEnum[]
  }

  /**
   * RoomPlayer findMany
   */
  export type RoomPlayerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * Filter, which RoomPlayers to fetch.
     */
    where?: RoomPlayerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RoomPlayers to fetch.
     */
    orderBy?: RoomPlayerOrderByWithRelationInput | RoomPlayerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RoomPlayers.
     */
    cursor?: RoomPlayerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RoomPlayers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RoomPlayers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RoomPlayers.
     */
    distinct?: RoomPlayerScalarFieldEnum | RoomPlayerScalarFieldEnum[]
  }

  /**
   * RoomPlayer create
   */
  export type RoomPlayerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * The data needed to create a RoomPlayer.
     */
    data: XOR<RoomPlayerCreateInput, RoomPlayerUncheckedCreateInput>
  }

  /**
   * RoomPlayer createMany
   */
  export type RoomPlayerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RoomPlayers.
     */
    data: RoomPlayerCreateManyInput | RoomPlayerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RoomPlayer createManyAndReturn
   */
  export type RoomPlayerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * The data used to create many RoomPlayers.
     */
    data: RoomPlayerCreateManyInput | RoomPlayerCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RoomPlayer update
   */
  export type RoomPlayerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * The data needed to update a RoomPlayer.
     */
    data: XOR<RoomPlayerUpdateInput, RoomPlayerUncheckedUpdateInput>
    /**
     * Choose, which RoomPlayer to update.
     */
    where: RoomPlayerWhereUniqueInput
  }

  /**
   * RoomPlayer updateMany
   */
  export type RoomPlayerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RoomPlayers.
     */
    data: XOR<RoomPlayerUpdateManyMutationInput, RoomPlayerUncheckedUpdateManyInput>
    /**
     * Filter which RoomPlayers to update
     */
    where?: RoomPlayerWhereInput
    /**
     * Limit how many RoomPlayers to update.
     */
    limit?: number
  }

  /**
   * RoomPlayer updateManyAndReturn
   */
  export type RoomPlayerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * The data used to update RoomPlayers.
     */
    data: XOR<RoomPlayerUpdateManyMutationInput, RoomPlayerUncheckedUpdateManyInput>
    /**
     * Filter which RoomPlayers to update
     */
    where?: RoomPlayerWhereInput
    /**
     * Limit how many RoomPlayers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RoomPlayer upsert
   */
  export type RoomPlayerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * The filter to search for the RoomPlayer to update in case it exists.
     */
    where: RoomPlayerWhereUniqueInput
    /**
     * In case the RoomPlayer found by the `where` argument doesn't exist, create a new RoomPlayer with this data.
     */
    create: XOR<RoomPlayerCreateInput, RoomPlayerUncheckedCreateInput>
    /**
     * In case the RoomPlayer was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RoomPlayerUpdateInput, RoomPlayerUncheckedUpdateInput>
  }

  /**
   * RoomPlayer delete
   */
  export type RoomPlayerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
    /**
     * Filter which RoomPlayer to delete.
     */
    where: RoomPlayerWhereUniqueInput
  }

  /**
   * RoomPlayer deleteMany
   */
  export type RoomPlayerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RoomPlayers to delete
     */
    where?: RoomPlayerWhereInput
    /**
     * Limit how many RoomPlayers to delete.
     */
    limit?: number
  }

  /**
   * RoomPlayer without action
   */
  export type RoomPlayerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomPlayer
     */
    select?: RoomPlayerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoomPlayer
     */
    omit?: RoomPlayerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomPlayerInclude<ExtArgs> | null
  }


  /**
   * Model GameRecord
   */

  export type AggregateGameRecord = {
    _count: GameRecordCountAggregateOutputType | null
    _min: GameRecordMinAggregateOutputType | null
    _max: GameRecordMaxAggregateOutputType | null
  }

  export type GameRecordMinAggregateOutputType = {
    id: string | null
    roomId: string | null
    startedAt: Date | null
    endedAt: Date | null
  }

  export type GameRecordMaxAggregateOutputType = {
    id: string | null
    roomId: string | null
    startedAt: Date | null
    endedAt: Date | null
  }

  export type GameRecordCountAggregateOutputType = {
    id: number
    roomId: number
    roles: number
    startedAt: number
    endedAt: number
    _all: number
  }


  export type GameRecordMinAggregateInputType = {
    id?: true
    roomId?: true
    startedAt?: true
    endedAt?: true
  }

  export type GameRecordMaxAggregateInputType = {
    id?: true
    roomId?: true
    startedAt?: true
    endedAt?: true
  }

  export type GameRecordCountAggregateInputType = {
    id?: true
    roomId?: true
    roles?: true
    startedAt?: true
    endedAt?: true
    _all?: true
  }

  export type GameRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameRecord to aggregate.
     */
    where?: GameRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameRecords to fetch.
     */
    orderBy?: GameRecordOrderByWithRelationInput | GameRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GameRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GameRecords
    **/
    _count?: true | GameRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GameRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GameRecordMaxAggregateInputType
  }

  export type GetGameRecordAggregateType<T extends GameRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateGameRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGameRecord[P]>
      : GetScalarType<T[P], AggregateGameRecord[P]>
  }




  export type GameRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GameRecordWhereInput
    orderBy?: GameRecordOrderByWithAggregationInput | GameRecordOrderByWithAggregationInput[]
    by: GameRecordScalarFieldEnum[] | GameRecordScalarFieldEnum
    having?: GameRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameRecordCountAggregateInputType | true
    _min?: GameRecordMinAggregateInputType
    _max?: GameRecordMaxAggregateInputType
  }

  export type GameRecordGroupByOutputType = {
    id: string
    roomId: string
    roles: JsonValue
    startedAt: Date
    endedAt: Date | null
    _count: GameRecordCountAggregateOutputType | null
    _min: GameRecordMinAggregateOutputType | null
    _max: GameRecordMaxAggregateOutputType | null
  }

  type GetGameRecordGroupByPayload<T extends GameRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GameRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GameRecordGroupByOutputType[P]>
            : GetScalarType<T[P], GameRecordGroupByOutputType[P]>
        }
      >
    >


  export type GameRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomId?: boolean
    roles?: boolean
    startedAt?: boolean
    endedAt?: boolean
    room?: boolean | RoomDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameRecord"]>

  export type GameRecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomId?: boolean
    roles?: boolean
    startedAt?: boolean
    endedAt?: boolean
    room?: boolean | RoomDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameRecord"]>

  export type GameRecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomId?: boolean
    roles?: boolean
    startedAt?: boolean
    endedAt?: boolean
    room?: boolean | RoomDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["gameRecord"]>

  export type GameRecordSelectScalar = {
    id?: boolean
    roomId?: boolean
    roles?: boolean
    startedAt?: boolean
    endedAt?: boolean
  }

  export type GameRecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "roomId" | "roles" | "startedAt" | "endedAt", ExtArgs["result"]["gameRecord"]>
  export type GameRecordInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    room?: boolean | RoomDefaultArgs<ExtArgs>
  }
  export type GameRecordIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    room?: boolean | RoomDefaultArgs<ExtArgs>
  }
  export type GameRecordIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    room?: boolean | RoomDefaultArgs<ExtArgs>
  }

  export type $GameRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GameRecord"
    objects: {
      room: Prisma.$RoomPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      roomId: string
      roles: Prisma.JsonValue
      startedAt: Date
      endedAt: Date | null
    }, ExtArgs["result"]["gameRecord"]>
    composites: {}
  }

  type GameRecordGetPayload<S extends boolean | null | undefined | GameRecordDefaultArgs> = $Result.GetResult<Prisma.$GameRecordPayload, S>

  type GameRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GameRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GameRecordCountAggregateInputType | true
    }

  export interface GameRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GameRecord'], meta: { name: 'GameRecord' } }
    /**
     * Find zero or one GameRecord that matches the filter.
     * @param {GameRecordFindUniqueArgs} args - Arguments to find a GameRecord
     * @example
     * // Get one GameRecord
     * const gameRecord = await prisma.gameRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameRecordFindUniqueArgs>(args: SelectSubset<T, GameRecordFindUniqueArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GameRecord that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameRecordFindUniqueOrThrowArgs} args - Arguments to find a GameRecord
     * @example
     * // Get one GameRecord
     * const gameRecord = await prisma.gameRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, GameRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordFindFirstArgs} args - Arguments to find a GameRecord
     * @example
     * // Get one GameRecord
     * const gameRecord = await prisma.gameRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameRecordFindFirstArgs>(args?: SelectSubset<T, GameRecordFindFirstArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GameRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordFindFirstOrThrowArgs} args - Arguments to find a GameRecord
     * @example
     * // Get one GameRecord
     * const gameRecord = await prisma.gameRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, GameRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GameRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GameRecords
     * const gameRecords = await prisma.gameRecord.findMany()
     * 
     * // Get first 10 GameRecords
     * const gameRecords = await prisma.gameRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const gameRecordWithIdOnly = await prisma.gameRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GameRecordFindManyArgs>(args?: SelectSubset<T, GameRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GameRecord.
     * @param {GameRecordCreateArgs} args - Arguments to create a GameRecord.
     * @example
     * // Create one GameRecord
     * const GameRecord = await prisma.gameRecord.create({
     *   data: {
     *     // ... data to create a GameRecord
     *   }
     * })
     * 
     */
    create<T extends GameRecordCreateArgs>(args: SelectSubset<T, GameRecordCreateArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GameRecords.
     * @param {GameRecordCreateManyArgs} args - Arguments to create many GameRecords.
     * @example
     * // Create many GameRecords
     * const gameRecord = await prisma.gameRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GameRecordCreateManyArgs>(args?: SelectSubset<T, GameRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GameRecords and returns the data saved in the database.
     * @param {GameRecordCreateManyAndReturnArgs} args - Arguments to create many GameRecords.
     * @example
     * // Create many GameRecords
     * const gameRecord = await prisma.gameRecord.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GameRecords and only return the `id`
     * const gameRecordWithIdOnly = await prisma.gameRecord.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GameRecordCreateManyAndReturnArgs>(args?: SelectSubset<T, GameRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GameRecord.
     * @param {GameRecordDeleteArgs} args - Arguments to delete one GameRecord.
     * @example
     * // Delete one GameRecord
     * const GameRecord = await prisma.gameRecord.delete({
     *   where: {
     *     // ... filter to delete one GameRecord
     *   }
     * })
     * 
     */
    delete<T extends GameRecordDeleteArgs>(args: SelectSubset<T, GameRecordDeleteArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GameRecord.
     * @param {GameRecordUpdateArgs} args - Arguments to update one GameRecord.
     * @example
     * // Update one GameRecord
     * const gameRecord = await prisma.gameRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GameRecordUpdateArgs>(args: SelectSubset<T, GameRecordUpdateArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GameRecords.
     * @param {GameRecordDeleteManyArgs} args - Arguments to filter GameRecords to delete.
     * @example
     * // Delete a few GameRecords
     * const { count } = await prisma.gameRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GameRecordDeleteManyArgs>(args?: SelectSubset<T, GameRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GameRecords
     * const gameRecord = await prisma.gameRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GameRecordUpdateManyArgs>(args: SelectSubset<T, GameRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GameRecords and returns the data updated in the database.
     * @param {GameRecordUpdateManyAndReturnArgs} args - Arguments to update many GameRecords.
     * @example
     * // Update many GameRecords
     * const gameRecord = await prisma.gameRecord.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GameRecords and only return the `id`
     * const gameRecordWithIdOnly = await prisma.gameRecord.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GameRecordUpdateManyAndReturnArgs>(args: SelectSubset<T, GameRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GameRecord.
     * @param {GameRecordUpsertArgs} args - Arguments to update or create a GameRecord.
     * @example
     * // Update or create a GameRecord
     * const gameRecord = await prisma.gameRecord.upsert({
     *   create: {
     *     // ... data to create a GameRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GameRecord we want to update
     *   }
     * })
     */
    upsert<T extends GameRecordUpsertArgs>(args: SelectSubset<T, GameRecordUpsertArgs<ExtArgs>>): Prisma__GameRecordClient<$Result.GetResult<Prisma.$GameRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GameRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordCountArgs} args - Arguments to filter GameRecords to count.
     * @example
     * // Count the number of GameRecords
     * const count = await prisma.gameRecord.count({
     *   where: {
     *     // ... the filter for the GameRecords we want to count
     *   }
     * })
    **/
    count<T extends GameRecordCountArgs>(
      args?: Subset<T, GameRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GameRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GameRecordAggregateArgs>(args: Subset<T, GameRecordAggregateArgs>): Prisma.PrismaPromise<GetGameRecordAggregateType<T>>

    /**
     * Group by GameRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameRecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GameRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameRecordGroupByArgs['orderBy'] }
        : { orderBy?: GameRecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GameRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGameRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GameRecord model
   */
  readonly fields: GameRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GameRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    room<T extends RoomDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RoomDefaultArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GameRecord model
   */
  interface GameRecordFieldRefs {
    readonly id: FieldRef<"GameRecord", 'String'>
    readonly roomId: FieldRef<"GameRecord", 'String'>
    readonly roles: FieldRef<"GameRecord", 'Json'>
    readonly startedAt: FieldRef<"GameRecord", 'DateTime'>
    readonly endedAt: FieldRef<"GameRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * GameRecord findUnique
   */
  export type GameRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * Filter, which GameRecord to fetch.
     */
    where: GameRecordWhereUniqueInput
  }

  /**
   * GameRecord findUniqueOrThrow
   */
  export type GameRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * Filter, which GameRecord to fetch.
     */
    where: GameRecordWhereUniqueInput
  }

  /**
   * GameRecord findFirst
   */
  export type GameRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * Filter, which GameRecord to fetch.
     */
    where?: GameRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameRecords to fetch.
     */
    orderBy?: GameRecordOrderByWithRelationInput | GameRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameRecords.
     */
    cursor?: GameRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameRecords.
     */
    distinct?: GameRecordScalarFieldEnum | GameRecordScalarFieldEnum[]
  }

  /**
   * GameRecord findFirstOrThrow
   */
  export type GameRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * Filter, which GameRecord to fetch.
     */
    where?: GameRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameRecords to fetch.
     */
    orderBy?: GameRecordOrderByWithRelationInput | GameRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GameRecords.
     */
    cursor?: GameRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameRecords.
     */
    distinct?: GameRecordScalarFieldEnum | GameRecordScalarFieldEnum[]
  }

  /**
   * GameRecord findMany
   */
  export type GameRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * Filter, which GameRecords to fetch.
     */
    where?: GameRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GameRecords to fetch.
     */
    orderBy?: GameRecordOrderByWithRelationInput | GameRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GameRecords.
     */
    cursor?: GameRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GameRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GameRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GameRecords.
     */
    distinct?: GameRecordScalarFieldEnum | GameRecordScalarFieldEnum[]
  }

  /**
   * GameRecord create
   */
  export type GameRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * The data needed to create a GameRecord.
     */
    data: XOR<GameRecordCreateInput, GameRecordUncheckedCreateInput>
  }

  /**
   * GameRecord createMany
   */
  export type GameRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GameRecords.
     */
    data: GameRecordCreateManyInput | GameRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * GameRecord createManyAndReturn
   */
  export type GameRecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * The data used to create many GameRecords.
     */
    data: GameRecordCreateManyInput | GameRecordCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameRecord update
   */
  export type GameRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * The data needed to update a GameRecord.
     */
    data: XOR<GameRecordUpdateInput, GameRecordUncheckedUpdateInput>
    /**
     * Choose, which GameRecord to update.
     */
    where: GameRecordWhereUniqueInput
  }

  /**
   * GameRecord updateMany
   */
  export type GameRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GameRecords.
     */
    data: XOR<GameRecordUpdateManyMutationInput, GameRecordUncheckedUpdateManyInput>
    /**
     * Filter which GameRecords to update
     */
    where?: GameRecordWhereInput
    /**
     * Limit how many GameRecords to update.
     */
    limit?: number
  }

  /**
   * GameRecord updateManyAndReturn
   */
  export type GameRecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * The data used to update GameRecords.
     */
    data: XOR<GameRecordUpdateManyMutationInput, GameRecordUncheckedUpdateManyInput>
    /**
     * Filter which GameRecords to update
     */
    where?: GameRecordWhereInput
    /**
     * Limit how many GameRecords to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GameRecord upsert
   */
  export type GameRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * The filter to search for the GameRecord to update in case it exists.
     */
    where: GameRecordWhereUniqueInput
    /**
     * In case the GameRecord found by the `where` argument doesn't exist, create a new GameRecord with this data.
     */
    create: XOR<GameRecordCreateInput, GameRecordUncheckedCreateInput>
    /**
     * In case the GameRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameRecordUpdateInput, GameRecordUncheckedUpdateInput>
  }

  /**
   * GameRecord delete
   */
  export type GameRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
    /**
     * Filter which GameRecord to delete.
     */
    where: GameRecordWhereUniqueInput
  }

  /**
   * GameRecord deleteMany
   */
  export type GameRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GameRecords to delete
     */
    where?: GameRecordWhereInput
    /**
     * Limit how many GameRecords to delete.
     */
    limit?: number
  }

  /**
   * GameRecord without action
   */
  export type GameRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GameRecord
     */
    select?: GameRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GameRecord
     */
    omit?: GameRecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameRecordInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    openId: 'openId',
    nickName: 'nickName',
    avatarUrl: 'avatarUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const RoomScalarFieldEnum: {
    id: 'id',
    code: 'code',
    hostId: 'hostId',
    status: 'status',
    gameType: 'gameType',
    roleConfig: 'roleConfig',
    maxPlayers: 'maxPlayers',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RoomScalarFieldEnum = (typeof RoomScalarFieldEnum)[keyof typeof RoomScalarFieldEnum]


  export const RoomPlayerScalarFieldEnum: {
    id: 'id',
    roomId: 'roomId',
    userId: 'userId',
    seatNo: 'seatNo',
    role: 'role',
    joinedAt: 'joinedAt'
  };

  export type RoomPlayerScalarFieldEnum = (typeof RoomPlayerScalarFieldEnum)[keyof typeof RoomPlayerScalarFieldEnum]


  export const GameRecordScalarFieldEnum: {
    id: 'id',
    roomId: 'roomId',
    roles: 'roles',
    startedAt: 'startedAt',
    endedAt: 'endedAt'
  };

  export type GameRecordScalarFieldEnum = (typeof GameRecordScalarFieldEnum)[keyof typeof GameRecordScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'RoomStatus'
   */
  export type EnumRoomStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RoomStatus'>
    


  /**
   * Reference to a field of type 'RoomStatus[]'
   */
  export type ListEnumRoomStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RoomStatus[]'>
    


  /**
   * Reference to a field of type 'GameType'
   */
  export type EnumGameTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'GameType'>
    


  /**
   * Reference to a field of type 'GameType[]'
   */
  export type ListEnumGameTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'GameType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    openId?: StringFilter<"User"> | string
    nickName?: StringFilter<"User"> | string
    avatarUrl?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    hostedRooms?: RoomListRelationFilter
    roomPlayers?: RoomPlayerListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    openId?: SortOrder
    nickName?: SortOrder
    avatarUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostedRooms?: RoomOrderByRelationAggregateInput
    roomPlayers?: RoomPlayerOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    openId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    nickName?: StringFilter<"User"> | string
    avatarUrl?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    hostedRooms?: RoomListRelationFilter
    roomPlayers?: RoomPlayerListRelationFilter
  }, "id" | "openId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    openId?: SortOrder
    nickName?: SortOrder
    avatarUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    openId?: StringWithAggregatesFilter<"User"> | string
    nickName?: StringWithAggregatesFilter<"User"> | string
    avatarUrl?: StringWithAggregatesFilter<"User"> | string
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type RoomWhereInput = {
    AND?: RoomWhereInput | RoomWhereInput[]
    OR?: RoomWhereInput[]
    NOT?: RoomWhereInput | RoomWhereInput[]
    id?: StringFilter<"Room"> | string
    code?: StringFilter<"Room"> | string
    hostId?: StringFilter<"Room"> | string
    status?: EnumRoomStatusFilter<"Room"> | $Enums.RoomStatus
    gameType?: EnumGameTypeFilter<"Room"> | $Enums.GameType
    roleConfig?: JsonFilter<"Room">
    maxPlayers?: IntFilter<"Room"> | number
    createdAt?: DateTimeFilter<"Room"> | Date | string
    updatedAt?: DateTimeFilter<"Room"> | Date | string
    host?: XOR<UserScalarRelationFilter, UserWhereInput>
    players?: RoomPlayerListRelationFilter
    games?: GameRecordListRelationFilter
  }

  export type RoomOrderByWithRelationInput = {
    id?: SortOrder
    code?: SortOrder
    hostId?: SortOrder
    status?: SortOrder
    gameType?: SortOrder
    roleConfig?: SortOrder
    maxPlayers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    host?: UserOrderByWithRelationInput
    players?: RoomPlayerOrderByRelationAggregateInput
    games?: GameRecordOrderByRelationAggregateInput
  }

  export type RoomWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: RoomWhereInput | RoomWhereInput[]
    OR?: RoomWhereInput[]
    NOT?: RoomWhereInput | RoomWhereInput[]
    hostId?: StringFilter<"Room"> | string
    status?: EnumRoomStatusFilter<"Room"> | $Enums.RoomStatus
    gameType?: EnumGameTypeFilter<"Room"> | $Enums.GameType
    roleConfig?: JsonFilter<"Room">
    maxPlayers?: IntFilter<"Room"> | number
    createdAt?: DateTimeFilter<"Room"> | Date | string
    updatedAt?: DateTimeFilter<"Room"> | Date | string
    host?: XOR<UserScalarRelationFilter, UserWhereInput>
    players?: RoomPlayerListRelationFilter
    games?: GameRecordListRelationFilter
  }, "id" | "code">

  export type RoomOrderByWithAggregationInput = {
    id?: SortOrder
    code?: SortOrder
    hostId?: SortOrder
    status?: SortOrder
    gameType?: SortOrder
    roleConfig?: SortOrder
    maxPlayers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RoomCountOrderByAggregateInput
    _avg?: RoomAvgOrderByAggregateInput
    _max?: RoomMaxOrderByAggregateInput
    _min?: RoomMinOrderByAggregateInput
    _sum?: RoomSumOrderByAggregateInput
  }

  export type RoomScalarWhereWithAggregatesInput = {
    AND?: RoomScalarWhereWithAggregatesInput | RoomScalarWhereWithAggregatesInput[]
    OR?: RoomScalarWhereWithAggregatesInput[]
    NOT?: RoomScalarWhereWithAggregatesInput | RoomScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Room"> | string
    code?: StringWithAggregatesFilter<"Room"> | string
    hostId?: StringWithAggregatesFilter<"Room"> | string
    status?: EnumRoomStatusWithAggregatesFilter<"Room"> | $Enums.RoomStatus
    gameType?: EnumGameTypeWithAggregatesFilter<"Room"> | $Enums.GameType
    roleConfig?: JsonWithAggregatesFilter<"Room">
    maxPlayers?: IntWithAggregatesFilter<"Room"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Room"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Room"> | Date | string
  }

  export type RoomPlayerWhereInput = {
    AND?: RoomPlayerWhereInput | RoomPlayerWhereInput[]
    OR?: RoomPlayerWhereInput[]
    NOT?: RoomPlayerWhereInput | RoomPlayerWhereInput[]
    id?: StringFilter<"RoomPlayer"> | string
    roomId?: StringFilter<"RoomPlayer"> | string
    userId?: StringFilter<"RoomPlayer"> | string
    seatNo?: IntFilter<"RoomPlayer"> | number
    role?: StringNullableFilter<"RoomPlayer"> | string | null
    joinedAt?: DateTimeFilter<"RoomPlayer"> | Date | string
    room?: XOR<RoomScalarRelationFilter, RoomWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type RoomPlayerOrderByWithRelationInput = {
    id?: SortOrder
    roomId?: SortOrder
    userId?: SortOrder
    seatNo?: SortOrder
    role?: SortOrderInput | SortOrder
    joinedAt?: SortOrder
    room?: RoomOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type RoomPlayerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    roomId_userId?: RoomPlayerRoomIdUserIdCompoundUniqueInput
    roomId_seatNo?: RoomPlayerRoomIdSeatNoCompoundUniqueInput
    AND?: RoomPlayerWhereInput | RoomPlayerWhereInput[]
    OR?: RoomPlayerWhereInput[]
    NOT?: RoomPlayerWhereInput | RoomPlayerWhereInput[]
    roomId?: StringFilter<"RoomPlayer"> | string
    userId?: StringFilter<"RoomPlayer"> | string
    seatNo?: IntFilter<"RoomPlayer"> | number
    role?: StringNullableFilter<"RoomPlayer"> | string | null
    joinedAt?: DateTimeFilter<"RoomPlayer"> | Date | string
    room?: XOR<RoomScalarRelationFilter, RoomWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "roomId_userId" | "roomId_seatNo">

  export type RoomPlayerOrderByWithAggregationInput = {
    id?: SortOrder
    roomId?: SortOrder
    userId?: SortOrder
    seatNo?: SortOrder
    role?: SortOrderInput | SortOrder
    joinedAt?: SortOrder
    _count?: RoomPlayerCountOrderByAggregateInput
    _avg?: RoomPlayerAvgOrderByAggregateInput
    _max?: RoomPlayerMaxOrderByAggregateInput
    _min?: RoomPlayerMinOrderByAggregateInput
    _sum?: RoomPlayerSumOrderByAggregateInput
  }

  export type RoomPlayerScalarWhereWithAggregatesInput = {
    AND?: RoomPlayerScalarWhereWithAggregatesInput | RoomPlayerScalarWhereWithAggregatesInput[]
    OR?: RoomPlayerScalarWhereWithAggregatesInput[]
    NOT?: RoomPlayerScalarWhereWithAggregatesInput | RoomPlayerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RoomPlayer"> | string
    roomId?: StringWithAggregatesFilter<"RoomPlayer"> | string
    userId?: StringWithAggregatesFilter<"RoomPlayer"> | string
    seatNo?: IntWithAggregatesFilter<"RoomPlayer"> | number
    role?: StringNullableWithAggregatesFilter<"RoomPlayer"> | string | null
    joinedAt?: DateTimeWithAggregatesFilter<"RoomPlayer"> | Date | string
  }

  export type GameRecordWhereInput = {
    AND?: GameRecordWhereInput | GameRecordWhereInput[]
    OR?: GameRecordWhereInput[]
    NOT?: GameRecordWhereInput | GameRecordWhereInput[]
    id?: StringFilter<"GameRecord"> | string
    roomId?: StringFilter<"GameRecord"> | string
    roles?: JsonFilter<"GameRecord">
    startedAt?: DateTimeFilter<"GameRecord"> | Date | string
    endedAt?: DateTimeNullableFilter<"GameRecord"> | Date | string | null
    room?: XOR<RoomScalarRelationFilter, RoomWhereInput>
  }

  export type GameRecordOrderByWithRelationInput = {
    id?: SortOrder
    roomId?: SortOrder
    roles?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrderInput | SortOrder
    room?: RoomOrderByWithRelationInput
  }

  export type GameRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: GameRecordWhereInput | GameRecordWhereInput[]
    OR?: GameRecordWhereInput[]
    NOT?: GameRecordWhereInput | GameRecordWhereInput[]
    roomId?: StringFilter<"GameRecord"> | string
    roles?: JsonFilter<"GameRecord">
    startedAt?: DateTimeFilter<"GameRecord"> | Date | string
    endedAt?: DateTimeNullableFilter<"GameRecord"> | Date | string | null
    room?: XOR<RoomScalarRelationFilter, RoomWhereInput>
  }, "id">

  export type GameRecordOrderByWithAggregationInput = {
    id?: SortOrder
    roomId?: SortOrder
    roles?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrderInput | SortOrder
    _count?: GameRecordCountOrderByAggregateInput
    _max?: GameRecordMaxOrderByAggregateInput
    _min?: GameRecordMinOrderByAggregateInput
  }

  export type GameRecordScalarWhereWithAggregatesInput = {
    AND?: GameRecordScalarWhereWithAggregatesInput | GameRecordScalarWhereWithAggregatesInput[]
    OR?: GameRecordScalarWhereWithAggregatesInput[]
    NOT?: GameRecordScalarWhereWithAggregatesInput | GameRecordScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"GameRecord"> | string
    roomId?: StringWithAggregatesFilter<"GameRecord"> | string
    roles?: JsonWithAggregatesFilter<"GameRecord">
    startedAt?: DateTimeWithAggregatesFilter<"GameRecord"> | Date | string
    endedAt?: DateTimeNullableWithAggregatesFilter<"GameRecord"> | Date | string | null
  }

  export type UserCreateInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    hostedRooms?: RoomCreateNestedManyWithoutHostInput
    roomPlayers?: RoomPlayerCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    hostedRooms?: RoomUncheckedCreateNestedManyWithoutHostInput
    roomPlayers?: RoomPlayerUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostedRooms?: RoomUpdateManyWithoutHostNestedInput
    roomPlayers?: RoomPlayerUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostedRooms?: RoomUncheckedUpdateManyWithoutHostNestedInput
    roomPlayers?: RoomPlayerUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomCreateInput = {
    id?: string
    code: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutHostedRoomsInput
    players?: RoomPlayerCreateNestedManyWithoutRoomInput
    games?: GameRecordCreateNestedManyWithoutRoomInput
  }

  export type RoomUncheckedCreateInput = {
    id?: string
    code: string
    hostId: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    players?: RoomPlayerUncheckedCreateNestedManyWithoutRoomInput
    games?: GameRecordUncheckedCreateNestedManyWithoutRoomInput
  }

  export type RoomUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutHostedRoomsNestedInput
    players?: RoomPlayerUpdateManyWithoutRoomNestedInput
    games?: GameRecordUpdateManyWithoutRoomNestedInput
  }

  export type RoomUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    players?: RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput
    games?: GameRecordUncheckedUpdateManyWithoutRoomNestedInput
  }

  export type RoomCreateManyInput = {
    id?: string
    code: string
    hostId: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RoomUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerCreateInput = {
    id?: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
    room: RoomCreateNestedOneWithoutPlayersInput
    user: UserCreateNestedOneWithoutRoomPlayersInput
  }

  export type RoomPlayerUncheckedCreateInput = {
    id?: string
    roomId: string
    userId: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
  }

  export type RoomPlayerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    room?: RoomUpdateOneRequiredWithoutPlayersNestedInput
    user?: UserUpdateOneRequiredWithoutRoomPlayersNestedInput
  }

  export type RoomPlayerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    roomId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerCreateManyInput = {
    id?: string
    roomId: string
    userId: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
  }

  export type RoomPlayerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    roomId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameRecordCreateInput = {
    id?: string
    roles: JsonNullValueInput | InputJsonValue
    startedAt?: Date | string
    endedAt?: Date | string | null
    room: RoomCreateNestedOneWithoutGamesInput
  }

  export type GameRecordUncheckedCreateInput = {
    id?: string
    roomId: string
    roles: JsonNullValueInput | InputJsonValue
    startedAt?: Date | string
    endedAt?: Date | string | null
  }

  export type GameRecordUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    room?: RoomUpdateOneRequiredWithoutGamesNestedInput
  }

  export type GameRecordUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    roomId?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameRecordCreateManyInput = {
    id?: string
    roomId: string
    roles: JsonNullValueInput | InputJsonValue
    startedAt?: Date | string
    endedAt?: Date | string | null
  }

  export type GameRecordUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameRecordUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    roomId?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type RoomListRelationFilter = {
    every?: RoomWhereInput
    some?: RoomWhereInput
    none?: RoomWhereInput
  }

  export type RoomPlayerListRelationFilter = {
    every?: RoomPlayerWhereInput
    some?: RoomPlayerWhereInput
    none?: RoomPlayerWhereInput
  }

  export type RoomOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RoomPlayerOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    openId?: SortOrder
    nickName?: SortOrder
    avatarUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    openId?: SortOrder
    nickName?: SortOrder
    avatarUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    openId?: SortOrder
    nickName?: SortOrder
    avatarUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRoomStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | EnumRoomStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRoomStatusFilter<$PrismaModel> | $Enums.RoomStatus
  }

  export type EnumGameTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.GameType | EnumGameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGameTypeFilter<$PrismaModel> | $Enums.GameType
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type GameRecordListRelationFilter = {
    every?: GameRecordWhereInput
    some?: GameRecordWhereInput
    none?: GameRecordWhereInput
  }

  export type GameRecordOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RoomCountOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    hostId?: SortOrder
    status?: SortOrder
    gameType?: SortOrder
    roleConfig?: SortOrder
    maxPlayers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RoomAvgOrderByAggregateInput = {
    maxPlayers?: SortOrder
  }

  export type RoomMaxOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    hostId?: SortOrder
    status?: SortOrder
    gameType?: SortOrder
    maxPlayers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RoomMinOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    hostId?: SortOrder
    status?: SortOrder
    gameType?: SortOrder
    maxPlayers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RoomSumOrderByAggregateInput = {
    maxPlayers?: SortOrder
  }

  export type EnumRoomStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | EnumRoomStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRoomStatusWithAggregatesFilter<$PrismaModel> | $Enums.RoomStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoomStatusFilter<$PrismaModel>
    _max?: NestedEnumRoomStatusFilter<$PrismaModel>
  }

  export type EnumGameTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.GameType | EnumGameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGameTypeWithAggregatesFilter<$PrismaModel> | $Enums.GameType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGameTypeFilter<$PrismaModel>
    _max?: NestedEnumGameTypeFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type RoomScalarRelationFilter = {
    is?: RoomWhereInput
    isNot?: RoomWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type RoomPlayerRoomIdUserIdCompoundUniqueInput = {
    roomId: string
    userId: string
  }

  export type RoomPlayerRoomIdSeatNoCompoundUniqueInput = {
    roomId: string
    seatNo: number
  }

  export type RoomPlayerCountOrderByAggregateInput = {
    id?: SortOrder
    roomId?: SortOrder
    userId?: SortOrder
    seatNo?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
  }

  export type RoomPlayerAvgOrderByAggregateInput = {
    seatNo?: SortOrder
  }

  export type RoomPlayerMaxOrderByAggregateInput = {
    id?: SortOrder
    roomId?: SortOrder
    userId?: SortOrder
    seatNo?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
  }

  export type RoomPlayerMinOrderByAggregateInput = {
    id?: SortOrder
    roomId?: SortOrder
    userId?: SortOrder
    seatNo?: SortOrder
    role?: SortOrder
    joinedAt?: SortOrder
  }

  export type RoomPlayerSumOrderByAggregateInput = {
    seatNo?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type GameRecordCountOrderByAggregateInput = {
    id?: SortOrder
    roomId?: SortOrder
    roles?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
  }

  export type GameRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    roomId?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
  }

  export type GameRecordMinOrderByAggregateInput = {
    id?: SortOrder
    roomId?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type RoomCreateNestedManyWithoutHostInput = {
    create?: XOR<RoomCreateWithoutHostInput, RoomUncheckedCreateWithoutHostInput> | RoomCreateWithoutHostInput[] | RoomUncheckedCreateWithoutHostInput[]
    connectOrCreate?: RoomCreateOrConnectWithoutHostInput | RoomCreateOrConnectWithoutHostInput[]
    createMany?: RoomCreateManyHostInputEnvelope
    connect?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
  }

  export type RoomPlayerCreateNestedManyWithoutUserInput = {
    create?: XOR<RoomPlayerCreateWithoutUserInput, RoomPlayerUncheckedCreateWithoutUserInput> | RoomPlayerCreateWithoutUserInput[] | RoomPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutUserInput | RoomPlayerCreateOrConnectWithoutUserInput[]
    createMany?: RoomPlayerCreateManyUserInputEnvelope
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
  }

  export type RoomUncheckedCreateNestedManyWithoutHostInput = {
    create?: XOR<RoomCreateWithoutHostInput, RoomUncheckedCreateWithoutHostInput> | RoomCreateWithoutHostInput[] | RoomUncheckedCreateWithoutHostInput[]
    connectOrCreate?: RoomCreateOrConnectWithoutHostInput | RoomCreateOrConnectWithoutHostInput[]
    createMany?: RoomCreateManyHostInputEnvelope
    connect?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
  }

  export type RoomPlayerUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RoomPlayerCreateWithoutUserInput, RoomPlayerUncheckedCreateWithoutUserInput> | RoomPlayerCreateWithoutUserInput[] | RoomPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutUserInput | RoomPlayerCreateOrConnectWithoutUserInput[]
    createMany?: RoomPlayerCreateManyUserInputEnvelope
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type RoomUpdateManyWithoutHostNestedInput = {
    create?: XOR<RoomCreateWithoutHostInput, RoomUncheckedCreateWithoutHostInput> | RoomCreateWithoutHostInput[] | RoomUncheckedCreateWithoutHostInput[]
    connectOrCreate?: RoomCreateOrConnectWithoutHostInput | RoomCreateOrConnectWithoutHostInput[]
    upsert?: RoomUpsertWithWhereUniqueWithoutHostInput | RoomUpsertWithWhereUniqueWithoutHostInput[]
    createMany?: RoomCreateManyHostInputEnvelope
    set?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    disconnect?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    delete?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    connect?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    update?: RoomUpdateWithWhereUniqueWithoutHostInput | RoomUpdateWithWhereUniqueWithoutHostInput[]
    updateMany?: RoomUpdateManyWithWhereWithoutHostInput | RoomUpdateManyWithWhereWithoutHostInput[]
    deleteMany?: RoomScalarWhereInput | RoomScalarWhereInput[]
  }

  export type RoomPlayerUpdateManyWithoutUserNestedInput = {
    create?: XOR<RoomPlayerCreateWithoutUserInput, RoomPlayerUncheckedCreateWithoutUserInput> | RoomPlayerCreateWithoutUserInput[] | RoomPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutUserInput | RoomPlayerCreateOrConnectWithoutUserInput[]
    upsert?: RoomPlayerUpsertWithWhereUniqueWithoutUserInput | RoomPlayerUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RoomPlayerCreateManyUserInputEnvelope
    set?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    disconnect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    delete?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    update?: RoomPlayerUpdateWithWhereUniqueWithoutUserInput | RoomPlayerUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RoomPlayerUpdateManyWithWhereWithoutUserInput | RoomPlayerUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RoomPlayerScalarWhereInput | RoomPlayerScalarWhereInput[]
  }

  export type RoomUncheckedUpdateManyWithoutHostNestedInput = {
    create?: XOR<RoomCreateWithoutHostInput, RoomUncheckedCreateWithoutHostInput> | RoomCreateWithoutHostInput[] | RoomUncheckedCreateWithoutHostInput[]
    connectOrCreate?: RoomCreateOrConnectWithoutHostInput | RoomCreateOrConnectWithoutHostInput[]
    upsert?: RoomUpsertWithWhereUniqueWithoutHostInput | RoomUpsertWithWhereUniqueWithoutHostInput[]
    createMany?: RoomCreateManyHostInputEnvelope
    set?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    disconnect?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    delete?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    connect?: RoomWhereUniqueInput | RoomWhereUniqueInput[]
    update?: RoomUpdateWithWhereUniqueWithoutHostInput | RoomUpdateWithWhereUniqueWithoutHostInput[]
    updateMany?: RoomUpdateManyWithWhereWithoutHostInput | RoomUpdateManyWithWhereWithoutHostInput[]
    deleteMany?: RoomScalarWhereInput | RoomScalarWhereInput[]
  }

  export type RoomPlayerUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RoomPlayerCreateWithoutUserInput, RoomPlayerUncheckedCreateWithoutUserInput> | RoomPlayerCreateWithoutUserInput[] | RoomPlayerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutUserInput | RoomPlayerCreateOrConnectWithoutUserInput[]
    upsert?: RoomPlayerUpsertWithWhereUniqueWithoutUserInput | RoomPlayerUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RoomPlayerCreateManyUserInputEnvelope
    set?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    disconnect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    delete?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    update?: RoomPlayerUpdateWithWhereUniqueWithoutUserInput | RoomPlayerUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RoomPlayerUpdateManyWithWhereWithoutUserInput | RoomPlayerUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RoomPlayerScalarWhereInput | RoomPlayerScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutHostedRoomsInput = {
    create?: XOR<UserCreateWithoutHostedRoomsInput, UserUncheckedCreateWithoutHostedRoomsInput>
    connectOrCreate?: UserCreateOrConnectWithoutHostedRoomsInput
    connect?: UserWhereUniqueInput
  }

  export type RoomPlayerCreateNestedManyWithoutRoomInput = {
    create?: XOR<RoomPlayerCreateWithoutRoomInput, RoomPlayerUncheckedCreateWithoutRoomInput> | RoomPlayerCreateWithoutRoomInput[] | RoomPlayerUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutRoomInput | RoomPlayerCreateOrConnectWithoutRoomInput[]
    createMany?: RoomPlayerCreateManyRoomInputEnvelope
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
  }

  export type GameRecordCreateNestedManyWithoutRoomInput = {
    create?: XOR<GameRecordCreateWithoutRoomInput, GameRecordUncheckedCreateWithoutRoomInput> | GameRecordCreateWithoutRoomInput[] | GameRecordUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: GameRecordCreateOrConnectWithoutRoomInput | GameRecordCreateOrConnectWithoutRoomInput[]
    createMany?: GameRecordCreateManyRoomInputEnvelope
    connect?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
  }

  export type RoomPlayerUncheckedCreateNestedManyWithoutRoomInput = {
    create?: XOR<RoomPlayerCreateWithoutRoomInput, RoomPlayerUncheckedCreateWithoutRoomInput> | RoomPlayerCreateWithoutRoomInput[] | RoomPlayerUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutRoomInput | RoomPlayerCreateOrConnectWithoutRoomInput[]
    createMany?: RoomPlayerCreateManyRoomInputEnvelope
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
  }

  export type GameRecordUncheckedCreateNestedManyWithoutRoomInput = {
    create?: XOR<GameRecordCreateWithoutRoomInput, GameRecordUncheckedCreateWithoutRoomInput> | GameRecordCreateWithoutRoomInput[] | GameRecordUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: GameRecordCreateOrConnectWithoutRoomInput | GameRecordCreateOrConnectWithoutRoomInput[]
    createMany?: GameRecordCreateManyRoomInputEnvelope
    connect?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
  }

  export type EnumRoomStatusFieldUpdateOperationsInput = {
    set?: $Enums.RoomStatus
  }

  export type EnumGameTypeFieldUpdateOperationsInput = {
    set?: $Enums.GameType
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutHostedRoomsNestedInput = {
    create?: XOR<UserCreateWithoutHostedRoomsInput, UserUncheckedCreateWithoutHostedRoomsInput>
    connectOrCreate?: UserCreateOrConnectWithoutHostedRoomsInput
    upsert?: UserUpsertWithoutHostedRoomsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutHostedRoomsInput, UserUpdateWithoutHostedRoomsInput>, UserUncheckedUpdateWithoutHostedRoomsInput>
  }

  export type RoomPlayerUpdateManyWithoutRoomNestedInput = {
    create?: XOR<RoomPlayerCreateWithoutRoomInput, RoomPlayerUncheckedCreateWithoutRoomInput> | RoomPlayerCreateWithoutRoomInput[] | RoomPlayerUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutRoomInput | RoomPlayerCreateOrConnectWithoutRoomInput[]
    upsert?: RoomPlayerUpsertWithWhereUniqueWithoutRoomInput | RoomPlayerUpsertWithWhereUniqueWithoutRoomInput[]
    createMany?: RoomPlayerCreateManyRoomInputEnvelope
    set?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    disconnect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    delete?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    update?: RoomPlayerUpdateWithWhereUniqueWithoutRoomInput | RoomPlayerUpdateWithWhereUniqueWithoutRoomInput[]
    updateMany?: RoomPlayerUpdateManyWithWhereWithoutRoomInput | RoomPlayerUpdateManyWithWhereWithoutRoomInput[]
    deleteMany?: RoomPlayerScalarWhereInput | RoomPlayerScalarWhereInput[]
  }

  export type GameRecordUpdateManyWithoutRoomNestedInput = {
    create?: XOR<GameRecordCreateWithoutRoomInput, GameRecordUncheckedCreateWithoutRoomInput> | GameRecordCreateWithoutRoomInput[] | GameRecordUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: GameRecordCreateOrConnectWithoutRoomInput | GameRecordCreateOrConnectWithoutRoomInput[]
    upsert?: GameRecordUpsertWithWhereUniqueWithoutRoomInput | GameRecordUpsertWithWhereUniqueWithoutRoomInput[]
    createMany?: GameRecordCreateManyRoomInputEnvelope
    set?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    disconnect?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    delete?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    connect?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    update?: GameRecordUpdateWithWhereUniqueWithoutRoomInput | GameRecordUpdateWithWhereUniqueWithoutRoomInput[]
    updateMany?: GameRecordUpdateManyWithWhereWithoutRoomInput | GameRecordUpdateManyWithWhereWithoutRoomInput[]
    deleteMany?: GameRecordScalarWhereInput | GameRecordScalarWhereInput[]
  }

  export type RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput = {
    create?: XOR<RoomPlayerCreateWithoutRoomInput, RoomPlayerUncheckedCreateWithoutRoomInput> | RoomPlayerCreateWithoutRoomInput[] | RoomPlayerUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: RoomPlayerCreateOrConnectWithoutRoomInput | RoomPlayerCreateOrConnectWithoutRoomInput[]
    upsert?: RoomPlayerUpsertWithWhereUniqueWithoutRoomInput | RoomPlayerUpsertWithWhereUniqueWithoutRoomInput[]
    createMany?: RoomPlayerCreateManyRoomInputEnvelope
    set?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    disconnect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    delete?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    connect?: RoomPlayerWhereUniqueInput | RoomPlayerWhereUniqueInput[]
    update?: RoomPlayerUpdateWithWhereUniqueWithoutRoomInput | RoomPlayerUpdateWithWhereUniqueWithoutRoomInput[]
    updateMany?: RoomPlayerUpdateManyWithWhereWithoutRoomInput | RoomPlayerUpdateManyWithWhereWithoutRoomInput[]
    deleteMany?: RoomPlayerScalarWhereInput | RoomPlayerScalarWhereInput[]
  }

  export type GameRecordUncheckedUpdateManyWithoutRoomNestedInput = {
    create?: XOR<GameRecordCreateWithoutRoomInput, GameRecordUncheckedCreateWithoutRoomInput> | GameRecordCreateWithoutRoomInput[] | GameRecordUncheckedCreateWithoutRoomInput[]
    connectOrCreate?: GameRecordCreateOrConnectWithoutRoomInput | GameRecordCreateOrConnectWithoutRoomInput[]
    upsert?: GameRecordUpsertWithWhereUniqueWithoutRoomInput | GameRecordUpsertWithWhereUniqueWithoutRoomInput[]
    createMany?: GameRecordCreateManyRoomInputEnvelope
    set?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    disconnect?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    delete?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    connect?: GameRecordWhereUniqueInput | GameRecordWhereUniqueInput[]
    update?: GameRecordUpdateWithWhereUniqueWithoutRoomInput | GameRecordUpdateWithWhereUniqueWithoutRoomInput[]
    updateMany?: GameRecordUpdateManyWithWhereWithoutRoomInput | GameRecordUpdateManyWithWhereWithoutRoomInput[]
    deleteMany?: GameRecordScalarWhereInput | GameRecordScalarWhereInput[]
  }

  export type RoomCreateNestedOneWithoutPlayersInput = {
    create?: XOR<RoomCreateWithoutPlayersInput, RoomUncheckedCreateWithoutPlayersInput>
    connectOrCreate?: RoomCreateOrConnectWithoutPlayersInput
    connect?: RoomWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutRoomPlayersInput = {
    create?: XOR<UserCreateWithoutRoomPlayersInput, UserUncheckedCreateWithoutRoomPlayersInput>
    connectOrCreate?: UserCreateOrConnectWithoutRoomPlayersInput
    connect?: UserWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type RoomUpdateOneRequiredWithoutPlayersNestedInput = {
    create?: XOR<RoomCreateWithoutPlayersInput, RoomUncheckedCreateWithoutPlayersInput>
    connectOrCreate?: RoomCreateOrConnectWithoutPlayersInput
    upsert?: RoomUpsertWithoutPlayersInput
    connect?: RoomWhereUniqueInput
    update?: XOR<XOR<RoomUpdateToOneWithWhereWithoutPlayersInput, RoomUpdateWithoutPlayersInput>, RoomUncheckedUpdateWithoutPlayersInput>
  }

  export type UserUpdateOneRequiredWithoutRoomPlayersNestedInput = {
    create?: XOR<UserCreateWithoutRoomPlayersInput, UserUncheckedCreateWithoutRoomPlayersInput>
    connectOrCreate?: UserCreateOrConnectWithoutRoomPlayersInput
    upsert?: UserUpsertWithoutRoomPlayersInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRoomPlayersInput, UserUpdateWithoutRoomPlayersInput>, UserUncheckedUpdateWithoutRoomPlayersInput>
  }

  export type RoomCreateNestedOneWithoutGamesInput = {
    create?: XOR<RoomCreateWithoutGamesInput, RoomUncheckedCreateWithoutGamesInput>
    connectOrCreate?: RoomCreateOrConnectWithoutGamesInput
    connect?: RoomWhereUniqueInput
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type RoomUpdateOneRequiredWithoutGamesNestedInput = {
    create?: XOR<RoomCreateWithoutGamesInput, RoomUncheckedCreateWithoutGamesInput>
    connectOrCreate?: RoomCreateOrConnectWithoutGamesInput
    upsert?: RoomUpsertWithoutGamesInput
    connect?: RoomWhereUniqueInput
    update?: XOR<XOR<RoomUpdateToOneWithWhereWithoutGamesInput, RoomUpdateWithoutGamesInput>, RoomUncheckedUpdateWithoutGamesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRoomStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | EnumRoomStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRoomStatusFilter<$PrismaModel> | $Enums.RoomStatus
  }

  export type NestedEnumGameTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.GameType | EnumGameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGameTypeFilter<$PrismaModel> | $Enums.GameType
  }

  export type NestedEnumRoomStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | EnumRoomStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RoomStatus[] | ListEnumRoomStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRoomStatusWithAggregatesFilter<$PrismaModel> | $Enums.RoomStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoomStatusFilter<$PrismaModel>
    _max?: NestedEnumRoomStatusFilter<$PrismaModel>
  }

  export type NestedEnumGameTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.GameType | EnumGameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.GameType[] | ListEnumGameTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumGameTypeWithAggregatesFilter<$PrismaModel> | $Enums.GameType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumGameTypeFilter<$PrismaModel>
    _max?: NestedEnumGameTypeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type RoomCreateWithoutHostInput = {
    id?: string
    code: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    players?: RoomPlayerCreateNestedManyWithoutRoomInput
    games?: GameRecordCreateNestedManyWithoutRoomInput
  }

  export type RoomUncheckedCreateWithoutHostInput = {
    id?: string
    code: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    players?: RoomPlayerUncheckedCreateNestedManyWithoutRoomInput
    games?: GameRecordUncheckedCreateNestedManyWithoutRoomInput
  }

  export type RoomCreateOrConnectWithoutHostInput = {
    where: RoomWhereUniqueInput
    create: XOR<RoomCreateWithoutHostInput, RoomUncheckedCreateWithoutHostInput>
  }

  export type RoomCreateManyHostInputEnvelope = {
    data: RoomCreateManyHostInput | RoomCreateManyHostInput[]
    skipDuplicates?: boolean
  }

  export type RoomPlayerCreateWithoutUserInput = {
    id?: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
    room: RoomCreateNestedOneWithoutPlayersInput
  }

  export type RoomPlayerUncheckedCreateWithoutUserInput = {
    id?: string
    roomId: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
  }

  export type RoomPlayerCreateOrConnectWithoutUserInput = {
    where: RoomPlayerWhereUniqueInput
    create: XOR<RoomPlayerCreateWithoutUserInput, RoomPlayerUncheckedCreateWithoutUserInput>
  }

  export type RoomPlayerCreateManyUserInputEnvelope = {
    data: RoomPlayerCreateManyUserInput | RoomPlayerCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type RoomUpsertWithWhereUniqueWithoutHostInput = {
    where: RoomWhereUniqueInput
    update: XOR<RoomUpdateWithoutHostInput, RoomUncheckedUpdateWithoutHostInput>
    create: XOR<RoomCreateWithoutHostInput, RoomUncheckedCreateWithoutHostInput>
  }

  export type RoomUpdateWithWhereUniqueWithoutHostInput = {
    where: RoomWhereUniqueInput
    data: XOR<RoomUpdateWithoutHostInput, RoomUncheckedUpdateWithoutHostInput>
  }

  export type RoomUpdateManyWithWhereWithoutHostInput = {
    where: RoomScalarWhereInput
    data: XOR<RoomUpdateManyMutationInput, RoomUncheckedUpdateManyWithoutHostInput>
  }

  export type RoomScalarWhereInput = {
    AND?: RoomScalarWhereInput | RoomScalarWhereInput[]
    OR?: RoomScalarWhereInput[]
    NOT?: RoomScalarWhereInput | RoomScalarWhereInput[]
    id?: StringFilter<"Room"> | string
    code?: StringFilter<"Room"> | string
    hostId?: StringFilter<"Room"> | string
    status?: EnumRoomStatusFilter<"Room"> | $Enums.RoomStatus
    gameType?: EnumGameTypeFilter<"Room"> | $Enums.GameType
    roleConfig?: JsonFilter<"Room">
    maxPlayers?: IntFilter<"Room"> | number
    createdAt?: DateTimeFilter<"Room"> | Date | string
    updatedAt?: DateTimeFilter<"Room"> | Date | string
  }

  export type RoomPlayerUpsertWithWhereUniqueWithoutUserInput = {
    where: RoomPlayerWhereUniqueInput
    update: XOR<RoomPlayerUpdateWithoutUserInput, RoomPlayerUncheckedUpdateWithoutUserInput>
    create: XOR<RoomPlayerCreateWithoutUserInput, RoomPlayerUncheckedCreateWithoutUserInput>
  }

  export type RoomPlayerUpdateWithWhereUniqueWithoutUserInput = {
    where: RoomPlayerWhereUniqueInput
    data: XOR<RoomPlayerUpdateWithoutUserInput, RoomPlayerUncheckedUpdateWithoutUserInput>
  }

  export type RoomPlayerUpdateManyWithWhereWithoutUserInput = {
    where: RoomPlayerScalarWhereInput
    data: XOR<RoomPlayerUpdateManyMutationInput, RoomPlayerUncheckedUpdateManyWithoutUserInput>
  }

  export type RoomPlayerScalarWhereInput = {
    AND?: RoomPlayerScalarWhereInput | RoomPlayerScalarWhereInput[]
    OR?: RoomPlayerScalarWhereInput[]
    NOT?: RoomPlayerScalarWhereInput | RoomPlayerScalarWhereInput[]
    id?: StringFilter<"RoomPlayer"> | string
    roomId?: StringFilter<"RoomPlayer"> | string
    userId?: StringFilter<"RoomPlayer"> | string
    seatNo?: IntFilter<"RoomPlayer"> | number
    role?: StringNullableFilter<"RoomPlayer"> | string | null
    joinedAt?: DateTimeFilter<"RoomPlayer"> | Date | string
  }

  export type UserCreateWithoutHostedRoomsInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    roomPlayers?: RoomPlayerCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutHostedRoomsInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    roomPlayers?: RoomPlayerUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutHostedRoomsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutHostedRoomsInput, UserUncheckedCreateWithoutHostedRoomsInput>
  }

  export type RoomPlayerCreateWithoutRoomInput = {
    id?: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
    user: UserCreateNestedOneWithoutRoomPlayersInput
  }

  export type RoomPlayerUncheckedCreateWithoutRoomInput = {
    id?: string
    userId: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
  }

  export type RoomPlayerCreateOrConnectWithoutRoomInput = {
    where: RoomPlayerWhereUniqueInput
    create: XOR<RoomPlayerCreateWithoutRoomInput, RoomPlayerUncheckedCreateWithoutRoomInput>
  }

  export type RoomPlayerCreateManyRoomInputEnvelope = {
    data: RoomPlayerCreateManyRoomInput | RoomPlayerCreateManyRoomInput[]
    skipDuplicates?: boolean
  }

  export type GameRecordCreateWithoutRoomInput = {
    id?: string
    roles: JsonNullValueInput | InputJsonValue
    startedAt?: Date | string
    endedAt?: Date | string | null
  }

  export type GameRecordUncheckedCreateWithoutRoomInput = {
    id?: string
    roles: JsonNullValueInput | InputJsonValue
    startedAt?: Date | string
    endedAt?: Date | string | null
  }

  export type GameRecordCreateOrConnectWithoutRoomInput = {
    where: GameRecordWhereUniqueInput
    create: XOR<GameRecordCreateWithoutRoomInput, GameRecordUncheckedCreateWithoutRoomInput>
  }

  export type GameRecordCreateManyRoomInputEnvelope = {
    data: GameRecordCreateManyRoomInput | GameRecordCreateManyRoomInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutHostedRoomsInput = {
    update: XOR<UserUpdateWithoutHostedRoomsInput, UserUncheckedUpdateWithoutHostedRoomsInput>
    create: XOR<UserCreateWithoutHostedRoomsInput, UserUncheckedCreateWithoutHostedRoomsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutHostedRoomsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutHostedRoomsInput, UserUncheckedUpdateWithoutHostedRoomsInput>
  }

  export type UserUpdateWithoutHostedRoomsInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roomPlayers?: RoomPlayerUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutHostedRoomsInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roomPlayers?: RoomPlayerUncheckedUpdateManyWithoutUserNestedInput
  }

  export type RoomPlayerUpsertWithWhereUniqueWithoutRoomInput = {
    where: RoomPlayerWhereUniqueInput
    update: XOR<RoomPlayerUpdateWithoutRoomInput, RoomPlayerUncheckedUpdateWithoutRoomInput>
    create: XOR<RoomPlayerCreateWithoutRoomInput, RoomPlayerUncheckedCreateWithoutRoomInput>
  }

  export type RoomPlayerUpdateWithWhereUniqueWithoutRoomInput = {
    where: RoomPlayerWhereUniqueInput
    data: XOR<RoomPlayerUpdateWithoutRoomInput, RoomPlayerUncheckedUpdateWithoutRoomInput>
  }

  export type RoomPlayerUpdateManyWithWhereWithoutRoomInput = {
    where: RoomPlayerScalarWhereInput
    data: XOR<RoomPlayerUpdateManyMutationInput, RoomPlayerUncheckedUpdateManyWithoutRoomInput>
  }

  export type GameRecordUpsertWithWhereUniqueWithoutRoomInput = {
    where: GameRecordWhereUniqueInput
    update: XOR<GameRecordUpdateWithoutRoomInput, GameRecordUncheckedUpdateWithoutRoomInput>
    create: XOR<GameRecordCreateWithoutRoomInput, GameRecordUncheckedCreateWithoutRoomInput>
  }

  export type GameRecordUpdateWithWhereUniqueWithoutRoomInput = {
    where: GameRecordWhereUniqueInput
    data: XOR<GameRecordUpdateWithoutRoomInput, GameRecordUncheckedUpdateWithoutRoomInput>
  }

  export type GameRecordUpdateManyWithWhereWithoutRoomInput = {
    where: GameRecordScalarWhereInput
    data: XOR<GameRecordUpdateManyMutationInput, GameRecordUncheckedUpdateManyWithoutRoomInput>
  }

  export type GameRecordScalarWhereInput = {
    AND?: GameRecordScalarWhereInput | GameRecordScalarWhereInput[]
    OR?: GameRecordScalarWhereInput[]
    NOT?: GameRecordScalarWhereInput | GameRecordScalarWhereInput[]
    id?: StringFilter<"GameRecord"> | string
    roomId?: StringFilter<"GameRecord"> | string
    roles?: JsonFilter<"GameRecord">
    startedAt?: DateTimeFilter<"GameRecord"> | Date | string
    endedAt?: DateTimeNullableFilter<"GameRecord"> | Date | string | null
  }

  export type RoomCreateWithoutPlayersInput = {
    id?: string
    code: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutHostedRoomsInput
    games?: GameRecordCreateNestedManyWithoutRoomInput
  }

  export type RoomUncheckedCreateWithoutPlayersInput = {
    id?: string
    code: string
    hostId: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    games?: GameRecordUncheckedCreateNestedManyWithoutRoomInput
  }

  export type RoomCreateOrConnectWithoutPlayersInput = {
    where: RoomWhereUniqueInput
    create: XOR<RoomCreateWithoutPlayersInput, RoomUncheckedCreateWithoutPlayersInput>
  }

  export type UserCreateWithoutRoomPlayersInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    hostedRooms?: RoomCreateNestedManyWithoutHostInput
  }

  export type UserUncheckedCreateWithoutRoomPlayersInput = {
    id?: string
    openId: string
    nickName?: string
    avatarUrl?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    hostedRooms?: RoomUncheckedCreateNestedManyWithoutHostInput
  }

  export type UserCreateOrConnectWithoutRoomPlayersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRoomPlayersInput, UserUncheckedCreateWithoutRoomPlayersInput>
  }

  export type RoomUpsertWithoutPlayersInput = {
    update: XOR<RoomUpdateWithoutPlayersInput, RoomUncheckedUpdateWithoutPlayersInput>
    create: XOR<RoomCreateWithoutPlayersInput, RoomUncheckedCreateWithoutPlayersInput>
    where?: RoomWhereInput
  }

  export type RoomUpdateToOneWithWhereWithoutPlayersInput = {
    where?: RoomWhereInput
    data: XOR<RoomUpdateWithoutPlayersInput, RoomUncheckedUpdateWithoutPlayersInput>
  }

  export type RoomUpdateWithoutPlayersInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutHostedRoomsNestedInput
    games?: GameRecordUpdateManyWithoutRoomNestedInput
  }

  export type RoomUncheckedUpdateWithoutPlayersInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    games?: GameRecordUncheckedUpdateManyWithoutRoomNestedInput
  }

  export type UserUpsertWithoutRoomPlayersInput = {
    update: XOR<UserUpdateWithoutRoomPlayersInput, UserUncheckedUpdateWithoutRoomPlayersInput>
    create: XOR<UserCreateWithoutRoomPlayersInput, UserUncheckedCreateWithoutRoomPlayersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRoomPlayersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRoomPlayersInput, UserUncheckedUpdateWithoutRoomPlayersInput>
  }

  export type UserUpdateWithoutRoomPlayersInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostedRooms?: RoomUpdateManyWithoutHostNestedInput
  }

  export type UserUncheckedUpdateWithoutRoomPlayersInput = {
    id?: StringFieldUpdateOperationsInput | string
    openId?: StringFieldUpdateOperationsInput | string
    nickName?: StringFieldUpdateOperationsInput | string
    avatarUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostedRooms?: RoomUncheckedUpdateManyWithoutHostNestedInput
  }

  export type RoomCreateWithoutGamesInput = {
    id?: string
    code: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutHostedRoomsInput
    players?: RoomPlayerCreateNestedManyWithoutRoomInput
  }

  export type RoomUncheckedCreateWithoutGamesInput = {
    id?: string
    code: string
    hostId: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    players?: RoomPlayerUncheckedCreateNestedManyWithoutRoomInput
  }

  export type RoomCreateOrConnectWithoutGamesInput = {
    where: RoomWhereUniqueInput
    create: XOR<RoomCreateWithoutGamesInput, RoomUncheckedCreateWithoutGamesInput>
  }

  export type RoomUpsertWithoutGamesInput = {
    update: XOR<RoomUpdateWithoutGamesInput, RoomUncheckedUpdateWithoutGamesInput>
    create: XOR<RoomCreateWithoutGamesInput, RoomUncheckedCreateWithoutGamesInput>
    where?: RoomWhereInput
  }

  export type RoomUpdateToOneWithWhereWithoutGamesInput = {
    where?: RoomWhereInput
    data: XOR<RoomUpdateWithoutGamesInput, RoomUncheckedUpdateWithoutGamesInput>
  }

  export type RoomUpdateWithoutGamesInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutHostedRoomsNestedInput
    players?: RoomPlayerUpdateManyWithoutRoomNestedInput
  }

  export type RoomUncheckedUpdateWithoutGamesInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    players?: RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput
  }

  export type RoomCreateManyHostInput = {
    id?: string
    code: string
    status?: $Enums.RoomStatus
    gameType?: $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RoomPlayerCreateManyUserInput = {
    id?: string
    roomId: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
  }

  export type RoomUpdateWithoutHostInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    players?: RoomPlayerUpdateManyWithoutRoomNestedInput
    games?: GameRecordUpdateManyWithoutRoomNestedInput
  }

  export type RoomUncheckedUpdateWithoutHostInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    players?: RoomPlayerUncheckedUpdateManyWithoutRoomNestedInput
    games?: GameRecordUncheckedUpdateManyWithoutRoomNestedInput
  }

  export type RoomUncheckedUpdateManyWithoutHostInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    status?: EnumRoomStatusFieldUpdateOperationsInput | $Enums.RoomStatus
    gameType?: EnumGameTypeFieldUpdateOperationsInput | $Enums.GameType
    roleConfig?: JsonNullValueInput | InputJsonValue
    maxPlayers?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    room?: RoomUpdateOneRequiredWithoutPlayersNestedInput
  }

  export type RoomPlayerUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    roomId?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    roomId?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerCreateManyRoomInput = {
    id?: string
    userId: string
    seatNo: number
    role?: string | null
    joinedAt?: Date | string
  }

  export type GameRecordCreateManyRoomInput = {
    id?: string
    roles: JsonNullValueInput | InputJsonValue
    startedAt?: Date | string
    endedAt?: Date | string | null
  }

  export type RoomPlayerUpdateWithoutRoomInput = {
    id?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRoomPlayersNestedInput
  }

  export type RoomPlayerUncheckedUpdateWithoutRoomInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoomPlayerUncheckedUpdateManyWithoutRoomInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    seatNo?: IntFieldUpdateOperationsInput | number
    role?: NullableStringFieldUpdateOperationsInput | string | null
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameRecordUpdateWithoutRoomInput = {
    id?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameRecordUncheckedUpdateWithoutRoomInput = {
    id?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type GameRecordUncheckedUpdateManyWithoutRoomInput = {
    id?: StringFieldUpdateOperationsInput | string
    roles?: JsonNullValueInput | InputJsonValue
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}