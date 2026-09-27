import SwiftUI
import UniformTypeIdentifiers

public struct AgentView: View {
    @ObservedObject var manager = ThreadSessionManager.shared
    @State private var inputText = ""
    @State private var messages: [(role: String, text: String)] = [
        ("agent", "I'm Thread's autonomous meeting agent. Tell me what you need—I can read your resume, auto-fill applications, draft follow-up emails, or schedule events.")
    ]
    @State private var isDocumentPickerPresented = false
    @State private var attachedFileName: String? = nil
    @State private var isThinking = false

    public init() {}

    public var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.06, blue: 0.08)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Thread Agent")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                        Text("Autonomous Meeting Delegations")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                .padding(16)
                .background(Color(red: 0.07, green: 0.10, blue: 0.14).opacity(0.8))

                // Chat Log
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(messages.indices, id: \.self) { idx in
                            let msg = messages[idx]
                            HStack {
                                if msg.role == "user" { Spacer() }
                                GlassCard {
                                    Text(msg.text)
                                        .font(.system(size: 13))
                                        .foregroundColor(msg.role == "user" ? .white : .white.opacity(0.9))
                                }
                                .frame(maxWidth: 300, alignment: msg.role == "user" ? .trailing : .leading)
                                if msg.role == "agent" { Spacer() }
                            }
                        }

                        if isThinking {
                            HStack {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                                Text("Thread is analyzing meeting context…")
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                    .padding(16)
                }

                // Document Attachment Chip if present
                if let fileName = attachedFileName {
                    HStack {
                        Image(systemName: "doc.fill")
                            .foregroundColor(.blue)
                        Text(fileName)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: { attachedFileName = nil }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.15))
                }

                // Input Bar
                HStack(spacing: 10) {
                    Button(action: { isDocumentPickerPresented = true }) {
                        Image(systemName: "paperclip")
                            .font(.system(size: 18))
                            .foregroundColor(.secondary)
                    }

                    TextField("e.g. 'Fill internship app with my resume'…", text: $inputText)
                        .font(.system(size: 13))
                        .padding(10)
                        .background(Color.white.opacity(0.06))
                        .cornerRadius(10)
                        .foregroundColor(.white)

                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 26))
                            .foregroundColor(inputText.trimmingCharacters(in: .whitespaces).isEmpty ? .secondary : .blue)
                    }
                    .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(12)
                .background(Color(red: 0.07, green: 0.10, blue: 0.14))
            }
        }
        .sheet(isPresented: $isDocumentPickerPresented) {
            DocumentPicker(attachedFileName: $attachedFileName)
        }
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        inputText = ""
        messages.append(("user", text))
        isThinking = true

        Task {
            // Simulate agent analysis with backend API
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            isThinking = false
            if text.lowercased().contains("fill") || text.lowercased().contains("internship") || text.lowercased().contains("application") {
                messages.append(("agent", "I've matched your uploaded resume with Sarah Chen's requirements from Discovery Day. 18 of 18 fields are prepared: Python fundamentals, expected graduation Dec 2027, and GPA 3.9. Check the Cockpit Action Queue to approve and send!"))
            } else if text.lowercased().contains("email") {
                messages.append(("agent", "I drafted a thank-you email to Sarah Chen expressing your enthusiasm for the SWE internship. Staged in your Action Queue—ready for your 1-tap approval!"))
            } else {
                messages.append(("agent", "Processed. I've noted this from the live meeting context and added follow-up tasks to your calendar and action queue."))
            }
        }
    }
}

// iOS Native Document Picker for Resumes (PDF / DOCX)
struct DocumentPicker: UIViewControllerRepresentable {
    @Binding var attachedFileName: String?

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .text, .data], asCopy: true)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker

        init(_ parent: DocumentPicker) {
            self.parent = parent
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            parent.attachedFileName = url.lastPathComponent
        }
    }
}
