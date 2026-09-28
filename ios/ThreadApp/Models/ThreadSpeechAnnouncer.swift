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

    /// Same calm, clear voices as the web's /api/tts (Sarah, Matilda, Alice, Jessica, Rachel); the first one the
    /// account has wins, and it's remembered so later announcements take one request.
    static let preferredVoiceIds = ["EXAVITQu4vr4xnSDxMaL", "XrExE9yKIg1WjnnlVkGX", "Xb7hH8MSUJpSbSDYk0k2", "cgSgspJ2msm6clMCkdW9", "21m00Tcm4TlvDq8ikWAM"]
    private static let voiceDefaultsKey = "Thread_elevenLabsVoiceId"

    static func pickVoice(from available: [String]) -> String? {
        preferredVoiceIds.first(where: available.contains) ?? available.first
    }

    private override init() {
        super.init()
        speechSynthesizer.delegate = self
        configureAudioSession()
    }

    public func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers, .mixWithOthers])
            try session.setActive(true)
        } catch {
            do {
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
                try session.setActive(true)
            } catch {
                print("[ThreadSpeech] AVAudioSession config error: \(error.localizedDescription)")
            }
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
        // Reinstantiate synthesizer to prevent internal audio unit deadlock in iOS
        speechSynthesizer = AVSpeechSynthesizer()
        speechSynthesizer.delegate = self

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
            ?? AVSpeechSynthesisVoice(language: Locale.current.identifier)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.98
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0
        utterance.preUtteranceDelay = 0.02
        utterance.postUtteranceDelay = 0.05

        isSpeaking = true
        speechSynthesizer.speak(utterance)
    }

    private func withVoice(key: String, _ use: @escaping (String) -> Void) {
        if let saved = UserDefaults.standard.string(forKey: Self.voiceDefaultsKey) { return use(saved) }
        guard let url = URL(string: "https://api.elevenlabs.io/v1/voices") else { return use(Self.preferredVoiceIds[0]) }
        var request = URLRequest(url: url)
        request.setValue(key, forHTTPHeaderField: "xi-api-key")
        URLSession.shared.dataTask(with: request) { data, response, _ in
            // A key without voice-read access can still speak, so keep the first choice then.
            guard (response as? HTTPURLResponse)?.statusCode == 200, let data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let voices = json["voices"] as? [[String: Any]],
                  let voice = Self.pickVoice(from: voices.compactMap { $0["voice_id"] as? String }) else {
                return use(Self.preferredVoiceIds[0])
            }
            UserDefaults.standard.set(voice, forKey: Self.voiceDefaultsKey)
            use(voice)
        }.resume()
    }

    private func speakWithElevenLabs(text: String, completion: @escaping (Bool) -> Void) {
        let key = elevenLabsApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        withVoice(key: key) { [weak self] voice in
            guard let self, let url = URL(string: "https://api.elevenlabs.io/v1/text-to-speech/\(voice)?output_format=mp3_44100_128") else {
                return completion(false)
            }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue(key, forHTTPHeaderField: "xi-api-key")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            let body: [String: Any] = [
                "text": text,
                "model_id": "eleven_flash_v2_5",
                "voice_settings": ["stability": 0.5, "similarity_boost": 0.75, "use_speaker_boost": true],
            ]
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
            self.play(request, completion: completion)
        }
    }

    private func play(_ request: URLRequest, completion: @escaping (Bool) -> Void) {
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if status == 404 { UserDefaults.standard.removeObject(forKey: Self.voiceDefaultsKey) } // voice left the account; pick again next time
            guard let self = self, let data = data, error == nil, status == 200 else {
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
