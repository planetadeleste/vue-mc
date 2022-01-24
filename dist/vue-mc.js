
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.0.116
   * Released under the MIT license.
   */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vueMc = require('vue-mc');
var vueMc$1 = require('@planetadeleste/vue-mc');
var lodash = require('lodash');
var Vue = require('vue');
var objectToFormdata = require('object-to-formdata');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);

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
        const obRequest = new vueMc$1.Request(config);
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
        if (lodash.isUndefined(arParams) || lodash.isEmpty(arParams)) {
            arParams = ["filters"];
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

/* eslint-disable @typescript-eslint/ban-ts-comment */
class Model extends vueMc.Model {
    _base() {
        if (!this._baseClass) {
            this._baseClass = vueMc$1.Base.getInstance();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        Vue__default['default'].set(this, "_relations", {});
        Vue__default['default'].set(this, "_accessors", {});
        this._silently = false;
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
        const obRequest = new vueMc$1.Request(config);
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
        if (lodash.isUndefined(arParams) || lodash.isEmpty(arParams)) {
            arParams = ["filters"];
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new Base();
        }
        return this.instance;
    }
    /**
     * getRouteResolver
     */
    getRouteResolver() {
        return this._resolve;
    }
    /**
     * setRouteResolver
     */
    setRouteResolver(obResolve) {
        this._resolve = obResolve;
    }
    /**
     * getHttp
     */
    getHttp() {
        return this._http;
    }
    /**
     * setHttp
     */
    setHttp(obValue) {
        this._http = obValue;
    }
    /**
     * getFlashModule
     */
    getFlashModule() {
        return this._flashModule;
    }
    /**
     * setFlashModule
     */
    setFlashModule(obModule) {
        this._flashModule = obModule;
    }
    /**
     * getLoadingModule
     */
    getLoadingModule() {
        return this._loadingModule;
    }
    /**
     * setLoadingModule
     */
    setLoadingModule(obModule) {
        this._loadingModule = obModule;
    }
    /**
     * getAuthModule
     */
    getAuthModule() {
        return this._authModule;
    }
    /**
     * setAuthModule
     */
    setAuthModule(obModule) {
        this._authModule = obModule;
    }
    static get $resolve() {
        return Base.getInstance().getRouteResolver();
    }
    static set $resolve(obValue) {
        Base.getInstance().setRouteResolver(obValue);
    }
    static get $http() {
        return Base.getInstance().getHttp();
    }
    static set $http(obValue) {
        Base.getInstance().setHttp(obValue);
    }
    static get flashModule() {
        return Base.getInstance().getFlashModule();
    }
    static get $flashModule() {
        return Base.getInstance().getFlashModule();
    }
    static set $flashModule(obValue) {
        Base.getInstance().setFlashModule(obValue);
    }
    static get loadingModule() {
        return Base.getInstance().getLoadingModule();
    }
    static get $loadingModule() {
        return Base.getInstance().getLoadingModule();
    }
    static set $loadingModule(obValue) {
        Base.getInstance().setLoadingModule(obValue);
    }
    static get authModule() {
        return Base.getInstance().getAuthModule();
    }
    static get $authModule() {
        return Base.getInstance().getAuthModule();
    }
    static set $authModule(obValue) {
        Base.getInstance().setAuthModule(obValue);
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

class Request extends vueMc.Request {
    /**
     * @returns {Promise}
     */
    send() {
        return vueMc$1.Base.$http
            .request(this.config)
            .then(this.createResponse)
            .catch((error) => {
            throw this.createError(error);
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvc3RydWN0dXJlL0NvbGxlY3Rpb24udHMiLCIuLi9zcmMvc3RydWN0dXJlL01vZGVsLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9CYXNlLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9GaWxlLnRzIiwiLi4vc3JjL3JlcXVlc3QvUmVxdWVzdC50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiQmFzZUNvbGxlY3Rpb24iLCJCYXNlIiwiZ2V0IiwiaW52b2tlIiwiUmVxdWVzdCIsImlzU3RyaW5nIiwiaXNBcnJheSIsImlzUGxhaW5PYmplY3QiLCJpc1VuZGVmaW5lZCIsImlzRW1wdHkiLCJwaWNrIiwiaXNOaWwiLCJoYXMiLCJhc3NpZ24iLCJwaWNrQnkiLCJpc051bWJlciIsIm1hcCIsIkJhc2VNb2RlbCIsIlZ1ZSIsImlzQm9vbGVhbiIsInVuaW9uQnkiLCJlYWNoIiwic2V0IiwiY2xvbmVEZWVwIiwibWFwVmFsdWVzIiwiZmxvdyIsImlzT2JqZWN0IiwiZm9yRWFjaCIsImRlZmF1bHRUbyIsInNlcmlhbGl6ZSIsIkZpbGUiLCJNb2RlbCIsIlJlcXVlc3RCYXNlIiwidHJpbSIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7TUE2QnFCLFVBR25CLFNBQVFBLGdCQUFpQjtJQUgzQjs7UUFLRSxXQUFNLEdBQTJDLEVBQUUsQ0FBQztRQUNwRCxVQUFLLEdBQTBDLEVBQUUsQ0FBQztLQTJRbkQ7SUF6UUMsS0FBSztRQUNILElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSUMsWUFBSSxFQUFFLENBQUM7U0FDOUI7UUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDeEI7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRWIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUE0QjtZQUM1QyxNQUFNLE1BQU0sR0FBR0MsVUFBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyQyxJQUFJLE1BQU0sRUFBRTtnQkFDVixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3BCO1NBQ0YsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxnQkFBZ0I7UUFDZCxPQUFPRCxZQUFJLENBQUMsUUFBUSxDQUFDO0tBQ3RCOzs7Ozs7O0lBUUQsS0FBSyxDQUFDLFFBQWdCLEVBQUUsS0FBSyxHQUFHLE9BQU87UUFDckMsSUFBSSxDQUFDQSxZQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3RCLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBRURFLGFBQU0sQ0FBQ0YsWUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0MsT0FBTyxRQUFRLENBQUM7S0FDakI7Ozs7SUFLRCxhQUFhLENBQUMsTUFBMEI7UUFDdEMsTUFBTSxTQUFTLEdBQUcsSUFBSUcsZUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sU0FBUyxDQUFDO0tBQ2xCOzs7Ozs7Ozs7OztJQVlELE1BQU0sbUJBQW1CLENBQ3ZCLE9BQWUsRUFDZixNQUFxQyxFQUNyQyxNQUE0QixFQUM1QixRQUFtQjtRQUVuQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQzNDLE9BQU8sRUFDUCxNQUFNLEVBQ04sTUFBTSxFQUNOLFFBQVEsQ0FDVCxDQUFDO1FBQ0YsT0FBTyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDeEM7Ozs7Ozs7Ozs7O0lBWUQsTUFBTSxhQUFhLENBQ2pCLE9BQWUsRUFDZixNQUFxQyxFQUNyQyxNQUE0QixFQUM1QixRQUFtQjtRQUVuQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQzNDLE9BQU8sRUFDUCxNQUFNLEVBQ04sTUFBTSxFQUNOLFFBQVEsQ0FDVCxDQUFDO1FBQ0YsT0FBTyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDdkQ7SUFFTyxrQkFBa0IsQ0FDeEIsT0FBZSxFQUNmLE1BQXFDLEVBQ3JDLE1BQTRCLEVBQzVCLFFBQW1CO1FBRW5CLElBQUksQ0FBQ0MsZUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3JCLElBQUlDLGNBQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDbkIsUUFBUSxHQUFHLE1BQU0sQ0FBQztnQkFDbEIsTUFBTSxHQUFHLEVBQUUsQ0FBQzthQUNiO2lCQUFNLElBQUlDLG9CQUFhLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUlELGNBQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDbkIsUUFBUSxHQUFHLE1BQU0sQ0FBQztpQkFDbkI7Z0JBQ0QsTUFBTSxHQUFHLE1BQU0sQ0FBQzthQUNqQjtZQUVELE1BQU0sR0FBRyxPQUFPLENBQUM7U0FDbEI7UUFFRCxJQUFJRSxrQkFBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJQyxjQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDOUMsUUFBUSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEI7UUFFRCxJQUFJRCxrQkFBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sR0FBRyxFQUFFLENBQUM7U0FDYjtRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQUdDLGNBQU8sQ0FBQyxRQUFRLENBQUM7Y0FDNUIsRUFBRTtjQUNGQyxXQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDOUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFdkMsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO0tBQ3RDO0lBRUQscUJBQXFCLENBQUMsUUFBa0I7UUFDdEMsTUFBTSxNQUFNLEdBQVksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDOzs7O1FBSzNDLElBQUlDLFlBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7O1FBR0QsSUFBSUMsVUFBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtZQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHVixVQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNwQztRQUVELElBQUlVLFVBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBR1YsVUFBRyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNwQzs7O1FBSUQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUlVLFVBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDN0MsT0FBT1YsVUFBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDcEM7UUFFRCxPQUFPLE1BQU0sQ0FBQztLQUNmOzs7Ozs7OztJQVVELGNBQWM7UUFDWixPQUFPQSxVQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDM0M7Ozs7O0lBTUQsV0FBVztRQUNULE9BQU9BLFVBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN4Qzs7Ozs7SUFNRCxhQUFhO1FBQ1gsT0FBT0EsVUFBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3BDOzs7OztJQU1ELGlCQUFpQjtRQUdmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNuQjs7Ozs7SUFNRCxRQUFRO1FBR04sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0tBQ3BCOzs7Ozs7SUFPRCxRQUFRLENBQWdDLE9BQTRCO1FBQ2xFLElBQUlPLGNBQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDRixvQkFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQy9DLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJSyxVQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQzNCLE9BQU8sR0FBR1YsVUFBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFDVyxhQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNCLElBQUksQ0FBQyxHQUFHLENBQ04sU0FBUyxFQUNUQyxhQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBVztZQUM1QixPQUFPQyxlQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUNKLFlBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDRixjQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDckUsQ0FBQyxDQUNILENBQUM7UUFFRixPQUFPLElBQUksQ0FBQztLQUNiOzs7OztJQU1ELFlBQVk7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV4QixPQUFPLElBQUksQ0FBQztLQUNiOzs7Ozs7SUFPRCxLQUFLLENBQWdDLE1BQWM7UUFDakQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFMUIsT0FBTyxJQUFJLENBQUM7S0FDYjs7OztJQUtELFlBQVk7UUFDVixPQUFPTyxVQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsT0FBVSxLQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFOzs7QUM3U0g7TUE2Q3FCLEtBQStCLFNBQVFDLFdBQVk7SUFLOUQsS0FBSztRQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxVQUFVLEdBQUdoQixZQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDdEM7UUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDeEI7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2JpQix1QkFBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDQSx1QkFBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWhDLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRXZCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztRQUV4QixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUE4QjtZQUM5QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQy9CLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7WUFDakMsSUFBSU4sVUFBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSUQsWUFBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3pCO1NBQ0YsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxJQUFJLFNBQVM7UUFDWCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDeEI7SUFFRCxPQUFPLENBQTJCLE1BQWdCO1FBQ2hELElBQUlILGtCQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQ1csZ0JBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUN2QjthQUFNLElBQUlBLGdCQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsZ0JBQWdCO1FBQ2QsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUVELFdBQVcsQ0FFVCxJQUFZLEVBQ1osTUFBc0IsRUFDdEIsUUFBNkI7UUFFN0IsSUFBSSxRQUFRLElBQUlaLG9CQUFhLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdkMsUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN2QztRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQztRQUNyRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQztRQUV6Q1csdUJBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekMsTUFBTSxLQUFLLEdBQUcsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFNUIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELFdBQVcsQ0FBQyxJQUFZO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtJQUVELGdCQUFnQixDQUVkLElBQVksRUFDWixNQUFzQjtRQUV0QixNQUFNLEtBQUssR0FBR0UsY0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTlDQyxXQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBWTtZQUN2QixNQUFNLEtBQUssR0FBRyxDQUFDYixrQkFBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXZDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtnQkFDaEMsR0FBRyxFQUFFLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pDLEdBQUcsRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDO2FBQzVELENBQUMsQ0FBQztZQUVILElBQUksS0FBSyxFQUFFO2dCQUNUYyxVQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRUMsZ0JBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQjtTQUNGLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxlQUFlO1FBQ2JGLFdBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJO1lBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDckMsQ0FBQyxDQUFDO0tBQ0o7Ozs7Ozs7Ozs7O0lBWUQsT0FBTyxDQUFDLElBQWE7UUFDbkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTyxJQUFJLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDL0M7Ozs7SUFLRCxTQUFTO1FBQ1AsT0FBTyxFQUFFLENBQUM7S0FDWDs7OztJQUtELGdCQUFnQjtRQUNkLElBQUksQ0FBQyxVQUFVLEdBQUdHLGdCQUFTLENBQ3pCLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFDaEIsQ0FBQyxDQUF3QixLQUFlQyxXQUFJLENBQUMsQ0FBZSxDQUFDLENBQzlELENBQUM7UUFFRixJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2xEOzs7O0lBS0QsZUFBZTtRQUNiSixXQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLFNBQW1CLEVBQUUsSUFBSTtZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQzthQUM3QjtTQUNGLENBQUMsQ0FBQztLQUNKO0lBRUQsZ0JBQWdCO1FBQ2QsT0FBT3BCLFlBQUksQ0FBQyxRQUFRLENBQUM7S0FDdEI7Ozs7Ozs7SUFRRCxLQUFLLENBQUMsUUFBZ0IsRUFBRSxLQUFLLEdBQUcsT0FBTztRQUNyQyxJQUFJLENBQUNBLFlBQUksQ0FBQyxZQUFZLEVBQUU7WUFDdEIsT0FBTyxRQUFRLENBQUM7U0FDakI7UUFFREUsYUFBTSxDQUFDRixZQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzQyxPQUFPLFFBQVEsQ0FBQztLQUNqQjs7OztJQUtELGFBQWEsQ0FBQyxNQUEwQjtRQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJRyxlQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsT0FBTyxTQUFTLENBQUM7S0FDbEI7Ozs7Ozs7Ozs7SUFXRCxNQUFNLG1CQUFtQixDQUN2QixPQUFlLEVBQ2YsTUFBZ0QsRUFDaEQsTUFBdUMsRUFDdkMsUUFBbUI7UUFFbkIsSUFBSSxDQUFDQyxlQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDckIsSUFBSUMsY0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNuQixRQUFRLEdBQUcsTUFBTSxDQUFDO2dCQUNsQixNQUFNLEdBQUcsRUFBRSxDQUFDO2FBQ2I7aUJBQU0sSUFBSUMsb0JBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDaEMsSUFBSUQsY0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNuQixRQUFRLEdBQUcsTUFBTSxDQUFDO2lCQUNuQjtnQkFDRCxNQUFNLEdBQUcsTUFBTSxDQUFDO2FBQ2pCO1lBRUQsTUFBTSxHQUFHLE9BQU8sQ0FBQztTQUNsQjtRQUVELElBQUlFLGtCQUFXLENBQUMsUUFBUSxDQUFDLElBQUlDLGNBQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUM5QyxRQUFRLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN4QjtRQUVELElBQUlELGtCQUFXLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdkIsTUFBTSxHQUFHLEVBQUUsQ0FBQztTQUNiO1FBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCYyxVQUFHLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDekM7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNwRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sTUFBTSxHQUFHYixjQUFPLENBQUMsUUFBUSxDQUFDO2NBQzVCLEVBQUU7Y0FDRkMsV0FBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXZDLE9BQU8sTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUN2RTs7OztJQUtELFdBQVc7UUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzVCO1FBRUQsT0FBTyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDNUI7Ozs7Ozs7SUFRTyxhQUFhLENBQUMsSUFBUztRQUM3QixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFcEIsSUFBSSxJQUFJLFlBQVksSUFBSSxFQUFFO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJSixjQUFPLENBQUMsSUFBSSxDQUFDLElBQUlvQixlQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDbkNDLGNBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFTO2dCQUN0QixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzVCLE9BQU8sR0FBRyxJQUFJLENBQUM7aUJBQ2hCO2FBQ0YsQ0FBQyxDQUFDO1NBQ0o7YUFBTSxJQUFJLElBQUksWUFBWSxJQUFJLEVBQUU7WUFDL0IsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNoQjtRQUVELE9BQU8sT0FBTyxDQUFDO0tBQ2hCOzs7Ozs7Ozs7Ozs7OztJQWVELEtBQUssQ0FBQyxVQUEwQixFQUFFO1FBQ2hDLElBQUksSUFBSSxHQUFHQyxnQkFBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFFdkQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzVCLElBQUksR0FBR0MsMEJBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDckU7UUFFRGhCLGFBQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTFCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUMzQjtJQUVELEtBQUssQ0FBQyxJQUFZO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDO0tBQ3ZDOzs7TUNsVmtCLElBQUk7O0lBVXZCLGlCQUF3QjtJQUVqQixPQUFPLFdBQVc7UUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1NBQzVCO1FBRUQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0tBQ3RCOzs7O0lBS00sZ0JBQWdCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUN0Qjs7OztJQUtNLGdCQUFnQixDQUFDLFNBQXdCO1FBQzlDLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO0tBQzNCOzs7O0lBS00sT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNuQjs7OztJQUtNLE9BQU8sQ0FBQyxPQUFvQjtRQUNqQyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztLQUN0Qjs7OztJQUtNLGNBQWM7UUFDbkIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0tBQzFCOzs7O0lBS00sY0FBYyxDQUFDLFFBQW9CO1FBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO0tBQzlCOzs7O0lBS00sZ0JBQWdCO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztLQUM1Qjs7OztJQUtNLGdCQUFnQixDQUFDLFFBQW9CO1FBQzFDLElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO0tBQ2hDOzs7O0lBS00sYUFBYTtRQUNsQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7S0FDekI7Ozs7SUFLTSxhQUFhLENBQUMsUUFBb0I7UUFDdkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUM7S0FDN0I7SUFFRCxXQUFXLFFBQVE7UUFDakIsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztLQUM5QztJQUVELFdBQVcsUUFBUSxDQUFDLE9BQXNCO1FBQ3hDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM5QztJQUVELFdBQVcsS0FBSztRQUNkLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ3JDO0lBRUQsV0FBVyxLQUFLLENBQUMsT0FBb0I7UUFDbkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNyQztJQUVELFdBQVcsV0FBVztRQUNwQixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM1QztJQUVELFdBQVcsWUFBWTtRQUNyQixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM1QztJQUVELFdBQVcsWUFBWSxDQUFDLE9BQW1CO1FBQ3pDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDNUM7SUFFRCxXQUFXLGFBQWE7UUFDdEIsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztLQUM5QztJQUVELFdBQVcsY0FBYztRQUN2QixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQzlDO0lBRUQsV0FBVyxjQUFjLENBQUMsT0FBbUI7UUFDM0MsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzlDO0lBRUQsV0FBVyxVQUFVO1FBQ25CLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO0tBQzNDO0lBRUQsV0FBVyxXQUFXO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO0tBQzNDO0lBRUQsV0FBVyxXQUFXLENBQUMsT0FBbUI7UUFDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUMzQzs7O0FDaEpIO0FBSUE7Ozs7Ozs7Ozs7Ozs7OztNQWVxQmlCLE1BQUssU0FBUUMsYUFBSztJQUNyQyxRQUFRO1FBQ04sT0FBTztZQUNMLFNBQVMsRUFBRSxJQUFJO1lBQ2YsS0FBSyxFQUFFLElBQUk7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLFNBQVMsRUFBRSxJQUFJO1lBQ2YsR0FBRyxFQUFFLElBQUk7WUFDVCxLQUFLLEVBQUUsSUFBSTtZQUNYLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUM7S0FDSDtJQUVELE9BQU87UUFDTCxPQUFPO1lBQ0wsT0FBTyxFQUFFO2dCQUNQLE1BQU0sRUFBRSxLQUFLO2FBQ2Q7U0FDRixDQUFDO0tBQ0g7SUFFRCxNQUFNO1FBQ0osT0FBTztZQUNMLE1BQU0sRUFBRSxjQUFjO1NBQ3ZCLENBQUM7S0FDSDs7Ozs7Ozs7O0lBVUQsTUFBTSxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWM7UUFDeEMsT0FBTyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FDbkMsUUFBUSxFQUNSLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUM1QyxDQUFDLFdBQVcsQ0FBQyxDQUNkLENBQUM7S0FDSDs7O01DeERrQixPQUFRLFNBQVFDLGFBQVc7Ozs7SUFJOUMsSUFBSTtRQUNGLE9BQU8vQixZQUFJLENBQUMsS0FBSzthQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO2FBQ3pCLEtBQUssQ0FBQyxDQUFDLEtBQWlCO1lBQ3ZCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvQixDQUFDLENBQUM7S0FDTjs7O0FDZkg7Ozs7OztBQWlCQTs7Ozs7TUFLYSxRQUFRLEdBQUcsQ0FBQyxJQUFhO0lBQ3BDLElBQUlVLFlBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNmLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPc0IsV0FBSSxDQUFDQyxlQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5Qjs7Ozs7Ozs7OyJ9
