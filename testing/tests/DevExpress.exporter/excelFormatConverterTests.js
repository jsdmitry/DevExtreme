"use strict";

var formatConverter = require("client_exporter/excel/excel_format_converter"),
    coreLocalization = require("localization/core");

QUnit.module("Number formatting", function() {
    QUnit.test("Percent format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("percent", 3), "0.000%", "precision = 3");
        assert.equal(formatConverter.convertFormat("percent", 0), "0%", "precision = 0");
        assert.equal(formatConverter.convertFormat("percent", 1), "0.0%", "precision = 1");
        assert.equal(formatConverter.convertFormat("percent", 6), "0.000000%", "precision = 6");
        assert.equal(formatConverter.convertFormat("percent"), "0%", "precision is undefined");
    });

    QUnit.test("FixedPoint format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("fixedPoint", 3), "#,##0.000", "precision = 3");
        assert.equal(formatConverter.convertFormat("fixedPoint", 2), "#,##0.00", "precision = 2");
        assert.equal(formatConverter.convertFormat("fixedPoint", 0), "#,##0", "precision = 0");
        assert.equal(formatConverter.convertFormat("fixedPoint"), "#,##0", "precision is undefined");
        assert.equal(formatConverter.convertFormat("fixedPoint", 1), "#,##0.0", "precision = 1");
        assert.equal(formatConverter.convertFormat("fixedPoint", 4), "#,##0.0000", "precision = 4");
    });

    QUnit.test("Decimal format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("decimal", 2), "#00", "precision = 2");
        assert.equal(formatConverter.convertFormat("decimal", 0), "#", "precision = 0");
        assert.equal(formatConverter.convertFormat("decimal"), "#", "precision is undefined");
        assert.equal(formatConverter.convertFormat("decimal", 1), "#0", "precision = 1");
        assert.equal(formatConverter.convertFormat("decimal", 7), "#0000000", "precision = 7");
    });

    QUnit.test("Exponential format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("exponential", 2), "0.00E+00", "precision = 2");
        assert.equal(formatConverter.convertFormat("exponential", 0), "0E+00", "precision = 0");
        assert.equal(formatConverter.convertFormat("exponential"), "0E+00", "precision is undefined");
        assert.equal(formatConverter.convertFormat("exponential", 1), "0.0E+00", "precision = 1");
        assert.equal(formatConverter.convertFormat("exponential", 3), "0.000E+00", "precision = 3");
    });

    QUnit.test("Currency format_en local", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("currency", 2), "$#,##0.00_);\\($#,##0.00\\)", "precision = 2");
        assert.equal(formatConverter.convertFormat("currency", 4), "$#,##0.0000_);\\($#,##0.0000\\)", "precision = 4");
        assert.equal(formatConverter.convertFormat("currency", 0), "$#,##0_);\\($#,##0\\)", "precision = 0");
        assert.equal(formatConverter.convertFormat("currency"), "$#,##0_);\\($#,##0\\)", "precision is undefined");
        assert.equal(formatConverter.convertFormat("currency", 1), "$#,##0.0_);\\($#,##0.0\\)", "precision = 1");
        assert.equal(formatConverter.convertFormat("currency", 5), "$#,##0.00000_);\\($#,##0.00000\\)", "precision = 5");
    });

    QUnit.test("Unknown format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("largeNumber", 2), undefined, "undefined format");
    });

    QUnit.test("Thousands format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("thousands", 2), "#,##0.00,&quot;K&quot;", "precision = 2");
        assert.equal(formatConverter.convertFormat("thousands", 0), "#,##0,&quot;K&quot;", "precision = 0");
        assert.equal(formatConverter.convertFormat("thousands"), "#,##0,&quot;K&quot;", "precision is undefined");
        assert.equal(formatConverter.convertFormat("thousands", 1), "#,##0.0,&quot;K&quot;", "precision = 1");
        assert.equal(formatConverter.convertFormat("thousands", 3), "#,##0.000,&quot;K&quot;", "precision = 3");
    });

    QUnit.test("Millions format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("millions", 2), "#,##0.00,,&quot;M&quot;", "precision = 2");
        assert.equal(formatConverter.convertFormat("millions", 0), "#,##0,,&quot;M&quot;", "precision = 0");
        assert.equal(formatConverter.convertFormat("millions"), "#,##0,,&quot;M&quot;", "precision is undefined");
        assert.equal(formatConverter.convertFormat("millions", 1), "#,##0.0,,&quot;M&quot;", "precision = 1");
        assert.equal(formatConverter.convertFormat("millions", 3), "#,##0.000,,&quot;M&quot;", "precision = 3");
    });

    QUnit.test("Billions format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("billions", 2), "#,##0.00,,,&quot;B&quot;", "precision = 2");
        assert.equal(formatConverter.convertFormat("billions", 0), "#,##0,,,&quot;B&quot;", "precision = 0");
        assert.equal(formatConverter.convertFormat("billions"), "#,##0,,,&quot;B&quot;", "precision is undefined");
        assert.equal(formatConverter.convertFormat("billions", 1), "#,##0.0,,,&quot;B&quot;", "precision = 1");
        assert.equal(formatConverter.convertFormat("billions", 3), "#,##0.000,,,&quot;B&quot;", "precision = 3");
    });

    QUnit.test("Trillions format", function(assert) {
        // act, assert
        assert.equal(formatConverter.convertFormat("trillions", 2), "#,##0.00,,,,&quot;T&quot;", "precision = 2");
        assert.equal(formatConverter.convertFormat("trillions", 0), "#,##0,,,,&quot;T&quot;", "precision = 0");
        assert.equal(formatConverter.convertFormat("trillions"), "#,##0,,,,&quot;T&quot;", "precision is undefined");
        assert.equal(formatConverter.convertFormat("trillions", 1), "#,##0.0,,,,&quot;T&quot;", "precision = 1");
        assert.equal(formatConverter.convertFormat("trillions", 3), "#,##0.000,,,,&quot;T&quot;", "precision = 3");
    });
});

