import $ from "../../core/renderer";
import eventsEngine from "../../events/core/events_engine";
import registerComponent from "../../core/component_registrator";
import Guid from "../../core/guid";
import { ensureDefined } from "../../core/utils/common";
import { isDefined, isEmptyObject, isObject, isString } from "../../core/utils/type";
import { data } from "../../core/element_data";
import { each } from "../../core/utils/iterator";
import { inArray } from "../../core/utils/array";
import { extend } from "../../core/utils/extend";
import { isEmpty } from "../../core/utils/string";
import browser from "../../core/utils/browser";
import { getPublicElement, triggerShownEvent } from "../../core/utils/dom";
import messageLocalization from "../../localization/message";
import Widget from "../widget/ui.widget";
import { defaultScreenFactorFunc, getCurrentScreenFactor, hasWindow } from "../../core/utils/window";
import ValidationEngine from "../validation_engine";
import LayoutManager from "./ui.form.layout_manager";
import { default as FormItemsRunTimeInfo } from "./ui.form.items_runtime_info";
import TabPanel from "../tab_panel";
import Scrollable from "../scroll_view/ui.scrollable";
import { Deferred } from "../../core/utils/deferred";
import themes from "../themes";

import "../validation_summary";
import "../validation_group";

const FORM_CLASS = "dx-form";
const FORM_GROUP_CLASS = `${FORM_CLASS}-group`;
const FORM_GROUP_CONTENT_CLASS = `${FORM_GROUP_CLASS}-content`;
const FORM_GROUP_WITH_CAPTION_CLASS = `${FORM_GROUP_CLASS}-with-caption`;
const FORM_GROUP_CAPTION_CLASS = `${FORM_GROUP_CLASS}-caption`;
const HIDDEN_LABEL_CLASS = "dx-layout-manager-hidden-label";
const FIELD_ITEM_CLASS = "dx-field-item";
const FIELD_ITEM_LABEL_TEXT_CLASS = `${FIELD_ITEM_CLASS}-label-text`;
const FIELD_ITEM_LABEL_CLASS = `${FIELD_ITEM_CLASS}-label`;
const FIELD_ITEM_LABEL_CONTENT_CLASS = `${FIELD_ITEM_CLASS}-label-content`;
const FIELD_ITEM_TAB_CLASS = `${FIELD_ITEM_CLASS}-tab`;
const FIELD_ITEM_CONTENT_CLASS = `${FIELD_ITEM_CLASS}-content`;
const FORM_FIELD_ITEM_COL_CLASS = "dx-col-";
const GROUP_COL_COUNT_CLASS = "dx-group-colcount-";
const FORM_VALIDATION_SUMMARY = `${FORM_CLASS}-validation-summary`;

const WIDGET_CLASS = "dx-widget";
const FOCUSED_STATE_CLASS = "dx-state-focused";

class Form extends Widget {
    _init() {
        super._init();

        this._cachedColCountOptions = [];
        this._itemsRunTimeInfo = new FormItemsRunTimeInfo();
        this._groupsColCount = [];

        this._attachSyncSubscriptions();
    }

    _initOptions(options) {
        if(!("screenByWidth" in options)) {
            options.screenByWidth = defaultScreenFactorFunc;
        }

        super._initOptions(options);
    }

