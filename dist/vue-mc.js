
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v2.0.1
   * Released under the MIT license.
   */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vuemc = require('@planetadeleste/vuemc');
var vueMc = require('@planetadeleste/vue-mc');
var lodash = require('lodash');
var vue = require('vue');
var objectToFormdata = require('object-to-formdata');

/* eslint-disable @typescript-eslint/no-explicit-any */
class Collection extends vuemc.Collection {
    constructor() {
        super(...arguments);
        this._links = {};
        this._meta = {};
    }
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
class File$1 extends vueMc.Model {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvc3RydWN0dXJlL0NvbGxlY3Rpb24udHMiLCIuLi9zcmMvc3RydWN0dXJlL01vZGVsLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9CYXNlLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9GaWxlLnRzIiwiLi4vc3JjL3JlcXVlc3QvUmVxdWVzdC50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiQmFzZUNvbGxlY3Rpb24iLCJCYXNlIiwiZ2V0IiwiaW52b2tlIiwiUmVxdWVzdCIsImlzU3RyaW5nIiwiaXNBcnJheSIsImlzUGxhaW5PYmplY3QiLCJpc1VuZGVmaW5lZCIsImlzRW1wdHkiLCJwaWNrIiwiaXNOaWwiLCJoYXMiLCJhc3NpZ24iLCJwaWNrQnkiLCJpc051bWJlciIsIm1hcCIsIkJhc2VNb2RlbCIsInJlZiIsImlzQm9vbGVhbiIsInNldCIsInVuaW9uQnkiLCJlYWNoIiwiY2xvbmVEZWVwIiwibWFwVmFsdWVzIiwiZmxvdyIsImlzT2JqZWN0IiwiZm9yRWFjaCIsImRlZmF1bHRUbyIsInNlcmlhbGl6ZSIsIkZpbGUiLCJNb2RlbCIsIlJlcXVlc3RCYXNlIiwidHJpbSIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQStCcUIsTUFBQSxVQUVuQixTQUFRQSxnQkFBaUIsQ0FBQTtBQUYzQixJQUFBLFdBQUEsR0FBQTs7UUFJRSxJQUFNLENBQUEsTUFBQSxHQUEyQyxFQUFFLENBQUM7UUFDcEQsSUFBSyxDQUFBLEtBQUEsR0FBMEMsRUFBRSxDQUFDO0tBNlFuRDtJQTNRQyxLQUFLLEdBQUE7QUFDSCxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ3BCLFlBQUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJQyxVQUFJLEVBQUUsQ0FBQztBQUM5QixTQUFBO1FB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
