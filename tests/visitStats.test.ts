import { describe, it } from "node:test"
import assert from "node:assert"
import { istDate, isValidVisitorId, looksLikeBot } from "../src/lib/visitStats.ts"

describe("visit statistics helpers", () => {
  it("uses the India date, which rolls over at 18:30 UTC", () => {
    assert.strictEqual(istDate(Date.parse("2026-11-14T18:29:00Z")), "2026-11-14")
    assert.strictEqual(istDate(Date.parse("2026-11-14T18:31:00Z")), "2026-11-15")
  })
  it("accepts only sensible visitor ids", () => {
    assert.ok(isValidVisitorId("3f2b8c1e-aaaa-4bbb-8ccc-1234567890ab"))
    assert.ok(!isValidVisitorId("short"))
    assert.ok(!isValidVisitorId("<script>alert(1)</script>"))
    assert.ok(!isValidVisitorId(undefined))
  })
  it("does not count bots, previews or missing user agents", () => {
    assert.ok(looksLikeBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"))
    assert.ok(looksLikeBot("WhatsApp/2.23.20.0"))
    assert.ok(looksLikeBot(null))
    assert.ok(!looksLikeBot("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36"))
  })
})
