
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.0.106
   * Released under the MIT license.
   */

import { Request as Request$1, Collection as Collection$1, Model as Model$1 } from 'vue-mc';
import { get, invoke, isString, isArray, isPlainObject, isUndefined, isEmpty, pick, isNil, has, assign, pickBy, isNumber, map, isBoolean, unionBy, each, set, cloneDeep, mapValues, flow, isObject, forEach, defaultTo, trim, toString } from 'lodash';
import { Base as Base$1, Model as Model$2 } from '@planetadeleste/vue-mc';
import Vue from 'vue';
import { serialize } from 'object-to-formdata';

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
        if (isUndefined(arParams)) {
            arParams = [];
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

/* eslint-disable @typescript-eslint/no-explicit-any */
class Model extends Model$1 {
    _base() {
        if (!this._baseClass) {
            this._baseClass = new Base$1();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        Vue.set(this, "_relations", {});
        Vue.set(this, "_accessors", {});
        this._silently = false;
        this.compileAccessors();
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
        if (isUndefined(arParams)) {
            arParams = [];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmVzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Nb2RlbC50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvQmFzZS50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvRmlsZS50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsIkJhc2UiLCJCYXNlTW9kZWwiLCJGaWxlIiwiTW9kZWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O01BSXFCLE9BQVEsU0FBUUEsU0FBVzs7OztJQUk5QyxJQUFJO1FBQ0YsT0FBTyxJQUFJLENBQUMsS0FBSzthQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO2FBQ3pCLEtBQUssQ0FBQyxDQUFDLEtBQWlCO1lBQ3ZCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvQixDQUFDLENBQUM7S0FDTjs7O0FDZkg7TUE2QnFCLFVBR25CLFNBQVFDLFlBQWlCO0lBSDNCOztRQUtFLFdBQU0sR0FBMkMsRUFBRSxDQUFDO1FBQ3BELFVBQUssR0FBMEMsRUFBRSxDQUFDO0tBaVFuRDtJQS9QQyxLQUFLO1FBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDcEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJQyxNQUFJLEVBQUUsQ0FBQztTQUM5QjtRQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUN4QjtJQUVELElBQUk7UUFDRixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9B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
