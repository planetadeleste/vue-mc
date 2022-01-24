import { RouteResolver } from "vue-mc";
import { VuexModule } from "vuex-module-decorators";
import { AxiosStatic } from "axios";

export default class Base {
  private static instance: Base;

  private _resolve!: RouteResolver;
  private _flashModule!: VuexModule;
  private _loadingModule!: VuexModule;
  private _authModule!: VuexModule;
  private _http!: AxiosStatic;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): Base {
    if (!this.instance) {
      this.instance = new Base();
    }

    return this.instance;
  }

  /**
   * getRouteResolver
   */
  public getRouteResolver(): RouteResolver {
    return this._resolve;
  }

  /**
   * setRouteResolver
   */
  public setRouteResolver(obResolve: RouteResolver): void {
    this._resolve = obResolve;
  }

  /**
   * getHttp
   */
  public getHttp(): AxiosStatic {
    return this._http;
  }

  /**
   * setHttp
   */
  public setHttp(obValue: AxiosStatic): void {
    this._http = obValue;
  }

  /**
   * getFlashModule
   */
  public getFlashModule(): VuexModule {
    return this._flashModule;
  }

  /**
   * setFlashModule
   */
  public setFlashModule(obModule: VuexModule): void {
    this._flashModule = obModule;
  }

  /**
   * getLoadingModule
   */
  public getLoadingModule(): VuexModule {
    return this._loadingModule;
  }

  /**
   * setLoadingModule
   */
  public setLoadingModule(obModule: VuexModule): void {
    this._loadingModule = obModule;
  }

  /**
   * getAuthModule
   */
  public getAuthModule(): VuexModule {
    return this._authModule;
  }

  /**
   * setAuthModule
   */
  public setAuthModule(obModule: VuexModule): void {
    this._authModule = obModule;
  }

  static get $resolve(): RouteResolver {
    return Base.getInstance().getRouteResolver();
  }

  static set $resolve(obValue: RouteResolver) {
    Base.getInstance().setRouteResolver(obValue);
  }

  static get $http(): AxiosStatic {
    return Base.getInstance().getHttp();
  }

  static set $http(obValue: AxiosStatic) {
    Base.getInstance().setHttp(obValue);
  }

  static get flashModule(): VuexModule {
    return Base.getInstance().getFlashModule();
  }

  static get $flashModule(): VuexModule {
    return Base.getInstance().getFlashModule();
  }

  static set $flashModule(obValue: VuexModule) {
    Base.getInstance().setFlashModule(obValue);
  }

  static get loadingModule(): VuexModule {
    return Base.getInstance().getLoadingModule();
  }

  static get $loadingModule(): VuexModule {
    return Base.getInstance().getLoadingModule();
  }

  static set $loadingModule(obValue: VuexModule) {
    Base.getInstance().setLoadingModule(obValue);
  }

  static get authModule(): VuexModule {
    return Base.getInstance().getAuthModule();
  }

  static get $authModule(): VuexModule {
    return Base.getInstance().getAuthModule();
  }

  static set $authModule(obValue: VuexModule) {
    Base.getInstance().setAuthModule(obValue);
  }
}