    _getDefaultOptions() {
        return extend(super._getDefaultOptions(), {
            formID: `dx-${new Guid()}`,
            /**
             * @name dxFormOptions.formData
             * @type object
             * @default {}
             * @fires dxFormOptions.onFieldDataChanged
             */
            formData: {},
            /**
             * @name dxFormOptions.colCount
             * @type number|Enums.Mode
             * @default 1
             */
            colCount: 1,

            /**
            * @name dxFormOptions.screenByWidth
            * @type function
            * @default null
            */
            screenByWidth: null,

            /**
            * @pseudo ColCountResponsibleType
            * @type object
            */
            /**
            * @name ColCountResponsible
            * @hidden
            */
            /**
            * @name ColCountResponsible.xs
            * @type number
            * @default undefined
            */
            /**
            * @name ColCountResponsible.sm
            * @type number
            * @default undefined
            */
            /**
            * @name ColCountResponsible.md
            * @type number
            * @default undefined
            */
            /**
            * @name ColCountResponsible.lg
            * @type number
            * @default undefined
            */

            /**
            * @name dxFormOptions.colCountByScreen
            * @extends ColCountResponsibleType
            * @inherits ColCountResponsible
            * @default undefined
            */
            colCountByScreen: undefined,

            /**
             * @name dxFormOptions.labelLocation
             * @type Enums.FormLabelLocation
             * @default "left"
             */
            labelLocation: "left",
            /**
             * @name dxFormOptions.readOnly
             * @type boolean
             * @default false
             */
            readOnly: false,
            /**
             * @name dxFormOptions.onFieldDataChanged
             * @extends Action
             * @type function(e)
             * @type_function_param1 e:object
             * @type_function_param1_field4 dataField:string
             * @type_function_param1_field5 value:object
             * @action
             */
            onFieldDataChanged: null,
            /**
             * @name dxFormOptions.customizeItem
             * @type function
             * @type_function_param1 item:dxFormSimpleItem|dxFormGroupItem|dxFormTabbedItem|dxFormEmptyItem|dxFormButtonItem
             */
            customizeItem: null,
            /**
             * @name dxFormOptions.onEditorEnterKey
             * @extends Action
             * @type function(e)
             * @type_function_param1 e:object
             * @type_function_param1_field4 dataField:string
             * @action
             */
            onEditorEnterKey: null,
            /**
             * @name dxFormOptions.minColWidth
             * @type number
             * @default 200
             */
            minColWidth: 200,
            /**
             * @name dxFormOptions.alignItemLabels
             * @type boolean
             * @default true
             */
            alignItemLabels: true,
            /**
             * @name dxFormOptions.alignItemLabelsInAllGroups
             * @type boolean
             * @default true
             */
            alignItemLabelsInAllGroups: true,
            /**
             * @name dxFormOptions.showColonAfterLabel
             * @type boolean
             * @default true
             */
            showColonAfterLabel: true,
            /**
             * @name dxFormOptions.showRequiredMark
             * @type boolean
             * @default true
             */
            showRequiredMark: true,
            /**
             * @name dxFormOptions.showOptionalMark
             * @type boolean
             * @default false
             */
            showOptionalMark: false,
            /**
             * @name dxFormOptions.requiredMark
             * @type string
             * @default "*"
             */
            requiredMark: "*",
            /**
             * @name dxFormOptions.optionalMark
             * @type string
             * @default "optional"
             */
            optionalMark: messageLocalization.format("dxForm-optionalMark"),
            /**
            * @name dxFormOptions.requiredMessage
            * @type string
            * @default "{0} is required"
            */
            requiredMessage: messageLocalization.getFormatter("dxForm-requiredMessage"),
            /**
             * @name dxFormOptions.showValidationSummary
             * @type boolean
             * @default false
             */
            showValidationSummary: false,
            /**
             * @name dxFormOptions.items
             * @type Array<dxFormSimpleItem,dxFormGroupItem,dxFormTabbedItem,dxFormEmptyItem,dxFormButtonItem>
             * @default undefined
             */
            items: undefined,
            /**
             * @name dxFormOptions.scrollingEnabled
             * @type boolean
             * @default false
             */
            scrollingEnabled: false,
            /**
             * @name dxFormOptions.validationGroup
             * @type string
             * @default undefined
             */
            validationGroup: undefined,
            stylingMode: undefined
            /**
            * @name dxFormSimpleItem
			* @publicName SimpleItem
            * @section FormItems
            * @type object
            */
            /**
             * @name dxFormSimpleItem.dataField
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.name
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.editorType
             * @type Enums.FormItemEditorType
             */
            /**
             * @name dxFormSimpleItem.editorOptions
             * @type object
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.colSpan
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.itemType
             * @type Enums.FormItemType
             * @default "simple"
             */
            /**
             * @name dxFormSimpleItem.visible
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormSimpleItem.cssClass
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.visibleIndex
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.template
             * @type template|function
             * @type_function_param1 data:object
             * @type_function_param1_field1 component:dxForm
             * @type_function_param1_field2 dataField:string
             * @type_function_param1_field3 editorOptions:object
             * @type_function_param1_field4 editorType:string
             * @type_function_param1_field5 name:string
             * @type_function_param2 itemElement:dxElement
             * @type_function_return string|Node|jQuery
             */
            /**
             * @name dxFormSimpleItem.label
             * @type object
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.label.text
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.label.visible
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormSimpleItem.label.showColon
             * @type boolean
             * @default from showColonAfterLabel
             */
            /**
             * @name dxFormSimpleItem.label.location
             * @type Enums.FormLabelLocation
             * @default "left"
             */
            /**
             * @name dxFormSimpleItem.label.alignment
             * @type Enums.HorizontalAlignment
             * @default "left"
             */
            /**
             * @name dxFormSimpleItem.helpText
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.isRequired
             * @type boolean
             * @default undefined
             */
            /**
             * @name dxFormSimpleItem.validationRules
             * @type Array<RequiredRule,NumericRule,RangeRule,StringLengthRule,CustomRule,CompareRule,PatternRule,EmailRule>
             * @default undefined
             */
            /**
            * @name dxFormGroupItem
			* @publicName GroupItem
            * @section FormItems
            * @type object
            */
            /**
             * @name dxFormGroupItem.caption
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormGroupItem.name
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormGroupItem.colCount
             * @type number
             * @default 1
             */
            /**
             * @name dxFormGroupItem.colCountByScreen
             * @extends ColCountResponsibleType
             * @inherits ColCountResponsible
             * @default undefined
             */
            /**
             * @name dxFormGroupItem.itemType
             * @type Enums.FormItemType
             * @default "simple"
             */
            /**
             * @name dxFormGroupItem.colSpan
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormGroupItem.visible
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormGroupItem.cssClass
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormGroupItem.visibleIndex
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormGroupItem.alignItemLabels
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormGroupItem.template
             * @type template|function
             * @type_function_param1 data:object
             * @type_function_param1_field1 component:dxForm
             * @type_function_param1_field2 formData:object
             * @type_function_param2 itemElement:dxElement
             * @type_function_return string|Node|jQuery
             */
            /**
             * @name dxFormGroupItem.items
             * @type Array<dxFormSimpleItem,dxFormGroupItem,dxFormTabbedItem,dxFormEmptyItem,dxFormButtonItem>
             * @default undefined
             */
            /**
            * @name dxFormTabbedItem
			* @publicName TabbedItem
            * @section FormItems
            * @type object
            */
            /**
             * @name dxFormTabbedItem.name
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.visible
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormTabbedItem.itemType
             * @type Enums.FormItemType
             * @default "simple"
             */
            /**
             * @name dxFormTabbedItem.cssClass
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.visibleIndex
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabPanelOptions
             * @type dxTabPanelOptions
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.colSpan
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs
             * @type Array<Object>
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs.alignItemLabels
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormTabbedItem.tabs.title
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs.colCount
             * @type number
             * @default 1
             */
            /**
             * @name dxFormTabbedItem.tabs.colCountByScreen
             * @extends ColCountResponsibleType
             * @inherits ColCountResponsible
             * @default undefined
            */
            /**
             * @name dxFormTabbedItem.tabs.items
             * @type Array<dxFormSimpleItem,dxFormGroupItem,dxFormTabbedItem,dxFormEmptyItem,dxFormButtonItem>
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs.badge
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs.disabled
             * @type boolean
             * @default false
             */
            /**
             * @name dxFormTabbedItem.tabs.icon
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs.tabTemplate
             * @type template|function
             * @type_function_param1 tabData:object
             * @type_function_param2 tabIndex:number
             * @type_function_param3 tabElement:dxElement
             * @default undefined
             */
            /**
             * @name dxFormTabbedItem.tabs.template
             * @type template|function
             * @type_function_param1 tabData:object
             * @type_function_param2 tabIndex:number
             * @type_function_param3 tabElement:dxElement
             * @default undefined
             */
            /**
            * @name dxFormEmptyItem
			* @publicName EmptyItem
            * @section FormItems
            * @type object
            */
            /**
             * @name dxFormEmptyItem.name
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormEmptyItem.colSpan
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormEmptyItem.itemType
             * @type Enums.FormItemType
             * @default "simple"
             */
            /**
             * @name dxFormEmptyItem.visible
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormEmptyItem.cssClass
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormEmptyItem.visibleIndex
             * @type number
             * @default undefined
             */
            /**
            * @name dxFormButtonItem
			* @publicName ButtonItem
            * @section FormItems
            * @type object
            */
            /**
             * @name dxFormButtonItem.name
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormButtonItem.colSpan
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormButtonItem.itemType
             * @type Enums.FormItemType
             * @default "simple"
             */
            /**
             * @name dxFormButtonItem.visible
             * @type boolean
             * @default true
             */
            /**
             * @name dxFormButtonItem.cssClass
             * @type string
             * @default undefined
             */
            /**
             * @name dxFormButtonItem.visibleIndex
             * @type number
             * @default undefined
             */
            /**
             * @name dxFormButtonItem.buttonOptions
             * @type dxButtonOptions
             * @default undefined
             */
            /**
             * @name dxFormButtonItem.alignment
             * @type Enums.HorizontalAlignment
             * @default "right"
             * @deprecated dxFormButtonItem.horizontalAlignment
             */
            /**
             * @name dxFormButtonItem.horizontalAlignment
             * @type Enums.HorizontalAlignment
             * @default "right"
             */
            /**
             * @name dxFormButtonItem.verticalAlignment
             * @type Enums.VerticalAlignment
             * @default "top"
             */
        });
    }

