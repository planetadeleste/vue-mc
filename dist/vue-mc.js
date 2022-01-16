
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.0.108
   * Released under the MIT license.
   */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vueMc = require('vue-mc');
var lodash = require('lodash');
var vueMc$1 = require('@planetadeleste/vue-mc');
var Vue = require('vue');
var objectToFormdata = require('object-to-formdata');
var mitt = require('mitt');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);
var mitt__default = /*#__PURE__*/_interopDefaultLegacy(mitt);

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
            this._baseClass = new vueMc$1.Base();
        }
        return this._baseClass;
    }
    boot() {
        this._base();
        Vue__default['default'].set(this, "_relations", {});
        Vue__default['default'].set(this, "_accessors", {});
        this._silently = false;
        this._emitter = mitt__default['default']();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Nb2RlbC50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvQmFzZS50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvRmlsZS50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsIkJhc2UiLCJnZXQiLCJpbnZva2UiLCJpc1N0cmluZyIsImlzQXJyYXkiLCJpc1BsYWluT2JqZWN0IiwiaXNVbmRlZmluZWQiLCJpc0VtcHR5IiwicGljayIsImlzTmlsIiwiaGFzIiwiYXNzaWduIiwicGlja0J5IiwiaXNOdW1iZXIiLCJtYXAiLCJCYXNlTW9kZWwiLCJWdWUiLCJtaXR0IiwiaXNCb29sZWFuIiwidW5pb25CeSIsImVhY2giLCJzZXQiLCJjbG9uZURlZXAiLCJtYXBWYWx1ZXMiLCJmbG93IiwiaXNPYmplY3QiLCJmb3JFYWNoIiwiZGVmYXVsdFRvIiwic2VyaWFsaXplIiwiRmlsZSIsIk1vZGVsIiwidHJpbSIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFJcUIsT0FBUSxTQUFRQSxhQUFXOzs7O0lBSTlDLElBQUk7UUFDRixPQUFPLElBQUksQ0FBQyxLQUFLO2FBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7YUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7YUFDekIsS0FBSyxDQUFDLENBQUMsS0FBaUI7WUFDdkIsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQy9CLENBQUMsQ0FBQztLQUNOOzs7QUNmSDtNQTZCcUIsVUFHbkIsU0FBUUMsZ0JBQWlCO0lB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
