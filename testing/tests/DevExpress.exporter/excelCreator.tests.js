"use strict";

var $ = require("jquery"),
    excelCreator = require("client_exporter").excel,
    ExcelCreator = excelCreator.creator,
    internals = excelCreator.__internals,
    exportMocks = require("../../helpers/exportMocks.js");

QUnit.module("Excel creator", {
    beforeEach: function() {
        this.dataProvider = new exportMocks.MockDataProvider();
        this.excelCreator = new ExcelCreator(this.dataProvider, {});
    },
    afterEach: function() {
        this.excelCreator.dispose();
    }
});

QUnit.test("Get excel date value", function(assert) {
    // act, assert
    var that = this,
        getExcelDateValue = function(strDate) {
            return String(that.excelCreator._getExcelDateValue(new Date(strDate), "dd/MM/yyyy H:MM:s"));
        };

    assert.strictEqual(getExcelDateValue("08/15/1900 12:52:03"), "228.53614583333334");
    assert.strictEqual(getExcelDateValue("02/2/1900 12:52:03"), "33.536145833333336");
    assert.strictEqual(getExcelDateValue("06/27/2075 18:42:17"), "64097.77936342593");
    assert.strictEqual(getExcelDateValue("06/08/1928 17:17:48"), "10387.720694444444");
    assert.ok(getExcelDateValue("08/11/1989 02:45:56").indexOf("32731.11523148148") === 0);
    assert.strictEqual(getExcelDateValue("09/15/1979 16:31:31"), "29113.68855324074");
    assert.strictEqual(getExcelDateValue("12/26/1980 22:24:35"), "29581.933738425927"); //
    assert.strictEqual(getExcelDateValue("12/16/1883 11:22:43"), "-5858.525891203703");
    assert.strictEqual(getExcelDateValue("06/14/1987 13:13:36"), "31942.551111111112");
    assert.ok(getExcelDateValue("08/23/1983 14:57:31").indexOf("30551.62327546296") === 0);
    assert.strictEqual(getExcelDateValue("03/29/1989 15:33:47"), "32596.64846064815");
    assert.strictEqual(getExcelDateValue("08/15/2015 2:00:00"), "42231.083333333336");
    // T267460 UTC -06:00 USA
    assert.strictEqual(getExcelDateValue("08/15/2015"), "42231");
    assert.strictEqual(getExcelDateValue("08/15/2015 0:30:00"), "42231.020833333336");
    assert.strictEqual(this.excelCreator._getExcelDateValue(""), undefined);
});

QUnit.test("Get excel date value when value is null", function(assert) {
    // act, assert
    assert.ok(!this.excelCreator._getExcelDateValue(null, "dd/MM/yyyy H:MM:s"));
});

QUnit.test("styleArray generating", function(assert) {
    // act
    this.dataProvider.getStyles.returns([
        { alignment: "center", bold: true, wrapText: true },
        { alignment: "left", bold: false, wrapText: false, format: "currency", precision: 0 },
        { alignment: "right", bold: false, wrapText: false, format: "currency", precision: 0 },
        { alignment: "left", format: { type: "fixedPoint", precision: 1 } }
    ]);
    this.excelCreator._prepareStyleData();

    var styles = this.excelCreator._stylesBuilder._styles;

    // assert
    assert.equal(styles.length, 4, "styles count");
    assert.deepEqual(styles[0], { alignment: "center", bold: true, wrapText: true, formatID: undefined }, "style 1");
    assert.deepEqual(styles[1], { alignment: "left", bold: false, wrapText: false, formatID: 1 }, "style 2");
    assert.deepEqual(styles[2], { alignment: "right", bold: false, wrapText: false, formatID: 1 }, "style 3");
    assert.deepEqual(styles[3], { alignment: "left", bold: false, wrapText: undefined, formatID: 2 }, "style 4");
});

QUnit.test("stringArray generating", function(assert) {
    // arrange
    var strings;

    // act
    this.excelCreator._prepareStyleData();
    this.excelCreator._prepareCellData();
    strings = this.excelCreator._sharedStringsBuilder._sharedStrings;

    // assert
    assert.equal(strings.length, 5, "strings count");
    assert.deepEqual(strings, ["test1", "test2", "test3", "ColumnClone", "test5"]);
});