    _defaultOptionsRules() {
        return super._defaultOptionsRules().concat([
            {
                device() {
                    return themes.isMaterial();
                },
                options: {
                    /**
                     * @name dxFormOptions.showColonAfterLabel
                     * @type boolean
                     * @default false @for Material
                     */
                    showColonAfterLabel: false,
                    /**
                     * @name dxFormOptions.labelLocation
                     * @type Enums.FormLabelLocation
                     * @default "top" @for Material
                     */
                    labelLocation: "top"
                }
            }
        ]);
    }

    _setOptionsByReference() {
        super._setOptionsByReference();

        extend(this._optionsByReference, {
            formData: true,
            validationGroup: true
        });
    }

    _getColCount($element) {
        let index = 0;
        let isColsExist = true;
        let $cols;

        while(isColsExist) {
            $cols = $element.find("." + FORM_FIELD_ITEM_COL_CLASS + index);
            if(!$cols.length) {
                isColsExist = false;
            } else {
                index++;
            }
        }
        return index;
    }

    _createHiddenElement(rootLayoutManager) {
        this._$hiddenElement = $("<div>")
            .addClass(WIDGET_CLASS)
            .addClass(HIDDEN_LABEL_CLASS)
            .appendTo("body");

        const $hiddenLabel = rootLayoutManager._renderLabel({
            text: " ",
            location: this.option("labelLocation")
        }).appendTo(this._$hiddenElement);

        this._hiddenLabelText = $hiddenLabel.find(`.${FIELD_ITEM_LABEL_TEXT_CLASS}`)[0];
    }

    _removeHiddenElement() {
        this._$hiddenElement.remove();
        this._hiddenLabelText = null;
    }

    _getLabelWidthByText(text) {
        // this code has slow performance
        this._hiddenLabelText.innerHTML = text;
        return this._hiddenLabelText.offsetWidth;
    }

    _getLabelsSelectorByCol(index, options) {
        options = options || {};

        const fieldItemClass = options.inOneColumn ? FIELD_ITEM_CLASS : FORM_FIELD_ITEM_COL_CLASS + index;
        const cssExcludeTabbedSelector = options.excludeTabbed ? `:not(.${FIELD_ITEM_TAB_CLASS})` : "";
        const childLabelContentSelector = `> .${FIELD_ITEM_LABEL_CLASS} > .${FIELD_ITEM_LABEL_CONTENT_CLASS}`;

        return `.${fieldItemClass + cssExcludeTabbedSelector + childLabelContentSelector}`;
    }

    _getLabelText(labelText) {
        const length = labelText.children.length;
        let child;
        let result = "";

        for(let i = 0; i < length; i++) {
            child = labelText.children[i];
            result = result + (!isEmpty(child.innerText) ? child.innerText : child.innerHTML);
        }

        return result;
    }

    _applyLabelsWidthByCol($container, index, options) {
        const $labelTexts = $container.find(this._getLabelsSelectorByCol(index, options));
        let $labelTextsLength = $labelTexts.length;
        let labelWidth;
        let maxWidth = 0;

        for(let i = 0; i < $labelTextsLength; i++) {
            labelWidth = this._getLabelWidthByText(this._getLabelText($labelTexts[i]));
            if(labelWidth > maxWidth) {
                maxWidth = labelWidth;
            }
        }
        for(let i = 0; i < $labelTextsLength; i++) {
            $labelTexts[i].style.width = `${maxWidth}px`;
        }
    }

