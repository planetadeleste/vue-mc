
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.0.110
   * Released under the MIT license.
   */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vueMc = require('vue-mc');
var lodash = require('lodash');
var vueMc$1 = require('@planetadeleste/vue-mc');
var Vue = require('vue');
var objectToFormdata = require('object-to-formdata');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);

class Request extends vueMc.Request {
    /**
     * @returns {Promise}
     */
    send() {
        return Base.$http
            .request(this.config)
            .then(this.createResponse)
            .catch((error) => {
            throw this.createError(error);
        });
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
class Collection extends vueMc.Collection {
    constructor() {
        super(...arguments);
        this._links = {};
        this._meta = {};
    }
    _base() {
        if (!this._baseClass) {
            this._baseClass = new vueMc$1.Base();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        this.on("fetch", (obEvent) => {
            const sError = lodash.get(obEvent, "error");
            if (sError) {
                this.alert(sError);
            }
        });
    }
    getRouteResolver() {
        return vueMc$1.Base.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!vueMc$1.Base.$flashModule) {
            return sMessage;
        }
        lodash.invoke(vueMc$1.Base.$flashModule, sType, sMessage);
        return sMessage;
    }
    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config) {
        const obRequest = new Request(config);
        return obRequest;
    }
    /**
     * Create a custom request, using option.method, route and data.
     * Response data will be fetched in collection
     *
     * @param {string} sMethod Method key name
     * @param {string | Record<string, any> | string[]} [sRoute] Route key name, model data or key params
     * @param {Record<string, any> | string[]} [obData] Model data or key params
     * @param {string[]} [arParams] Param keys to pick from model attributes
     * @returns {Promise<Response>}
     */
    async createCustomRequest(sMethod, sRoute, obData, arParams) {
        const obRequestData = this.parseRequestConfig(sMethod, sRoute, obData, arParams);
        return await this.fetch(obRequestData);
    }
    /**
     * Create a custom request, using option.method, route and data
     * Response data will be returned
     *
     * @param {string} sMethod Method key name
     * @param {string | Record<string, any> | string[]} [sRoute] Route key name, model data or key params
     * @param {Record<string, any> | string[]} [obData] Model data or key params
     * @param {string[]} [arParams] Param keys to pick from model attributes
     * @returns {Promise<Response>}
     */
    async customRequest(sMethod, sRoute, obData, arParams) {
        const obRequestData = this.parseRequestConfig(sMethod, sRoute, obData, arParams);
        return await this.createRequest(obRequestData).send();
    }
    parseRequestConfig(sMethod, sRoute, obData, arParams) {
        if (!lodash.isString(sRoute)) {
            if (lodash.isArray(sRoute)) {
                arParams = sRoute;
                obData = {};
            }
            else if (lodash.isPlainObject(sRoute)) {
                if (lodash.isArray(obData)) {
                    arParams = obData;
                }
                obData = sRoute;
            }
            sRoute = sMethod;
        }
        if (lodash.isUndefined(arParams)) {
            arParams = [];
        }
        if (lodash.isUndefined(obData)) {
            obData = {};
        }
        const method = this.getOption(`methods.${sMethod}`);
        const route = this.getRoute(sRoute);
        const params = lodash.isEmpty(arParams)
            ? {}
            : lodash.pick(this.getRouteParameters(), arParams);
        const url = this.getURL(route, params);
        return { method, url, data: obData };
    }
    getModelsFromResponse(response) {
        const models = response.getData();
        // An empty, non-array response indicates that we didn't intend to send
        // any models in the response. This means that the current models are
        // already up to date, as no changes are necessary.
        if (lodash.isNil(models) || models === "") {
            return null;
        }
        // Add pagination meta/links properties
        if (lodash.has(models, "meta")) {
            this._meta = lodash.get(models, "meta");
            this.page(this._meta.current_page);
        }
        if (lodash.has(models, "links")) {
            this._links = lodash.get(models, "links");
        }
        // We're making an assumption here that paginated models are returned
        // within the "data" field of the response.
        if (this.isPaginated() || lodash.has(models, "data")) {
            return lodash.get(models, "data", models);
        }
        return models;
    }
    /*
     * PAGINATION METHODS
     */
    /**
     * Get the current collection page, gived from server response
     * @returns {number}
     */
    getCurrentPage() {
        return lodash.get(this._meta, "current_page", 1);
    }
    /**
     * Get last collection page, gived from server response
     * @returns {number}
     */
    getLastPage() {
        return lodash.get(this._meta, "last_page", 1);
    }
    /**
     * Get total number of collection items from server
     * @returns {number}
     */
    getTotalItems() {
        return lodash.get(this._meta, "total", 0);
    }
    /**
     * Get pagination data
     * @returns {ApiMetaResponse}
     */
    getPaginationData() {
        return this._meta;
    }
    /**
     * Get pagination links for first, last, next and prev page
     * @returns {ApiLinksResponse}
     */
    getLinks() {
        return this._links;
    }
    /**
     *
     * @param {Object} filters JSON object to add filters param
     * @returns {Collection}
     */
    filterBy(filters) {
        if (lodash.isEmpty(filters) || !lodash.isPlainObject(filters)) {
            return this;
        }
        if (lodash.has(filters, "filters")) {
            filters = lodash.get(filters, "filters");
        }
        const obFilters = this.get("filters", {});
        lodash.assign(obFilters, filters);
        this.set("filters", lodash.pickBy(obFilters, (sValue) => {
            return lodash.isNumber(sValue) ? true : !lodash.isNil(sValue) && !lodash.isEmpty(sValue);
        }));
        return this;
    }
    /**
     * Remove all collection filters
     * @returns {T}
     */
    clearFilters() {
        this.set("filters", {});
        return this;
    }
    /**
     * Limit number of records getting from query
     *
     * @param {Number} iCount Number of records to get
     */
    limit(iCount) {
        this.set("limit", iCount);
        return this;
    }
    /**
     * @returns {Record<string, any>} A native representation of this collection models that will determine the contents of JSON.stringify(model).
     */
    getModelList() {
        return lodash.map(this.getModels(), (obModel) => obModel.toJSON());
    }
}

function mitt (n) {
  return {
    all: n = n || new Map(),
    on: function on(t, e) {
      var i = n.get(t);
      i ? i.push(e) : n.set(t, [e]);
    },
    off: function off(t, e) {
      var i = n.get(t);
      i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
    },
    emit: function emit(t, e) {
      var i = n.get(t);
      i && i.slice().map(function (n) {
        n(e);
      }), (i = n.get("*")) && i.slice().map(function (n) {
        n(t, e);
      });
    }
  };
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
class Model extends vueMc.Model {
    _base() {
        if (!this._baseClass) {
            this._baseClass = new vueMc$1.Base();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        Vue__default['default'].set(this, "_relations", {});
        Vue__default['default'].set(this, "_accessors", {});
        this._silently = false;
        this._emitter = mitt();
        this.compileAccessors();
        // @ts-ignore
        this.assignRelations();
        this.on("fetch", (obEvent) => {
            const obModel = obEvent.target;
            const attrs = obModel.attributes;
            if (lodash.has(attrs, "data") && lodash.isNil(obModel.id)) {
                this.clear();
                this.assign(attrs.data);
            }
        });
    }
    get relations() {
        return this._relations;
    }
    on(sEvent, fnListener) {
        this._emitter.on(sEvent, fnListener);
    }
    off(sType, fnHandler) {
        this._emitter.off(sType, fnHandler);
    }
    emit(sEvent, obContext) {
        // @ts-ignore
        this._emitter.emit(sEvent, obContext);
    }
    silenty(bEvent) {
        if (lodash.isUndefined(bEvent) || !lodash.isBoolean(bEvent)) {
            this._silently = true;
        }
        else if (lodash.isBoolean(bEvent)) {
            this._silently = bEvent;
        }
        return this;
    }
    definedRelations() {
        return {};
    }
    setRelation(name, config, relation) {
        if (relation && lodash.isPlainObject(relation)) {
            relation = new config.class(relation);
        }
        const foreignKey = config.foreignKey || `${name}_id`;
        const localKey = config.localKey || "id";
        Vue__default['default'].set(this._relations, name, relation);
        const value = relation ? relation[localKey] : null;
        this.set(foreignKey, value);
        return this;
    }
    getRelation(name) {
        return this._relations[name];
    }
    registerRelation(name, config) {
        const names = lodash.unionBy([name], config.aliases);
        lodash.each(names, (item) => {
            const exist = !lodash.isUndefined(this[item]); // I can't find how to set Relations before super() method.
            Object.defineProperty(this, item, {
                get: () => this.getRelation(name),
                set: (relation) => this.setRelation(name, config, relation),
            });
            if (exist) {
                lodash.set(this, item, lodash.cloneDeep(this.get(item)));
                this.unset(item);
            }
        });
        return this;
    }
    assignRelations() {
        lodash.each(this.definedRelations(), (config, name) => {
            this.registerRelation(name, config);
        });
    }
    /**
     * The isDirty method determines if any of the model's attributes have
     * been changed since the model was retrieved. You may pass a specific
     * attribute name to the isDirty method to determine if a particular
     * attribute is dirty.
     *
     * @author Alvaro Canepa <bfpdevel@gmail.com>
     * @return {boolean}
     * @memberof Model
     */
    isDirty(sKey) {
        const arChanged = this.changed();
        if (!arChanged) {
            return false;
        }
        return sKey ? arChanged.includes(sKey) : true;
    }
    /**
     *  @returns {Object} Attribute accessor keyed by attribute name.
     */
    accessors() {
        return {};
    }
    /**
     * Compiles all accessors into pipelines that can be executed quickly.
     */
    compileAccessors() {
        this._accessors = lodash.mapValues(this.accessors(), (m) => lodash.flow(m));
        this.on("sync", this.assignAccessors.bind(this));
    }
    /**
     * Sync all accessors with model attributes
     */
    assignAccessors() {
        lodash.each(this._accessors, (fAccessor, sKey) => {
            if (!this.hasIn(sKey)) {
                this.set(sKey, fAccessor());
            }
        });
    }
    getRouteResolver() {
        return vueMc$1.Base.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!vueMc$1.Base.$flashModule) {
            return sMessage;
        }
        lodash.invoke(vueMc$1.Base.$flashModule, sType, sMessage);
        return sMessage;
    }
    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config) {
        const obRequest = new Request(config);
        return obRequest;
    }
    /**
     * Create a custom request, using option.method, route and data
     *
     * @param {string} sMethod Method key name
     * @param {string | Record<string, any> | string[]} [sRoute] Route key name, model data or key params
     * @param {Record<string, any> | string[]} [obData] Model data or key params
     * @param {string[]} [arParams] Param keys to pick from model attributes
     * @returns {Promise<Response>}
     */
    async createCustomRequest(sMethod, sRoute, obData, arParams) {
        if (!lodash.isString(sRoute)) {
            if (lodash.isArray(sRoute)) {
                arParams = sRoute;
                obData = {};
            }
            else if (lodash.isPlainObject(sRoute)) {
                if (lodash.isArray(obData)) {
                    arParams = obData;
                }
                obData = sRoute;
            }
            sRoute = sMethod;
        }
        if (lodash.isUndefined(arParams)) {
            arParams = [];
        }
        if (lodash.isUndefined(obData)) {
            obData = {};
        }
        if (this._silently) {
            lodash.set(obData, "silently", this._silently);
        }
        const method = this.getOption(`methods.${sMethod}`);
        const route = this.getRoute(sRoute);
        const params = lodash.isEmpty(arParams)
            ? {}
            : lodash.pick(this.getRouteParameters(), arParams);
        const url = this.getURL(route, params);
        return await this.createRequest({ method, url, data: obData }).send();
    }
    /**
     * @returns {Object} The data to send to the server when saving this model.
     */
    getSaveData() {
        if (!this.isNew()) {
            this.set("_method", "PUT");
        }
        return super.getSaveData();
    }
    /**
     * Iterates over elements of data to find instanceof File
     *
     * @param {Object} data
     * @returns {Boolean}
     */
    hasFileUpload(data) {
        let hasFile = false;
        if (data instanceof File) {
            return true;
        }
        if (lodash.isArray(data) || lodash.isObject(data)) {
            lodash.forEach(data, (item) => {
                if (this.hasFileUpload(item)) {
                    hasFile = true;
                }
            });
        }
        else if (data instanceof File) {
            hasFile = true;
        }
        return hasFile;
    }
    /**
     * Detect instance of File in saved data ams call upload or save methods.
     * Persists data to the database/API.
     *
     * @param {options}             Save options
     * @param {options.method}      Save HTTP method
     * @param {options.url}         Save URL
     * @param {options.data}        Save data
     * @param {options.params}      Query params
     * @param {options.headers}     Query headers
     *
     * @returns {Promise}
     */
    store(options = {}) {
        let data = lodash.defaultTo(options.data, this.getSaveData());
        if (this.hasFileUpload(data)) {
            data = objectToFormdata.serialize(data, { indices: true, booleansAsIntegers: true });
        }
        lodash.assign(options, { data });
        return this.save(options);
    }
    hasIn(sKey) {
        return this.has(sKey) || sKey in this;
    }
}

class Base {
    get flashModule() {
        return Base.$flashModule;
    }
    get loadingModule() {
        return Base.$loadingModule;
    }
    get authModule() {
        return Base.$authModule;
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description File model
 * @author Alvaro Canepa <bfpdevel@gmail.com>
 * @export
 * @class File
 * @extends {Model}
 *
 * @property {string} disk_name
 * @property {string} thumb
 * @property {string} path
 * @property {string} file_name
 * @property {string} ext
 * @property {string} title
 * @property {string} description
 */
class File$1 extends vueMc$1.Model {
    defaults() {
        return {
            disk_name: null,
            thumb: null,
            path: null,
            file_name: null,
            ext: null,
            title: null,
            description: null,
        };
    }
    options() {
        return {
            methods: {
                resize: "GET",
            },
        };
    }
    routes() {
        return {
            resize: "files.resize",
        };
    }
    /**
     * @description Resize current file
     * @author Alvaro Canepa <bfpdevel@gmail.com>
     * @param {number} width Target width. If is 0, that value is calculated using original image ratio
     * @param {number} height Target height. If is 0, that value is calculated using original image ratio
     * @return {Promise<Response>}
     * @memberof File
     */
    async resize(width, height) {
        return await this.createCustomRequest("resize", { width, height, disk_name: this.disk_name }, ["disk_name"]);
    }
}

/**
 * Base Models and Collections.
 * Prepared to be used with PlanetaDelEste.ApiShopaholic OctoberCMS plugin
 *
 * @author Alvaro Canepa <bfpdevel@gmail.com>
 */
/**
 * Convert value to string and trim
 * @param {string} sVal
 * @returns {string}
 */
const cleanStr = (sVal) => {
    if (lodash.isNil(sVal)) {
        return null;
    }
    return lodash.trim(lodash.toString(sVal));
};

exports.Base = Base;
exports.Collection = Collection;
exports.File = File$1;
exports.Model = Model;
exports.Request = Request;
exports.cleanStr = cleanStr;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vbm9kZV9tb2R1bGVzL21pdHQvZGlzdC9taXR0Lm1qcyIsIi4uL3NyYy9zdHJ1Y3R1cmUvTW9kZWwudHMiLCIuLi9zcmMvc3RydWN0dXJlL0Jhc2UudHMiLCIuLi9zcmMvc3RydWN0dXJlL0ZpbGUudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG4pe3JldHVybnthbGw6bj1ufHxuZXcgTWFwLG9uOmZ1bmN0aW9uKHQsZSl7dmFyIGk9bi5nZXQodCk7aT9pLnB1c2goZSk6bi5zZXQodCxbZV0pfSxvZmY6ZnVuY3Rpb24odCxlKXt2YXIgaT1uLmdldCh0KTtpJiYoZT9pLnNwbGljZShpLmluZGV4T2YoZSk+Pj4wLDEpOm4uc2V0KHQsW10pKX0sZW1pdDpmdW5jdGlvbih0LGUpe3ZhciBpPW4uZ2V0KHQpO2kmJmkuc2xpY2UoKS5tYXAoZnVuY3Rpb24obil7bihlKX0pLChpPW4uZ2V0KFwiKlwiKSkmJmkuc2xpY2UoKS5tYXAoZnVuY3Rpb24obil7bih0LGUpfSl9fX1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1pdHQubWpzLm1hcFxuIixudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsIkJhc2UiLCJnZXQiLCJpbnZva2UiLCJpc1N0cmluZyIsImlzQXJyYXkiLCJpc1BsYWluT2JqZWN0IiwiaXNVbmRlZmluZWQiLCJpc0VtcHR5IiwicGljayIsImlzTmlsIiwiaGFzIiwiYXNzaWduIiwicGlja0J5IiwiaXNOdW1iZXIiLCJtYXAiLCJhbGwiLCJNYXAiLCJvbiIsInR5cGUiLCJoYW5kbGVyIiwiaGFuZGxlcnMiLCJwdXNoIiwic2V0Iiwib2ZmIiwic3BsaWNlIiwiaW5kZXhPZiIsImVtaXQiLCJldnQiLCJzbGljZSIsIkJhc2VNb2RlbCIsIlZ1ZSIsImlzQm9vbGVhbiIsInVuaW9uQnkiLCJlYWNoIiwiY2xvbmVEZWVwIiwibWFwVmFsdWVzIiwiZmxvdyIsImlzT2JqZWN0IiwiZm9yRWFjaCIsImRlZmF1bHRUbyIsInNlcmlhbGl6ZSIsIkZpbGUiLCJNb2RlbCIsInRyaW0iLCJ0b1N0cmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQUlxQixPQUFRLFNBQVFBLGFBQVc7Ozs7SUFJOUMsSUFBSTtRQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUs7YUFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQzthQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQzthQUN6QixLQUFLLENBQUMsQ0FBQyxLQUFpQjtZQUN2QixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0IsQ0FBQyxDQUFDO0tBQ047OztBQ2ZIO01BNkJxQixVQUduQixTQUFRQyxnQkFBaUI7SUFIM0I7O1FBS0UsV0FBTSxHQUEyQyxFQUFFLENBQUM7UUFDcEQsVUFBSyxHQUEwQyxFQUFFLENBQUM7S0EyUW5EO0lBelFDLEtBQUs7UUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUlDLFlBQUksRUFBRSxDQUFDO1NBQzlCO1FBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQ3hCO0lBRUQsSUFBSTtRQUNGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBNEI7WUFDNUMsTUFBTSxNQUFNLEdBQUdDLFVBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckMsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNwQjtTQUNGLENB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
