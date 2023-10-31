
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.1.1
   * Released under the MIT license.
   */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vueMc = require('vue-mc');
var lodash = require('lodash');
var Vue = require('vue');
var objectToFormdata = require('object-to-formdata');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);

class Base {
    static instance;
    _resolve;
    _flashModule;
    _loadingModule;
    _authModule;
    _http;
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
    _baseClass;
    _links = {};
    _meta = {};
    _base() {
        if (!this._baseClass) {
            this._baseClass = Base.getInstance();
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
        return Base.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!Base.$flashModule) {
            return sMessage;
        }
        lodash.invoke(Base.$flashModule, sType, sMessage);
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
            this._meta = lodash.get(models, "meta", {});
            this.page(this._meta.current_page);
        }
        if (lodash.has(models, "links")) {
            this._links = lodash.get(models, "links", {});
        }
        // We're making an assumption here that paginated models are returned
        // within the "data" field of the response.
        if (this.isPaginated() || lodash.has(models, "data")) {
            return lodash.get(models, "data", models);
        }
        return models;
    }
    /**
     * Get the current collection page, gived from server response
     * @returns {number}
     */
    getCurrentPage() {
        return lodash.get(this._meta, "current_page", 1);
    }
    /*
     * PAGINATION METHODS
     */
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
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
class Model extends vueMc.Model {
    _accessors;
    _relations;
    _baseClass;
    _silently;
    _base() {
        if (!this._baseClass) {
            this._baseClass = Base.getInstance();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        Vue__default["default"].set(this, "_relations", {});
        Vue__default["default"].set(this, "_accessors", {});
        this._silently = false;
        this.compileAccessors();
        // @ts-ignore
        this.assignRelations();
        this.on("fetch", (obEvent) => {
            const obModel = obEvent.target;
            const attrs = obModel.attributes;
            if (lodash.has(attrs, "data") && lodash.isNil(lodash.get(obModel, "id"))) {
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
        Vue__default["default"].set(this._relations, name, relation);
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
            const exist = !lodash.isUndefined(lodash.get(this, item)); // I can't find how to set Relations before super() method.
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
        return Base.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!Base.$flashModule) {
            return sMessage;
        }
        lodash.invoke(Base.$flashModule, sType, sMessage);
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

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description File model
 * @author Alvaro Canepa <bfpdevel@gmail.com>
 * @export
 * @class File
 * @extends {Model}
 */
class File$1 extends Model {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvc3RydWN0dXJlL0Jhc2UudHMiLCIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Nb2RlbC50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvRmlsZS50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsImdldCIsImludm9rZSIsImlzTmlsIiwiaGFzIiwiaXNFbXB0eSIsImlzUGxhaW5PYmplY3QiLCJhc3NpZ24iLCJwaWNrQnkiLCJpc051bWJlciIsIm1hcCIsImlzU3RyaW5nIiwiaXNBcnJheSIsImlzVW5kZWZpbmVkIiwicGljayIsIkJhc2VNb2RlbCIsIlZ1ZSIsImlzQm9vbGVhbiIsInVuaW9uQnkiLCJlYWNoIiwic2V0IiwiY2xvbmVEZWVwIiwibWFwVmFsdWVzIiwiZmxvdyIsImlzT2JqZWN0IiwiZm9yRWFjaCIsImRlZmF1bHRUbyIsInNlcmlhbGl6ZSIsIkZpbGUiLCJ0cmltIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUljLE1BQU8sSUFBSSxDQUFBO0lBQ2YsT0FBTyxRQUFRLENBQU87QUFFdEIsSUFBQSxRQUFRLENBQWlCO0FBQ3pCLElBQUEsWUFBWSxDQUFjO0FBQzFCLElBQUEsY0FBYyxDQUFjO0FBQzVCLElBQUEsV0FBVyxDQUFjO0FBQ3pCLElBQUEsS0FBSyxDQUFlOztBQUc1QixJQUFBLFdBQUEsR0FBQSxHQUF3QjtBQUVqQixJQUFBLE9BQU8sV0FBVyxHQUFBO0FBQ3ZCLFFBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDbEIsWUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxFQUFF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