    _applyLabelsWidth($container, excludeTabbed, inOneColumn, colCount) {
        colCount = inOneColumn ? 1 : colCount || this._getColCount($container);
        const applyLabelsOptions = {
            excludeTabbed: excludeTabbed,
            inOneColumn: inOneColumn
        };

        for(let i = 0; i < colCount; i++) {
            this._applyLabelsWidthByCol($container, i, applyLabelsOptions);
        }
    }

    _getGroupElementsInColumn($container, columnIndex, colCount) {
        const cssColCountSelector = isDefined(colCount) ? `.${GROUP_COL_COUNT_CLASS + colCount}` : "";
        const groupSelector = `.${FORM_FIELD_ITEM_COL_CLASS + columnIndex} > .${FIELD_ITEM_CONTENT_CLASS} > .${FORM_GROUP_CLASS + cssColCountSelector}`;

        return $container.find(groupSelector);
    }

    _applyLabelsWidthWithGroups($container, colCount, excludeTabbed) {
        const alignItemLabelsInAllGroups = this.option("alignItemLabelsInAllGroups");

        if(alignItemLabelsInAllGroups) {
            this._applyLabelsWidthWithNestedGroups($container, colCount, excludeTabbed);
        } else {
            const $groups = this.$element().find(`.${FORM_GROUP_CLASS}`);
            for(let i = 0; i < $groups.length; i++) {
                this._applyLabelsWidth($groups.eq(i), excludeTabbed);
            }
        }
    }

    _applyLabelsWidthWithNestedGroups($container, colCount, excludeTabbed) {
        const applyLabelsOptions = { excludeTabbed: excludeTabbed };
        let groupColIndex;
        let $groupsByCol;

        for(let colIndex = 0; colIndex < colCount; colIndex++) {
            $groupsByCol = this._getGroupElementsInColumn($container, colIndex);
            this._applyLabelsWidthByCol($groupsByCol, 0, applyLabelsOptions);

            for(let groupsColIndex = 0; groupsColIndex < this._groupsColCount.length; groupsColIndex++) {
                $groupsByCol = this._getGroupElementsInColumn($container, colIndex, this._groupsColCount[groupsColIndex]);
                var groupColCount = this._getColCount($groupsByCol);

                for(groupColIndex = 1; groupColIndex < groupColCount; groupColIndex++) {
                    this._applyLabelsWidthByCol($groupsByCol, groupColIndex, applyLabelsOptions);
                }
            }
        }
    }

    _alignLabelsInColumn(options) {
        if(!hasWindow()) {
            return;
        }

        this._createHiddenElement(options.layoutManager);
        if(options.inOneColumn) {
            this._applyLabelsWidth(options.$container, options.excludeTabbed, true);
        } else {
            if(this._checkGrouping(options.items)) {
                this._applyLabelsWidthWithGroups(options.$container, options.layoutManager._getColCount(), options.excludeTabbed);
            } else {
                this._applyLabelsWidth(options.$container, options.excludeTabbed, false, options.layoutManager._getColCount());
            }
        }
        this._removeHiddenElement();
    }

    _prepareFormData() {
        if(!isDefined(this.option("formData"))) {
            this.option("formData", {});
        }
    }

    _initMarkup() {
        ValidationEngine.addGroup(this._getValidationGroup());
        this._clearCachedInstances();
        this._prepareFormData();
        this.$element().addClass(FORM_CLASS);

        super._initMarkup();

        this.setAria("role", "form", this.$element());

        if(this.option("scrollingEnabled")) {
            this._renderScrollable();
        }

        this._renderLayout();
        this._renderValidationSummary();

        this._lastMarkupScreenFactor = this._targetScreenFactor || this._getCurrentScreenFactor();
    }

    _getCurrentScreenFactor() {
        return hasWindow() ? getCurrentScreenFactor(this.option("screenByWidth")) : "lg";
    }

    _clearCachedInstances() {
        this._itemsRunTimeInfo.clear();
        this._cachedLayoutManagers = [];
    }

    _alignLabels(layoutManager, inOneColumn) {
        this._alignLabelsInColumn({
            $container: this.$element(),
            layoutManager: layoutManager,
            excludeTabbed: true,
            items: this.option("items"),
            inOneColumn: inOneColumn
        });
    }

    _clean() {
        super._clean();
        this._groupsColCount = [];
        this._cachedColCountOptions = [];
        this._lastMarkupScreenFactor = undefined;
    }

    _renderScrollable() {
        const useNativeScrolling = this.option("useNativeScrolling");
        this._scrollable = new Scrollable(this.$element(), {
            useNative: !!useNativeScrolling,
            useSimulatedScrollbar: !useNativeScrolling,
            useKeyboard: false,
            direction: "both",
            bounceEnabled: false
        });
    }

    _getContent() {
        return this.option("scrollingEnabled") ? this._scrollable.$content() : this.$element();
    }

    _renderValidationSummary() {
        const $validationSummary = this.$element().find(`.${FORM_VALIDATION_SUMMARY}`);

        if($validationSummary.length > 0) {
            $validationSummary.remove();
        }

        if(this.option("showValidationSummary")) {
            $("<div>").addClass(FORM_VALIDATION_SUMMARY).dxValidationSummary({
                validationGroup: this._getValidationGroup()
            }).appendTo(this._getContent());
        }
    }

    _prepareItems(items, parentIsTabbedItem) {
        if(items) {
            const result = [];

            for(let i = 0; i < items.length; i++) {
                const item = items[i];
                const guid = this._itemsRunTimeInfo.add(item);

                if(isObject(item)) {
                    const itemCopy = extend({}, item);
                    itemCopy.guid = guid;
                    this._tryPrepareGroupItem(itemCopy);
                    this._tryPrepareTabbedItem(itemCopy);
                    this._tryPrepareItemTemplate(itemCopy);

                    if(parentIsTabbedItem) {
                        itemCopy.cssItemClass = FIELD_ITEM_TAB_CLASS;
                    }

                    if(itemCopy.items) {
                        itemCopy.items = this._prepareItems(itemCopy.items, parentIsTabbedItem);
                    }
                    result.push(itemCopy);
                } else {
                    result.push(item);
                }
            }

            return result;
        }
    }

