
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v2.0.1
   * Released under the MIT license.
   */

'use strict';

var vuemc = require('@planetadeleste/vuemc');
var vueMc = require('@planetadeleste/vue-mc');
var lodash = require('lodash');
var vue = require('vue');
var objectToFormdata = require('object-to-formdata');

/* eslint-disable @typescript-eslint/no-explicit-any */
class Collection extends vuemc.Collection {
    _baseClass;
    _links = {};
    _meta = {};
    _base() {
        if (!this._baseClass) {
            this._baseClass = new vueMc.Base();
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
        return vueMc.Base.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!vueMc.Base.$flashModule) {
            return sMessage;
        }
        lodash.invoke(vueMc.Base.$flashModule, sType, sMessage);
        return sMessage;
    }
    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config) {
        const obRequest = new vueMc.Request(config);
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
class Model extends vuemc.Model {
    _accessors;
    _relations;
    _baseClass;
    _silently;
    _base() {
        if (!this._baseClass) {
            this._baseClass = vueMc.Base.getInstance();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        this._relations = vue.ref({});
        this._accessors = vue.ref({});
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
        return this._relations.value;
    }
    /**
     *  @returns {Object} Attribute accessor keyed by attribute name.
     */
    get accessors() {
        return this._accessors.value;
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
        lodash.set(this._relations.value, name, relation);
        const value = relation ? relation[localKey] : null;
        this.set(foreignKey, value);
        return this;
    }
    getRelation(name) {
        return lodash.get(this.relations, name);
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
     * Compiles all accessors into pipelines that can be executed quickly.
     */
    compileAccessors() {
        this._accessors.value = lodash.mapValues(this.accessors, (m) => lodash.flow(m));
        this.on("sync", this.assignAccessors.bind(this));
    }
    /**
     * Sync all accessors with model attributes
     */
    assignAccessors() {
        lodash.each(this.accessors, (fAccessor, sKey) => {
            if (!this.hasIn(sKey) && fAccessor) {
                if (lodash.isArray(fAccessor)) {
                    fAccessor = fAccessor[0];
                }
                this.set(sKey, fAccessor());
            }
        });
    }
    getRouteResolver() {
        return vueMc.Base.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!vueMc.Base.$flashModule) {
            return sMessage;
        }
        lodash.invoke(vueMc.Base.$flashModule, sType, sMessage);
        return sMessage;
    }
    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config) {
        const obRequest = new vueMc.Request(config);
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
     * @returns {string} The full URL to use when making a fetch request.
     */
    getFetchURL() {
        return this.getURL(this.getFetchRoute(), lodash.pick(this.getRouteParameters(), [this.getKey()]));
    }
    /**
     *
     * @returns {string} The attribute that should be used to uniquely identify this model. Usualy "id".
     */
    getKey() {
        return this.getOption("identifier");
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
let File$1 = class File extends vueMc.Model {
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
};

class Request extends vuemc.Request {
    /**
     * @returns {Promise}
     */
    send() {
        return vueMc.Base.$http
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvc3RydWN0dXJlL0NvbGxlY3Rpb24udHMiLCIuLi9zcmMvc3RydWN0dXJlL01vZGVsLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9CYXNlLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9GaWxlLnRzIiwiLi4vc3JjL3JlcXVlc3QvUmVxdWVzdC50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiQmFzZUNvbGxlY3Rpb24iLCJCYXNlIiwiZ2V0IiwiaW52b2tlIiwiUmVxdWVzdCIsImlzU3RyaW5nIiwiaXNBcnJheSIsImlzUGxhaW5PYmplY3QiLCJpc1VuZGVmaW5lZCIsImlzRW1wdHkiLCJwaWNrIiwiaXNOaWwiLCJoYXMiLCJhc3NpZ24iLCJwaWNrQnkiLCJpc051bWJlciIsIm1hcCIsIkJhc2VNb2RlbCIsInJlZiIsImlzQm9vbGVhbiIsInNldCIsInVuaW9uQnkiLCJlYWNoIiwiY2xvbmVEZWVwIiwibWFwVmFsdWVzIiwiZmxvdyIsImlzT2JqZWN0IiwiZm9yRWFjaCIsImRlZmF1bHRUbyIsInNlcmlhbGl6ZSIsIk1vZGVsIiwiUmVxdWVzdEJhc2UiLCJ0cmltIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQStCcUIsTUFBQSxVQUVuQixTQUFRQSxnQkFBaUIsQ0FBQTtBQUN6QixJQUFBLFVBQVUsQ0FBUTtJQUNsQixNQUFNLEdBQTJDLEVBQUUsQ0FBQztJQUNwRCxLQUFLLEdBQTBDLEVBQUUsQ0FBQztJQUVsRCxLQUFLLEdBQUE7QUFDSCxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ3BCLFlBQUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJQyxVQUFJLEVBQUUsQ0FBQztBQUM5QixTQUFBO1FBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQ3hCO0lB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
