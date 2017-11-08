"use strict";

var Class = require("../../core/class"),
    xmlUtils = require("./xml_utils"),
    stringUtils = require("../../core/utils/string"),
    typeUtils = require("../../core/utils/type"),

    ROWS_COUNT_PERFORMANCE_LIMIT = 10000,
    //START_CELL_INDEX = "A1",

    GROUP_SHEET_PR_XML = "<sheetPr><outlinePr summaryBelow=\"0\"/></sheetPr>",
    SINGLE_SHEET_PR_XML = "<sheetPr/>";

exports.SheetBuilder = Class.inherit({
    _getCellIndex: function(rowIndex, cellIndex) {
        var sheetIndex = '',
            max = 26,
            charCode;

        if(this._maxIndex[0] < Number(rowIndex)) {
            this._maxIndex[0] = Number(rowIndex);
        }

        if(this._maxIndex[1] < Number(cellIndex)) {
            this._maxIndex[1] = Number(cellIndex);
        }

        while(true) {
            charCode = 65 + ((cellIndex >= max) ? (cellIndex % max) : Math.ceil(cellIndex));
            sheetIndex = String.fromCharCode(charCode) + sheetIndex;

            if(cellIndex >= max) {
                cellIndex = Math.floor(cellIndex / max) - 1;
            } else {
                break;
            }
        }

        return sheetIndex + rowIndex;
    },

    _createSheetPrElement: function(isGroupedData) {
        return isGroupedData ? GROUP_SHEET_PR_XML : SINGLE_SHEET_PR_XML;
    },

    _createDimensionElement: function(startCellIndex, endCellIndex) {
        return xmlUtils.getXMLTag("dimension", [{
            name: "ref",
            value: stringUtils.format("{0}:{1}", startCellIndex, endCellIndex)
        }]);
    },

    _createPaneElement: function(frozenArea) {
        var attributes = [{ name: "activePane", value: "bottomLeft" }, { name: "state", value: "frozen" }];

        if(!(frozenArea.x || frozenArea.y)) return "";

        if(frozenArea.x) {
            attributes.push({ name: "xSplit", value: frozenArea.x });
        }
        if(frozenArea.y) {
            attributes.push({ name: "ySplit", value: frozenArea.y });
        }

        attributes.push({ name: "topLeftCell", value: this._getCellIndex(frozenArea.y + 1, frozenArea.x) });

        return xmlUtils.getXMLTag("pane", attributes);
    },

    _createSheetViewElement: function(innerXml, isRTL) {
        var attributes = [
            { name: "tabSelected", value: 1 },
            { name: "workbookViewId", value: 0 }
        ];

        if(isRTL) {
            attributes.unshift({ name: "rightToLeft", value: 1 });
        }
        return xmlUtils.getXMLTag("sheetViews", attributes, innerXml);
    },

    _createSheetViewsElement: function(frozenArea, isRTL) {
        var paneElement = this._createPaneElement(frozenArea),
            innerXml = this._createSheetViewElement(paneElement, isRTL);

        return xmlUtils.getXMLTag("sheetViews", [], innerXml);
    },

    _createSheetFormatPrElement: function(groupLevel) {
        return xmlUtils.getXMLTag("sheetFormatPr", [
            { name: "defaultRowHeight", value: "15" },
            { name: "outlineLevelRow", value: groupLevel },
            { name: "x14ac:dyDescent", value: 0.25 }]);
    },

    _createColElement: function(width, colIndex) {
        return xmlUtils.getXMLTag("col", [
            { name: "width", value: width },
            { name: "min", value: colIndex + 1 },
            { name: "max", value: colIndex + 1 }
        ]);
    },

    _createColsElement: function(widths) {
        return xmlUtils.getXMLTag("cols", [], widths.map(this._createColElement).join(""));
    },

    _createCellElement: function(value, cellIndex, styleIndex, type) {
        var valueElement = typeUtils.isDefined(value) ? xmlUtils.getXMLTag("v", [], value) : null;

        return xmlUtils.getXMLTag("c", [
            { name: "r", value: cellIndex },
            { name: "s", value: styleIndex },
            { name: "t", value: type }
        ], valueElement);
    },

    _createRowElement: function(rowIndex, spans, groupLevel, cellElements) {
        return xmlUtils.getXMLTag("row", [
            { name: "r", value: rowIndex + 1 },
            { name: "spans", value: spans },
            { name: "outlineLevel", value: groupLevel },
            { name: "x14ac:dyDescent", value: "0.25" }
        ], cellElements);
    },

    _generateCellElements: function(cells) {
        var cellsLength = cells.length,
            result = [],
            i,
            cell;

        for(i = 0; i < cellsLength; i++) {
            cell = cells[i];
            result.push(this._createCellElement(cell.value, cell.cellIndex, cell.styleIndex, cell.type));
        }
        return result.join("");
    },

    _createSheetDataElement: function(rows, colsLength, getGroupLevel) {
        var rowElements = [],
            spans = "1:" + colsLength,
            i,
            counter = 0,
            rowsLength = rows.length,
            rowElement,
            cellElements,
            cells,
            result = [];

        for(i = 0; i < rowsLength; i++) {
            cells = rows[i];
            cellElements = this._generateCellElements(cells);
            rowElement = this._createRowElement(i, spans, getGroupLevel(i), cellElements);
            rowElements.push(rowElement);

            if(counter++ > ROWS_COUNT_PERFORMANCE_LIMIT) {
                result.push(rowElements.join(""));
                rowElements = [];
                counter = 0;
            }
        }
        return xmlUtils.getXMLTag("sheetData", [], result.join(""));
    },

    _createIgnoreErrorsElement: function(startCellIndex, maxCellIndex) {
        var ignoreErrorElement = xmlUtils.getXMLTag("ignoredError", [
            { name: "sqref", value: stringUtils.format("{0}:{1}", startCellIndex, maxCellIndex) },
            { name: "numberStoredAsText", value: 1 }
        ]);

        return xmlUtils.getXMLTag("ignoredErrors", [], ignoreErrorElement);
    },

    _createAutoFilterElement: function(startCellIndex, endCellIndex) {
        return xmlUtils.getXMLTag("autoFilter", [{
            name: "ref",
            value: stringUtils.format("{0}:{1}", startCellIndex, endCellIndex)
        }]);
    },

    _createPageMarginsElement: function() {
    },

    ctor: function() {
        this._maxIndex = [1, 2];
    },

    dispose: function() {
        this._maxIndex = null;
    }
});
