"use strict";

var Class = require("../../core/class"),
    inArray = require("../../core/utils/array").inArray,
    xmlUtils = require("./xml_utils"),

    CUSTOM_FORMAT_START_INDEX = 165;


exports.StylesCollection = Class.inherit({
    _formats: [],
    _borders: [],
    _fills: [],
    _fonts: [],

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
        }], innerXml.join());
    },

    addFormat: function(format) {
        if(format) {
            if(inArray(format, this._formats) === -1) {
                this._formats.push(format);
            }

            return inArray(format, this._formats) + 1;
        }
    },

    getXML: function() {
        return xmlUtils.XML_TAG + this._getStyleSheet();
    }
});