QUnit.module("Date time formatting", function() {
    QUnit.test("Date time format converting", function(assert) {
        // arrange
        var expected = {
            longTime: "[$-9]H:mm:ss AM/PM",
            longDate: "[$-9]dddd, MMMM d, yyyy",
            year: "[$-9]yyyy",
            monthAndDay: "[$-9]MMMM d",
            monthAndYear: "[$-9]MMMM yyyy",
            quarterAndYear: "[$-9]M\\/d\\/yyyy",
            shortDate: "[$-9]M\\/d\\/yyyy",
            shortTime: "[$-9]H:mm AM/PM",
            shortDateShortTime: "[$-9]M\\/d\\/yyyy, H:mm AM/PM",
            longDateLongTime: "[$-9]dddd, MMMM d, yyyy, H:mm:ss AM/PM",
            dayOfWeek: "[$-9]dddd",
            hour: "[$-9]HH",
            minute: "[$-9]H:mm:ss AM/PM",
            second: "[$-9]ss",
            millisecond: "[$-9]H:mm:ss AM/PM",
            day: "[$-9]d",
            month: "[$-9]MMMM",
            quarter: "[$-9]M\\/d\\/yyyy"
        };

        // assert, act
        for(var formatIndex in expected) {
            assert.strictEqual(formatConverter.convertFormat(formatIndex, null, "date"), expected[formatIndex], "excel format: " + expected[formatIndex]);
        }
    });

    //T495544
    QUnit.test("Date format converting when format is custom", function(assert) {
        //act
        var excelFormat = formatConverter.convertFormat('dd/MMM/yyyy', null, "date");

        //assert
        assert.strictEqual(excelFormat, "[$-9]dd\\/MMM\\/yyyy", "excel format for custom date format");
    });

    //T476869
    QUnit.test("Number format converting when format is not string", function(assert) {
        var format = function(x) { return x + " $"; };

        //act
        var excelFormat = formatConverter.convertFormat(format, null, "number");

        //assert
        assert.strictEqual(excelFormat, undefined, "no excel format for format as function");
    });

    //T454328
    QUnit.test("Date time format as function converting", function(assert) {
        // arrange
        var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var day_names_short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var day_names_short2 = ['Вс', 'Пн', 'Вт', 'Cр', 'Чт', 'Пт', 'Сб'];
        var day_names_es = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        var arabicZeroCode = 1632;

        var formatArabicNumber = function(text) {
            return text.split("").map(function(char) {
                var digit = parseInt(char);
                return String.fromCharCode(digit + arabicZeroCode);
            }).join("");
        };

        var convertDate = function(formatter) {
            return formatConverter.convertFormat(formatter, null, "date");
        };

        function leftPad(text, length, char) {
            while(text.length < length) {
                text = char + text;
            }

            return text;
        }

        var expected = {
            "[$-9]AM/PM H:mm:ss": function(value) { return expected["[$-9]AM/PM"](value) + " " + expected["[$-9]H:mm:ss"](value); },
            "[$-9]yyyy \\d\\e MM \\d\\e dd": function(value) { return expected["[$-9]yyyy"](value) + " de " + expected["[$-9]MM"](value) + " de " + expected["[$-9]dd"](value); },
            "[$-9]H:mm:ss": function(value) { return value.getHours().toString() + ":" + leftPad(value.getMinutes().toString(), 2, "0") + ":" + leftPad(value.getSeconds().toString(), 2, "0"); },
            "[$-9]HH:mm:ss": function(value) { return leftPad(value.getHours().toString(), 2, "0") + ":" + leftPad(value.getMinutes().toString(), 2, "0") + ":" + leftPad(value.getSeconds().toString(), 2, "0"); },
            "[$-9]AM/PM": function(value) { return value.getHours() < 12 ? "AM" : "PM"; },
            "[$-9]yyyy": function(value) { return value.getFullYear().toString(); },
            "[$-9]yy": function(value) { return value.getFullYear().toString().substr(2); },
            "[$-9]M": function(value) { return value.getMonth().toString(); },
            "[$-9]MM": function(value) { return leftPad(value.getMonth().toString(), 2, "0"); },
            "[$-9]MMM": function(value) { return month_names_short[value.getMonth()]; },
            "[$-9]MMMM": function(value) { return month_names[value.getMonth()]; },
            "[$-9]MMMM yyyy": function(value) { return month_names[value.getMonth()] + " " + value.getFullYear().toString(); },
            "[$-9]yyyy MMMM": function(value) { return value.getFullYear().toString() + " " + month_names[value.getMonth()]; },
            "[$-9]d": function(value) { return value.getDate().toString(); },
            "[$-9]dd": function(value) { return leftPad(value.getDate().toString(), 2, "0"); },
            "[$-9]ddd": [function(value) { return day_names_short[value.getDay()]; }, function(value) { return day_names_short2[value.getDay()]; }],
            "[$-9]dddd": [function(value) { return day_names[value.getDay()]; }, function(value) { return day_names_es[value.getDay()]; }],
            "[$-9]d,ddd": function(value) { return value.getDate().toString() + "," + day_names_short[value.getDay()]; },
            "[$-9]yyyy\\/MM\\/dd": function(value) { return expected["[$-9]yyyy"](value) + "/" + expected["[$-9]MM"](value) + "/" + expected["[$-9]dd"](value); },
            "[$-9]dddd, MMMM d, yyyy": function(value) { return expected["[$-9]dddd"][0](value) + ", " + expected["[$-9]MMMM"](value) + " " + expected["[$-9]d"](value) + ", " + expected["[$-9]yyyy"](value); },
            "[$-9]dd-MMM-yyyy": function(value) { return expected["[$-9]dd"](value) + "-" + expected["[$-9]MMM"](value) + "-" + expected["[$-9]yyyy"](value); }, //T489981
            "[$-2010009]d\\/M\\/yyyy": function(value) { return formatArabicNumber(expected["[$-9]d"](value)) + "/" + formatArabicNumber(expected["[$-9]M"](value)) + "/" + formatArabicNumber(expected["[$-9]yyyy"](value)); }
        };

        // assert, act
        for(var pattern in expected) {
            var formatters = Array.isArray(expected[pattern]) ? expected[pattern] : [expected[pattern]];

            for(var i = 0; i < formatters.length; i++) {
                assert.strictEqual(convertDate(formatters[i]), pattern, "Pattern: \"" + pattern + "\", Example:\"" + formatters[i](new Date()) + "\"");
            }
        }
    });

    //T457272
    QUnit.test("shortDate format for user language", function(assert) {
        var oldLocale = coreLocalization.locale();

        coreLocalization.locale("cs");

        //act
        var excelFormat = formatConverter.convertFormat(function(value) {
            return value.getDate().toString() + ". " + value.getMonth().toString() + ". " + value.getFullYear().toString();
        }, null, "date");

        coreLocalization.locale(oldLocale);

        // assert
        assert.strictEqual(excelFormat, "[$-5]d. M. yyyy", "shortDate format for cs locale");
    });
});
