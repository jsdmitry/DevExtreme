"use strict";

var typeUtils = require("../../core/utils/type"),
    XML_TAG = "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
    OPEN_XML_FORMAT_URL = "http://schemas.openxmlformats.org";

var getXMLTag = function(tagName, attributes, content) {
    var result = "<" + tagName,
        i,
        length = attributes.length,
        attr;

    for(i = 0; i < length; i++) {
        attr = attributes[i];
        result = result + " " + attr.name + "=\"" + attr.value + "\"";
    }

    return typeUtils.isDefined(content) ? result + ">" + content + "</" + tagName + ">" : result + " />";
};

exports.XML_TAG = XML_TAG;
exports.OPEN_XML_FORMAT_URL = OPEN_XML_FORMAT_URL;
exports.getXMLTag = getXMLTag;
