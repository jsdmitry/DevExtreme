import { isDefined } from "../../core/utils/type";
import $ from "../../core/renderer";
import { extend } from "../../core/utils/extend";
import domUtils from "../../core/utils/dom";
import themes from "../themes";
import errors from "../widget/ui.errors";
import Guid from "../../core/guid";
import { each } from "../../core/utils/iterator";
import inflector from "../../core/utils/inflector";
import { inArray } from "../../core/utils/array";
import eventsEngine from "../../events/core/events_engine";
import clickEvent from "../../events/click";
import Validator from "../validator";
import stringUtils from "../../core/utils/string";

const FIELD_ITEM_CLASS = "dx-field-item";
const FIELD_ITEM_REQUIRED_CLASS = "dx-field-item-required";
const FIELD_ITEM_OPTIONAL_CLASS = "dx-field-item-optional";
const FIELD_ITEM_REQUIRED_MARK_CLASS = "dx-field-item-required-mark";
const FIELD_ITEM_OPTIONAL_MARK_CLASS = "dx-field-item-optional-mark";
const FIELD_ITEM_LABEL_CLASS = "dx-field-item-label";
const FIELD_ITEM_LABEL_ALIGN_CLASS = "dx-field-item-label-align";
const FIELD_ITEM_LABEL_CONTENT_CLASS = "dx-field-item-label-content";
const FIELD_ITEM_LABEL_TEXT_CLASS = "dx-field-item-label-text";
const FIELD_ITEM_LABEL_LOCATION_CLASS = "dx-field-item-label-location-";
const FIELD_ITEM_CONTENT_CLASS = "dx-field-item-content";
const FIELD_ITEM_CONTENT_LOCATION_CLASS = "dx-field-item-content-location-";
const FIELD_ITEM_CONTENT_WRAPPER_CLASS = "dx-field-item-content-wrapper";
const FIELD_ITEM_HELP_TEXT_CLASS = "dx-field-item-help-text";
const INVALID_CLASS = "dx-invalid";
const FLEX_LAYOUT_CLASS = "dx-flex-layout";
const TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper";
const LABEL_HORIZONTAL_ALIGNMENT_CLASS = "dx-label-h-align";
const LABEL_VERTICAL_ALIGNMENT_CLASS = "dx-label-v-align";

const SIMPLE_ITEM_TYPE = "simple";

const DATA_OPTIONS = ["dataSource", "items"];
const EDITORS_WITH_ARRAY_VALUE = ["dxTagBox", "dxRangeSlider"];

export default class SimpleItem {
    constructor(options) {
        // showRequiredMark, showOptionalMark, requiredMark, optionalMark
        // data
        // cssItemClass
        // requiredMessage
        // showColonAfterLabel
        // labelLocation
        // stylingMode
        // validationBoundary
        // validationGroup
        // createComponent
        // formInstance
        this._options = options;
    }

    _renderLabel(options) {
        const { text, id, location, alignment, isRequired, labelID = null } = options;

        if(isDefined(text) && text.length > 0) {
            const labelClasses = FIELD_ITEM_LABEL_CLASS + " " + FIELD_ITEM_LABEL_LOCATION_CLASS + location;
            const $label = $("<label>")
                .addClass(labelClasses)
                .attr("for", id)
                .attr("id", labelID);

            const $labelContent = $("<span>")
                .addClass(FIELD_ITEM_LABEL_CONTENT_CLASS)
                .appendTo($label);

            $("<span>")
                .addClass(FIELD_ITEM_LABEL_TEXT_CLASS)
                .text(text)
                .appendTo($labelContent);

            if(alignment) {
                $label.css("textAlign", alignment);
            }

            $labelContent.append(this._renderLabelMark(isRequired));

            return $label;
        }
    }