    _tryPrepareGroupItem(item) {
        if(item.itemType === "group") {
            item.alignItemLabels = ensureDefined(item.alignItemLabels, true);

            if(item.template) {
                item.groupContentTemplate = this._getTemplate(item.template);
            }

            item.template = this._itemGroupTemplate.bind(this, item);
        }
    }

    _tryPrepareTabbedItem(item) {
        if(item.itemType === "tabbed") {
            item.template = this._itemTabbedTemplate.bind(this, item);
            item.tabs = this._prepareItems(item.tabs, true);
        }
    }

    _tryPrepareItemTemplate(item) {
        if(item.template) {
            item.template = this._getTemplate(item.template);
        }
    }

    _checkGrouping(items) {
        if(items) {
            for(let i = 0; i < items.length; i++) {
                const item = items[i];
                if(item.itemType === "group") {
                    return true;
                }
            }
        }
    }

    _renderLayout() {
        const $content = this._getContent();
        let items = this.option("items");

        items = this._prepareItems(items);

        //#DEBUG
        this._testResultItems = items;
        //#ENDDEBUG

        this._rootLayoutManager = this._renderLayoutManager(items, $content, {
            colCount: this.option("colCount"),
            alignItemLabels: this.option("alignItemLabels"),
            screenByWidth: this.option("screenByWidth"),
            colCountByScreen: this.option("colCountByScreen"),
            onLayoutChanged: inOneColumn => this._alignLabels(this._rootLayoutManager, inOneColumn),
            onContentReady: e => this._alignLabels(e.component, e.component.isSingleColumnMode())
        });
    }

    _tryGetItemsForTemplate(item) {
        return item.items || [];
    }

    _itemTabbedTemplate(item, e, $container) {
        const $tabPanel = $("<div>").appendTo($container);
        const tabPanelOptions = extend({}, item.tabPanelOptions, {
            dataSource: item.tabs,
            onItemRendered: args => triggerShownEvent(args.itemElement),
            itemTemplate: (itemData, e, container) => {
                const $container = $(container);
                const alignItemLabels = ensureDefined(itemData.alignItemLabels, true);

                const layoutManager = this._renderLayoutManager(this._tryGetItemsForTemplate(itemData), $container, {
                    colCount: itemData.colCount,
                    alignItemLabels: alignItemLabels,
                    screenByWidth: this.option("screenByWidth"),
                    colCountByScreen: itemData.colCountByScreen,
                    cssItemClass: itemData.cssItemClass,
                    onLayoutChanged: inOneColumn =>
                        this._alignLabelsInColumn({
                            $container: $container,
                            layoutManager: layoutManager,
                            items: itemData.items,
                            inOneColumn: inOneColumn
                        })
                });

                if(alignItemLabels) {
                    this._alignLabelsInColumn({
                        $container: $container,
                        layoutManager: layoutManager,
                        items: itemData.items,
                        inOneColumn: layoutManager.isSingleColumnMode()
                    });
                }
            }
        });

        this._createComponent($tabPanel, TabPanel, tabPanelOptions);
    }

    _itemGroupTemplate(item, e, $container) {
        const $group = $("<div>")
            .toggleClass(FORM_GROUP_WITH_CAPTION_CLASS, isDefined(item.caption) && item.caption.length)
            .addClass(FORM_GROUP_CLASS)
            .appendTo($container);

        if(item.caption) {
            $("<span>")
                .addClass(FORM_GROUP_CAPTION_CLASS)
                .text(item.caption)
                .appendTo($group);
        }

        const $groupContent = $("<div>")
            .addClass(FORM_GROUP_CONTENT_CLASS)
            .appendTo($group);

        if(item.groupContentTemplate) {
            const data = {
                formData: this.option("formData"),
                component: this
            };
            item.groupContentTemplate.render({
                model: data,
                container: getPublicElement($groupContent)
            });
        } else {
            const layoutManager = this._renderLayoutManager(this._tryGetItemsForTemplate(item), $groupContent, {
                colCount: item.colCount,
                colCountByScreen: item.colCountByScreen,
                alignItemLabels: item.alignItemLabels,
                cssItemClass: item.cssItemClass
            });

            const colCount = layoutManager._getColCount();
            if(inArray(colCount, this._groupsColCount) === -1) {
                this._groupsColCount.push(colCount);
            }
            $group.addClass(GROUP_COL_COUNT_CLASS + colCount);
        }
    }

    _renderLayoutManager(items, $rootElement, options) {
        const $element = $("<div>");
        const baseColCountByScreen = {
            lg: options.colCount,
            md: options.colCount,
            sm: options.colCount,
            xs: 1
        };

        this._cachedColCountOptions.push({ colCountByScreen: extend(baseColCountByScreen, options.colCountByScreen) });
        $element.appendTo($rootElement);

        const config = this._getLayoutManagerConfig(items, options);
        const instance = this._createComponent($element, "dxLayoutManager", config);
        instance.on("autoColCountChanged", () => this._refresh());

        this._cachedLayoutManagers.push(instance);
        return instance;
    }

    _getValidationGroup() {
        return this.option("validationGroup") || this;
    }

