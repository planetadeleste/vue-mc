/* eslint-disable @typescript-eslint/no-explicit-any */
import Model from "./Model";
import {Response} from "vue-mc";
import {FileData} from "@planetadeleste/vue-mc";

type FileModel = Model & FileData;

/**
 * @description File model
 * @author Alvaro Canepa <bfpdevel@gmail.com>
 * @export
 * @class File
 * @extends {Model}
 */
export default class File extends Model {
    defaults(): Record<string, any> {
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

    options(): Record<string, any> {
        return {
            methods: {
                resize: "GET",
            },
        };
    }

    routes(): Record<string, any> {
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
    async resize(this: FileModel, width: number, height: number): Promise<Response> {
        return await this.createCustomRequest(
            "resize",
            {width, height, disk_name: this.disk_name},
            ["disk_name"]
        );
    }
}
