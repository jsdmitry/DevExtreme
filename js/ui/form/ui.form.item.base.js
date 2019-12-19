import { abstract } from "../../core/class";

export default class ItemBase {
    constructor(options) {
        this._options = options;
    }

    render(item, $container) {
        abstract();
    }
}
