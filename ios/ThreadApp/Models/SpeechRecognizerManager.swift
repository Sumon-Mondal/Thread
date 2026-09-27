import Foundation
import Speech
import AVFoundation

@MainActor
public class SpeechRecognizerManager: ObservableObject {
    public static let shared = SpeechRecognizerManager()

    @Published public var isRecording: Bool = false
    @Published public var liveTranscript: String = ""
    @Published public var errorMessage: String? = nil

    private var speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    private init() {}

    public func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }

    public func startRecording() {
        guard !isRecording else { return }

        // Ethical and legal compliance: In-room audio transcription requires explicit user opt-in & consent
        guard ThreadSessionManager.shared.isAmbientListeningEnabled else {
            self.errorMessage = "In-room microphone listening is disabled. Enable it with participant consent in Settings."
            ThreadSessionManager.shared.showNotification(text: "⚠️ Enable In-Room Audio in Settings with attendee consent")
            return
        }

        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                switch authStatus {
                case .authorized:
                    do {
                        try self.beginAudioSession()
                    } catch {
                        self.errorMessage = "Audio engine error: \(error.localizedDescription)"
                    }
                case .denied, .restricted, .notDetermined:
                    self.errorMessage = "Microphone or Speech Recognition permission denied."
                @unknown default:
                    self.errorMessage = "Unknown speech authorization state."
                }
            }
        }
    }

    private func beginAudioSession() throws {
        // Cancel previous tasks if running
        recognitionTask?.cancel()
        recognitionTask = nil

        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            throw NSError(domain: "SpeechRecognizer", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unable to create request"])
        }
        recognitionRequest.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        isRecording = true
        errorMessage = nil
        ThreadSessionManager.shared.showNotification(text: "🎙 Live iPhone Mic Listening…")
        ThreadSessionManager.shared.meetingTitle = "In-Room Live Meeting"
        ThreadSessionManager.shared.currentSpeaker = SpeakerInfo(name: "Live Audio", role: "In-Room Speaker", initials: "LA", color: .cyan)
        ThreadSessionManager.shared.shortHeadline = "Listening to Speech"
        ThreadSessionManager.shared.meetingStartDate = Date()
        ThreadSessionManager.shared.isConnectedToMeeting = true
        ThreadSessionManager.shared.startLiveActivity()

        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                if let result = result {
                    let text = result.bestTranscription.formattedString
                    self.liveTranscript = text
                    if result.isFinal {
                        ThreadSessionManager.shared.handleLiveSpokenText(speaker: "Meeting Attendee", text: text)
                    } else {
                        // Periodic analysis on significant length chunks
                        ThreadSessionManager.shared.analyzeLiveChunkIfNeeded(text: text)
                    }
                }
                if error != nil || (result?.isFinal ?? false) {
                    // Task ended or error
                }
            }
        }
    }

    public func stopRecording() {
        guard isRecording else { return }
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        isRecording = false
        ThreadSessionManager.shared.isConnectedToMeeting = false
        if !ThreadSessionManager.shared.isDemoMode {
            ThreadSessionManager.shared.endLiveActivity()
        }
        ThreadSessionManager.shared.showNotification(text: "Microphone stopped")
    }
}
