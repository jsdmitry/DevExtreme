"use strict";

var Class = require("../../core/class"),
    typeUtils = require("../../core/utils/type"),
    inArray = require("../../core/utils/array").inArray,
    xmlUtils = require("./xml_utils"),

    excelFormatConverter = require("./excel_format_converter"),

    CUSTOM_FORMAT_START_INDEX = 165;


exports.StylesBuilder = Class.inherit({
    _getFonts: function() {
        return "<fonts count=\"2\"><font><sz val=\"11\"/><color theme=\"1\"/><name val=\"Calibri\"/><family val=\"2\"/>" +
        "<scheme val=\"minor\"/></font><font><b/><sz val=\"11\"/><color theme=\"1\"/><name val=\"Calibri\"/>" +
        "<family val=\"2\"/><scheme val=\"minor\"/></font></fonts>";
    },

    _getFills: function() {
        return "<fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>";
    },

    _getBorders: function() {
        return "<borders count=\"1\"><border><left style=\"thin\"><color rgb=\"FFD3D3D3\"/></left><right style=\"thin\">" +
        "<color rgb=\"FFD3D3D3\"/></right><top style=\"thin\"><color rgb=\"FFD3D3D3\"/></top><bottom style=\"thin\"><color rgb=\"FFD3D3D3\"/>" +
        "</bottom></border></borders>";
    },

    _getNumFMTS: function() {
        for(var formatIndex = 0; formatIndex < this._formats.length; formatIndex++) {
            this._formats[formatIndex] = xmlUtils.getXMLTag("numFmt", [
                { name: "numFmtId", value: Number(formatIndex) + CUSTOM_FORMAT_START_INDEX },
                { name: "formatCode", value: this._formats[formatIndex] }
            ]);
        }

        return xmlUtils.getXMLTag("numFmts", [{
            name: "count",
            value: this._formats.length
        }], this._formats.join(""));
    },

    _getCellStyleXFS: function() {
        return "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>";
    },

    _getCellXFS: function() {
        var xmlStyles = [];

        this._styles.forEach(function(style) {
            xmlStyles.push(xmlUtils.getXMLTag("xf", [
                { name: "xfId", value: 0 },
                { name: "applyAlignment", value: 1 },
                { name: "fontId", value: Number(!!style.bold) },
                { name: "applyNumberFormat", value: (typeUtils.isDefined(style.formatID)) ? 1 : 0 },
                {
                    name: "numFmtId",
                    value: typeUtils.isDefined(style.formatID) ? Number(style.formatID) + CUSTOM_FORMAT_START_INDEX - 1 : 0
                }
            ], xmlUtils.getXMLTag("alignment", [
                { name: "vertical", value: "top" },
                { name: "wrapText", value: Number(!!style.wrapText) },
                { name: "horizontal", value: style.alignment }
            ])));
        });

        return xmlUtils.getXMLTag("cellXfs", [{ name: "count", value: xmlStyles.length }], xmlStyles.join(""));
    },

    _getCellStyles: function() {
        var innerXML = xmlUtils.getXMLTag("cellStyle", [
            { name: "name", value: "Normal" },
            { name: "xfId", value: 0 },
            { name: "builtinId", value: 0 }
        ]);

        return xmlUtils.getXMLTag("cellStyles", [{
            name: "count", value: 1
        }], innerXML);
    },

    _getStyleSheet: function() {
        var innerXml = [];
        innerXml.push(this._getNumFMTS());
        innerXml.push(this._getFonts());
        innerXml.push(this._getFills());
        innerXml.push(this._getBorders());
        innerXml.push(this._getCellStyleXFS());
        innerXml.push(this._getCellXFS());
        innerXml.push(this._getCellStyles());

        return xmlUtils.getXMLTag("styleSheet", [{
            name: "xmlns",
            value: xmlUtils.OPEN_XML_FORMAT_URL + "/spreadsheetml/2006/main"
        }], innerXml.join(""));
    },

    _addFormat: function(options) {
        var excelFormat = excelFormatConverter.convertFormat(options.format, options.precision, options.dataType, options.currency);
        if(excelFormat) {
            if(inArray(excelFormat, this._formats) === -1) {
                this._formats.push(excelFormat);
            }

            return inArray(excelFormat, this._formats) + 1;
        }
    },

    _init: function() {
        this._formats = [];
        this._styles = [];
    },

    ctor: function() {
        this._init();
    },

    addStyle: function(style) {
        this._styles.push({
            bold: style.bold,
            alignment: style.alignment,
            formatID: this._addFormat(style.format),
            wrapText: style.wrapText
        });
    },

    getFormatByStyleID: function(styleID) {
        var formatID = this._styles[styleID].formatID;
        return typeUtils.isNumeric(formatID) ? this._formats[formatID - 1] : null;
    },

    getXML: function() {
        return xmlUtils.XML_TAG + this._getStyleSheet();
    },

    dispose: function() {
        this._formats = [];
        this._styles = [];
    }
});
