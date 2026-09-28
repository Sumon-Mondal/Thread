import XCTest
@testable import ThreadApp

final class VoiceChoiceTests: XCTestCase {
    func testPrefersSarahThenTheNextCalmVoiceTheAccountHas() {
        let sarah = "EXAVITQu4vr4xnSDxMaL"
        let matilda = "XrExE9yKIg1WjnnlVkGX"
        XCTAssertEqual(ThreadSpeechAnnouncer.pickVoice(from: ["someone-else", matilda, sarah]), sarah)
        XCTAssertEqual(ThreadSpeechAnnouncer.pickVoice(from: ["someone-else", matilda]), matilda)
        XCTAssertEqual(ThreadSpeechAnnouncer.pickVoice(from: ["my-cloned-voice"]), "my-cloned-voice")
        XCTAssertNil(ThreadSpeechAnnouncer.pickVoice(from: []))
    }
}
