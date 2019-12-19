import { default as ItemBase } from "./ui.form.item.base";

const FIELD_EMPTY_ITEM_CLASS = "dx-field-empty-item";

export default class EmptyItem extends ItemBase {
    render($container) {
        $container
            .addClass(FIELD_EMPTY_ITEM_CLASS)
            .html("&nbsp;");
    }
}