QUnit.test("cellsArray generating", function(assert) {
    // arrange
    var cells;

    this.dataProvider.getStyles.returns([
        { alignment: "center", bold: true, dataType: "string" },
        { alignment: "left", bold: false, wrapText: false, format: "currency", precision: 0 },
        { alignment: "right", bold: false, wrapText: false, format: "currency", precision: 0 },
        { alignment: "left", format: { type: "fixedPoint", precision: 1 } }
    ]);

    this.dataProvider.getStyleId
        .withArgs(0, 0).returns(0)
        .withArgs(0, 1).returns(1)
        .withArgs(0, 2).returns(2)
        .withArgs(0, 3).returns(3);

    // act
    this.excelCreator._prepareStyleData();

    this.excelCreator._prepareCellData();
    cells = this.excelCreator._cellsArray;

    // assert
    assert.equal(cells.length, 6, "rows count");
    assert.equal(cells[0].length, 4, "cells count in row 1");
    assert.equal(cells[1].length, 4, "cells count in row 2");
    assert.equal(cells[2].length, 4, "cells count in row 3");
    assert.equal(cells[3].length, 4, "cells count in row 4");
    assert.equal(cells[4].length, 4, "cells count in row 5");
    assert.equal(cells[5].length, 4, "cells count in row 6");

    assert.deepEqual(cells[0][0], { style: 0, type: "b", value: true }, "cell1 in first row data");
    assert.deepEqual(cells[0][1], { style: 1, type: "s", value: 0 }, "cell2 in first row data");
    assert.deepEqual(cells[0][2], { style: 2, type: "n", value: 12 }, "cell3 in first row data");
    assert.deepEqual(cells[0][3], { style: 3, type: "n", value: 41709.5 }, "cell4 in first row data");
});

QUnit.test("colsArray generating", function(assert) {
    // act
    this.excelCreator._prepareStyleData();

    // assert
    assert.deepEqual(this.excelCreator._colsArray, [13.57, 27.86, 20.71, 22.14]);
});

QUnit.test("Cell index generate", function(assert) {
    // assert, act
    assert.strictEqual(this.excelCreator._getCellIndex(1, 3), "D1", "Simple letter index correct (\"D1\")");
    assert.strictEqual(this.excelCreator._getCellIndex(1, 26), "AA1", "Two-digit letter index correct (\"AA1\")"); // T271869
    assert.strictEqual(this.excelCreator._getCellIndex(121, 2132), "CDA121", "Multi letter index correct (\"DEA121\")");
    assert.strictEqual(this.excelCreator._getCellIndex(99999999, 99999999), "HJUNYV99999999", "Long multi letter index correct (\"IKVOZV99999999\")");
});

QUnit.test("Cell type generate", function(assert) {
    // assert, act
    assert.strictEqual(this.excelCreator._getDataType("number"), "n", "dataType number converting correct");
    assert.strictEqual(this.excelCreator._getDataType("boolean"), "b", "dataType boolean converting correct");
    assert.strictEqual(this.excelCreator._getDataType("string"), "s", "dataType string converting correct");
    assert.strictEqual(this.excelCreator._getDataType("date"), "d", "dataType date converting correct");
    assert.strictEqual(this.excelCreator._getDataType("numeric"), "s", "Error dataTypes corrected into string");
});

QUnit.test("Excel file structure", function(assert) {
    // arrange
    var zip = this.excelCreator._zip,
        paths = [];

    // act
    this.excelCreator._generateContent();
    zip.filter(function(relativePath) {
        paths.push(relativePath);
    });

    // assert
    assert.deepEqual(paths, ["xl/", "xl/styles.xml", "xl/sharedStrings.xml", "xl/worksheets/", "xl/worksheets/sheet1.xml", "_rels/", "_rels/.rels", "xl/_rels/", "xl/_rels/workbook.xml.rels", "xl/workbook.xml", "[Content_Types].xml"], "paths");
});

