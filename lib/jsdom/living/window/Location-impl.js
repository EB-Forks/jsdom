"use strict";
const whatwgURL = require("whatwg-url");
const DOMException = require("domexception/webidl2js-wrapper");
const { documentBaseURL, parseURLToResultingURLRecord } = require("../helpers/document-base-url");
const { navigate } = require("./navigation");
const idlUtils = require("../generated/utils.js");

// Not implemented: use of entry settings object's API base URL in href setter, assign, and replace. Instead we just
// use the document base URL. The difference matters in the case of cross-frame calls.

exports.implementation = class LocationImpl {
  constructor(globalObject, args, privateData) {
    this._relevantDocument = privateData.relevantDocument;
    this.url = null;

    this._globalObject = globalObject;
  }

  get _url() {
    return this._relevantDocument._URL;
  }

  _locationObjectSetterNavigate(url) {
    // Not implemented: extra steps here to determine replacement flag.

    return this._locationObjectNavigate(url);
  }

  _locationObjectNavigate(url, { replacement = false } = {}) {
    // Not implemented: the setup for calling navigate, which doesn't apply to our stub navigate anyway.

    navigate(this._relevantDocument._defaultView, url, { replacement, exceptionsEnabled: true });
  }

  toString() {
    return this.href;
  }

  get href() {
    return whatwgURL.serializeURL(this._url);
  }
  set href(v) {
    const newURL = whatwgURL.parseURL(v, { baseURL: documentBaseURL(this._relevantDocument) });
    if (newURL === null) {
      throw new TypeError(`Could not parse "${v}" as a URL`);
    }

    this._locationObjectSetterNavigate(newURL);
  }

  get origin() {
    return whatwgURL.serializeURLOrigin(this._url);
  }

  get protocol() {
    return this._url.scheme + ":";
  }
  set protocol(v) {
    const copyURL = Object.assign({}, this._url);

    const possibleFailure = whatwgURL.basicURLParse(v + ":", { url: copyURL, stateOverride: "scheme start" });
    if (possibleFailure === null) {
      throw new TypeError(`Could not parse the URL after setting the procol to "${v}"`);
    }

    if (copyURL.scheme !== "http" && copyURL.scheme !== "https") {
      return;
    }

    this._locationObjectSetterNavigate(copyURL);
  }

  get host() {
    const url = this._url;

    if (url.host === null) {
      return "";
    }
    if (url.port === null) {
      return whatwgURL.serializeHost(url.host);
    }

    return whatwgURL.serializeHost(url.host) + ":" + whatwgURL.serializeInteger(url.port);
  }
  set host(v) {
    const copyURL = Object.assign({}, this._url);

    if (copyURL.cannotBeABaseURL) {
      return;
    }

    whatwgURL.basicURLParse(v, { url: copyURL, stateOverride: "host" });

    this._locationObjectSetterNavigate(copyURL);
  }

  get hostname() {
    if (this._url.host === null) {
      return "";
    }

    return whatwgURL.serializeHost(this._url.host);
  }
  set hostname(v) {
    const copyURL = Object.assign({}, this._url);

    if (copyURL.cannotBeABaseURL) {
      return;
    }

    whatwgURL.basicURLParse(v, { url: copyURL, stateOverride: "hostname" });

    this._locationObjectSetterNavigate(copyURL);
  }

  get port() {
    if (this._url.port === null) {
      return "";
    }

    return whatwgURL.serializeInteger(this._url.port);
  }
  set port(v) {
    const copyURL = Object.assign({}, this._url);

    if (copyURL.host === null || copyURL.cannotBeABaseURL || copyURL.scheme === "file") {
      return;
    }

    whatwgURL.basicURLParse(v, { url: copyURL, stateOverride: "port" });

    this._locationObjectSetterNavigate(copyURL);
  }

  get pathname() {
    const url = this._url;

    if (url.cannotBeABaseURL) {
      return url.path[0];
    }

    return "/" + url.path.join("/");
  }
  set pathname(v) {
    const copyURL = Object.assign({}, this._url);

    if (copyURL.cannotBeABaseURL) {
      return;
    }

    copyURL.path = [];
    whatwgURL.basicURLParse(v, { url: copyURL, stateOverride: "path start" });

    this._locationObjectSetterNavigate(copyURL);
  }

  get search() {
    if (this._url.query === null || this._url.query === "") {
      return "";
    }

    return "?" + this._url.query;
  }
  set search(v) {
    const copyURL = Object.assign({}, this._url);

    if (v === "") {
      copyURL.query = null;
    } else {
      const input = v[0] === "?" ? v.substring(1) : v;
      copyURL.query = "";
      whatwgURL.basicURLParse(input, {
        url: copyURL,
        stateOverride: "query",
        encodingOverride: this._relevantDocument.charset
      });
    }

    this._locationObjectSetterNavigate(copyURL);
  }

  get hash() {
    if (this._url.fragment === null || this._url.fragment === "") {
      return "";
    }

    return "#" + this._url.fragment;
  }
  set hash(v) {
    const copyURL = Object.assign({}, this._url);

    if (copyURL.scheme === "javascript") {
      return;
    }

    if (v === "") {
      copyURL.fragment = null;
    } else {
      const input = v[0] === "#" ? v.substring(1) : v;
      copyURL.fragment = "";
      whatwgURL.basicURLParse(input, { url: copyURL, stateOverride: "fragment" });
    }

    this._locationObjectSetterNavigate(copyURL);
  }

  assign(url) {
    // Should be entry settings object; oh well
    const parsedURL = parseURLToResultingURLRecord(url, this._relevantDocument);

    if (parsedURL === null) {
      throw DOMException.create(this._globalObject, [
        `Could not resolve the given string "${url}" relative to the base URL "${this._relevantDocument.URL}"`,
        "SyntaxError"
      ]);
    }

    this._locationObjectNavigate(parsedURL);
  }

  replace(url) {
    // Should be entry settings object; oh well
    const parsedURL = parseURLToResultingURLRecord(url, this._relevantDocument);

    if (parsedURL === null) {
      throw DOMException.create(this._globalObject, [
        `Could not resolve the given string "${url}" relative to the base URL "${this._relevantDocument.URL}"`,
        "SyntaxError"
      ]);
    }

    this._locationObjectNavigate(parsedURL, { replacement: true });
  }

  reload() {
    const flags = { replace: true, reloadTriggered: true, exceptionsEnabled: true };
    navigate(this._relevantDocument._defaultView, this._url, flags);
  }
};

