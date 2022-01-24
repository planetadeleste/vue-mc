import { Response, Request as RequestBase } from "vue-mc";
import { AxiosError } from "axios";
import { Base } from "@planetadeleste/vue-mc";

export default class Request extends RequestBase {
  /**
   * @returns {Promise}
   */
  send(): Promise<Response> {
    return Base.$http
      .request(this.config)
      .then(this.createResponse)
      .catch((error: AxiosError): never => {
        throw this.createError(error);
      });
  }
}
