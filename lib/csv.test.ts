import assert from "node:assert/strict";
import { test } from "node:test";

import { escapeCsv } from "@/lib/csv";

test("leaves ordinary values unchanged", () => {
    assert.equal(escapeCsv("hello"), "hello");
    assert.equal(escapeCsv("123"), "123");
    assert.equal(escapeCsv(null), "");
    assert.equal(escapeCsv(undefined), "");
});

test("neutralizes every formula prefix", () => {
    assert.equal(escapeCsv("=SUM(A1:A2)"), "'=SUM(A1:A2)");
    assert.equal(escapeCsv("+1"), "'+1");
    assert.equal(escapeCsv("-1"), "'-1");
    assert.equal(escapeCsv("@cmd"), "'@cmd");
    assert.equal(escapeCsv("\t=1"), "'\t=1");
    assert.equal(escapeCsv("\r=1"), "\"'\r=1\"");
});

test("does not prefix a formula character that is not first", () => {
    assert.equal(escapeCsv("a=b"), "a=b");
    assert.equal(escapeCsv("1+2"), "1+2");
});

test("quotes values containing separators or quotes", () => {
    assert.equal(escapeCsv("a,b"), '"a,b"');
    assert.equal(escapeCsv('a"b'), '"a""b"');
    assert.equal(escapeCsv("a\nb"), '"a\nb"');
    assert.equal(escapeCsv("a\rb"), '"a\rb"');
});

test("prefixes before quoting a formula with separators", () => {
    assert.equal(
        escapeCsv('=HYPERLINK("https://attacker.example","click")'),
        '"\'=HYPERLINK(""https://attacker.example"",""click"")"'
    );
});
