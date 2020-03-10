import $ from '../../core/renderer';
import { extend } from '../../core/utils/extend';
import { BindableTemplate } from '../../core/templates/bindable_template';

import CollectionWidget from '../collection/ui.collection_widget.edit';

const FILE_MANAGER_THUMBNAILS_VIEW_PORT_CLASS = 'dx-filemanager-thumbnails-view-port';
const FILE_MANAGER_THUMBNAILS_ITEM_LIST_CONTAINER_CLASS = 'dx-filemanager-thumbnails-container';
const FILE_MANAGER_THUMBNAILS_ITEM_CLASS = 'dx-filemanager-thumbnails-item';
const FILE_MANAGER_THUMBNAILS_ITEM_NAME_CLASS = 'dx-filemanager-thumbnails-item-name';
const FILE_MANAGER_THUMBNAILS_ITEM_SPACER_CLASS = 'dx-filemanager-thumbnails-item-spacer';

const FILE_MANAGER_THUMBNAILS_ITEM_DATA_KEY = 'dxFileManagerItemData';

class FileManagerThumbnailListBox extends CollectionWidget {
    _initMarkup() {
        super._initMarkup();
        this._initActions();

        this.$element().addClass(FILE_MANAGER_THUMBNAILS_VIEW_PORT_CLASS);
        this._renderItemsContainer();

        this._layoutUtils = new ListBoxLayoutUtils(this.$element(), this._$itemContainer, this.itemElements().first());
    }

    _initActions() {
        this._onItemEnterKeyPressed = this._createActionByOption('onItemEnterKeyPressed');
    }

    _initTemplates() {
        super._initTemplates();
        this._itemThumbnailTemplate = this.option('itemThumbnailTemplate');
        this._getTooltipText = this.option('getTooltipText');
        this._templateManager.addDefaultTemplates({
            item: new BindableTemplate(function($container, data, itemModel) {
                const $itemElement = this._getDefaultItemTemplate(itemModel, $container);
                $container.append($itemElement);
            }.bind(this), ['fileItem'], this.option('integrationOptions.watchMethod'))
        });
    }

    _renderItemsContainer() {
        if(!this._$itemContainer) {
            this._$itemContainer = $('<div>')
                .addClass(FILE_MANAGER_THUMBNAILS_ITEM_LIST_CONTAINER_CLASS)
                .appendTo(this.$element());
        }
    }

    _supportedKeys() {
        return extend(super._supportedKeys(), {
            upArrow(e) {
                this._beforeKeyProcessing(e);
                this._processArrowKeys(-1, false, e);
            },
            downArrow(e) {
                this._beforeKeyProcessing(e);
                this._processArrowKeys(1, false, e);
            },
            home(e) {
                this._beforeKeyProcessing(e);
                this._processHomeEndKeys(0, true, e);
            },
            end(e) {
                this._beforeKeyProcessing(e);
                this._processHomeEndKeys(this._getItemsLength() - 1, true, e);
            },
            pageUp(e) {
                this._beforeKeyProcessing(e);
                this._processPageChange(true, e);
            },
            pageDown(e) {
                this._beforeKeyProcessing(e);
                this._processPageChange(false, e);
            },
            enter(e) {
                this._beforeKeyProcessing(e);
                this._onItemEnterKeyPressed(this._getFocusedItem());
            },
            A(e) {
                this._beforeKeyProcessing(e);
                if(e.ctrlKey || e.metaKey) {
                    this.selectAll();
                }
            }
        });
    }

    _beforeKeyProcessing(e) {
        e.preventDefault();
        this._layoutUtils.reset();
    }

    _processArrowKeys(offset, horizontal, eventArgs) {
        const item = this._getFocusedItem();
        if(item) {
            if(!horizontal) {
                const layout = this._layoutUtils.getLayoutModel();
                if(!layout) {
                    return;
                }

                offset *= layout.itemPerRowCount;
            }

            const newItemIndex = this._getIndexByItem(item) + offset;
            this._focusItemByIndex(newItemIndex, true, eventArgs);
        }
    }