QUnit.test("Generate merging XML", function(assert) {
    // arrange
    this.excelCreator._dataProvider.getCellMerging = function(rowIndex, cellIndex) {
        return { colspan: 1, rowspan: 1 };
    };

    this.excelCreator._dataProvider.getHeaderRowCount = undefined;

    // act
    var mergingXML = this.excelCreator._generateMergingXML(),
        expected = "<mergeCells count=\"6\"><mergeCell ref=\"A1:B2\" /><mergeCell ref=\"C1:D2\" /><mergeCell ref=\"A3:B4\" /><mergeCell ref=\"C3:D4\" /><mergeCell ref=\"A5:B6\" /><mergeCell ref=\"C5:D6\" /></mergeCells>";

    // assert
    assert.equal(mergingXML, expected);
});

QUnit.test("Content_Types file content", function(assert) {
    // arrange
    var expected = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\" />" +
            "<Default Extension=\"xml\" ContentType=\"application/xml\" /><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\" /><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\" /><Override PartName=\"/xl/sharedStrings.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml\" />" +
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\" /></Types>",
        done = assert.async();

    // act
    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.files[internals.CONTENTTYPES_FILE_NAME].async("string").then(function(data) {
        try {
            // assert
            assert.strictEqual(data, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("_rels\\.rels file content", function(assert) {
    // arrange
    var expected = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\" /></Relationships>",
        done = assert.async();

    // act
    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.folder("_" + internals.RELATIONSHIP_PART_NAME).file("." + internals.RELATIONSHIP_PART_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual(content, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("xl\\_rels\\workbook.xml.rels file content", function(assert) {
    // arrange
    var expected = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
            "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\" />" +
            "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\" />" +
            "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"sharedStrings.xml\" /></Relationships>",
        done = assert.async();

    // act
    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME).folder("_" + internals.RELATIONSHIP_PART_NAME).file(internals.WORKBOOK_FILE_NAME + ".rels").async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual(content, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("xl\\workbook.xml file content", function(assert) {
    // arrange
    var expected = "<?xml version=\"1.0\" encoding=\"utf-8\"?><workbook xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><bookViews><workbookView xWindow=\"0\" yWindow=\"0\" windowWidth=\"0\" windowHeight=\"0\"/></bookViews><sheets><sheet name=\"Sheet\" sheetId=\"1\" r:id=\"rId1\" /></sheets>" +
            "<definedNames><definedName name=\"_xlnm.Print_Titles\" localSheetId=\"0\">Sheet!$1:$1</definedName>" +
            "<definedName name=\"_xlnm._FilterDatabase\" hidden=\"0\" localSheetId=\"0\">Sheet!$A$1:$F$6332</definedName></definedNames></workbook>",
        done = assert.async();

    // act
    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME).file(internals.WORKBOOK_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual(content, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("xl\\styles.xml file content", function(assert) {
    // arrange
    var done = assert.async(),
        expected = "<?xml version=\"1.0\" encoding=\"utf-8\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
            "<numFmts count=\"3\">" +
            "<numFmt numFmtId=\"165\" formatCode=\"$#,##0_);\\($#,##0\\)\" />" +
            "<numFmt numFmtId=\"166\" formatCode=\"[$-9]M\\/d\\/yyyy\" />" +
            "<numFmt numFmtId=\"167\" formatCode=\"#,##0.0\" />" +
            "</numFmts>" +
                "<fonts count=\"2\"><font><sz val=\"11\"/><color theme=\"1\"/><name val=\"Calibri\"/><family val=\"2\"/><scheme val=\"minor\"/></font>" +
                "<font><b/><sz val=\"11\"/><color theme=\"1\"/><name val=\"Calibri\"/><family val=\"2\"/><scheme val=\"minor\"/></font></fonts>" +
                "<fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>" +
                "<borders count=\"1\"><border><left style=\"thin\"><color rgb=\"FFD3D3D3\"/></left><right style=\"thin\"><color rgb=\"FFD3D3D3\"/></right><top style=\"thin\"><color rgb=\"FFD3D3D3\"/></top><bottom style=\"thin\"><color rgb=\"FFD3D3D3\"/></bottom></border></borders>" +
                "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
                "<cellXfs count=\"6\">" +
                "<xf xfId=\"0\" applyAlignment=\"1\" fontId=\"1\" applyNumberFormat=\"0\" numFmtId=\"0\"><alignment vertical=\"top\" wrapText=\"1\" horizontal=\"center\" /></xf>" +
                "<xf xfId=\"0\" applyAlignment=\"1\" fontId=\"0\" applyNumberFormat=\"1\" numFmtId=\"165\"><alignment vertical=\"top\" wrapText=\"0\" horizontal=\"left\" /></xf>" +
                "<xf xfId=\"0\" applyAlignment=\"1\" fontId=\"0\" applyNumberFormat=\"1\" numFmtId=\"165\"><alignment vertical=\"top\" wrapText=\"0\" horizontal=\"right\" /></xf>" +
                "<xf xfId=\"0\" applyAlignment=\"1\" fontId=\"1\" applyNumberFormat=\"1\" numFmtId=\"166\"><alignment vertical=\"top\" wrapText=\"0\" horizontal=\"center\" /></xf>" +
                "<xf xfId=\"0\" applyAlignment=\"1\" fontId=\"0\" applyNumberFormat=\"1\" numFmtId=\"167\"><alignment vertical=\"top\" wrapText=\"0\" horizontal=\"left\" /></xf>" +
                "<xf xfId=\"0\" applyAlignment=\"1\" fontId=\"1\" applyNumberFormat=\"0\" numFmtId=\"0\"><alignment vertical=\"top\" wrapText=\"0\" horizontal=\"left\" /></xf>" +
               "</cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\" /></cellStyles></styleSheet>";
    // act
    this.dataProvider.getStyles.returns([
        { alignment: "center", bold: true, wrapText: true },
        { alignment: "left", bold: false, wrapText: false, format: "currency", precision: 0, dataType: "number" },
        { alignment: "right", bold: false, wrapText: false, format: "currency", precision: 0, dataType: "number" },
        { alignment: "center", format: "shortDate", dataType: "date", bold: true },
        { alignment: "left", format: { type: "fixedPoint", precision: 1 } },
        { bold: true }
    ]);

    this.dataProvider.getStyleId
        .withArgs(0, 0).returns(0)
        .withArgs(0, 1).returns(1)
        .withArgs(0, 2).returns(2)
        .withArgs(0, 3).returns(3);


    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME).file(internals.STYLE_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual(content, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("xl\\sharedStrings.xml file content", function(assert) {
    // arrange
    var expected = "<?xml version=\"1.0\" encoding=\"utf-8\"?><sst xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" count=\"5\" uniqueCount=\"5\"><si><t>test1</t></si><si><t>test2</t></si><si><t>test3</t></si><si><t>ColumnClone</t></si><si><t>test5</t></si></sst>",
        done = assert.async();

    // act
    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME).file(internals.SHAREDSTRING_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual(content, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("xl\\worksheets\\sheet1.xml file content", function(assert) {
    // arrange
    var expected = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" mc:Ignorable=\"x14ac\" xmlns:x14ac=\"http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac\"><sheetPr><outlinePr summaryBelow=\"0\"/></sheetPr><dimension ref=\"A1:C1\"/><sheetViews><sheetView tabSelected=\"1\" workbookViewId=\"0\"><pane activePane=\"bottomLeft\" state=\"frozen\" ySplit=\"1\" topLeftCell=\"A2\" /></sheetView></sheetViews><sheetFormatPr defaultRowHeight=\"15\" outlineLevelRow=\"0\" x14ac:dyDescent=\"0.25\"/><cols><col width=\"13.57\" min=\"1\" max=\"1\" /><col width=\"27.86\" min=\"2\" max=\"2\" /><col width=\"20.71\" min=\"3\" max=\"3\" /><col width=\"22.14\" min=\"4\" max=\"4\" /></cols><sheetData><row r=\"1\" spans=\"1:4\" outlineLevel=\"0\" x14ac:dyDescent=\"0.25\"><c r=\"A1\" s=\"0\" t=\"b\"><v>true</v></c><c r=\"B1\" s=\"0\" t=\"s\"><v>0</v></c><c r=\"C1\" s=\"0\" t=\"n\"><v>12</v></c><c r=\"D1\" s=\"0\" t=\"n\"><v>41709.5</v></c></row><row r=\"2\" spans=\"1:4\" outlineLevel=\"0\" x14ac:dyDescent=\"0.25\"><c r=\"A2\" s=\"0\" t=\"b\"><v>true</v></c><c r=\"B2\" s=\"0\" t=\"s\"><v>1</v></c><c r=\"C2\" s=\"0\" t=\"n\"><v>122</v></c><c r=\"D2\" s=\"0\" t=\"n\"><v>41740.5</v></c></row><row r=\"3\" spans=\"1:4\" outlineLevel=\"1\" x14ac:dyDescent=\"0.25\"><c r=\"A3\" s=\"0\" t=\"b\"><v>false</v></c><c r=\"B3\" s=\"0\" t=\"s\"><v>2</v></c><c r=\"C3\" s=\"0\" t=\"n\"><v>1</v></c><c r=\"D3\" s=\"0\" t=\"n\"><v>41770.5</v></c></row><row r=\"4\" spans=\"1:4\" outlineLevel=\"1\" x14ac:dyDescent=\"0.25\"><c r=\"A4\" s=\"0\" t=\"b\"><v>false</v></c><c r=\"B4\" s=\"0\" t=\"s\"><v>3</v></c><c r=\"C4\" s=\"0\" t=\"n\"><v>4</v></c><c r=\"D4\" s=\"0\" t=\"n\"><v>41801.5</v></c></row><row r=\"5\" spans=\"1:4\" outlineLevel=\"1\" x14ac:dyDescent=\"0.25\"><c r=\"A5\" s=\"0\" t=\"b\"><v>true</v></c><c r=\"B5\" s=\"0\" t=\"s\"><v>4</v></c><c r=\"C5\" s=\"0\" t=\"n\"><v>5</v></c><c r=\"D5\" s=\"0\" t=\"n\"><v>41831.5</v></c></row><row r=\"6\" spans=\"1:4\" outlineLevel=\"1\" x14ac:dyDescent=\"0.25\"><c r=\"A6\" s=\"0\" t=\"b\"><v>true</v></c><c r=\"B6\" s=\"0\" t=\"s\"><v>3</v></c><c r=\"C6\" s=\"0\" t=\"n\"><v>5</v></c><c r=\"D6\" s=\"0\" t=\"n\"><v>41831.5</v></c></row></sheetData><autoFilter ref=\"A1:D6\" /><ignoredErrors><ignoredError sqref=\"A1:D6\" numberStoredAsText=\"1\" /></ignoredErrors></worksheet>",
        done = assert.async();

    // act
    this.excelCreator._options.autoFilterEnabled = true;
    this.excelCreator._options.ignoreErrors = true;
    this.excelCreator._generateContent();

    assert.expect(1);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual(content, expected, "content of file");
        } finally {
            done();
        }
    });
});

QUnit.test("Disable ignore errors", function(assert) {
    // arrange
    var done = assert.async();

    this.excelCreator._options.ignoreErrors = false;

    // act
    this.excelCreator._generateContent();

    assert.expect(1);
    var worksheetFile = this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME);
    worksheetFile.async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("ignoredError") === -1);
        } finally {
            done();
        }
    });
});

QUnit.test("Generating worksheet without groups", function(assert) {
    // arrange
    var dataProvider = new exportMocks.MockDataProvider(),
        done = assert.async();

    dataProvider.getGroupLevel = function(index) {
        return 0;
    };
    dataProvider.isGroupRow = function() {
        return false;
    };

    this.excelCreator = new ExcelCreator(dataProvider, {});

    // act
    this.excelCreator._generateContent();
    assert.expect(4);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("outlineLevel=\"1\"") === -1, "Excel worksheet outlineLevel correct");
            assert.ok(content.indexOf(internals.GROUP_SHEET_PR_XML) === -1, "Excel worksheet sheetPr correct");
            assert.ok(content.indexOf(internals.SINGLE_SHEET_PR_XML) !== -1, "Excel worksheet sheetPr single correct");
            assert.ok(content.indexOf("s=\"1\"") === -1, "Worksheet has no bold style cells");
        } finally {
            done();
        }
    });
});

QUnit.test("Generating worksheet with groups", function(assert) {
    // arrange
    var done = assert.async();

    this.dataProvider.getStyles.returns([
        { alignment: "center", bold: true, wrapText: true },
        { alignment: "left", bold: false, wrapText: false, format: "currency", precision: 0, dataType: "number" },
        { alignment: "right", bold: false, wrapText: false, format: "currency", precision: 0, dataType: "number" },
        { alignment: "center", format: "shortDate", dataType: "date", bold: true },
        { alignment: "left", format: { type: "fixedPoint", precision: 1 } }
    ]);

    this.dataProvider.getStyleId
        .withArgs(0, 0).returns(0)
        .withArgs(0, 1).returns(1)
        .withArgs(0, 2).returns(2)
        .withArgs(0, 3).returns(3);

    // act
    this.excelCreator._generateContent();
    assert.expect(4);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("outlineLevel=\"1\"") !== -1, "Excel worksheet outlineLevel correct");
            assert.ok(content.indexOf(internals.GROUP_SHEET_PR_XML) !== -1, "Excel worksheet sheetPr correct");
            assert.ok(content.indexOf(internals.SINGLE_SHEET_PR_XML) === -1, "Excel worksheet sheetPr single correct");
            assert.ok(content.indexOf("s=\"3\"") !== -1, "Worksheet group cells is bold");
        } finally {
            done();
        }
    });
});

QUnit.test("Add rtl property to sheet view", function(assert) {
    // arrange
    var done = assert.async(),
        excelCreatorRTL = new ExcelCreator(new exportMocks.MockDataProvider(), {
            rtlEnabled: true
        });

    // act
    excelCreatorRTL._generateContent();
    assert.expect(1);
    excelCreatorRTL._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual($(content).find("sheetView").attr("rightToLeft"), "1");
        } finally {
            done();
        }
    });
});

QUnit.test("Workwheet XML content is valid", function(assert) {
    // arrange
    var excelCreator,
        done = assert.async(),
        dataProvider = new exportMocks.MockDataProvider();

    dataProvider.isTotalRow = function(rowIndex) {
        return rowIndex === 5;
    };

    // act
    excelCreator = new ExcelCreator(dataProvider, {
        wrapTextEnabled: true
    });
    excelCreator._generateContent();
    assert.expect(4);
    excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("<v />") === -1, "No empty cell values <v /> in worksheet XML content");
            assert.ok(content.indexOf("undefined") === -1, "No undefined variables in worksheetXML content");
            assert.ok(content.indexOf("NaN") === -1, "No undefined NaN in worksheetXML content");
            assert.ok(content.indexOf("NULL") === -1, "No undefined NULL in worksheetXML content");
        } finally {
            done();
        }
    });
});