    _renderLabelMark(isRequired) {
        let $mark;
        const requiredMarksConfig = this._getRequiredMarksConfig();
        const isRequiredMark = requiredMarksConfig.showRequiredMark && isRequired;
        const isOptionalMark = requiredMarksConfig.showOptionalMark && !isRequired;

        if(isRequiredMark || isOptionalMark) {
            const markClass = isRequiredMark ? FIELD_ITEM_REQUIRED_MARK_CLASS : FIELD_ITEM_OPTIONAL_MARK_CLASS;
            const markText = isRequiredMark ? requiredMarksConfig.requiredMark : requiredMarksConfig.optionalMark;

            $mark = $("<span>")
                .addClass(markClass)
                .html("&nbsp" + markText);
        }

        return $mark;
    }

    _getRequiredMarksConfig() {
        if(!this._cashedRequiredConfig) {
            const { showRequiredMark, showOptionalMark, requiredMark, optionalMark } = this._options;
            this._cashedRequiredConfig = { showRequiredMark, showOptionalMark, requiredMark, optionalMark };
        }
        return this._cashedRequiredConfig;
    }

    _replaceDataOptions(originalOptions, resultOptions) {
        if(originalOptions) {
            DATA_OPTIONS.forEach(function(item) {
                if(resultOptions[item]) {
                    resultOptions[item] = originalOptions[item];
                }
            });
        }
    }

    _addWrapperInvalidClass(editorInstance) {
        const wrapperClass = `.${FIELD_ITEM_CONTENT_WRAPPER_CLASS}`;
        const toggleInvalidClass = e =>
            $(e.element).parents(wrapperClass)
                .toggleClass(INVALID_CLASS, e.component._isFocused() && e.component.option("isValid") === false);

        editorInstance
            .on("focusIn", toggleInvalidClass)
            .on("focusOut", toggleInvalidClass)
            .on("enterKey", toggleInvalidClass);
    }

    _createEditor($container, renderOptions, editorOptions) {
        const { createComponent, formInstance } = this._options;
        if(renderOptions.dataField && !editorOptions.name) {
            editorOptions.name = renderOptions.dataField;
        }

        this._addItemContentClasses($container);
        if(renderOptions.template) {
            var data = {
                dataField: renderOptions.dataField,
                editorType: renderOptions.editorType,
                editorOptions: editorOptions,
                component: formInstance,
                name: renderOptions.name
            };

            renderOptions.template.render({
                model: data,
                container: domUtils.getPublicElement($container)
            });
        } else {
            const $editor = $("<div>").appendTo($container);

            try {
                const editorInstance = createComponent($editor, renderOptions.editorType, editorOptions);
                editorInstance.setAria("describedby", renderOptions.helpID);
                editorInstance.setAria("labelledby", renderOptions.labelID);
                editorInstance.setAria("required", renderOptions.isRequired);

                if(themes.isMaterial()) {
                    this._addWrapperInvalidClass(editorInstance);
                }
                return editorInstance;
            } catch(e) {
                errors.log("E1035", e.message);
            }
        }
    }

    _renderEditor(options) {
        const { stylingMode, value } = this._options;
        const defaultEditorOptions = value !== undefined ? { value } : {};
        const isDeepExtend = true;

        if(EDITORS_WITH_ARRAY_VALUE.indexOf(options.editorType) !== -1) {
            defaultEditorOptions.value = defaultEditorOptions.value || [];
        }

        const editorOptions = extend(isDeepExtend, defaultEditorOptions, options.editorOptions, {
            inputAttr: {
                id: options.id
            },
            validationBoundary: options.validationBoundary,
            stylingMode
        });

        this._replaceDataOptions(options.editorOptions, editorOptions);

        return this._createEditor(options.$container, {
            editorType: options.editorType,
            dataField: options.dataField,
            template: options.template,
            name: options.name,
            helpID: options.helpID,
            labelID: options.labelID,
            isRequired: options.isRequired
        }, editorOptions);
    }