    _processHomeEndKeys(index, scrollToItem, eventArgs) {
        this._focusItemByIndex(index, scrollToItem, eventArgs);
    }

    _processPageChange(pageUp, eventArgs) {
        const item = this._getFocusedItem();
        if(!item) {
            return;
        }

        const layout = this._layoutUtils.getLayoutModel();
        if(!layout) {
            return;
        }

        const itemLayout = this._layoutUtils.createItemLayoutModel(this._getIndexByItem(item));

        const rowOffset = pageUp ? layout.rowPerPageRate : -layout.rowPerPageRate;
        const newRowRate = itemLayout.itemRowIndex - rowOffset;
        const roundFunc = pageUp ? Math.ceil : Math.floor;
        const newRowIndex = roundFunc(newRowRate);
        let newItemIndex = newRowIndex * layout.itemPerRowCount + itemLayout.itemColumnIndex;
        if(newItemIndex < 0) {
            newItemIndex = 0;
        } else if(newItemIndex >= this._getItemsLength()) {
            newItemIndex = this._getItemsLength() - 1;
        }

        this._focusItemByIndex(newItemIndex, true, eventArgs);
    }

    _itemContainer() {
        return this._$itemContainer;
    }

    _itemClass() {
        return FILE_MANAGER_THUMBNAILS_ITEM_CLASS;
    }

    _itemDataKey() {
        return FILE_MANAGER_THUMBNAILS_ITEM_DATA_KEY;
    }

    _getDefaultItemTemplate(fileItemInfo, $itemElement) {
        $itemElement.attr('title', this._getTooltipText(fileItemInfo));

        const $itemThumbnail = this._itemThumbnailTemplate(fileItemInfo);

        const $itemSpacer = $('<div>').addClass(FILE_MANAGER_THUMBNAILS_ITEM_SPACER_CLASS);

        const $itemName = $('<div>')
            .addClass(FILE_MANAGER_THUMBNAILS_ITEM_NAME_CLASS)
            .text(fileItemInfo.fileItem.name);

        $itemElement.append($itemThumbnail, $itemSpacer, $itemName);
    }

    _itemSelectHandler(e) {
        let options = {};
        if(this.option('selectionMode') === 'multiple') {
            if(!this._isPreserveSelectionMode) {
                this._isPreserveSelectionMode = e.ctrlKey || e.metaKey || e.shiftKey;
            }
            options = {
                control: this._isPreserveSelectionMode,
                shift: e.shiftKey
            };
        }
        const index = this._getIndexByItemElement(e.currentTarget);
        this._selection.changeItemSelection(index, options);
    }

    _updateSelection(addedSelection, removedSelection) {
        for(let i = 0; i < removedSelection.length; i++) {
            this._removeSelection(removedSelection[i]);
        }
        for(let i = 0; i < addedSelection.length; i++) {
            this._addSelection(addedSelection[i]);
        }
        const selectedItemsCount = this.getSelectedItems().length;
        if(selectedItemsCount === 0) {
            this._isPreserveSelectionMode = false;
        }
    }

    _focusOutHandler() {}

    _getItems() {
        return this.option('items') || [];
    }

    _getItemsLength() {
        return this._getItems().length;
    }

    _getIndexByItemElement(itemElement) {
        return this._editStrategy.getNormalizedIndex(itemElement);
    }

    _getItemByIndex(index) {
        return this._getItems()[index];
    }

    _getFocusedItem() {
        return this.getItemByItemElement(this.option('focusedElement'));
    }

    _focusItem(item, scrollToItem) {
        this.option('focusedElement', this.getItemElementByItem(item));
        if(scrollToItem) {
            this._layoutUtils.scrollToItem(this._getIndexByItem(item));
        }
    }

    _focusItemByIndex(index, scrollToItem, eventArgs) {
        if(index >= 0 && index < this._getItemsLength()) {
            const item = this._getItemByIndex(index);
            this._focusItem(item, scrollToItem, eventArgs);
        }
    }

