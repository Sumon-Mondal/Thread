import SwiftUI

public struct EmailComposerSheet: View {
    @EnvironmentObject var manager: ThreadSessionManager
    @Environment(\.dismiss) private var dismiss

    public let action: DemoAction

    @State private var toText: String
    @State private var subjectText: String
    @State private var bodyText: String
    @State private var isSending: Bool = false

    public init(action: DemoAction) {
        self.action = action
        let initialTo = action.emailTo ?? (action.link?.hasPrefix("mailto:") == true ? String(action.link!.dropFirst("mailto:".count)) : "shumonmondale@gmail.com")
        let initialSubject = action.emailSubject ?? (action.id == "a2" ? "Nova Dynamics Discovery Day — Follow-up & Portfolio" : "Follow-up: Nova Dynamics Discovery Day")
        let initialBody = action.emailBody ?? "Hi Sarah,\n\nThank you for hosting the Nova Dynamics Discovery Day session today! I loved hearing about the platform, infrastructure, and applied AI internship roles. I've submitted my application through the portal and attached my GitHub portfolio for reference.\n\nLooking forward to staying in touch,\nSumon Mondal"

        _toText = State(initialValue: initialTo)
        _subjectText = State(initialValue: initialSubject)
        _bodyText = State(initialValue: initialBody)
    }

    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.07, blue: 0.10)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // AI Badge & Context Pill
                        HStack(spacing: 8) {
                            HStack(spacing: 5) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 11, weight: .bold))
                                Text("AGENT DRAFTED")
                                    .font(.system(size: 10, weight: .black))
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.cyan.opacity(0.18))
                            .foregroundColor(Color(red: 0.0, green: 0.9, blue: 1.0))
                            .cornerRadius(6)

                            Text("Review & edit before sending")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.white.opacity(0.6))

                            Spacer()
                        }
                        .padding(.top, 4)

                        // Email Meta Container (To & Subject)
                        VStack(spacing: 1) {
                            // To Field
                            HStack(alignment: .center, spacing: 10) {
                                Text("To:")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.5))
                                    .frame(width: 58, alignment: .leading)

                                TextField("Recipient Email", text: $toText)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .keyboardType(.emailAddress)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(Color.white.opacity(0.04))

                            Divider().background(Color.white.opacity(0.08))

                            // Subject Field
                            HStack(alignment: .center, spacing: 10) {
                                Text("Subject:")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.5))
                                    .frame(width: 58, alignment: .leading)

                                TextField("Email Subject", text: $subjectText)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(Color.white.opacity(0.04))
                        }
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))

                        // Body Editor Container
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Message Body")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white.opacity(0.8))
                                Spacer()
                                Text("Editable text")
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundColor(.white.opacity(0.4))
                            }

                            TextEditor(text: $bodyText)
                                .font(.system(size: 13, weight: .regular))
                                .foregroundColor(.white)
                                .scrollContentBackground(.hidden)
                                .background(Color.black.opacity(0.35))
                                .frame(minHeight: 180)
                                .padding(10)
                                .background(Color.white.opacity(0.03))
                                .cornerRadius(10)
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.1), lineWidth: 1))
                        }

                        // Attachments Preview
                        VStack(alignment: .leading, spacing: 6) {
                            Text("ATTACHMENTS")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white.opacity(0.4))

                            HStack(spacing: 8) {
                                HStack(spacing: 4) {
                                    Image(systemName: "paperclip")
                                        .font(.system(size: 10))
                                    Text("Portfolio_Resume.pdf")
                                        .font(.system(size: 11, weight: .medium))
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color.white.opacity(0.06))
                                .foregroundColor(.cyan)
                                .cornerRadius(6)

                                HStack(spacing: 4) {
                                    Image(systemName: "link")
                                        .font(.system(size: 10))
                                    Text("Discovery_Day_Notes")
                                        .font(.system(size: 11, weight: .medium))
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color.white.opacity(0.06))
                                .foregroundColor(.white.opacity(0.7))
                                .cornerRadius(6)
                            }
                        }

                        // Action Buttons
                        VStack(spacing: 10) {
                            // Send Button
                            Button(action: {
                                isSending = true
                                UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                                manager.approveAction(
                                    id: action.id,
                                    customTo: toText,
                                    customSubject: subjectText,
                                    customBody: bodyText
                                )
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                                    dismiss()
                                }
                            }) {
                                HStack(spacing: 8) {
                                    if isSending {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Image(systemName: "paperplane.fill")
                                            .font(.system(size: 13, weight: .bold))
                                    }
                                    Text(isSending ? "Sending via Gmail…" : "Send Email via Gmail")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(LinearGradient(colors: [Color.teal, Color.cyan], startPoint: .leading, endPoint: .trailing))
                                .foregroundColor(.black)
                                .cornerRadius(12)
                                .shadow(color: Color.cyan.opacity(0.3), radius: 10, y: 3)
                            }
                            .disabled(isSending)

                            // Save Draft Button
                            Button(action: {
                                if let idx = manager.actions.firstIndex(where: { $0.id == action.id }) {
                                    manager.actions[idx].emailTo = toText
                                    manager.actions[idx].emailSubject = subjectText
                                    manager.actions[idx].emailBody = bodyText
                                }
                                manager.showNotification(text: "✓ Email draft saved")
                                UINotificationFeedbackGenerator().notificationOccurred(.success)
                                dismiss()
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "square.and.arrow.down")
                                    Text("Save Changes to Draft")
                                }
                                .font(.system(size: 12, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color.white.opacity(0.06))
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                        }
                        .padding(.top, 8)
                    }
                    .padding(16)
                }
            }
            .navigationBarTitle("Edit Email Draft", displayMode: .inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.7))
                }
            }
        }
    }
}