    _hasRequiredRuleInSet(rules) {
        let hasRequiredRule;

        if(rules && rules.length) {
            each(rules, function(index, rule) {
                if(rule.type === "required") {
                    hasRequiredRule = true;
                    return false;
                }
            });
        }

        return hasRequiredRule;
    }

    _getItemContentLocationSpecificClass() {
        const { labelLocation } = this._options;
        const oppositeClasses = {
            right: "left",
            left: "right",
            top: "bottom"
        };
        return FIELD_ITEM_CONTENT_LOCATION_CLASS + oppositeClasses[labelLocation];
    }

    _addItemContentClasses($itemContent) {
        const locationSpecificClass = this._getItemContentLocationSpecificClass();
        $itemContent.addClass([FIELD_ITEM_CONTENT_CLASS, locationSpecificClass].join(" "));
    }

    _renderHelpText(fieldItem, $editor, helpID) {
        const helpText = fieldItem.helpText;
        const isSimpleItem = fieldItem.itemType === SIMPLE_ITEM_TYPE;

        if(helpText && isSimpleItem) {
            const $editorWrapper = $("<div>").addClass(FIELD_ITEM_CONTENT_WRAPPER_CLASS);
            $editor.wrap($editorWrapper);

            $("<div>")
                .addClass(FIELD_ITEM_HELP_TEXT_CLASS)
                .attr("id", helpID)
                .text(helpText)
                .appendTo($editor.parent());
        }
    }

    _addItemClasses($item, column) {
        const { cssItemClass } = this._options;
        $item
            .addClass(FIELD_ITEM_CLASS)
            .addClass(cssItemClass)
            .addClass(isDefined(column) ? `dx-col-${column}` : '');
    }

    _isLabelNeedId(item) {
        const editorsRequiringIdForLabel = ["dxRadioGroup", "dxCheckBox", "dxLookup", "dxSlider", "dxRangeSlider", "dxSwitch", "dxHtmlEditor"]; // TODO: support "dxCalendar"
        return inArray(item.editorType, editorsRequiringIdForLabel) !== -1;
    }

    _getLabelOptions(item, id, isRequired) {
        const { labelLocation, showColonAfterLabel } = this._options;
        const labelOptions = extend(
            {
                showColon: showColonAfterLabel,
                location: labelLocation,
                id,
                visible: true,
                isRequired
            },
            item ? item.label : {}
        );

        if(this._isLabelNeedId(item)) {
            labelOptions.labelID = `dx-label-${new Guid()}`;
        }

        if(!labelOptions.text && item.dataField) {
            labelOptions.text = inflector.captionize(item.dataField);
        }

        if(labelOptions.text) {
            labelOptions.text += labelOptions.showColon ? ":" : "";
        }

        return labelOptions;
    }

    _isLabelNeedBaselineAlign(item) {
        const { hasBrowserFlex } = this._options;
        const largeEditors = ["dxTextArea", "dxRadioGroup", "dxCalendar", "dxHtmlEditor"];
        return (!!item.helpText && !hasBrowserFlex) || inArray(item.editorType, largeEditors) !== -1;
    }

    _appendEditorToField(params) {
        if(params.$label) {
            const location = params.labelOptions.location;

            if(location === "top" || location === "left") {
                params.$fieldItem.append(params.$editor);
            }

            if(location === "right") {
                params.$fieldItem.prepend(params.$editor);
            }

            this._addInnerItemAlignmentClass(params.$fieldItem, location);
        } else {
            params.$fieldItem.append(params.$editor);
        }
    }

    _addInnerItemAlignmentClass($fieldItem, location) {
        if(location === "top") {
            $fieldItem.addClass(LABEL_VERTICAL_ALIGNMENT_CLASS);
        } else {
            $fieldItem.addClass(LABEL_HORIZONTAL_ALIGNMENT_CLASS);
        }
    }

