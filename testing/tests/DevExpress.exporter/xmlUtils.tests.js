"use strict";

var xmlUtils = require("client_exporter/excel/xml_utils");

QUnit.module("XmlUtils", function() {
    QUnit.test("Check XML tag generating with content", function(assert) {
        // arrange
        var expected = "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"><test>content</test></Relationship>",
            attributes = [
                { name: "Id", value: "rId1" },
                {
                    name: "Type",
                    value: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
                },
                { name: "Target", value: "xl/workbook.xml" }
            ];

        // act, assert
        assert.strictEqual(xmlUtils.getXMLTag("Relationship", attributes, "<test>content</test>"), expected);
    });

    QUnit.test("Check XML tag generating without content", function(assert) {
        // arrange
        var expected = "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\" />",
            attributes = [
                { name: "Id", value: "rId1" },
                {
                    name: "Type",
                    value: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
                },
                { name: "Target", value: "xl/workbook.xml" }
            ];

        // act, assert
        assert.strictEqual(xmlUtils.getXMLTag("Relationship", attributes), expected);
    });
});

