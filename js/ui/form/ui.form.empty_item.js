const FIELD_EMPTY_ITEM_CLASS = "dx-field-empty-item";

export default class EmptyItem {
    render($container) {
        $container
            .addClass(FIELD_EMPTY_ITEM_CLASS)
            .html("&nbsp;");
    }
}
