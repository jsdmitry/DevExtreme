import { default as ItemBase } from "./ui.form.item.base";
import $ from "../../core/renderer";
import { extend } from "../../core/utils/extend";
import { isDefined } from "../../core/utils/type";
import errors from "../widget/ui.errors";

const FIELD_BUTTON_ITEM_CLASS = "dx-field-button-item";
const FIELD_ITEM_CLASS = "dx-field-item";

export default class ButtonItem extends ItemBase {
    _getButtonHorizontalAlignment(item) {
        if(isDefined(item.horizontalAlignment)) {
            return item.horizontalAlignment;
        }

        if(isDefined(item.alignment)) {
            errors.log("W0001", "dxForm", "alignment", "18.1", "Use the 'horizontalAlignment' option in button items instead.");
            return item.alignment;
        }

        return "right";
    }

    _getButtonVerticalAlignment(item) {
        switch(item.verticalAlignment) {
            case "center":
                return "center";
            case "bottom":
                return "flex-end";
            default:
                return "flex-start";
        }
    }

    _addItemClasses($item, column) {
        const { cssItemClass } = this._options;
        $item
            .addClass(FIELD_ITEM_CLASS)
            .addClass(cssItemClass)
            .addClass(isDefined(column) ? "dx-col-" + column : "");
    }

    getWidgetInstance() {
        return this._instance;
    }

    render(item, $container) {
        const $button = $("<div>").appendTo($container);
        const { validationGroup, createComponent } = this._options;
        const defaultOptions = { validationGroup };

        $container
            .addClass(FIELD_BUTTON_ITEM_CLASS)
            .css("textAlign", this._getButtonHorizontalAlignment(item));

        $container.parent().css("justifyContent", this._getButtonVerticalAlignment(item));

        this._instance = createComponent($button, "dxButton", extend(defaultOptions, item.buttonOptions));

        this._addItemClasses($container, item.col);

        return $button;
    }
}