QUnit.test("Generating worksheet with groups and three rows of the header", function(assert) {
    // arrange
    var done = assert.async();

    this.excelCreator._dataProvider.getHeaderRowCount = function() {
        return 3;
    };

    this.excelCreator._dataProvider.getGroupLevel = function(index) {
        return (index > 0) ? 1 : 0;
    };
    // act
    this.excelCreator._generateContent();
    assert.expect(3);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("row r=\"5\" spans=\"1:4\" outlineLevel=\"1\"") !== -1, "Excel worksheet outlineLevel correct");
            assert.ok(content.indexOf(internals.GROUP_SHEET_PR_XML) !== -1, "Excel worksheet sheetPr correct");
            assert.ok(content.indexOf(internals.SINGLE_SHEET_PR_XML) === -1, "Excel worksheet sheetPr single correct");
        } finally {
            done();
        }
    });
});




QUnit.test("Style XML content is valid", function(assert) {
    // arrange
    var excelCreator,
        done = assert.async(),
        dataProvider = new exportMocks.MockDataProvider();

    // act
    excelCreator = new ExcelCreator(dataProvider, {
        wrapTextEnabled: true
    });
    excelCreator._generateContent();
    assert.expect(4);
    excelCreator._zip.folder(internals.XL_FOLDER_NAME).file(internals.STYLE_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("<v />") === -1, "No empty cell values <v /> in worksheet XML content");
            assert.ok(content.indexOf("undefined") === -1, "No undefined variables in worksheetXML content");
            assert.ok(content.indexOf("NaN") === -1, "No undefined NaN in worksheetXML content");
            assert.ok(content.indexOf("NULL") === -1, "No undefined NULL in worksheetXML content");
        } finally {
            done();
        }
    });
});

