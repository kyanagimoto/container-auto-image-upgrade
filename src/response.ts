// To parse this data:
//
//   import { Convert, Response } from "./file";
//
//   const response = Convert.toResponse(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Response {
  count: number
  next: null
  previous: null
  results: Result[]
}

export interface Result {
  creator: number
  id: number
  image_id: null
  images: Image[]
  last_updated: Date
  last_updater: number
  last_updater_username: LastUpdaterUsername
  name: string
  repository: number
  full_size: number
  v2: boolean
  tag_status: Status
  tag_last_pulled: Date | null
  tag_last_pushed: Date
}

export interface Image {
  architecture: Architecture
  features: string
  variant: null
  digest: string
  os: OS
  os_features: string
  os_version: null
  size: number
  status: Status
  last_pulled: Date | null
  last_pushed: Date | null
}

export enum Architecture {
  Amd64 = 'amd64'
}

export enum OS {
  Linux = 'linux'
}

export enum Status {
  Active = 'active',
  Inactive = 'inactive'
}

export enum LastUpdaterUsername {
  Chriskoehnkeatelastic = 'chriskoehnkeatelastic',
  Dliappis = 'dliappis',
  Elasticmachine = 'elasticmachine',
  Mgreau = 'mgreau'
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toResponse(json: string): Response {
    return cast(JSON.parse(json), r('Response'))
  }

  public static responseToJson(value: Response): string {
    return JSON.stringify(uncast(value, r('Response')), null, 2)
  }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
  if (key) {
    throw Error(
      `Invalid value for key "${key}". Expected type ${JSON.stringify(
        typ
      )} but got ${JSON.stringify(val)}`
    )
  }
  throw Error(
    `Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`
  )
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.json] = {key: p.js, typ: p.typ}))
    typ.jsonToJS = map
  }
  return typ.jsonToJS
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.js] = {key: p.json, typ: p.typ}))
    typ.jsToJSON = map
  }
  return typ.jsToJSON
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val
    return invalidValue(typ, val, key)
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length
    for (let i = 0; i < l; i++) {
      const typ = typs[i]
      try {
        return transform(val, typ, getProps)
      } catch (_) {}
    }
    return invalidValue(typs, val)
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val
    return invalidValue(cases, val)
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue('array', val)
    return val.map(el => transform(el, typ, getProps))
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null
    }
    const d = new Date(val)
    if (isNaN(d.valueOf())) {
      return invalidValue('Date', val)
    }
    return d
  }

  function transformObject(
    props: {[k: string]: any},
    additional: any,
    val: any
  ): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue('object', val)
    }
    const result: any = {}
    Object.getOwnPropertyNames(props).forEach(key => {
      const prop = props[key]
      const v = Object.prototype.hasOwnProperty.call(val, key)
        ? val[key]
        : undefined
      result[prop.key] = transform(v, prop.typ, getProps, prop.key)
    })
    Object.getOwnPropertyNames(val).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key)
      }
    })
    return result
  }

  if (typ === 'any') return val
  if (typ === null) {
    if (val === null) return val
    return invalidValue(typ, val)
  }
  if (typ === false) return invalidValue(typ, val)
  while (typeof typ === 'object' && typ.ref !== undefined) {
    typ = typeMap[typ.ref]
  }
  if (Array.isArray(typ)) return transformEnum(typ, val)
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty('props')
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val)
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') return transformDate(val)
  return transformPrimitive(typ, val)
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps)
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps)
}

function a(typ: any) {
  return {arrayItems: typ}
}

function u(...typs: any[]) {
  return {unionMembers: typs}
}

function o(props: any[], additional: any) {
  return {props, additional}
}

function m(additional: any) {
  return {props: [], additional}
}

function r(name: string) {
  return {ref: name}
}

const typeMap: any = {
  Response: o(
    [
      {json: 'count', js: 'count', typ: 0},
      {json: 'next', js: 'next', typ: null},
      {json: 'previous', js: 'previous', typ: null},
      {json: 'results', js: 'results', typ: a(r('Result'))}
    ],
    false
  ),
  Result: o(
    [
      {json: 'creator', js: 'creator', typ: 0},
      {json: 'id', js: 'id', typ: 0},
      {json: 'image_id', js: 'image_id', typ: null},
      {json: 'images', js: 'images', typ: a(r('Image'))},
      {json: 'last_updated', js: 'last_updated', typ: Date},
      {json: 'last_updater', js: 'last_updater', typ: 0},
      {
        json: 'last_updater_username',
        js: 'last_updater_username',
        typ: r('LastUpdaterUsername')
      },
      {json: 'name', js: 'name', typ: ''},
      {json: 'repository', js: 'repository', typ: 0},
      {json: 'full_size', js: 'full_size', typ: 0},
      {json: 'v2', js: 'v2', typ: true},
      {json: 'tag_status', js: 'tag_status', typ: r('Status')},
      {json: 'tag_last_pulled', js: 'tag_last_pulled', typ: u(Date, null)},
      {json: 'tag_last_pushed', js: 'tag_last_pushed', typ: Date}
    ],
    false
  ),
  Image: o(
    [
      {json: 'architecture', js: 'architecture', typ: r('Architecture')},
      {json: 'features', js: 'features', typ: ''},
      {json: 'variant', js: 'variant', typ: null},
      {json: 'digest', js: 'digest', typ: ''},
      {json: 'os', js: 'os', typ: r('OS')},
      {json: 'os_features', js: 'os_features', typ: ''},
      {json: 'os_version', js: 'os_version', typ: null},
      {json: 'size', js: 'size', typ: 0},
      {json: 'status', js: 'status', typ: r('Status')},
      {json: 'last_pulled', js: 'last_pulled', typ: u(Date, null)},
      {json: 'last_pushed', js: 'last_pushed', typ: u(Date, null)}
    ],
    false
  ),
  Architecture: ['amd64'],
  OS: ['linux'],
  Status: ['active', 'inactive'],
  LastUpdaterUsername: [
    'chriskoehnkeatelastic',
    'dliappis',
    'elasticmachine',
    'mgreau'
  ]
}
