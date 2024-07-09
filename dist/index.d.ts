/**
 * @name parse-nested-form-data
 * @license MIT license.
 * @copyright (c) 2022 Christian Schurr
 * @author Christian Schurr <chris@schurr.dev>
 */
/**
 * Thrown when a path is used multiple times or has missmatching path parts.
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[0]', 'b')
 * formData.append('a[0]', 'c')
 * parseFormData(formData)
 * // throws DuplicateKeyError('a[0]')
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a', 'b')
 * formData.append('a', 'c')
 * parseFormData(formData)
 * // throws DuplicateKeyError('a')
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a', 'b')
 * formData.append('a[]', 'c')
 * parseFormData(formData)
 * // throws DuplicateKeyError('a[]')
 * ```
 *
 */
export declare class DuplicateKeyError extends Error {
    key: string;
    constructor(key: string);
}
/**
 * Thrown when an array is used at the same path with an order parameter and
 * without an order parameter.
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[0]', 'a')
 * formData.append('a[]', 'b')
 * parseFormData(formData)
 * // => throws `MixedArrayError(a[])`
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[]', 'a')
 * formData.append('a[0]', 'b')
 * parseFormData(formData)
 * // => throws `MixedArrayError(a[0])`
 * ```
 */
export declare class MixedArrayError extends Error {
    key: string;
    constructor(key: string);
}
type JsonObject = {
    [Key in string]?: JsonValue;
};
type JsonArray = Array<JsonValue>;
type JsonValue = string | number | JsonObject | JsonArray | boolean | null | File;
type JsonLeafValue = Exclude<JsonValue, JsonArray | JsonObject>;
/**
 * Default Transformer for `parseFormData`.
 *
 * Transforms a FormData Entry into a path and a `JsonLeafValue`.
 *
 * - `path` starts with `+` -> transform value to `number`
 * - `path` starts with `&` -> transform value to `boolean`
 * - `path` starts with `-` -> transform value to `null`
 *
 * @example
 * ```ts
 * const entry = ['a[0]', 'b']
 * const result = defaultTransform(entry)
 * // => {path: 'a[0]', value: 'b'}
 * ```
 *
 * @example
 * ```ts
 * const entry = ['+a[0]', '1']
 * const result = defaultTransform(entry)
 * // => {path: 'a[0]', value: 1}
 * ```
 *
 * @example
 * ```ts
 * const entry = ['&a[0]', 'true']
 * const result = defaultTransform(entry)
 * // => {path: 'a[0]', value: true}
 * ```
 *
 * @example
 * ```ts
 * const entry = ['-a[0]', 'null']
 * const result = defaultTransform(entry)
 * // => {path: 'a[0]', value: null}
 * ```
 *
 * @example
 * ```ts
 * const entry = ['a[0]', new File([''], 'file.txt')]
 * const result = defaultTransform(entry)
 * // => {path: 'a[0]', value: File}
 * ```
 *
 *
 * @param entry [path, value]: the FormData entry
 * @returns the path and the transformed value
 */
declare function defaultTransform(entry: [path: string, value: string | File]): {
    path: string;
    value: JsonLeafValue;
};
type DefaultTransform = typeof defaultTransform;
/**
 * Options to change the behavior of `parseFormData`.
 * @param transformEntry - a function to transform the FormData entry into a path and a value
 * (default: `defaultTransform`)
 * @param removeEmptyString - skip empty values '' (default: `false`)
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a', '')
 * formData.append('b', 'b')
 * const result = parseFormData(formData, {removeEmptyString: true})
 * // => {b: 'b'}
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a', 'a')
 * formData.append('b', 'b')
 * parseFormData(formData, {
 *   transformEntry: ([path, value], defaultTransform) => {
 *     return {
 *       path,
 *       value:
 *         typeof value === 'string'
 *           ? value.toUpperCase()
 *           : defaultTransform(value),
 *     }
 *   },
 * })
 * // => {a: 'A', b: 'B'}
 * ```
 */
export type ParseFormDataOptions = {
    removeEmptyString?: boolean;
    transformEntry?: (entry: [path: string, value: string | File], defaultTransform: DefaultTransform) => {
        path: string;
        value: JsonLeafValue;
    };
};
/**
 *
 * Parses a FormData object to a JSON object. This is done by parsing the `name`
 * attribute of each `FormDataEntryValue` and then inserting the value at the
 * path. Also by default the start of the path is used to transform the value.
 *
 *
 * In front of the whole `key`:
 *  - `+` => parse to `Number`
 *  - `-` => set value to `null`
 *  - `&` => parse to `Boolean`
 *
 * - `.` between path parts => nest into `objects`
 * - `[\d*]` after path part => push to array in order `\d` or push to end if `[]`
 *

 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('+a', '1')
 * formData.append('&b', 'true')
 * formData.append('-c', 'null')
 * formData.append('d', 'foo')
 * parseFormData(formData, defaultTransform)
 * // => {a: 1, b: true, c: null, d: 'foo'}
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a.b', 'foo')
 * parseFormData(formData)
 * // => {a: {b: 'foo'}}
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[0]', 'foo')
 * formData.append('a[1]', 'bar')
 * parseFormData(formData)
 * // => {a: ['foo', 'bar']}
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[]', 'foo')
 * formData.append('a[]', 'bar')
 * parseFormData(formData)
 * // => {a: ['foo', 'bar']}
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[0]', 'foo')
 * parseFormData(formData, {transformEntry: (path, value) => {path, value: value + 'bar'}})
 * // => {a: ['foobar']}
 * ```
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('a[0]', 'foo')
 * formData.append('a[1]', '')
 * parseFormData(formData, {removeEmptyString: true})
 * // => {a: ['foo']}
 * ```
 *
 * @param {Iterable<[string, string | File]>} formData - an iterator of an [`path`, `value`] tuple
 * - `path` := `^(\+|\-|\&)?([^\.]+?(\[\d*\])*)(\.[^\.]+?(\[\d*\])*)*$` (e.g. `+a[][1].b`)
 * - `value` := `string` or `File`
 * @param {ParseFormDataOptions} options - options for parsing the form data
 * - `transformEntry` - a function to transform the path and the value before
 *    inserting the value at the path in the resulting object (default: `defaultTransform`)
 * - `removeEmptyString` - if `true` removes all entries where the value is an empty string
 * @returns {JsonObject} the parsed JSON object
 * @throws `DuplicateKeyError` if
 * - a path part is an object and the path part is already defined as an object
 * - a path part is an array and the path part is already defined as an array
 * @throws `MixedArrayError` if at a specific path part an unordered array is
 * defined and at a later path part an ordered array is defined or vice versa
 * - e.g. `a[0]` and `a[]`
 * - e.g. `a[]` and `a[0]`
 */
export declare function parseFormData(formData: Iterable<[string, string | File]>, { removeEmptyString, transformEntry, }?: ParseFormDataOptions): JsonObject;
export {};