QUnit.test("SharedString XML content is valid", function(assert) {
    // arrange
    var excelCreator,
        done = assert.async(),
        dataProvider = new exportMocks.MockDataProvider();

    dataProvider.isTotalRow = function(rowIndex) {
        return rowIndex === 5;
    };

    // act
    excelCreator = new ExcelCreator(dataProvider, {
        wrapTextEnabled: true
    });
    excelCreator._generateContent();
    assert.expect(4);
    excelCreator._zip.folder(internals.XL_FOLDER_NAME).file(internals.SHAREDSTRING_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.ok(content.indexOf("<v />") === -1, "No empty cell values <v /> in worksheet XML content");
            assert.ok(content.indexOf("undefined") === -1, "No undefined variables in worksheetXML content");
            assert.ok(content.indexOf("NaN") === -1, "No undefined NaN in worksheetXML content");
            assert.ok(content.indexOf("NULL") === -1, "No undefined NULL in worksheetXML content");
        } finally {
            done();
        }
    });
});

//T267460
QUnit.test("CalculateWidth convert 0 and undefined to min value", function(assert) {
    // act, assert
    assert.equal(this.excelCreator._calculateWidth(0), 13.57, "Return min value width zerow");
    assert.equal(this.excelCreator._calculateWidth(undefined), 13.57, "Return min value width undefined");
    assert.equal(this.excelCreator._calculateWidth(null), 13.57, "Return min value width null");
    assert.equal(this.excelCreator._calculateWidth(NaN), 13.57, "Return min value width zerow width");
    assert.equal(this.excelCreator._calculateWidth(1), 13.57, "Return min value width zerow width");
    assert.equal(this.excelCreator._calculateWidth(14), 1.29, "Return min value width zerow width");
});

