import $ from "../../core/renderer";
import eventsEngine from "../../events/core/events_engine";
import { default as FormItemsRunTimeInfo } from "./ui.form.items_runtime_info";
import registerComponent from "../../core/component_registrator";
import { isDefined, isEmptyObject, isFunction, isObject, type } from "../../core/utils/type";
import { isWrapped, isWritableWrapped, unwrap } from "../../core/utils/variable_wrapper";
import windowUtils from "../../core/utils/window";
import { each } from "../../core/utils/iterator";
import { extend } from "../../core/utils/extend";
import { normalizeIndexes } from "../../core/utils/array";
import dataUtils from "../../core/utils/data";
import removeEvent from "../../core/remove_event";
import messageLocalization from "../../localization/message";
import styleUtils from "../../core/utils/style";
import Widget from "../widget/ui.widget";
import ResponsiveBox from "../responsive_box";
import { default as SimpleItem } from './ui.form.simple_item';
import { default as EmptyItem } from './ui.form.empty_item';
import { default as ButtonItem } from './ui.form.button_item';

import "../text_box";
import "../number_box";
import "../check_box";
import "../date_box";
import "../button";

const FORM_EDITOR_BY_DEFAULT = "dxTextBox";
const SINGLE_COLUMN_ITEM_CONTENT = "dx-single-column-item-content";

const LAYOUT_MANAGER_FIRST_ROW_CLASS = "dx-first-row";
const LAYOUT_MANAGER_FIRST_COL_CLASS = "dx-first-col";
const LAYOUT_MANAGER_LAST_COL_CLASS = "dx-last-col";
const LAYOUT_STRATEGY_FLEX = "flex";
const LAYOUT_STRATEGY_FALLBACK = "fallback";

const SIMPLE_ITEM_TYPE = "simple";