    _getLayoutManagerConfig(items, options) {
        const baseConfig = {
            form: this,
            validationGroup: this._getValidationGroup(),
            showRequiredMark: this.option("showRequiredMark"),
            showOptionalMark: this.option("showOptionalMark"),
            requiredMark: this.option("requiredMark"),
            optionalMark: this.option("optionalMark"),
            requiredMessage: this.option("requiredMessage"),
            screenByWidth: this.option("screenByWidth"),
            layoutData: this.option("formData"),
            labelLocation: this.option("labelLocation"),
            customizeItem: this.option("customizeItem"),
            minColWidth: this.option("minColWidth"),
            showColonAfterLabel: this.option("showColonAfterLabel"),
            onEditorEnterKey: this.option("onEditorEnterKey"),
            onFieldDataChanged: args => {
                if(!this._isDataUpdating) {
                    this._triggerOnFieldDataChanged(args);
                }
            },
            validationBoundary: this.option("scrollingEnabled") ? this.$element() : undefined
        };

        return extend(baseConfig, {
            items: items,
            onContentReady: args => {
                this._itemsRunTimeInfo.addItemsOrExtendFrom(args.component._itemsRunTimeInfo);
                options.onContentReady && options.onContentReady(args);
            },
            colCount: options.colCount,
            alignItemLabels: options.alignItemLabels,
            cssItemClass: options.cssItemClass,
            colCountByScreen: options.colCountByScreen,
            onLayoutChanged: options.onLayoutChanged,
            width: options.width
        });
    }

    _createComponent($element, type, config) {
        config = config || {};

        this._extendConfig(config, {
            readOnly: this.option("readOnly")
        });

        return super._createComponent($element, type, config);
    }

    _attachSyncSubscriptions() {
        this.on("optionChanged", args => {
            const optionFullName = args.fullName;

            if(optionFullName === "formData") {
                if(!isDefined(args.value)) {
                    this._options.formData = args.value = {};
                }

                this._triggerOnFieldDataChangedByDataSet(args.value);
            }

            if(this._cachedLayoutManagers.length) {
                each(this._cachedLayoutManagers, (index, layoutManager) => {
                    if(optionFullName === "formData") {
                        this._isDataUpdating = true;
                        layoutManager.option("layoutData", args.value);
                        this._isDataUpdating = false;
                    }

                    if(args.name === "readOnly" || args.name === "disabled") {
                        layoutManager.option(optionFullName, args.value);
                    }
                });
            }
        });
    }

    _optionChanged(args) {
        const rootNameOfComplexOption = this._getRootLevelOfExpectedComplexOption(args.fullName, ["formData", "items"]);

        if(rootNameOfComplexOption) {
            this._customHandlerOfComplexOption(args, rootNameOfComplexOption);
            return;
        }

        switch(args.name) {
            case "formData":
                if(!this.option("items")) {
                    this._invalidate();
                } else if(isEmptyObject(args.value)) {
                    this._resetValues();
                }
                break;
            case "items":
            case "colCount":
            case "onFieldDataChanged":
            case "onEditorEnterKey":
            case "labelLocation":
            case "alignItemLabels":
            case "showColonAfterLabel":
            case "customizeItem":
            case "alignItemLabelsInAllGroups":
            case "showRequiredMark":
            case "showOptionalMark":
            case "requiredMark":
            case "optionalMark":
            case "requiredMessage":
            case "scrollingEnabled":
            case "formID":
            case "colCountByScreen":
            case "screenByWidth":
            case "stylingMode":
                this._invalidate();
                break;
            case "showValidationSummary":
                this._renderValidationSummary();
                break;
            case "minColWidth":
                if(this.option("colCount") === "auto") {
                    this._invalidate();
                }
                break;
            case "readOnly":
                break;
            case "width":
                super._optionChanged(args);
                this._rootLayoutManager.option(args.name, args.value);
                this._alignLabels(this._rootLayoutManager, this._rootLayoutManager.isSingleColumnMode());
                break;
            case "visible":
                super._optionChanged(args);

                if(args.value) {
                    triggerShownEvent(this.$element());
                }
                break;
            case "validationGroup":
                ValidationEngine.removeGroup(args.previousValue || this);
                this._invalidate();
                break;
            default:
                super._optionChanged(args);
        }
    }

    _getRootLevelOfExpectedComplexOption(fullOptionName, expectedRootNames) {
        const splitFullName = fullOptionName.split(".");
        let result;

        if(splitFullName.length > 1) {
            const rootOptionName = splitFullName[0];

            for(let i = 0; i < expectedRootNames.length; i++) {
                if(rootOptionName.search(expectedRootNames[i]) !== -1) {
                    result = expectedRootNames[i];
                }
            }
        }

        return result;
    }

    _customHandlerOfComplexOption(args, rootOptionName) {
        const nameParts = args.fullName.split(".");

        switch(rootOptionName) {
            case "items": {
                const itemPath = this._getItemPath(nameParts);
                const item = this.option(itemPath);
                const instance = this._itemsRunTimeInfo.findWidgetInstanceByItem(item);
                const $itemContainer = this._itemsRunTimeInfo.findItemContainerByItem(item);
                const fullName = args.fullName;

                if(instance) {
                    if(fullName.search("buttonOptions") !== -1) {
                        instance.option(item.buttonOptions);
                        break;
                    } else if(instance && fullName.search("editorOptions") !== -1) {
                        instance.option(item.editorOptions);
                        break;
                    } else if(fullName.search("validationRules") !== -1) {
                        const validator = data(instance.$element()[0], "dxValidator");
                        if(validator) {
                            const filterRequired = item => item.type === "required";
                            const oldContainsRequired = (validator.option("validationRules") || []).some(filterRequired);
                            const newContainsRequired = (item.validationRules || []).some(filterRequired);
                            if(!oldContainsRequired && !newContainsRequired || oldContainsRequired && newContainsRequired) {
                                validator.option("validationRules", item.validationRules);
                                break;
                            }
                        }
                    } else if($itemContainer && fullName.substring(fullName.length - 8, fullName.length) === "cssClass") {
                        $itemContainer.removeClass(args.previousValue).addClass(args.value);
                        break;
                    }
                }

                if(item) {
                    const name = args.fullName.replace(`${itemPath}.`, "");
                    this._changeItemOption(item, name, args.value);
                    const items = this._generateItemsFromData(this.option("items"));
                    this.option("items", items);
                }

                break;
            }
            case "formData": {
                const dataField = nameParts.slice(1).join(".");
                const editor = this.getEditor(dataField);

                if(editor) {
                    editor.option("value", args.value);
                } else {
                    this._triggerOnFieldDataChanged({
                        dataField: dataField,
                        value: args.value
                    });
                }
                break;
            }
        }
    }

