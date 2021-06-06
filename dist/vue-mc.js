
  /**
   * @license
   * author: Alvaro Canepa
   * vue-mc.js v1.0.96
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

class Collection extends vueMc.Collection {
    constructor() {
        super(...arguments);
        this._links = {};
        this._meta = {};
    }
    _base() {
        if (!this._baseClass) {
            this._baseClass = new Base();
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
     * Create a custom request, using option.method, route and data
     *
     * @param {string} sMethod Method key name
     * @param {string | Record<string, any>} [sRoute] Route key name
     * @param {Record<string, any>} [obData]
     * @returns {Promise<Response>}
     */
    async createCustomRequest(sMethod, sRoute, obData) {
        if (!lodash.isString(sRoute)) {
            if (lodash.isPlainObject(sRoute)) {
                obData = sRoute;
            }
            sRoute = sMethod;
        }
        const method = this.getOption(`methods.${sMethod}`);
        const route = this.getRoute(sRoute);
        const params = this.getRouteParameters();
        const url = this.getURL(route, params);
        return await this.fetch({ method, url, data: obData });
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

class Model extends vueMc.Model {
    _base() {
        if (!this._baseClass) {
            this._baseClass = new Base();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnVlLW1jLmpzIiwic291cmNlcyI6WyIuLi9zcmMvcmVxdWVzdC9SZXF1ZXN0LnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9CYXNlLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Db2xsZWN0aW9uLnRzIiwiLi4vc3JjL3N0cnVjdHVyZS9Nb2RlbC50cyIsIi4uL3NyYy9zdHJ1Y3R1cmUvRmlsZS50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwibmFtZXMiOlsiUmVxdWVzdEJhc2UiLCJCYXNlQ29sbGVjdGlvbiIsImdldCIsImludm9rZSIsImlzU3RyaW5nIiwiaXNQbGFpbk9iamVjdCIsImlzTmlsIiwiaGFzIiwiaXNFbXB0eSIsImFzc2lnbiIsInBpY2tCeSIsImlzTnVtYmVyIiwibWFwIiwiQmFzZU1vZGVsIiwiVnVlIiwiaXNVbmRlZmluZWQiLCJpc0Jvb2xlYW4iLCJ1bmlvbkJ5IiwiZWFjaCIsInNldCIsImNsb25lRGVlcCIsIm1hcFZhbHVlcyIsImZsb3ciLCJpc0FycmF5IiwicGljayIsImlzT2JqZWN0IiwiZm9yRWFjaCIsImRlZmF1bHRUbyIsInNlcmlhbGl6ZSIsIkZpbGUiLCJ0cmltIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQUlxQixPQUFRLFNBQVFBLGFBQVc7Ozs7SUFJOUMsSUFBSTtRQUNGLE9BQU8sSUFBSSxDQUFDLEtBQUs7YUFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQzthQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQzthQUN6QixLQUFLLENBQUMsQ0FBQyxLQUFpQjtZQUN2QixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0IsQ0FBQyxDQUFDO0tBQ047OztNQ1hrQixJQUFJO0lBT3ZCLElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztL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