    _attachClickHandler($label, $editor, editorType) {
        const isBooleanEditors = editorType === "dxCheckBox" || editorType === "dxSwitch";
        if($label && isBooleanEditors) {
            eventsEngine.on($label, clickEvent.name, function() {
                eventsEngine.trigger($editor.children(), clickEvent.name);
            });
        }
    }

    _getFieldLabelName(item) {
        const isItemHaveCustomLabel = item.label && item.label.text;
        const itemName = isItemHaveCustomLabel ? null : this._getName(item);
        return isItemHaveCustomLabel ? item.label.text : itemName && inflector.captionize(itemName);
    }

    _getName(item) {
        return item.dataField || item.name;
    }

    _prepareValidationRules(userValidationRules, isItemRequired, itemType, itemName) {
        const isSimpleItem = itemType === SIMPLE_ITEM_TYPE;
        let validationRules;

        if(isSimpleItem) {
            if(userValidationRules) {
                validationRules = userValidationRules;
            } else {
                const { requiredMessage } = this._options;
                const formattedMessage = stringUtils.format(requiredMessage, itemName || "");
                validationRules = isItemRequired ? [{ type: "required", message: formattedMessage }] : null;
            }
        }

        return validationRules;
    }

    _renderValidator($editor, item) {
        const { createComponent, validationGroup } = this._options;
        const fieldName = this._getFieldLabelName(item);
        const validationRules = this._prepareValidationRules(item.validationRules, item.isRequired, item.itemType, fieldName);

        if(Array.isArray(validationRules) && validationRules.length) {
            createComponent($editor, Validator, {
                validationRules,
                validationGroup,
                dataGetter: function() {
                    return {
                        formItem: item
                    };
                }
            });
        }
    }

    _renderFieldItem(item, $container) {
        const { formInstance, validationBoundary, template, hasBrowserFlex } = this._options;
        const name = this._getName(item);
        const id = formInstance.getItemID(name);
        const isRequired = isDefined(item.isRequired) ? item.isRequired : !!this._hasRequiredRuleInSet(item.validationRules);
        const labelOptions = this._getLabelOptions(item, id, isRequired);
        const $editor = $("<div>");
        const helpID = item.helpText ? `dx-${new Guid()}` : null;
        let $label;

        this._addItemClasses($container, item.col);
        $container.addClass(isRequired ? FIELD_ITEM_REQUIRED_CLASS : FIELD_ITEM_OPTIONAL_CLASS);

        if(labelOptions.visible && labelOptions.text) {
            $label = this._renderLabel(labelOptions).appendTo($container);
        }

        if(item.itemType === SIMPLE_ITEM_TYPE) {
            if(this._isLabelNeedBaselineAlign(item) && labelOptions.location !== "top") {
                $container.addClass(FIELD_ITEM_LABEL_ALIGN_CLASS);
            }
            hasBrowserFlex && $container.addClass(FLEX_LAYOUT_CLASS);
        }

        $editor.data("dx-form-item", item);
        this._appendEditorToField({
            $fieldItem: $container,
            $label,
            $editor,
            labelOptions
        });

        this._instance = this._renderEditor({
            $container: $editor,
            dataField: item.dataField,
            name: item.name,
            editorType: item.editorType,
            editorOptions: item.editorOptions,
            template,
            isRequired: isRequired,
            helpID: helpID,
            labelID: labelOptions.labelID,
            id: id,
            validationBoundary
        });

        const editorElem = $editor.children().first();
        const $validationTarget = editorElem.hasClass(TEMPLATE_WRAPPER_CLASS) ? editorElem.children().first() : editorElem;

        if($validationTarget && $validationTarget.data("dx-validation-target")) {
            this._renderValidator($validationTarget, item);
        }

        this._renderHelpText(item, $editor, helpID);

        this._attachClickHandler($label, $editor, item.editorType);
    }

    getEditorInstance() {
        return this._instance;
    }

    render(item, $container) {
        this._renderFieldItem(item, $container);
    }
}
