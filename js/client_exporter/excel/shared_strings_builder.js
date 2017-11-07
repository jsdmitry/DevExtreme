"use strict";

var Class = require("../../core/class"),
    typeUtils = require("../../core/utils/type"),
    stringUtils = require("../../core/utils/string"),
    xmlUtils = require("./xml_utils");

exports.SharedStringsBuilder = Class.inherit({
    _createSIElement: function(value) {
        return xmlUtils.getXMLTag("si", [], xmlUtils.getXMLTag("t", [], value));
    },

    _createSSTElement: function(sharedStringsCount, innerXML) {
        return xmlUtils.getXMLTag("sst", [
            { name: "xmlns", value: xmlUtils.OPEN_XML_FORMAT_URL + "/spreadsheetml/2006/main" },
            { name: "count", value: sharedStringsCount },
            { name: "uniqueCount", value: sharedStringsCount }
        ], innerXML);
    },

    _generateSIElements: function(sharedStrings) {
        var stringsLength = sharedStrings.length,
            result = [],
            i;

        for(i = 0; i < stringsLength; i++) {
            result[i] = this._createSIElement(sharedStrings[i]);
        }

        return result;
    },

    ctor: function() {
        this._sharedStrings = [];
        this._sharedStringsHash = {};
    },

    dispose: function() {
        this._sharedStrings = null;
        this._sharedStringsHash = null;
    },

    appendString: function(value) {
        if(typeUtils.isDefined(value)) {
            value = String(value);
            if(value.length) {
                value = stringUtils.encodeHtml(value);
                if(this._sharedStringsHash[value] === undefined) {
                    this._sharedStringsHash[value] = this._sharedStrings.length;
                    this._sharedStrings.push(value);
                }
                return this._sharedStringsHash[value];
            }
        }
    },

    getXML: function() {
        var sharedStringElements = this._generateSIElements(this._sharedStrings);
        return xmlUtils.XML_TAG + this._createSSTElement(this._sharedStrings.length, sharedStringElements.join(""));
    }
});