    _changeItemSelection(item, select) {
        if(this.isItemSelected(item) === select) {
            return;
        }
        const itemElement = this.getItemElementByItem(item);
        const index = this._getIndexByItemElement(itemElement);
        this._selection.changeItemSelection(index, { control: this._isPreserveSelectionMode });
    }

    getSelectedItems() {
        return this._selection.getSelectedItems();
    }

    getItemElementByItem(item) {
        return this._findItemElementByItem(item);
    }

    getItemByItemElement(itemElement) {
        return this._getItemByIndex(this._getIndexByItemElement(itemElement));
    }

    selectAll() {
        this._selection.selectAll();
        this._isPreserveSelectionMode = true;
    }

    selectItem(item) {
        this._changeItemSelection(item, true);
    }

    deselectItem(item) {
        this._changeItemSelection(item, false);
    }

    clearSelection() {
        this._selection.deselectAll();
    }

    _optionChanged(args) {
        switch(args.name) {
            case 'items':
                if(this._layoutUtils) {
                    this._layoutUtils.updateItems(this.itemElements().first());
                }
                super._optionChanged(args);
                break;
            default:
                super._optionChanged(args);
        }
    }
}

class ListBoxLayoutUtils {
    constructor($viewPort, $itemContainer, $item) {
        this._layoutModel = null;
        this._$viewPort = $viewPort;
        this._$itemContainer = $itemContainer;
        this._$item = $item;
    }

    updateItems($item) {
        this._$item = $item;
    }

    reset() {
        this._layoutModel = null;
    }

    getLayoutModel() {
        if(!this._layoutModel) {
            this._layoutModel = this._createLayoutModel();
        }
        return this._layoutModel;
    }

    _createLayoutModel() {
        if(!this._$item) {
            return null;
        }

        const itemWidth = this._$item.outerWidth(true);
        if(itemWidth === 0) {
            return null;
        }

        const itemHeight = this._$item.outerHeight(true);

        const viewPortWidth = this._$itemContainer.innerWidth();
        const viewPortHeight = this._$viewPort.innerHeight();
        const viewPortScrollTop = this._$viewPort.scrollTop();
        const viewPortScrollBottom = viewPortScrollTop + viewPortHeight;

        const itemPerRowCount = Math.floor(viewPortWidth / itemWidth);
        const rowPerPageRate = viewPortHeight / itemHeight;

        return {
            itemWidth: itemWidth,
            itemHeight: itemHeight,
            viewPortWidth: viewPortWidth,
            viewPortHeight: viewPortHeight,
            viewPortScrollTop: viewPortScrollTop,
            viewPortScrollBottom: viewPortScrollBottom,
            itemPerRowCount: itemPerRowCount,
            rowPerPageRate: rowPerPageRate
        };
    }

    createItemLayoutModel(index) {
        const layout = this.getLayoutModel();
        if(!layout) {
            return null;
        }

        const itemRowIndex = Math.floor(index / layout.itemPerRowCount);
        const itemColumnIndex = index % layout.itemPerRowCount;
        const itemTop = itemRowIndex * layout.itemHeight;
        const itemBottom = itemTop + layout.itemHeight;

        return {
            itemRowIndex: itemRowIndex,
            itemColumnIndex: itemColumnIndex,
            itemTop: itemTop,
            itemBottom: itemBottom
        };
    }

    scrollToItem(index) {
        const layout = this.getLayoutModel();
        if(!layout) {
            return;
        }

        const itemRowIndex = Math.floor(index / layout.itemPerRowCount);
        const itemTop = itemRowIndex * layout.itemHeight;
        const itemBottom = itemTop + layout.itemHeight;

        let newScrollTop = layout.viewPortScrollTop;

        if(itemTop < layout.viewPortScrollTop) {
            newScrollTop = itemTop;
        } else if(itemBottom > layout.viewPortScrollBottom) {
            newScrollTop = itemBottom - layout.viewPortHeight;
        }

        this._$viewPort.scrollTop(newScrollTop);
    }
}

module.exports = FileManagerThumbnailListBox;