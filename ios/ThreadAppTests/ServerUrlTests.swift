import XCTest
@testable import ThreadApp

@MainActor
final class ServerUrlTests: XCTestCase {
    private let key = "Thread_serverUrl"
    private var saved: String?

    override func setUp() {
        saved = UserDefaults.standard.string(forKey: key)
    }

    override func tearDown() {
        UserDefaults.standard.set(saved, forKey: key)
    }

    func testOldMacAddressMovesToTheBonjourName() {
        UserDefaults.standard.set("http://10.11.6.47:8080", forKey: key)
        XCTAssertEqual(ThreadSessionManager.savedServerUrl(), ThreadSessionManager.macServerUrl)
        XCTAssertEqual(UserDefaults.standard.string(forKey: key), ThreadSessionManager.macServerUrl, "the new address should be saved")
    }

    func testOtherChoicesAreKept() {
        UserDefaults.standard.set(ThreadSessionManager.cloudServerUrl, forKey: key)
        XCTAssertEqual(ThreadSessionManager.savedServerUrl(), ThreadSessionManager.cloudServerUrl)
        UserDefaults.standard.removeObject(forKey: key)
        XCTAssertEqual(ThreadSessionManager.savedServerUrl(), ThreadSessionManager.cloudServerUrl)
    }
}
