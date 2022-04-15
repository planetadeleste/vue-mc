declare module "@planetadeleste/vue-mc" {
  import { VuexModule } from "vuex-module-decorators";
  import { AxiosStatic, AxiosRequestConfig } from "axios";
  import {
    Collection as BaseCollection,
    Model as BaseModel,
    RequestOptions,
    Response,
    RouteResolver,
    Request as RequestBase,
  } from "@planetadeleste/vuemc";

  type Constructor<T> = new (...args: any[]) => T;
  type Extract<Type> = {
    [Property in keyof Type]: Type[Property];
  };

  export class Request extends RequestBase {
    send(): Promise<Response>;
  }

  export class Base {
    public static getInstance(): Base;

    public getRouteResolver(): RouteResolver;
    public setRouteResolver(obResolve: RouteResolver): void;
    public getHttp(): AxiosStatic;
    public setHttp(obValue: AxiosStatic): void;
    public getFlashModule(): VuexModule;
    public setFlashModule(obModule: VuexModule): void;
    public getLoadingModule(): VuexModule;
    public setLoadingModule(obModule: VuexModule): void;
    public getAuthModule(): VuexModule;
    public setAuthModule(obModule: VuexModule): void;

    static get $resolve(): RouteResolver;
    static set $resolve(obValue: RouteResolver);

    static get $http(): AxiosStatic;
    static set $http(obValue: AxiosStatic);

    static get flashModule(): VuexModule;
    static get $flashModule(): VuexModule;
    static set $flashModule(obValue: VuexModule);

    static get loadingModule(): VuexModule;
    static get $loadingModule(): VuexModule;
    static set $loadingModule(obValue: VuexModule);

    static get authModule(): VuexModule;
    static get $authModule(): VuexModule;
    static set $authModule(obValue: VuexModule);
  }

  export interface RelationConfig {
    class: Constructor<Model>;
    foreignKey?: string;
    localKey?: string;
    aliases?: string[];
  }

  export class Model<A = Record<string, any>> extends BaseModel<A> {
    private _accessors: Record<string, Accessor>;
    private _relations: Record<string, Constructor<Model>>;
    private _baseClass: Base;
    private _silently: boolean;
    private _base(): Base;

    boot(): void;

    get relations(): Record<string, Constructor<Model>>;

    silenty<T extends Model>(this: T, bEvent?: boolean): T;
    definedRelations(): Record<string, RelationConfig>;
    setRelation<T extends Model>(
      this: T,
      name: string,
      config: RelationConfig,
      relation: Record<string, any>
    ): T;
    getRelation(name: string): Constructor<Model>;
    registerRelation<T extends Model>(
      this: T,
      name: string,
      config: RelationConfig
    ): T;
    assignRelations(): void;

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
    isDirty(sKey?: string): boolean;

    /**
     *  @returns {Object} Attribute accessor keyed by attribute name.
     */
    accessors(): Record<string, Accessor | Accessor[]>;

    /**
     * Compiles all accessors into pipelines that can be executed quickly.
     */
    compileAccessors(): void;

    /**
     * Sync all accessors with model attributes
     */
    assignAccessors(): void;

    getRouteResolver(): RouteResolver;

    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage: string, sType: string): string;

    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config: AxiosRequestConfig): Request;

    /**
     * Create a custom request, using option.method, route and data
     *
     * @param {string} sMethod Method key name
     * @param {string | Record<string, any> | string[]} [sRoute] Route key name, model data or key params
     * @param {Record<string, any> | string[]} [obData] Model data or key params
     * @param {string[]} [arParams] Param keys to pick from model attributes
     * @returns {Promise<Response>}
     */
    createCustomRequest(
      sMethod: string,
      sRoute?: string | Record<string, any> | string[],
      obData?: Record<string, any> | string[],
      arParams?: string[]
    ): Promise<Response>;

    /**
     *
     * @returns {string} The attribute that should be used to uniquely identify this model. Usualy "id".
     */
    getKey(): string;

    /**
     * @returns {Object} The data to send to the server when saving this model.
     */
    getSaveData(): Record<string, any>;

    /**
     * Iterates over elements of data to find instanceof File
     *
     * @param {Object} data
     * @returns {Boolean}
     */
    private hasFileUpload(data: any): boolean;

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
    store(options?: RequestOptions): Promise<Response<any> | null>;
  }

  export class Collection<A extends Model = Model> extends BaseCollection<A> {
    _baseClass: Base;
    _links: ApiLinksResponse | Record<string, any>;
    _meta: ApiMetaResponse | Record<string, any>;

    _base(): Base;
    boot(): void;
    getRouteResolver(): RouteResolver;

    /**
     * Send an alert message to Flash store service
     *
     * @param {string} sMessage Alert Message
     * @param {string} sType Alert type (error, info, success)
     */
    alert(sMessage: string, sType?: string): string;

    /**
     * @returns {Request} A new `Request` using the given configuration.
     */
    createRequest(config: AxiosRequestConfig): Request;

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
    async createCustomRequest(
      sMethod: string,
      sRoute?: string | Record<string, any>,
      obData?: Record<string, any>,
      arParams?: string[]
    ): Promise<Response>;

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
    async customRequest(
      sMethod: string,
      sRoute?: string | Record<string, any>,
      obData?: Record<string, any>,
      arParams?: string[]
    ): Promise<Response>;

    getModelsFromResponse(response: Response): any;

    /**
     * Get the current collection page, gived from server response
     * @returns {number}
     */
    getCurrentPage<T extends Collection>(this: T): number;

    /**
     * Get last collection page, gived from server response
     * @returns {number}
     */
    getLastPage<T extends Collection>(this: T): number;

    /**
     * Get total number of collection items from server
     * @returns {number}
     */
    getTotalItems<T extends Collection>(this: T): number;

    /**
     * Get pagination data
     * @returns {ApiMetaResponse}
     */
    getPaginationData<T extends Collection>(
      this: T
    ): ApiMetaResponse | Record<string, any>;

    /**
     * Get pagination links for first, last, next and prev page
     * @returns {ApiLinksResponse}
     */
    getLinks<T extends Collection>(
      this: T
    ): ApiLinksResponse | Record<string, any>;

    /**
     *
     * @param {Object} filters JSON object to add filters param
     * @returns {Collection}
     */
    filterBy<T extends Collection>(this: T, filters: Record<string, any>): T;

    /**
     * Remove all collection filters
     * @returns {T}
     */
    clearFilters<T extends Collection>(this: T): T;

    /**
     * Limit number of records getting from query
     *
     * @param {Number} iCount Number of records to get
     */
    limit<T extends Collection>(this: T, iCount: number): T;

    /**
     * @returns {Record<string, any>} A native representation of this collection models that will determine the contents of JSON.stringify(model).
     */
    getModelList<T extends Collection>(this: T): Extract<A>[];
  }

  export interface FileData {
    disk_name: string;
    thumb: string;
    path: string;
    file_name: string;
    ext: string;
    title: string;
    description: string;
  }

  interface File extends Model, FileData {}
  class File extends Model {
    resize(width: number, height: number): Promise<Response>;
  }
  export { File };

  export type Accessor = (value?: any) => any;

  export interface ApiLinksResponse {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  }

  export interface ApiMetaResponse {
    current_page: number;
    last_page: number;
    path: string;
    per_page: number;
    total: number;
    from?: string;
    to?: string;
  }

  export interface Result<T = Record<string, any>> {
    status: boolean;
    data: T;
    message: string | null;
    code: string | null;
    links?: ApiLinksResponse[];
    meta?: ApiMetaResponse[];
  }

  /**
   * Convert value to string and trim
   * @param {string} sVal
   * @returns {string}
   */
  export function cleanStr(sVal?: string): string | null;
}
