import Foundation
import AVFoundation

public class ThreadSpeechAnnouncer: NSObject, AVSpeechSynthesizerDelegate, AVAudioPlayerDelegate {
    public static let shared = ThreadSpeechAnnouncer()

    private var speechSynthesizer = AVSpeechSynthesizer()
    private var audioPlayer: AVAudioPlayer?

    public var isSpeaking: Bool = false
    public var lastSpokenText: String = ""

    /// A real key (sk_…) pasted in Settings wins; otherwise the value from the local, git-ignored
    /// ios/Config/Secrets.xcconfig baked in at build time. Empty means Apple's voice is used.
    public var elevenLabsApiKey: String {
        get {
            if let saved = UserDefaults.standard.string(forKey: "Thread_elevenLabsApiKey"), saved.hasPrefix("sk_") {
                return saved
            }
            return (Bundle.main.object(forInfoDictionaryKey: "ElevenLabsAPIKey") as? String) ?? ""
        }
        set {
            UserDefaults.standard.set(newValue.trimmingCharacters(in: .whitespacesAndNewlines), forKey: "Thread_elevenLabsApiKey")
        }
    }

    private override init() {
        super.init()
        speechSynthesizer.delegate = self
        configureAudioSession()
    }

    public func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try session.setActive(true)
        } catch {
            print("[ThreadSpeech] AVAudioSession config error: \(error.localizedDescription)")
        }
    }

    public func speak(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        lastSpokenText = trimmed
        configureAudioSession()

        // Check if a valid secret ElevenLabs API key is configured
        let key = elevenLabsApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        if key.hasPrefix("sk_") {
            speakWithElevenLabs(text: trimmed) { [weak self] success in
                if !success {
                    DispatchQueue.main.async {
                        self?.speakWithSystemSynthesizer(text: trimmed)
                    }
                }
            }
        } else {
            speakWithSystemSynthesizer(text: trimmed)
        }
    }

    private func speakWithSystemSynthesizer(text: String) {
        if speechSynthesizer.isSpeaking {
            speechSynthesizer.stopSpeaking(at: .immediate)
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
            ?? AVSpeechSynthesisVoice(language: Locale.current.identifier)
            ?? AVSpeechSynthesisVoice(language: AVSpeechSynthesisVoice.currentLanguageCode())
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.96
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0
        utterance.preUtteranceDelay = 0.05
        utterance.postUtteranceDelay = 0.1

        isSpeaking = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.06) { [weak self] in
            guard let self = self else { return }
            self.speechSynthesizer.speak(utterance)
        }
    }

    private func speakWithElevenLabs(text: String, completion: @escaping (Bool) -> Void) {
        let key = elevenLabsApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        // Rachel voice ID: 21m00Tcm4TlvDq8ikWAM
        guard let url = URL(string: "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM") else {
            completion(false)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(key, forHTTPHeaderField: "xi-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "text": text,
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": [
                "stability": 0.5,
                "similarity_boost": 0.8
            ]
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil,
                  let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                completion(false)
                return
            }

            DispatchQueue.main.async {
                do {
                    self.audioPlayer?.stop()
                    self.audioPlayer = try AVAudioPlayer(data: data)
                    self.audioPlayer?.delegate = self
                    self.audioPlayer?.prepareToPlay()
                    self.audioPlayer?.play()
                    self.isSpeaking = true
                    completion(true)
                } catch {
                    completion(false)
                }
            }
        }.resume()
    }

    public func stop() {
        if speechSynthesizer.isSpeaking {
            speechSynthesizer.stopSpeaking(at: .immediate)
        }
        audioPlayer?.stop()
        isSpeaking = false
    }

    // MARK: - AVSpeechSynthesizerDelegate
    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        DispatchQueue.main.async { [weak self] in
            self?.isSpeaking = false
        }
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        DispatchQueue.main.async { [weak self] in
            self?.isSpeaking = false
        }
    }

    // MARK: - AVAudioPlayerDelegate
    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async { [weak self] in
            self?.isSpeaking = false
        }
    }
}
