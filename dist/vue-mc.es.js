
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.1.1
   * Released under the MIT license.
   */

import { Request as Request$1, Collection as Collection$1, Model as Model$1 } from 'vue-mc';
import { get, invoke, isNil, has, isEmpty, isPlainObject, assign, pickBy, isNumber, map, isString, isArray, isUndefined, pick, isBoolean, unionBy, each, set, cloneDeep, mapValues, flow, isObject, forEach, defaultTo, trim, toString } from 'lodash';
import Vue from 'vue';
import { serialize } from 'object-to-formdata';

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

class Request extends Request$1 {
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
class Collection extends Collection$1 {
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
            const sError = get(obEvent, "error");
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
        invoke(Base.$flashModule, sType, sMessage);
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
        if (isNil(models) || models === "") {
            return null;
        }
        // Add pagination meta/links properties
        if (has(models, "meta")) {
            this._meta = get(models, "meta", {});
            this.page(this._meta.current_page);
        }
        if (has(models, "links")) {
            this._links = get(models, "links", {});
        }
        // We're making an assumption here that paginated models are returned
        // within the "data" field of the response.
        if (this.isPaginated() || has(models, "data")) {
            return get(models, "data", models);
        }
        return models;
    }
    /**
     * Get the current collection page, gived from server response
     * @returns {number}
     */
    getCurrentPage() {
        return get(this._meta, "current_page", 1);
    }
    /*
     * PAGINATION METHODS
     */
    /**
     * Get last collection page, gived from server response
     * @returns {number}
     */
    getLastPage() {
        return get(this._meta, "last_page", 1);
    }
    /**
     * Get total number of collection items from server
     * @returns {number}
     */
    getTotalItems() {
        return get(this._meta, "total", 0);
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
        if (isEmpty(filters) || !isPlainObject(filters)) {
            return this;
        }
        if (has(filters, "filters")) {
            filters = get(filters, "filters");
        }
        const obFilters = this.get("filters", {});
        assign(obFilters, filters);
        this.set("filters", pickBy(obFilters, (sValue) => {
            return isNumber(sValue) ? true : !isNil(sValue) && !isEmpty(sValue);
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
        return map(this.getModels(), (obModel) => obModel.toJSON());
    }
    parseRequestConfig(sMethod, sRoute, obData, arParams) {
        if (!isString(sRoute)) {
            if (isArray(sRoute)) {
                arParams = sRoute;
                obData = {};
            }
            else if (isPlainObject(sRoute)) {
                if (isArray(obData)) {
                    arParams = obData;
                }
                obData = sRoute;
            }
            sRoute = sMethod;
        }
        if (isUndefined(arParams) || isEmpty(arParams)) {
            arParams = ["filters"];
        }
        if (isUndefined(obData)) {
            obData = {};
        }
        const method = this.getOption(`methods.${sMethod}`);
        const route = this.getRoute(sRoute);
        const params = isEmpty(arParams)
            ? {}
            : pick(this.getRouteParameters(), arParams);
        const url = this.getURL(route, params);
        return { method, url, data: obData };
    }
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
class Model extends Model$1 {
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
        Vue.set(this, "_relations", {});
        Vue.set(this, "_accessors", {});
        this._silently = false;
        this.compileAccessors();
        // @ts-ignore
        this.assignRelations();
        this.on("fetch", (obEvent) => {
            const obModel = obEvent.target;
            const attrs = obModel.attributes;
            if (has(attrs, "data") && isNil(get(obModel, "id"))) {
                this.clear();
                this.assign(attrs.data);
            }
        });
    }
    get relations() {
        return this._relations;
    }
    silenty(bEvent) {
        if (isUndefined(bEvent) || !isBoolean(bEvent)) {
            this._silently = true;
        }
        else if (isBoolean(bEvent)) {
            this._silently = bEvent;
        }
        return this;
    }
    definedRelations() {
        return {};
    }
    setRelation(name, config, relation) {
        if (relation && isPlainObject(relation)) {
            relation = new config.class(relation);
        }
        const foreignKey = config.foreignKey || `${name}_id`;
        const localKey = config.localKey || "id";
        Vue.set(this._relations, name, relation);
        const value = relation ? relation[localKey] : null;
        this.set(foreignKey, value);
        return this;
    }
    getRelation(name) {
        return this._relations[name];
    }
    registerRelation(name, config) {
        const names = unionBy([name], config.aliases);
        each(names, (item) => {
            const exist = !isUndefined(get(this, item)); // I can't find how to set Relations before super() method.
            Object.defineProperty(this, item, {
                get: () => this.getRelation(name),
                set: (relation) => this.setRelation(name, config, relation),
            });
            if (exist) {
                set(this, item, cloneDeep(this.get(item)));
                this.unset(item);
            }
        });
        return this;
    }
    assignRelations() {
        each(this.definedRelations(), (config, name) => {
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
        this._accessors = mapValues(this.accessors(), (m) => flow(m));
        this.on("sync", this.assignAccessors.bind(this));
    }
    /**
     * Sync all accessors with model attributes
     */
    assignAccessors() {
        each(this._accessors, (fAccessor, sKey) => {
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
        invoke(Base.$flashModule, sType, sMessage);
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
        if (!isString(sRoute)) {
            if (isArray(sRoute)) {
                arParams = sRoute;
                obData = {};
            }
            else if (isPlainObject(sRoute)) {
                if (isArray(obData)) {
                    arParams = obData;
                }
                obData = sRoute;
            }
            sRoute = sMethod;
        }
        if (isUndefined(arParams) || isEmpty(arParams)) {
            arParams = ["filters"];
        }
        if (isUndefined(obData)) {
            obData = {};
        }
        if (this._silently) {
            set(obData, "silently", this._silently);
        }
        const method = this.getOption(`methods.${sMethod}`);
        const route = this.getRoute(sRoute);
        const params = isEmpty(arParams)
            ? {}
            : pick(this.getRouteParameters(), arParams);
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
        if (isArray(data) || isObject(data)) {
            forEach(data, (item) => {
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
        let data = defaultTo(options.data, this.getSaveData());
        if (this.hasFileUpload(data)) {
            data = serialize(data, { indices: true, booleansAsIntegers: true });
        }
        assign(options, { data });
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
    if (isNil(sVal)) {
        return null;
    }
    return trim(toString(sVal));
};

export { Base, Collection, File$1 as File, Model, Request, cleanStr };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmVzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvc3RydWN0dXJlL0Jhc2UudHMiLCIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Nb2RlbC50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvRmlsZS50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsIkJhc2VNb2RlbCIsIkZpbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFJYyxNQUFPLElBQUksQ0FBQTtJQUNmLE9BQU8sUUFBUSxDQUFPO0FBRXRCLElBQUEsUUFBUSxDQUFpQjtBQUN6QixJQUFBLFlBQVksQ0FBYztBQUMxQixJQUFBLGNBQWMsQ0FBYztBQUM1QixJQUFBLFdBQVcsQ0FBYztBQUN6QixJQUFBLEtBQUssQ0FBZTs7QUFHNUIsSUFBQSxXQUFBLEdBQUEsR0FBd0I7QUFFakIsSUFBQSxPQUFPLFdBQVcsR0FBQTtBQUN2QixRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2xCLFlBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0FBQzVCLFNBQUE7UUFFRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7S0FDdEI7QUFFRDs7QUFFRztJQUNJLGdCQUFnQixHQUFBO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUN0QjtBQUVEOztBQUVHO0FBQ0ksSUFBQSxnQkFBZ0IsQ0FBQyxTQUF3QixFQUFBO0FBQzlDLFFBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7S0FDM0I7QUFFRDs7QUFFRztJQUNJLE9BQU8sR0FBQTtRQUNaLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNuQjtBQUVEOztBQUVHO0FBQ0ksSUFBQSxPQUFPLENBQUMsT0FBb0IsRUFBQTtBQUNqQyxRQUFBLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO0tBQ3RCO0FBRUQ7O0FBRUc7SUFDSSxjQUFjLEdBQUE7UUFDbkIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0tBQzFCO0FBRUQ7O0FBRUc7QUFDSSxJQUFBLGNBQWMsQ0FBQyxRQUFvQixFQUFBO0FBQ3hDLFFBQUEsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7S0FDOUI7QUFFRDs7QUFFRztJQUNJLGdCQUFnQixHQUFBO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztLQUM1QjtBQUVEOztBQUVHO0FBQ0ksSUFBQSxnQkFBZ0IsQ0FBQyxRQUFvQixFQUFBO0FBQzFDLFFBQUEsSUFBSSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUM7S0FDaEM7QUFFRDs7QUFFRztJQUNJLGFBQWEsR0FBQTtRQUNsQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7S0FDekI7QUFFRDs7QUFFRztBQUNJLElBQUEsYUFBYSxDQUFDLFFBQW9CLEVBQUE7QUFDdkMsUUFBQSxJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQztLQUM3QjtBQUVELElBQUEsV0FBVyxRQUFRLEdBQUE7QUFDakIsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQzlDO0lBRUQsV0FBVyxRQUFRLENBQUMsT0FBc0IsRUFBQTtRQUN4QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDOUM7QUFFRCxJQUFBLFdBQVcsS0FBSyxHQUFBO0FBQ2QsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNyQztJQUVELFdBQVcsS0FBSyxDQUFDLE9BQW9CLEVBQUE7UUFDbkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNyQztBQUVELElBQUEsV0FBVyxXQUFXLEdBQUE7QUFDcEIsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM1QztBQUVELElBQUEsV0FBVyxZQUFZLEdBQUE7QUFDckIsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUM1QztJQUVELFdBQVcsWUFBWSxDQUFDLE9BQW1CLEVBQUE7UUFDekMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM1QztBQUVELElBQUEsV0FBVyxhQUFhLEdBQUE7QUFDdEIsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQzlDO0FBRUQsSUFBQSxXQUFXLGNBQWMsR0FBQTtBQUN2QixRQUFBLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGdCQUFnQixFQUFFLENBQUM7S0FDOUM7SUFFRCxXQUFXLGNBQWMsQ0FBQyxPQUFtQixFQUFBO1FBQzNDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM5QztBQUVELElBQUEsV0FBVyxVQUFVLEdBQUE7QUFDbkIsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUMzQztBQUVELElBQUEsV0FBVyxXQUFXLEdBQUE7QUFDcEIsUUFBQSxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUMzQztJQUVELFdBQVcsV0FBVyxDQUFDLE9BQW1CLEVBQUE7UUFDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUMzQztBQUNGOztBQzdJb0IsTUFBQSxPQUFRLFNBQVFBLFNBQVcsQ0FBQTtBQUM5Qzs7QUFFRztJQUNILElBQUksR0FBQTtRQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUs7QUFDZCxhQUFBLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3BCLGFBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7QUFDekIsYUFBQSxLQUFLLENBQUMsQ0FBQyxLQUFpQixLQUFXO0FBQ2xDLFlBQUEsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLFNBQUMsQ0FBQyxDQUFDO0tBQ047QUFDRjs7QUNoQkQ7QUE4QnFCLE1BQUEsVUFHbkIsU0FBUUMsWUFBaUIsQ0FBQTtBQUN2QixJQUFBLFVBQVUsQ0FBUTtJQUNsQixNQUFNLEdBQTJDLEVBQUUsQ0FBQztJQUNwRCxLQUFLLEdBQTBDLEVBQUUsQ0FBQztJQUVsRCxLQUFLLEdBQUE7QUFDRCxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ2xCLFlBQUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsU0FBQTtRQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUMxQjtJQUVELElBQUksR0FBQTtRQUNBLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBNEIsS0FBSTtZQUM5QyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3JDLFlBQUEsSUFBSSxNQUFNLEVBQUU7QUFDUixnQkFBQSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RCLGFBQUE7QUFDTCxTQUFDLENBQUMsQ0FBQztLQUNOO0lBRUQsZ0JBQWdCLEdBQUE7UUFDWixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7S0FDeEI7QUFFRDs7Ozs7QUFLRztBQUNILElBQUEsS0FBSyxDQUFDLFFBQWdCLEVBQUUsS0FBSyxHQUFHLE9BQU8sRUFBQTtBQUNuQyxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ3BCLFlBQUEsT0FBTyxRQUFRLENBQUM7QUFDbkIsU0FBQTtRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztBQUMzQyxRQUFBLE9BQU8sUUFBUSxDQUFDO0tBQ25CO0FBRUQ7O0FBRUc7QUFDSCxJQUFBLGFBQWEsQ0FBQyxNQUEwQixFQUFBO0FBQ3BDLFFBQUEsTUFBTSxTQUFTLEdBQUcsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsUUFBQSxPQUFPLFNBQVMsQ0FBQztLQUNwQjtBQUVEOzs7Ozs7Ozs7QUFTRztJQUNILE1BQU0sbUJBQW1CLENBQ3JCLE9BQWUsRUFDZixNQUFxQyxFQUNyQyxNQUE0QixFQUM1QixRQUFtQixFQUFBO0FBRW5CLFFBQUEsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUN6QyxPQUFPLEVBQ1AsTUFBTSxFQUNOLE1BQU0sRUFDTixRQUFRLENBQ08sQ0FBQztBQUNwQixRQUFBLE9BQU8sTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQzFDO0FBRUQ7Ozs7Ozs7OztBQVNHO0lBQ0gsTUFBTSxhQUFhLENBQ2YsT0FBZSxFQUNmLE1BQXFDLEVBQ3JDLE1BQTRCLEVBQzVCLFFBQW1CLEVBQUE7QUFFbkIsUUFBQSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQ3pDLE9BQU8sRUFDUCxNQUFNLEVBQ04sTUFBTSxFQUNOLFFBQVEsQ0FDWCxDQUFDO1FBQ0YsT0FBTyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDekQ7QUFFRCxJQUFBLHFCQUFxQixDQUFDLFFBQWtCLEVBQUE7QUFDcEMsUUFBQSxNQUFNLE1BQU0sR0FBWSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Ozs7UUFLM0MsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxLQUFLLEVBQUUsRUFBRTtBQUNoQyxZQUFBLE9BQU8sSUFBSSxDQUFDO0FBQ2YsU0FBQTs7QUFHRCxRQUFBLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN0QyxTQUFBO0FBRUQsUUFBQSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMxQyxTQUFBOzs7UUFJRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQzNDLE9BQU8sR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdEMsU0FBQTtBQUVELFFBQUEsT0FBTyxNQUFNLENBQUM7S0FDakI7QUFFRDs7O0FBR0c7SUFDSCxjQUFjLEdBQUE7UUFDVixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM3QztBQUVEOztBQUVHO0FBRUg7OztBQUdHO0lBQ0gsV0FBVyxHQUFBO1FBQ1AsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDMUM7QUFFRDs7O0FBR0c7SUFDSCxhQUFhLEdBQUE7UUFDVCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN0QztBQUVEOzs7QUFHRztJQUNILGlCQUFpQixHQUFBO1FBR2IsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0tBQ3JCO0FBRUQ7OztBQUdHO0lBQ0gsUUFBUSxHQUFBO1FBR0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0tBQ3RCO0FBRUQ7Ozs7QUFJRztBQUNILElBQUEsUUFBUSxDQUFnQyxPQUE0QixFQUFBO1FBQ2hFLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQzdDLFlBQUEsT0FBTyxJQUFJLENBQUM7QUFDZixTQUFBO0FBRUQsUUFBQSxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLEVBQUU7QUFDekIsWUFBQSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNyQyxTQUFBO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDMUMsUUFBQSxNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRTNCLFFBQUEsSUFBSSxDQUFDLEdBQUcsQ0FDSixTQUFTLEVBQ1QsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLE1BQVcsS0FBSTtZQUM5QixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDdkUsQ0FBQyxDQUNMLENBQUM7QUFFRixRQUFBLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7QUFFRDs7O0FBR0c7SUFDSCxZQUFZLEdBQUE7QUFDUixRQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBRXhCLFFBQUEsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUVEOzs7O0FBSUc7QUFDSCxJQUFBLEtBQUssQ0FBZ0MsTUFBYyxFQUFBO0FBQy9DLFFBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFMUIsUUFBQSxPQUFPLElBQUksQ0FBQztLQUNmO0FBRUQ7O0FBRUc7SUFDSCxZQUFZLEdBQUE7QUFDUixRQUFBLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLE9BQVUsS0FBSyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztLQUNsRTtBQUVPLElBQUEsa0JBQWtCLENBQ3RCLE9BQWUsRUFDZixNQUFxQyxFQUNyQyxNQUE0QixFQUM1QixRQUFtQixFQUFBO0FBRW5CLFFBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNuQixZQUFBLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNqQixRQUFRLEdBQUcsTUFBTSxDQUFDO2dCQUNsQixNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2YsYUFBQTtBQUFNLGlCQUFBLElBQUksYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGdCQUFBLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNqQixRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLGlCQUFBO2dCQUNELE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDbkIsYUFBQTtZQUVELE1BQU0sR0FBRyxPQUFPLENBQUM7QUFDcEIsU0FBQTtRQUVELElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM1QyxZQUFBLFFBQVEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzFCLFNBQUE7QUFFRCxRQUFBLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3JCLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDZixTQUFBO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFXLFFBQUEsRUFBQSxPQUFPLENBQUUsQ0FBQSxDQUFDLENBQUM7UUFDcEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQyxRQUFBLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDNUIsY0FBRSxFQUFFO2NBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXZDLE9BQU8sRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQztLQUN0QztBQUNKOztBQy9TRDtBQTZDcUIsTUFBQSxLQUErQixTQUFRQyxPQUFZLENBQUE7QUFDOUQsSUFBQSxVQUFVLENBQTRCO0FBQ3RDLElBQUEsVUFBVSxDQUFzQztBQUNoRCxJQUFBLFVBQVUsQ0FBUTtBQUNsQixJQUFBLFNBQVMsQ0FBVztJQUNwQixLQUFLLEdBQUE7QUFDWCxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ3BCLFlBQUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdEMsU0FBQTtRQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUN4QjtJQUVELElBQUksR0FBQTtRQUNGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFaEMsUUFBQSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUV2QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzs7UUFFeEIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXZCLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBOEIsS0FBSTtBQUNsRCxZQUFBLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDL0IsWUFBQSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQ2pDLFlBQUEsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGdCQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLGFBQUE7QUFDSCxTQUFDLENBQUMsQ0FBQztLQUNKO0FBRUQsSUFBQSxJQUFJLFNBQVMsR0FBQTtRQUNYLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUN4QjtBQUVELElBQUEsT0FBTyxDQUEyQixNQUFnQixFQUFBO1FBQ2hELElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzdDLFlBQUEsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDdkIsU0FBQTtBQUFNLGFBQUEsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDNUIsWUFBQSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQztBQUN6QixTQUFBO0FBRUQsUUFBQSxPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsZ0JBQWdCLEdBQUE7QUFDZCxRQUFBLE9BQU8sRUFBRSxDQUFDO0tBQ1g7QUFFRCxJQUFBLFdBQVcsQ0FFVCxJQUFZLEVBQ1osTUFBc0IsRUFDdEIsUUFBNkIsRUFBQTtBQUU3QixRQUFBLElBQUksUUFBUSxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN2QyxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZDLFNBQUE7UUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxJQUFJLENBQUEsRUFBRyxJQUFJLENBQUEsR0FBQSxDQUFLLENBQUM7QUFDckQsUUFBQSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQztRQUV6QyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLFFBQUEsTUFBTSxLQUFLLEdBQUcsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkQsUUFBQSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUU1QixRQUFBLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFFRCxJQUFBLFdBQVcsQ0FBQyxJQUFZLEVBQUE7QUFDdEIsUUFBQSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDOUI7SUFFRCxnQkFBZ0IsQ0FFZCxJQUFZLEVBQ1osTUFBc0IsRUFBQTtBQUV0QixRQUFBLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUU5QyxRQUFBLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFZLEtBQUk7QUFDM0IsWUFBQSxNQUFNLEtBQUssR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFNUMsWUFBQSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7Z0JBQ2hDLEdBQUcsRUFBRSxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0FBQ2pDLGdCQUFBLEdBQUcsRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDO0FBQzVELGFBQUEsQ0FBQyxDQUFDO0FBRUgsWUFBQSxJQUFJLEtBQUssRUFBRTtBQUNULGdCQUFBLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxnQkFBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xCLGFBQUE7QUFDSCxTQUFDLENBQUMsQ0FBQztBQUVILFFBQUEsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELGVBQWUsR0FBQTtRQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLEtBQUk7QUFDN0MsWUFBQSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3RDLFNBQUMsQ0FBQyxDQUFDO0tBQ0o7QUFFRDs7Ozs7Ozs7O0FBU0c7QUFDSCxJQUFBLE9BQU8sQ0FBQyxJQUFhLEVBQUE7QUFDbkIsUUFBQSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNkLFlBQUEsT0FBTyxLQUFLLENBQUM7QUFDZCxTQUFBO0FBRUQsUUFBQSxPQUFPLElBQUksR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUMvQztBQUVEOztBQUVHO0lBQ0gsU0FBUyxHQUFBO0FBQ1AsUUFBQSxPQUFPLEVBQUUsQ0FBQztLQUNYO0FBRUQ7O0FBRUc7SUFDSCxnQkFBZ0IsR0FBQTtRQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUN6QixJQUFJLENBQUMsU0FBUyxFQUFFLEVBQ2hCLENBQUMsQ0FBd0IsS0FBZSxJQUFJLENBQUMsQ0FBZSxDQUFDLENBQzlELENBQUM7QUFFRixRQUFBLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDbEQ7QUFFRDs7QUFFRztJQUNILGVBQWUsR0FBQTtRQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBbUIsRUFBRSxJQUFJLEtBQUk7QUFDbEQsWUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztBQUM3QixhQUFBO0FBQ0gsU0FBQyxDQUFDLENBQUM7S0FDSjtJQUVELGdCQUFnQixHQUFBO1FBQ2QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0tBQ3RCO0FBRUQ7Ozs7O0FBS0c7QUFDSCxJQUFBLEtBQUssQ0FBQyxRQUFnQixFQUFFLEtBQUssR0FBRyxPQUFPLEVBQUE7QUFDckMsUUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtBQUN0QixZQUFBLE9BQU8sUUFBUSxDQUFDO0FBQ2pCLFNBQUE7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDM0MsUUFBQSxPQUFPLFFBQVEsQ0FBQztLQUNqQjtBQUVEOztBQUVHO0FBQ0gsSUFBQSxhQUFhLENBQUMsTUFBMEIsRUFBQTtBQUN0QyxRQUFBLE1BQU0sU0FBUyxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RDLFFBQUEsT0FBTyxTQUFTLENBQUM7S0FDbEI7QUFFRDs7Ozs7Ozs7QUFRRztJQUNILE1BQU0sbUJBQW1CLENBQ3ZCLE9BQWUsRUFDZixNQUFnRCxFQUNoRCxNQUF1QyxFQUN2QyxRQUFtQixFQUFBO0FBRW5CLFFBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNyQixZQUFBLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNuQixRQUFRLEdBQUcsTUFBTSxDQUFDO2dCQUNsQixNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2IsYUFBQTtBQUFNLGlCQUFBLElBQUksYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLGdCQUFBLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNuQixRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQ25CLGlCQUFBO2dCQUNELE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDakIsYUFBQTtZQUVELE1BQU0sR0FBRyxPQUFPLENBQUM7QUFDbEIsU0FBQTtRQUVELElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QyxZQUFBLFFBQVEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3hCLFNBQUE7QUFFRCxRQUFBLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDYixTQUFBO1FBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN6QyxTQUFBO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFXLFFBQUEsRUFBQSxPQUFPLENBQUUsQ0FBQSxDQUFDLENBQUM7UUFDcEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQyxRQUFBLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDOUIsY0FBRSxFQUFFO2NBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZDLFFBQUEsT0FBTyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3ZFO0FBRUQ7O0FBRUc7SUFDSCxXQUFXLEdBQUE7QUFDVCxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7QUFDakIsWUFBQSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM1QixTQUFBO0FBRUQsUUFBQSxPQUFPLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztLQUM1QjtBQUVEOzs7OztBQUtHO0FBQ0ssSUFBQSxhQUFhLENBQUMsSUFBUyxFQUFBO1FBQzdCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVwQixJQUFJLElBQUksWUFBWSxJQUFJLEVBQUU7QUFDeEIsWUFBQSxPQUFPLElBQUksQ0FBQztBQUNiLFNBQUE7UUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbkMsWUFBQSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBUyxLQUFJO0FBQzFCLGdCQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDNUIsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNoQixpQkFBQTtBQUNILGFBQUMsQ0FBQyxDQUFDO0FBQ0osU0FBQTthQUFNLElBQUksSUFBSSxZQUFZLElBQUksRUFBRTtZQUMvQixPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFNBQUE7QUFFRCxRQUFBLE9BQU8sT0FBTyxDQUFDO0tBQ2hCO0FBRUQ7Ozs7Ozs7Ozs7OztBQVlHO0lBQ0gsS0FBSyxDQUFDLFVBQTBCLEVBQUUsRUFBQTtBQUNoQyxRQUFBLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBRXZELFFBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVCLFlBQUEsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDckUsU0FBQTtBQUVELFFBQUEsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFFMUIsUUFBQSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDM0I7QUFFRCxJQUFBLEtBQUssQ0FBQyxJQUFZLEVBQUE7UUFDaEIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUM7S0FDdkM7QUFDRjs7QUN2VkQ7QUFPQTs7Ozs7O0FBTUc7QUFDa0IsTUFBQUMsTUFBSyxTQUFRLEtBQUssQ0FBQTtJQUNuQyxRQUFRLEdBQUE7UUFDSixPQUFPO0FBQ0gsWUFBQSxTQUFTLEVBQUUsSUFBSTtBQUNmLFlBQUEsS0FBSyxFQUFFLElBQUk7QUFDWCxZQUFBLElBQUksRUFBRSxJQUFJO0FBQ1YsWUFBQSxTQUFTLEVBQUUsSUFBSTtBQUNmLFlBQUEsR0FBRyxFQUFFLElBQUk7QUFDVCxZQUFBLEtBQUssRUFBRSxJQUFJO0FBQ1gsWUFBQSxXQUFXLEVBQUUsSUFBSTtTQUNwQixDQUFDO0tBQ0w7SUFFRCxPQUFPLEdBQUE7UUFDSCxPQUFPO0FBQ0gsWUFBQSxPQUFPLEVBQUU7QUFDTCxnQkFBQSxNQUFNLEVBQUUsS0FBSztBQUNoQixhQUFBO1NBQ0osQ0FBQztLQUNMO0lBRUQsTUFBTSxHQUFBO1FBQ0YsT0FBTztBQUNILFlBQUEsTUFBTSxFQUFFLGNBQWM7U0FDekIsQ0FBQztLQUNMO0FBRUQ7Ozs7Ozs7QUFPRztBQUNILElBQUEsTUFBTSxNQUFNLENBQWtCLEtBQWEsRUFBRSxNQUFjLEVBQUE7UUFDdkQsT0FBTyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FDakMsUUFBUSxFQUNSLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBQyxFQUMxQyxDQUFDLFdBQVcsQ0FBQyxDQUNoQixDQUFDO0tBQ0w7QUFDSjs7QUN4REQ7Ozs7O0FBS0c7QUFZSDs7OztBQUlHO0FBQ1UsTUFBQSxRQUFRLEdBQUcsQ0FBQyxJQUFhLEtBQW1CO0FBQ3ZELElBQUEsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDZixRQUFBLE9BQU8sSUFBSSxDQUFDO0FBQ2IsS0FBQTtBQUNELElBQUEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDOUI7Ozs7In0=