    _getItemPath(nameParts) {
        let itemPath = nameParts[0];
        for(let i = 1; i < nameParts.length; i++) {
            if(nameParts[i].search("items|tabs") !== -1) {
                itemPath += `.${nameParts[i]}`;
            } else {
                break;
            }
        }
        return itemPath;
    }

    _triggerOnFieldDataChanged(args) {
        this._createActionByOption("onFieldDataChanged")(args);
    }

    _triggerOnFieldDataChangedByDataSet(data) {
        if(data && isObject(data)) {
            each(data, (dataField, value) => this._triggerOnFieldDataChanged({ dataField: dataField, value: value }));
        }
    }

    _updateFieldValue(dataField, value) {
        if(isDefined(this.option("formData"))) {
            this.option(`formData.${dataField}`, value);

            const editor = this.getEditor(dataField);
            if(editor) {
                const editorValue = editor.option("value");
                if(editorValue !== value) {
                    editor.option("value", value);
                }
            }
        }
    }

    _generateItemsFromData(items) {
        const formData = this.option("formData");
        const result = [];

        if(!items && isDefined(formData)) {
            each(formData, dataField => {
                result.push({ dataField });
            });
        }

        if(items) {
            each(items, (index, item) => {
                if(isObject(item)) {
                    result.push(item);
                } else {
                    result.push({
                        dataField: item
                    });
                }
            });
        }

        return result;
    }

    _getItemByField(field, items) {
        const fieldParts = isObject(field) ? field : this._getFieldParts(field);
        const { fieldName, fieldPath } = fieldParts;
        let resultItem;

        if(items.length) {
            each(items, (index, item) => {
                const itemType = item.itemType;

                if(fieldPath.length) {
                    const path = fieldPath.slice();
                    item = this._getItemByFieldPath(path, fieldName, item);
                } else if(itemType === "group" && !(item.caption || item.name) || itemType === "tabbed") {
                    const subItemsField = this._getSubItemField(itemType);
                    item.items = this._generateItemsFromData(item.items);
                    item = this._getItemByField({ fieldName: fieldName, fieldPath: fieldPath }, item[subItemsField]);
                }

                if(this._isExpectedItem(item, fieldName)) {
                    resultItem = item;
                    return false;
                }
            });
        }

        return resultItem;
    }

    _getFieldParts(field) {
        const fieldSeparator = ".";
        const resultPath = [];
        let fieldName = field;
        let separatorIndex = fieldName.indexOf(fieldSeparator);

        while(separatorIndex !== -1) {
            resultPath.push(fieldName.substr(0, separatorIndex));
            fieldName = fieldName.substr(separatorIndex + 1);
            separatorIndex = fieldName.indexOf(fieldSeparator);
        }

        return {
            fieldName: fieldName,
            fieldPath: resultPath.reverse()
        };
    }

    _getItemByFieldPath(path, fieldName, item) {
        const itemType = item.itemType;
        const subItemsField = this._getSubItemField(itemType);
        const isItemWithSubItems = itemType === "group" || itemType === "tabbed" || item.title;
        let result;

        do {
            if(isItemWithSubItems) {
                const name = item.name || item.caption || item.title;
                const isGroupWithName = isDefined(name);
                const nameWithoutSpaces = this._getTextWithoutSpaces(name);
                let pathNode;

                item[subItemsField] = this._generateItemsFromData(item[subItemsField]);

                if(isGroupWithName) {
                    pathNode = path.pop();
                }

                if(!path.length) {
                    result = this._getItemByField(fieldName, item[subItemsField]);
                    if(result) {
                        break;
                    }
                }

                if(!isGroupWithName || isGroupWithName && nameWithoutSpaces === pathNode) {
                    if(path.length) {
                        result = this._searchItemInEverySubItem(path, fieldName, item[subItemsField]);
                    }
                }
            } else {
                break;
            }
        } while(path.length && !isDefined(result));

        return result;
    }

    _getSubItemField(itemType) {
        return itemType === "tabbed" ? "tabs" : "items";
    }

    _searchItemInEverySubItem(path, fieldName, items) {
        let result;
        each(items, (index, groupItem) => {
            result = this._getItemByFieldPath(path.slice(), fieldName, groupItem);
            if(result) {
                return false;
            }
        });

        if(!result) {
            result = false;
        }

        return result;
    }

    _getTextWithoutSpaces(text) {
        return text ? text.replace(/\s/g, '') : undefined;
    }

    _isExpectedItem(item, fieldName) {
        return item && (item.dataField === fieldName || item.name === fieldName || this._getTextWithoutSpaces(item.title) === fieldName ||
            (item.itemType === "group" && this._getTextWithoutSpaces(item.caption) === fieldName));
    }

    _changeItemOption(item, option, value) {
        if(isObject(item)) {
            item[option] = value;
        }
    }

    _dimensionChanged() {
        const currentScreenFactor = this._getCurrentScreenFactor();

        if(this._lastMarkupScreenFactor !== currentScreenFactor) {
            if(this._isColCountChanged(this._lastMarkupScreenFactor, currentScreenFactor)) {
                this._targetScreenFactor = currentScreenFactor;
                this._refresh();
                this._targetScreenFactor = undefined;
            }

            this._lastMarkupScreenFactor = currentScreenFactor;
        }
    }