QUnit.module("Excel creator with cellMerged data provider ", {
    beforeEach: function() {
        this.dataProvider = new exportMocks.MockDataProvider({});
        this.dataProvider.getCellMerging
            .returns({
                colspan: 0,
                rowspan: 0
            })
            .withArgs(0, 0).returns({
                colspan: 2,
                rowspan: 0
            });
        this.dataProvider.getHeaderRowCount = sinon.stub().returns(2);

        this.excelCreator = new ExcelCreator(this.dataProvider, {});
    }
});

QUnit.test("xl\\worksheets\\sheet1.xml file content", function(assert) {
    // arrange
    var done = assert.async();
    // act
    this.excelCreator._generateContent();

    assert.expect(2);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            assert.strictEqual($(content).find("mergeCells").children().length, 1, "merged cells count");
            assert.strictEqual($(content).find("mergeCells").find("mergeCell").attr("ref"), "A1:C1", "merge cell");
        } finally {
            done();
        }
    });
});

QUnit.test("xl\\worksheets\\sheet1.xml file content with AutoFilter", function(assert) {
    // arrange
    var done = assert.async();

    // act
    this.excelCreator._options.autoFilterEnabled = true;
    this.excelCreator._generateContent();

    assert.expect(2);
    this.excelCreator._zip.folder(internals.XL_FOLDER_NAME + "/" + internals.WORKSHEETS_FOLDER).file(internals.WORKSHEET_FILE_NAME).async("string").then(function(content) {
        try {
            // assert
            var $autoFilter = $(content).find("autoFilter");
            assert.strictEqual($autoFilter.parent()[0].tagName.toLowerCase(), "worksheet");
            assert.strictEqual($autoFilter.attr("ref"), "A2:C3");
        } finally {
            done();
        }
    });
});

QUnit.test("Exception should be thrown if JSzip not included has no start date", function(assert) {
    var zip_backup = this.excelCreator._zip;

    this.excelCreator._zip = null;

    assert.throws(
        function() { this.excelCreator.getData(); }.bind(this),
        function(e) {
            return /E1041/.test(e.message);
        },
        "The JSZip script is referenced after DevExtreme scripts"
    );

    this.excelCreator._zip = zip_backup;
});
