
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v2.0.1-0
   * Released under the MIT license.
   */

import { Collection as Collection$1, Model as Model$1, Request as Request$2 } from '@planetadeleste/vuemc';
import { Base as Base$1, Request as Request$1, Model as Model$2 } from '@planetadeleste/vue-mc';
import { get, invoke, isString, isArray, isPlainObject, isUndefined, isEmpty, pick, isNil, has, assign, pickBy, isNumber, map, isBoolean, set, unionBy, each, cloneDeep, mapValues, flow, isObject, forEach, defaultTo, trim, toString } from 'lodash';
import { ref } from 'vue';
import { serialize } from 'object-to-formdata';

/* eslint-disable @typescript-eslint/no-explicit-any */
class Collection extends Collection$1 {
    constructor() {
        super(...arguments);
        this._links = {};
        this._meta = {};
    }
    _base() {
        if (!this._baseClass) {
            this._baseClass = new Base$1();
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
        return Base$1.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!Base$1.$flashModule) {
            return sMessage;
        }
        invoke(Base$1.$flashModule, sType, sMessage);
        return sMessage;
    }
    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config) {
        const obRequest = new Request$1(config);
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
            this._meta = get(models, "meta");
            this.page(this._meta.current_page);
        }
        if (has(models, "links")) {
            this._links = get(models, "links");
        }
        // We're making an assumption here that paginated models are returned
        // within the "data" field of the response.
        if (this.isPaginated() || has(models, "data")) {
            return get(models, "data", models);
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
        return get(this._meta, "current_page", 1);
    }
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
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
class Model extends Model$1 {
    _base() {
        if (!this._baseClass) {
            this._baseClass = Base$1.getInstance();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        this._relations = ref({});
        this._accessors = ref({});
        this._silently = false;
        this.compileAccessors();
        // @ts-ignore
        this.assignRelations();
        this.on("fetch", (obEvent) => {
            const obModel = obEvent.target;
            const attrs = obModel.attributes;
            if (has(attrs, "data") && isNil(obModel.id)) {
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
        set(this._relations.value, name, relation);
        const value = relation ? relation[localKey] : null;
        this.set(foreignKey, value);
        return this;
    }
    getRelation(name) {
        return get(this.relations, name);
    }
    registerRelation(name, config) {
        const names = unionBy([name], config.aliases);
        each(names, (item) => {
            const exist = !isUndefined(this[item]); // I can't find how to set Relations before super() method.
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
     * Compiles all accessors into pipelines that can be executed quickly.
     */
    compileAccessors() {
        this._accessors.value = mapValues(this.accessors, (m) => flow(m));
        this.on("sync", this.assignAccessors.bind(this));
    }
    /**
     * Sync all accessors with model attributes
     */
    assignAccessors() {
        each(this.accessors, (fAccessor, sKey) => {
            if (!this.hasIn(sKey) && fAccessor) {
                if (isArray(fAccessor)) {
                    fAccessor = fAccessor[0];
                }
                this.set(sKey, fAccessor());
            }
        });
    }
    getRouteResolver() {
        return Base$1.$resolve;
    }
    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage, sType = "error") {
        if (!Base$1.$flashModule) {
            return sMessage;
        }
        invoke(Base$1.$flashModule, sType, sMessage);
        return sMessage;
    }
    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config) {
        const obRequest = new Request$1(config);
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
     * @returns {string} The full URL to use when making a fetch request.
     */
    getFetchURL() {
        return this.getURL(this.getFetchRoute(), pick(this.getRouteParameters(), [this.getKey()]));
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
class File$1 extends Model$2 {
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

class Request extends Request$2 {
    /**
     * @returns {Promise}
     */
    send() {
        return Base$1.$http
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
    if (isNil(sVal)) {
        return null;
    }
    return trim(toString(sVal));
};

export { Base, Collection, File$1 as File, Model, Request, cleanStr };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmVzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvc3RydWN0dXJlL0NvbGxlY3Rpb24udHMiLCIuLi9zcmMvc3RydWN0dXJlL01vZGVsLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9CYXNlLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9GaWxlLnRzIiwiLi4vc3JjL3JlcXVlc3QvUmVxdWVzdC50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiQmFzZUNvbGxlY3Rpb24iLCJCYXNlIiwiUmVxdWVzdCIsIkJhc2VNb2RlbCIsIkZpbGUiLCJNb2RlbCIsIlJlcXVlc3RCYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBO0FBK0JxQixNQUFBLFVBR25CLFNBQVFBLFlBQWlCLENBQUE7QUFIM0IsSUFBQSxXQUFBLEdBQUE7O1FBS0UsSUFBTSxDQUFBLE1BQUEsR0FBMkMsRUFBRSxDQUFDO1FBQ3BELElBQUssQ0FBQSxLQUFBLEdBQTBDLEVBQUUsQ0FBQztLQTJRbkQ7SUF6UUMsS0FBSyxHQUFBO0FBQ0gsUUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNwQixZQUFBLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSUMsTUFBSSxFQUFFLENBQUM7QUFDOUIsU0FBQTtRQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUN4QjtJQUVELElBQUksR0FBQTtRQUNGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUViLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBNEIsS0FBSTtZQUNoRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3JDLFlBQUEsSUFBSSxNQUFNLEVBQUU7QUFDVixnQkFBQSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BCLGFBQUE7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