    _isColCountChanged(oldScreenSize, newScreenSize) {
        let isChanged = false;

        each(this._cachedColCountOptions, (index, item) => {
            if(item.colCountByScreen[oldScreenSize] !== item.colCountByScreen[newScreenSize]) {
                isChanged = true;
                return false;
            }
        });

        return isChanged;
    }

    _refresh() {
        const editorSelector = `.${FOCUSED_STATE_CLASS} input, .${FOCUSED_STATE_CLASS} textarea`;
        eventsEngine.trigger(this.$element().find(editorSelector), "change");
        super._refresh();
    }

    _resetValues() {
        const validationGroup = this._getValidationGroup();
        const validationGroupConfig = ValidationEngine.getGroupConfig(validationGroup);

        validationGroupConfig && validationGroupConfig.reset();
        this._itemsRunTimeInfo.each(function(_, itemRunTimeInfo) {
            if(isDefined(itemRunTimeInfo.widgetInstance) && isDefined(itemRunTimeInfo.item) && itemRunTimeInfo.item.itemType !== "button") {
                itemRunTimeInfo.widgetInstance.reset();
                itemRunTimeInfo.widgetInstance.option("isValid", true);
            }
        });
    }

    _updateData(data, value, isComplexData) {
        const _data = isComplexData ? value : data;
        if(isObject(_data)) {
            each(_data, (dataField, fieldValue) => {
                this._updateData(isComplexData ? `${data}.${dataField}` : dataField, fieldValue, isObject(fieldValue));
            });
        } else if(isString(data)) {
            this._updateFieldValue(data, value);
        }
    }

    registerKeyHandler(key, handler) {
        super.registerKeyHandler(key, handler);
        this._itemsRunTimeInfo.each((_, itemRunTimeInfo) => {
            if(isDefined(itemRunTimeInfo.widgetInstance)) {
                itemRunTimeInfo.widgetInstance.registerKeyHandler(key, handler);
            }
        });
    }

    _focusTarget() {
        return this.$element().find(`.${FIELD_ITEM_CONTENT_CLASS} [tabindex]`).first();
    }

    _visibilityChanged(visible) {
        if(visible && browser.msie) {
            this._refresh();
        }
    }

    _dispose() {
        ValidationEngine.removeGroup(this._getValidationGroup());
        super._dispose();
    }

    /**
     * @name dxFormMethods.resetValues
     * @publicName resetValues()
     */
    resetValues() {
        this._resetValues();
    }

    /**
     * @name dxFormMethods.updateData
     * @publicName updateData(dataField, value)
     * @param1 dataField:string
     * @param2 value:object
     */
    /**
     * @name dxFormMethods.updateData
     * @publicName updateData(data)
     * @param1 data:object
     */
    updateData(data, value) {
        this._updateData(data, value);
    }

    /**
     * @name dxFormMethods.getEditor
     * @publicName getEditor(dataField)
     * @param1 dataField:string
     * @return Editor | undefined
     */
    getEditor(dataField) {
        return this._itemsRunTimeInfo.findWidgetInstanceByDataField(dataField) || this._itemsRunTimeInfo.findWidgetInstanceByName(dataField);
    }

    /**
     * @name dxFormMethods.getButton
     * @publicName getButton(name)
     * @param1 name:string
     * @return dxButton | undefined
     */
    getButton(name) {
        return this._itemsRunTimeInfo.findWidgetInstanceByName(name);
    }

    /**
     * @name dxFormMethods.updateDimensions
     * @publicName updateDimensions()
     * @return Promise<void>
     */
    updateDimensions() {
        const deferred = new Deferred();
        if(this._scrollable) {
            this._scrollable.update().done(() => deferred.resolveWith(this));
        } else {
            deferred.resolveWith(this);
        }

        return deferred.promise();
    }

    /**
     * @name dxFormMethods.itemOption
     * @publicName itemOption(id, option, value)
     * @param1 id:string
     * @param2 option:string
     * @param3 value:any
     */
    /**
     * @name dxFormMethods.itemOption
     * @publicName itemOption(id, options)
     * @param1 id:string
     * @param2 options:object
     */
    /**
     * @name dxFormMethods.itemOption
     * @publicName itemOption(id)
     * @param1 id:string
     * @return any
     */
    itemOption(id, option, value) {
        const items = this._generateItemsFromData(this.option("items"));
        const item = this._getItemByField(id, items);

        switch(arguments.length) {
            case 1:
                return item;
            case 3:
                this._changeItemOption(item, option, value);
                break;
            default:
                if(isObject(option)) {
                    each(option, (optionName, optionValue) => this._changeItemOption(item, optionName, optionValue));
                }
                break;
        }

        this.option("items", items);
    }
    /**
     * @name dxFormMethods.validate
     * @publicName validate()
     * @return dxValidationGroupResult
     */
    validate() {
        return ValidationEngine.validateGroup(this._getValidationGroup());
    }

    getItemID(name) {
        return `dx_${this.option("formID")}_${(name || new Guid())}`;
    }

    getTargetScreenFactor() {
        return this._targetScreenFactor;
    }
}

registerComponent("dxForm", Form);

module.exports = Form;

//#DEBUG
module.exports.__internals = extend({
    FORM_CLASS: FORM_CLASS,
    FORM_GROUP_CLASS: FORM_GROUP_CLASS,
    FORM_GROUP_CAPTION_CLASS: FORM_GROUP_CAPTION_CLASS,
    FORM_FIELD_ITEM_COL_CLASS: FORM_FIELD_ITEM_COL_CLASS
}, LayoutManager.__internals);

//#ENDDEBUG