const proxyHandler = {
  // https://html.spec.whatwg.org/multipage/history.html#location-getprototypeof
  getPrototypeOf(target) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then return ! OrdinaryGetPrototypeOf(this).
    return Reflect.getPrototypeOf(target);

    // 2. Return null.
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-setprototypeof
  setPrototypeOf(target, V) {
    // 1. Return ! SetImmutablePrototype(this, V).

    // SetImmutablePrototype ( O, V ): https://tc39.es/ecma262/#sec-set-immutable-prototype
    // 1. Assert: Either Type(V) is Object or Type(V) is Null.
    // 2. Let current be ? O.[[GetPrototypeOf]]().
    const current = this.getPrototypeOf(target);

    // 3. If SameValue(V, current) is true, return true.
    // 4. Return false.
    return Object.is(V, current);
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-isextensible
  isExtensible() {
    return true;
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-preventextensions
  preventExtensions() {
    return false;
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-getownproperty
  getOwnPropertyDescriptor(target, P) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then:
    //     1. Let desc be ! OrdinaryGetOwnProperty(this, P).
    const desc = Reflect.getOwnPropertyDescriptor(target, P);

    //     2. If the value of the [[DefaultProperties]] internal slot of this contains P,
    //        then set desc.[[Configurable]] to true.
    /*
    if (idlUtils.implForWrapper(target)._defaultProperties.includes(P)) {
      // The properties are defined as `[LegacyUnforgeable]`, which makes them non-configurable:
      desc.configurable = true;
    }
    */

    //     3. Return desc.
    return desc;

    // 2. Let property be ! CrossOriginGetOwnPropertyHelper(this, P).
    // 3. If property is not undefined, then return property.
    // 4. Return ? CrossOriginPropertyFallback(P).
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-defineownproperty
  defineProperty(target, P, desc) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then:
    //     1. If the value of the [[DefaultProperties]] internal slot of this contains P, then return false.
    if (idlUtils.implForWrapper(target)._defaultProperties.includes(P)) {
      return false;
    }

    //     2. Return ? OrdinaryDefineOwnProperty(this, P, Desc).
    return Reflect.defineProperty(target, P, desc);

    // 2. Throw a "SecurityError" DOMException.
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-get
  get(target, P, receiver) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then return ? OrdinaryGet(this, P, receiver).
    const desc = this.getOwnPropertyDescriptor(target, P);
    if (desc === undefined) {
      const parent = this.getPrototypeOf(target);
      if (parent === null) {
        return undefined;
      }
      return Reflect.get(target, P, receiver);
    }
    if (!desc.get && !desc.set) {
      return desc.value;
    }
    const getter = desc.get;
    if (getter === undefined) {
      return undefined;
    }
    return Reflect.apply(getter, receiver, []);

    // 2. Return ? CrossOriginGet(this, P, receiver).
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-set
  set(target, P, V, receiver) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then return ? OrdinarySet(this, P, V, receiver).
    let ownDesc = this.getOwnPropertyDescriptor(target, P);
    if (ownDesc === undefined) {
      const parent = this.getPrototypeOf(target);
      if (parent !== null) {
        return Reflect.set(parent, P, V, receiver);
      }
      ownDesc = { writable: true, enumerable: true, configurable: true, value: undefined };
    }
    if (!ownDesc.writable) {
      return false;
    }
    const existingDesc = Reflect.getOwnPropertyDescriptor(receiver, P);
    let valueDesc;
    if (existingDesc !== undefined) {
      if (existingDesc.get || existingDesc.set) {
        return false;
      }
      if (!existingDesc.writable) {
        return false;
      }
      valueDesc = { value: V };
    } else {
      valueDesc = { writable: true, enumerable: true, configurable: true, value: V };
    }
    return Reflect.defineProperty(receiver, P, valueDesc);

    // 2. Return ? CrossOriginSet(this, P, V, receiver).
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-delete
  deleteProperty(target, P) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then:
    //     1. If the value of the [[DefaultProperties]] internal slot of this contains P, then return false.
    if (idlUtils.implForWrapper(target)._defaultProperties.includes(P)) {
      return false;
    }

    //     2. Return ? OrdinaryDelete(this, P).
    return Reflect.deleteProperty(target, P);

    // 2. Throw a "SecurityError" DOMException.
  },

  // https://html.spec.whatwg.org/multipage/history.html#location-ownpropertykeys
  ownKeys(target) {
    // 1. If ! IsPlatformObjectSameOrigin(this) is true, then return ! OrdinaryOwnPropertyKeys(this).
    return Reflect.ownKeys(target);

    // 2. Return ! CrossOriginOwnPropertyKeys(this).
  }
};

exports.init = locationImpl => {
  const locationWrapper = idlUtils.wrapperForImpl(locationImpl);
  locationImpl._defaultProperties = Reflect.ownKeys(locationWrapper);

  // TODO: Do this using a WebIDL2JS-specific extended attribute:
  locationImpl[idlUtils.wrapperSymbol] = new Proxy(locationWrapper, proxyHandler);
};
