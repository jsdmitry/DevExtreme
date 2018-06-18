"use strict";

var stylesBuilder = require("client_exporter/excel/styles_builder"),
    exportMocks = require("../../helpers/exportMocks.js");

QUnit.module("Formatting", {
    beforeEach: function() {
        this._stylesBuilder = new stylesBuilder.StylesBuilder();
    },
    afterEach: function() {
        this._stylesBuilder.dispose();
    }
}, function() {
    QUnit.test("Append unique format", function(assert) {
        // act
        this._stylesBuilder.addStyle({
            format: {
                format: "currency"
            }
        });

        this._stylesBuilder.addStyle({
            format: {
                format: "currency"
            }
        });

        this._stylesBuilder.addStyle({
            format: {
                format: "longDate"
            }
        });

        // assert
        assert.ok(exportMocks.checkUniqueValue(this._stylesBuilder._formats));
    });
});
