"use strict";

var sharedStringsBuilder = require("client_exporter/excel/shared_strings_builder"),
    exportMocks = require("../../helpers/exportMocks.js");

QUnit.module("Shared strings", {
    beforeEach: function() {
        this._sharedStringsBuilder = new sharedStringsBuilder.SharedStringsBuilder();
    },
    afterEach: function() {
        this._sharedStringsBuilder.dispose();
    }
}, function() {
    QUnit.test("Append unique string", function(assert) {
        // act
        var uniqueIndexes = [];
        uniqueIndexes[0] = this._sharedStringsBuilder.appendString("Test");
        uniqueIndexes[1] = this._sharedStringsBuilder.appendString("Test");
        uniqueIndexes[2] = this._sharedStringsBuilder.appendString("New Value");

        // assert
        assert.ok(exportMocks.checkUniqueValue(this._sharedStringsBuilder._sharedStrings));
        assert.equal(uniqueIndexes[0], 0, "unique index for thirst value");
        assert.equal(uniqueIndexes[1], 0, "unique index for second value");
        assert.equal(uniqueIndexes[2], 1, "unique index for third value");
    });

    QUnit.test("Symbols '<','>' are replaced with '&lt;', '&gt;' in sharedString array T273272", function(assert) {
        // act
        this._sharedStringsBuilder.appendString("aa>aa");
        this._sharedStringsBuilder.appendString("bb<bb");

        // assert
        assert.equal(this._sharedStringsBuilder._sharedStrings[0], "aa&gt;aa", "> replacing ok");
        assert.equal(this._sharedStringsBuilder._sharedStrings[1], "bb&lt;bb", "< replacing ok");
    });

    QUnit.test("Append not string value when type is string_T259295", function(assert) {
        // act
        this._sharedStringsBuilder.appendString(123.34);
        this._sharedStringsBuilder.appendString(new Date("10/9/2000"));
        this._sharedStringsBuilder.appendString(true);

        // assert
        assert.equal(this._sharedStringsBuilder._sharedStrings[0], "123.34", "number type");
        assert.ok(this._sharedStringsBuilder._sharedStrings[1].indexOf("Mon Oct") > -1, "date type");
        assert.equal(this._sharedStringsBuilder._sharedStrings[2], "true", "boolean type");
    });

    QUnit.test("EncodeHtml for sharedStrings", function(assert) {
        // act
        this._sharedStringsBuilder.appendString("<div cssClass=\"myCss\" data='dfsdf'><p>La & la & ba</p></div>");
        this._sharedStringsBuilder.appendString("<div cssClass=\"myCss\" data='dfsdf'><p>La & la & ba</p></div>");

        // assert
        assert.equal(this._sharedStringsBuilder._sharedStrings.length, 1, "stringArray length");
        assert.equal(this._sharedStringsBuilder._sharedStrings[0], "&lt;div cssClass=&quot;myCss&quot; data=&#39;dfsdf&#39;&gt;&lt;p&gt;La &amp; la &amp; ba&lt;/p&gt;&lt;/div&gt;");
    });
});
