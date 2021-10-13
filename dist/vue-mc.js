
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.0.100
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

/* eslint-disable @typescript-eslint/no-explicit-any */
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
        this.compileAccessors();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Nb2RlbC50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvQmFzZS50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvRmlsZS50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsIkJhc2UiLCJnZXQiLCJpbnZva2UiLCJpc1N0cmluZyIsImlzQXJyYXkiLCJpc1BsYWluT2JqZWN0IiwiaXNVbmRlZmluZWQiLCJpc0VtcHR5IiwicGljayIsImlzTmlsIiwiaGFzIiwiYXNzaWduIiwicGlja0J5IiwiaXNOdW1iZXIiLCJtYXAiLCJCYXNlTW9kZWwiLCJWdWUiLCJpc0Jvb2xlYW4iLCJ1bmlvbkJ5IiwiZWFjaCIsInNldCIsImNsb25lRGVlcCIsIm1hcFZhbHVlcyIsImZsb3ciLCJpc09iamVjdCIsImZvckVhY2giLCJkZWZhdWx0VG8iLCJzZXJpYWxpemUiLCJGaWxlIiwiTW9kZWwiLCJ0cmltIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFJcUIsT0FBUSxTQUFRQSxhQUFXOzs7O0lBSTlDLElBQUk7UUFDRixPQUFPLElBQUksQ0FBQyxLQUFLO2FBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7YUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7YUFDekIsS0FBSyxDQUFDLENBQUMsS0FBaUI7WUFDdkIsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQy9CLENBQUMsQ0FBQztLQUNOOzs7QUNmSDtNQTZCcUIsVUFFbkIsU0FBUUMsZ0JBQWlCO0lBRjNCOztRQUlF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