const LayoutManager = Widget.inherit({
    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            layoutData: {},
            readOnly: false,
            colCount: 1,
            colCountByScreen: undefined,
            labelLocation: "left",
            onFieldDataChanged: null,
            onEditorEnterKey: null,
            customizeItem: null,
            alignItemLabels: true,
            minColWidth: 200,
            showRequiredMark: true,
            screenByWidth: null,
            showOptionalMark: false,
            requiredMark: "*",
            optionalMark: messageLocalization.format("dxForm-optionalMark"),
            requiredMessage: messageLocalization.getFormatter("dxForm-requiredMessage")
        });
    },

    _setOptionsByReference: function() {
        this.callBase();

        extend(this._optionsByReference, {
            layoutData: true,
            validationGroup: true
        });
    },

    _init: function() {
        var layoutData = this.option("layoutData");

        this.callBase();
        this._itemWatchers = [];
        this._itemsRunTimeInfo = new FormItemsRunTimeInfo();
        this._updateReferencedOptions(layoutData);
        this._initDataAndItems(layoutData);
    },

    _dispose: function() {
        this.callBase();

        this._cleanItemWatchers();
    },

    _initDataAndItems: function(initialData) {
        this._syncDataWithItems();
        this._updateItems(initialData);
    },

    _syncDataWithItems: function() {
        var that = this,
            userItems = that.option("items");

        if(isDefined(userItems)) {
            each(userItems, function(index, item) {
                var value;
                if(item.dataField && that._getDataByField(item.dataField) === undefined) {
                    if(item.editorOptions) {
                        value = item.editorOptions.value;
                    }

                    that._updateFieldValue(item.dataField, value);
                }
            });
        }
    },

    _getDataByField: function(dataField) {
        return dataField ? this.option("layoutData." + dataField) : null;
    },

    _updateFieldValue: function(dataField, value) {
        var layoutData = this.option("layoutData"),
            newValue = value;

        if(!isWrapped(layoutData[dataField]) && isDefined(dataField)) {
            this.option("layoutData." + dataField, newValue);
        } else if(isWritableWrapped(layoutData[dataField])) {
            newValue = isFunction(newValue) ? newValue() : newValue;

            layoutData[dataField](newValue);
        }

        this._triggerOnFieldDataChanged({ dataField: dataField, value: newValue });
    },

    _triggerOnFieldDataChanged: function(args) {
        this._createActionByOption("onFieldDataChanged")(args);
    },

    _updateItems: function(layoutData) {
        var that = this,
            userItems = this.option("items"),
            isUserItemsExist = isDefined(userItems),
            customizeItem = that.option("customizeItem"),
            items,
            processedItems;

        items = isUserItemsExist ? userItems : this._generateItemsByData(layoutData);
        if(isDefined(items)) {
            processedItems = [];

            each(items, function(index, item) {
                if(that._isAcceptableItem(item)) {
                    item = that._processItem(item);

                    customizeItem && customizeItem(item);

                    if(isObject(item) && unwrap(item.visible) !== false) {
                        processedItems.push(item);
                    }
                }
            });

            if(!that._itemWatchers.length || !isUserItemsExist) {
                that._updateItemWatchers(items);
            }

            this._items = processedItems;

            this._sortItems();
        }
    },

    _cleanItemWatchers: function() {
        this._itemWatchers.forEach(function(dispose) {
            dispose();
        });
        this._itemWatchers = [];
    },

    _updateItemWatchers: function(items) {
        var that = this,
            watch = that._getWatch();

        items.forEach(function(item) {
            if(isObject(item) && isDefined(item.visible) && isFunction(watch)) {

                that._itemWatchers.push(
                    watch(
                        function() {
                            return unwrap(item.visible);
                        },
                        function() {
                            that._updateItems(that.option("layoutData"));
                            that.repaint();
                        },
                        { skipImmediate: true }
                    ));
            }
        });
    },

    _generateItemsByData: function(layoutData) {
        var result = [];

        if(isDefined(layoutData)) {
            each(layoutData, function(dataField) {
                result.push({
                    dataField: dataField
                });
            });
        }

        return result;
    },

    _isAcceptableItem: function(item) {
        var itemField = item.dataField || item,
            itemData = this._getDataByField(itemField);

        return !(isFunction(itemData) && !isWrapped(itemData));
    },

    _processItem: function(item) {
        if(typeof item === "string") {
            item = { dataField: item };
        }

        if(typeof item === "object" && !item.itemType) {
            item.itemType = SIMPLE_ITEM_TYPE;
        }

        if(!isDefined(item.editorType) && isDefined(item.dataField)) {
            var value = this._getDataByField(item.dataField);

            item.editorType = isDefined(value) ? this._getEditorTypeByDataType(type(value)) : FORM_EDITOR_BY_DEFAULT;
        }

        return item;
    },

    _getEditorTypeByDataType: function(dataType) {
        switch(dataType) {
            case "number":
                return "dxNumberBox";
            case "date":
                return "dxDateBox";
            case "boolean":
                return "dxCheckBox";
            default:
                return "dxTextBox";
        }
    },

    _sortItems: function() {
        normalizeIndexes(this._items, "visibleIndex");
        this._sortIndexes();
    },

    _sortIndexes: function() {
        this._items.sort(function(itemA, itemB) {
            var indexA = itemA.visibleIndex,
                indexB = itemB.visibleIndex,
                result;

            if(indexA > indexB) {
                result = 1;
            } else if(indexA < indexB) {
                result = -1;
            } else {
                result = 0;
            }

            return result;
        });
    },

    _initMarkup: function() {
        this._itemsRunTimeInfo.clear();
        this.$element().addClass("dx-layout-manager");

        this.callBase();
        this._renderResponsiveBox();
    },

    _hasBrowserFlex: function() {
        return styleUtils.styleProp(LAYOUT_STRATEGY_FLEX) === LAYOUT_STRATEGY_FLEX;
    },

    _renderResponsiveBox: function() {
        var that = this,
            templatesInfo = [];

        if(that._items && that._items.length) {
            var colCount = that._getColCount(),
                $container = $("<div>").appendTo(that.$element()),
                layoutItems;

            that._prepareItemsWithMerging(colCount);

            layoutItems = that._generateLayoutItems();
            that._extendItemsWithDefaultTemplateOptions(layoutItems, that._items);

            that._responsiveBox = that._createComponent($container, ResponsiveBox, that._getResponsiveBoxConfig(layoutItems, colCount, templatesInfo));
            if(!windowUtils.hasWindow()) {
                that._renderTemplates(templatesInfo);
            }
        }
    },

    _extendItemsWithDefaultTemplateOptions: function(targetItems, sourceItems) {
        sourceItems.forEach(function(item) {
            if(!item.merged) {
                if(isDefined(item.disabled)) {
                    targetItems[item.visibleIndex].disabled = item.disabled;
                }
                if(isDefined(item.visible)) {
                    targetItems[item.visibleIndex].visible = item.visible;
                }
            }
        });
    },

    _itemStateChangedHandler: function() {
        this._refresh();
    },

    _renderItem: function($container, item) {
        switch(item.itemType) {
            case "empty": {
                const emptyItem = new EmptyItem();
                emptyItem.render($container);
                break;
            }
            case "button": {
                const buttonItem = new ButtonItem({
                    validationGroup: this.option("validationGroup"),
                    createComponent: this._createComponent.bind(this),
                    cssItemClass: this.option("cssItemClass")
                });
                buttonItem.render(item, $container);
                this._itemsRunTimeInfo.add({
                    item,
                    widgetInstance: buttonItem.getWidgetInstance(),
                    guid: item.guid,
                    $itemContainer: $container
                });
                break;
            }
            default: {
                const simpleItem = new SimpleItem({
                    showRequiredMark: this.option("showRequiredMark"),
                    showOptionalMark: this.option("showOptionalMark"),
                    requiredMark: this.option("requiredMark"),
                    optionalMark: this.option("optionalMark"),
                    value: this._getDataByField(item.dataField),
                    template: this._getTemplateByFieldItem(item),
                    cssItemClass: this.option("cssItemClass"),
                    requiredMessage: this.option("requiredMessage"),
                    showColonAfterLabel: this.option("showColonAfterLabel"),
                    labelLocation: this.option("labelLocation"),
                    stylingMode: this._getComponentOwner().option("stylingMode"),
                    validationBoundary: this.option("validationBoundary"),
                    validationGroup: this.option("validationGroup"),
                    hasBrowserFlex: this._hasBrowserFlex(),
                    createComponent: this._createComponent.bind(this),
                    formInstance: this._getComponentOwner()
                });
                simpleItem.render(item, $container);
                const instance = simpleItem.getWidgetInstance();
                this._itemsRunTimeInfo.add({
                    item,
                    widgetInstance: instance,
                    guid: item.guid,
                    $itemContainer: $container
                });
                if(instance && item.dataField) {
                    this._bindDataField(instance, item, $container);
                }
            }
        }
    },

    _renderTemplates: function(templatesInfo) {
        var that = this;
        each(templatesInfo, function(index, info) {
            that._renderItem(info.container, info.formItem);
        });
    },

    _getResponsiveBoxConfig: function(layoutItems, colCount, templatesInfo) {
        var that = this,
            colCountByScreen = that.option("colCountByScreen"),
            xsColCount = colCountByScreen && colCountByScreen.xs;

        return {
            onItemStateChanged: this._itemStateChangedHandler.bind(this),
            _layoutStrategy: that._hasBrowserFlex() ? LAYOUT_STRATEGY_FLEX : LAYOUT_STRATEGY_FALLBACK,
            onLayoutChanged: function() {
                var onLayoutChanged = that.option("onLayoutChanged"),
                    isSingleColumnMode = that.isSingleColumnMode();

                if(onLayoutChanged) {
                    that.$element().toggleClass("dx-layout-manager-one-col", isSingleColumnMode);
                    onLayoutChanged(isSingleColumnMode);
                }
            },
            onContentReady: function(e) {
                if(windowUtils.hasWindow()) {
                    that._renderTemplates(templatesInfo);
                }
                if(that.option("onLayoutChanged")) {
                    that.$element().toggleClass("dx-layout-manager-one-col", that.isSingleColumnMode(e.component));
                }
            },
            itemTemplate: function(e, itemData, itemElement) {
                if(!e.location) {
                    return;
                }
                var $itemElement = $(itemElement),
                    itemRenderedCountInPreviousRows = e.location.row * colCount,
                    item = that._items[e.location.col + itemRenderedCountInPreviousRows],
                    $fieldItem = $("<div>")
                        .addClass(item.cssClass)
                        .appendTo($itemElement);

                templatesInfo.push({
                    container: $fieldItem,
                    formItem: item
                });

                $itemElement.toggleClass(SINGLE_COLUMN_ITEM_CONTENT, that.isSingleColumnMode(this));

                if(e.location.row === 0) {
                    $fieldItem.addClass(LAYOUT_MANAGER_FIRST_ROW_CLASS);
                }
                if(e.location.col === 0) {
                    $fieldItem.addClass(LAYOUT_MANAGER_FIRST_COL_CLASS);
                }
                if((e.location.col === colCount - 1) || (e.location.col + e.location.colspan === colCount)) {
                    $fieldItem.addClass(LAYOUT_MANAGER_LAST_COL_CLASS);
                }
            },
            cols: that._generateRatio(colCount),
            rows: that._generateRatio(that._getRowsCount(), true),
            dataSource: layoutItems,
            screenByWidth: that.option("screenByWidth"),
            singleColumnScreen: xsColCount ? false : "xs"
        };
    },

    _getColCount: function() {
        var colCount = this.option("colCount"),
            colCountByScreen = this.option("colCountByScreen");

        if(colCountByScreen) {
            var screenFactor = this.option("form").getTargetScreenFactor();
            if(!screenFactor) {
                screenFactor = windowUtils.hasWindow() ? windowUtils.getCurrentScreenFactor(this.option("screenByWidth")) : "lg";
            }
            colCount = colCountByScreen[screenFactor] || colCount;
        }

        if(colCount === "auto") {
            if(this._cashedColCount) {
                return this._cashedColCount;
            }

            this._cashedColCount = colCount = this._getMaxColCount();
        }

        return colCount < 1 ? 1 : colCount;
    },

    _getMaxColCount: function() {
        if(!windowUtils.hasWindow()) {
            return 1;
        }

        var minColWidth = this.option("minColWidth"),
            width = this.$element().width(),
            itemsCount = this._items.length,
            maxColCount = Math.floor(width / minColWidth) || 1;

        return itemsCount < maxColCount ? itemsCount : maxColCount;
    },

    isCachedColCountObsolete: function() {
        return this._cashedColCount && this._getMaxColCount() !== this._cashedColCount;
    },

    _prepareItemsWithMerging: function(colCount) {
        var items = this._items.slice(0),
            item,
            itemsMergedByCol,
            result = [],
            j,
            i;

        for(i = 0; i < items.length; i++) {
            item = items[i];
            result.push(item);

            if(this.option("alignItemLabels") || item.alignItemLabels || item.colSpan) {
                item.col = this._getColByIndex(result.length - 1, colCount);
            }
            if(item.colSpan > 1 && (item.col + item.colSpan <= colCount)) {
                itemsMergedByCol = [];
                for(j = 0; j < item.colSpan - 1; j++) {
                    itemsMergedByCol.push({ merged: true });
                }
                result = result.concat(itemsMergedByCol);
            } else {
                delete item.colSpan;
            }
        }
        this._items = result;
    },

    _getColByIndex: function(index, colCount) {
        return index % colCount;
    },

    _generateLayoutItems: function() {
        var items = this._items,
            colCount = this._getColCount(),
            result = [],
            item,
            i;

        for(i = 0; i < items.length; i++) {
            item = items[i];

            if(!item.merged) {
                var generatedItem = {
                    location: {
                        row: parseInt(i / colCount),
                        col: this._getColByIndex(i, colCount)
                    }
                };
                if(isDefined(item.colSpan)) {
                    generatedItem.location.colspan = item.colSpan;
                }
                if(isDefined(item.rowSpan)) {
                    generatedItem.location.rowspan = item.rowSpan;
                }
                result.push(generatedItem);
            }
        }

        return result;
    },

    _getComponentOwner: function() {
        return this.option("form") || this;
    },

    _bindDataField: function(editorInstance, renderOptions, $container) {
        var componentOwner = this._getComponentOwner();

        editorInstance.on("enterKey", function(args) {
            componentOwner._createActionByOption("onEditorEnterKey")(extend(args, { dataField: renderOptions.dataField }));
        });

        this._createWatcher(editorInstance, $container, renderOptions);
        this.linkEditorToDataField(editorInstance, renderOptions.dataField, renderOptions.editorType);
    },

    _createWatcher: function(editorInstance, $container, renderOptions) {
        var that = this,
            watch = that._getWatch();

        if(!isFunction(watch)) {
            return;
        }

        var dispose = watch(
            function() {
                return that._getDataByField(renderOptions.dataField);
            },
            function() {
                editorInstance.option("value", that._getDataByField(renderOptions.dataField));
            },
            {
                deep: true,
                skipImmediate: true
            }
        );

        eventsEngine.on($container, removeEvent, dispose);
    },

    _getWatch: function() {
        if(!isDefined(this._watch)) {
            var formInstance = this.option("form");

            this._watch = formInstance && formInstance.option("integrationOptions.watchMethod");
        }

        return this._watch;
    },

    _createComponent: function($editor, type, editorOptions) {
        var that = this,
            readOnlyState = this.option("readOnly"),
            instance;

        instance = that.callBase($editor, type, editorOptions);

        readOnlyState && instance.option("readOnly", readOnlyState);

        that.on("optionChanged", function(args) {
            if(args.name === "readOnly" && !isDefined(editorOptions.readOnly)) {
                instance.option(args.name, args.value);
            }
        });

        return instance;
    },

    _getTemplateByFieldItem: function(fieldItem) {
        return fieldItem.template ? this._getTemplate(fieldItem.template) : null;
    },

    _generateRatio: function(count, isAutoSize) {
        var result = [],
            ratio,
            i;

        for(i = 0; i < count; i++) {
            ratio = { ratio: 1 };
            if(isAutoSize) {
                ratio.baseSize = "auto";
            }
            result.push(ratio);
        }

        return result;
    },

    _getRowsCount: function() {
        return Math.ceil(this._items.length / this._getColCount());
    },

    _updateReferencedOptions: function(newLayoutData) {
        var layoutData = this.option("layoutData");

        if(isObject(layoutData)) {
            Object.getOwnPropertyNames(layoutData)
                .forEach(property => delete this._optionsByReference['layoutData.' + property]);
        }

        if(isObject(newLayoutData)) {
            Object.getOwnPropertyNames(newLayoutData)
                .forEach(property => this._optionsByReference['layoutData.' + property] = true);
        }
    },

    _resetWidget(instance) {
        const defaultOptions = instance._getDefaultOptions();
        instance._setOptionSilent("value", defaultOptions.value);
        instance.option("isValid", true);
    },

    _optionChanged(args) {
        if(args.fullName.search("layoutData.") === 0) {
            return;
        }

        switch(args.name) {
            case "showRequiredMark":
            case "showOptionalMark":
            case "requiredMark":
            case "optionalMark":
                this._cashedRequiredConfig = null;
                this._invalidate();
                break;
            case "layoutData":
                this._updateReferencedOptions(args.value);

                if(this.option("items")) {
                    if(!isEmptyObject(args.value)) {
                        this._itemsRunTimeInfo.each((_, itemRunTimeInfo) => {
                            if(isDefined(itemRunTimeInfo.item)) {
                                const dataField = itemRunTimeInfo.item.dataField;

                                if(dataField && isDefined(itemRunTimeInfo.widgetInstance)) {
                                    const valueGetter = dataUtils.compileGetter(dataField);
                                    const dataValue = valueGetter(args.value);

                                    if(dataValue === undefined) {
                                        this._resetWidget(itemRunTimeInfo.widgetInstance);
                                    } else {
                                        itemRunTimeInfo.widgetInstance.option("value", dataValue);
                                    }
                                }
                            }
                        });
                    }
                } else {
                    this._initDataAndItems(args.value);
                    this._invalidate();
                }
                break;
            case "items":
                this._cleanItemWatchers();
                this._initDataAndItems(args.value);
                this._invalidate();
                break;
            case "alignItemLabels":
            case "labelLocation":
            case "requiredMessage":
                this._invalidate();
                break;
            case "customizeItem":
                this._updateItems(this.option("layoutData"));
                this._invalidate();
                break;
            case "colCount":
                this._resetColCount();
                break;
            case "minColWidth":
                if(this.option("colCount") === "auto") {
                    this._resetColCount();
                }
                break;
            case "readOnly":
                break;
            case "width":
                this.callBase(args);

                if(this.option("colCount") === "auto") {
                    this._resetColCount();
                }
                break;
            case "onFieldDataChanged":
                break;
            default:
                this.callBase(args);
        }
    },

    _resetColCount: function() {
        this._cashedColCount = null;
        this._invalidate();
    },

    linkEditorToDataField(editorInstance, dataField) {
        this.on("optionChanged", args => {
            if(args.fullName === `layoutData.${dataField}`) {
                editorInstance._setOptionSilent("value", args.value);
            }
        });
        editorInstance.on("valueChanged", args => {
            if(!(isObject(args.value) && args.value === args.previousValue)) {
                this._updateFieldValue(dataField, args.value);
            }
        });
    },

    _dimensionChanged: function() {
        if(this.option("colCount") === "auto" && this.isCachedColCountObsolete()) {
            this._eventsStrategy.fireEvent("autoColCountChanged");
        }
    },

    updateData: function(data, value) {
        var that = this;

        if(isObject(data)) {
            each(data, function(dataField, fieldValue) {
                that._updateFieldValue(dataField, fieldValue);
            });
        } else if(typeof data === "string") {
            that._updateFieldValue(data, value);
        }
    },

    getEditor: function(field) {
        return this._itemsRunTimeInfo.findWidgetInstanceByDataField(field) || this._itemsRunTimeInfo.findWidgetInstanceByName(field);
    },

    isSingleColumnMode: function(component) {
        var responsiveBox = this._responsiveBox || component;
        if(responsiveBox) {
            return responsiveBox.option("currentScreenFactor") === responsiveBox.option("singleColumnScreen");
        }
    },

    getItemsRunTimeInfo: function() {
        return this._itemsRunTimeInfo;
    }
});

registerComponent("dxLayoutManager", LayoutManager);

module.exports = LayoutManager;
