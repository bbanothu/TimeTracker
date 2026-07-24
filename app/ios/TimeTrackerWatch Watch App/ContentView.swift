import SwiftUI
import UIKit

struct ContentView: View {
  @EnvironmentObject private var phone: PhoneSession
  @State private var selectedTagId: String?

  var body: some View {
    NavigationStack {
      StartView(selectedTagId: $selectedTagId)
        .navigationDestination(for: WatchRoute.self) { route in
          switch route {
          case .sessions:
            SessionsView()
          case .tags:
            TagPickerView(selectedTagId: $selectedTagId)
          case .account:
            AccountView()
          case .history:
            HistoryView()
          case .alarm:
            DurationPickerView(
              title: "Start alarm",
              subtitle: "Ends with an alarm",
              minutesOptions: [15, 25, 45, 60],
              confirmLabel: "Start"
            ) { minutes in
              guard let tagId = selectedTagId else { return }
              phone.startAlarm(tagId: tagId, durationMinutes: minutes)
            }
          case .logSession:
            LogSessionView(tagId: selectedTagId)
          }
        }
        .onChange(of: phone.snapshot.tags) { _, tags in
          if selectedTagId == nil || !tags.contains(where: { $0.id == selectedTagId }) {
            selectedTagId = tags.first?.id
          }
        }
        .onAppear {
          // Only seed once — do not reset after returning from the tag picker.
          if selectedTagId == nil {
            selectedTagId = phone.snapshot.tags.first?.id
          }
          phone.refresh()
        }
    }
    .toolbarBackground(.hidden, for: .navigationBar)
  }
}

private enum WatchRoute: Hashable {
  case sessions
  case tags
  case account
  case history
  case alarm
  case logSession
}

/// Compact Track screen — mirrors the phone hero + start card.
private struct StartView: View {
  @EnvironmentObject private var phone: PhoneSession
  @Binding var selectedTagId: String?

  private var selectedTag: WatchTag? {
    phone.snapshot.tags.first(where: { $0.id == selectedTagId })
  }

  private var tagLabel: String {
    if let selectedTag { return selectedTag.name }
    if !phone.snapshot.ready { return "Waiting…" }
    return phone.snapshot.tags.isEmpty ? "No tags" : "Select tag"
  }

  private var canAct: Bool { selectedTagId != nil }

  var body: some View {
    VStack(spacing: 0) {
      topBar

      Spacer()
        .frame(maxHeight: 4)

      heroTimer

      startSessionCard
        .padding(.top, 3)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    .scenePadding(.horizontal)
    .padding(.vertical, 2)
    .watchAtmosphere()
  }

  private var topBar: some View {
    HStack(alignment: .center, spacing: 6) {
      NavigationLink(value: WatchRoute.account) {
        UserAvatarView(user: phone.snapshot.user, size: 22)
      }
      .buttonStyle(.plain)
      .accessibilityLabel("Account")

      Spacer(minLength: 0)

      NavigationLink(value: WatchRoute.sessions) {
        ZStack(alignment: .topTrailing) {
          Image(systemName: "line.3.horizontal.circle.fill")
            .font(.system(size: 18))
            .foregroundStyle(.white.opacity(0.9))
            .frame(width: 24, height: 24)

          if !phone.snapshot.sessions.isEmpty {
            Circle()
              .fill(Color.orange)
              .frame(width: 6, height: 6)
              .offset(x: 1, y: -1)
          }
        }
      }
      .buttonStyle(.plain)
      .accessibilityLabel("Active sessions")
    }
  }

  private var heroTimer: some View {
    VStack(spacing: 1) {
      Text(formatDuration(ms: phone.snapshot.liveTotalTrackingMs()))
        .font(.system(size: 26, weight: .light, design: .default))
        .monospacedDigit()
        .foregroundStyle(.white)
        .minimumScaleFactor(0.55)
        .lineLimit(1)

      if let status = phone.statusMessage, !phone.snapshot.ready {
        Text(status)
          .font(.system(size: 8))
          .foregroundStyle(.orange.opacity(0.9))
          .multilineTextAlignment(.center)
          .lineLimit(2)
      }
    }
    .frame(maxWidth: .infinity)
  }

  private var startSessionCard: some View {
    VStack(alignment: .leading, spacing: 5) {
      Text("START")
        .font(.system(size: 9, weight: .semibold))
        .foregroundStyle(.secondary)
        .tracking(0.5)

      HStack(spacing: 5) {
        taskSwitcher
        startButton
      }

      HStack(spacing: 5) {
        NavigationLink(value: WatchRoute.alarm) {
          secondaryActionLabel(title: "Alarm", systemImage: "alarm.fill")
        }
        .buttonStyle(.plain)
        .disabled(!canAct)
        .opacity(canAct ? 1 : 0.45)

        NavigationLink(value: WatchRoute.logSession) {
          secondaryActionLabel(title: "Log", systemImage: "plus.circle.fill")
        }
        .buttonStyle(.plain)
        .disabled(!canAct)
        .opacity(canAct ? 1 : 0.45)
      }
    }
    .padding(7)
    .background(
      RoundedRectangle(cornerRadius: 9, style: .continuous)
        .fill(Color.white.opacity(0.22))
    )
    .overlay(
      RoundedRectangle(cornerRadius: 9, style: .continuous)
        .stroke(Color.white.opacity(0.20), lineWidth: 1)
    )
  }

  /// Custom field (not system Picker) so watchOS won't draw the green focus border.
  private var taskSwitcher: some View {
    NavigationLink(value: WatchRoute.tags) {
      HStack(spacing: 5) {
        Circle()
          .fill(Color(hex: selectedTag?.colorHex ?? "#8E8E93"))
          .frame(width: 7, height: 7)

        Text(tagLabel)
          .font(.system(size: 12, weight: .medium))
          .foregroundStyle(.white)
          .lineLimit(1)

        Spacer(minLength: 0)

        Image(systemName: "chevron.down")
          .font(.system(size: 9, weight: .semibold))
          .foregroundStyle(.white.opacity(0.55))
      }
      .padding(.horizontal, 7)
      .padding(.vertical, 6)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(
        RoundedRectangle(cornerRadius: 6, style: .continuous)
          .fill(Color.black.opacity(0.50))
      )
    }
    .buttonStyle(.plain)
    .disabled(phone.snapshot.tags.isEmpty)
  }

  private var startButton: some View {
    Button {
      guard let tagId = selectedTagId else { return }
      phone.start(tagId: tagId)
    } label: {
      Image(systemName: "play.fill")
        .font(.system(size: 12, weight: .bold))
        .foregroundStyle(.black)
        .frame(width: 30, height: 30)
        .background(RoundedRectangle(cornerRadius: 7, style: .continuous).fill(Color.orange))
    }
    .buttonStyle(.plain)
    .disabled(!canAct)
    .opacity(canAct ? 1 : 0.45)
    .accessibilityLabel("Start")
  }

  private func secondaryActionLabel(title: String, systemImage: String) -> some View {
    HStack(spacing: 4) {
      Image(systemName: systemImage)
        .font(.system(size: 10, weight: .semibold))
      Text(title)
        .font(.system(size: 11, weight: .semibold))
        .lineLimit(1)
    }
    .foregroundStyle(.white)
    .frame(maxWidth: .infinity)
    .padding(.vertical, 7)
    .background(
      RoundedRectangle(cornerRadius: 6, style: .continuous)
        .fill(Color.black.opacity(0.40))
    )
  }
}

private struct DurationPickerView: View {
  @Environment(\.dismiss) private var dismiss

  let title: String
  let subtitle: String
  let minutesOptions: [Int]
  let confirmLabel: String
  let onConfirm: (Int) -> Void

  @State private var selectedMinutes: Int

  init(
    title: String,
    subtitle: String,
    minutesOptions: [Int],
    confirmLabel: String,
    onConfirm: @escaping (Int) -> Void
  ) {
    self.title = title
    self.subtitle = subtitle
    self.minutesOptions = minutesOptions
    self.confirmLabel = confirmLabel
    self.onConfirm = onConfirm
    _selectedMinutes = State(initialValue: minutesOptions.first ?? 15)
  }

  var body: some View {
    VStack(spacing: 6) {
      Text(subtitle)
        .font(.system(size: 10))
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)

      HStack(spacing: 4) {
        ForEach(minutesOptions, id: \.self) { minutes in
          Button {
            selectedMinutes = minutes
          } label: {
            Text("\(minutes)m")
              .font(.system(size: 11, weight: .semibold))
              .foregroundStyle(selectedMinutes == minutes ? .black : .white)
              .frame(maxWidth: .infinity)
              .padding(.vertical, 6)
              .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                  .fill(selectedMinutes == minutes ? Color.orange : Color.white.opacity(0.14))
              )
          }
          .buttonStyle(.plain)
        }
      }

      Button {
        onConfirm(selectedMinutes)
        dismiss()
      } label: {
        Text(confirmLabel)
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(.black)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 7)
          .background(
            RoundedRectangle(cornerRadius: 7, style: .continuous)
              .fill(Color.orange)
          )
      }
      .buttonStyle(.plain)
    }
    .padding(.horizontal, 4)
    .navigationTitle(title)
    .watchAtmosphere()
  }
}

/// Manual past session — Start/End rows open a time picker.
private struct LogSessionView: View {
  @EnvironmentObject private var phone: PhoneSession
  @Environment(\.dismiss) private var dismiss

  let tagId: String?

  @State private var startAt: Date
  @State private var endAt: Date
  @State private var errorMessage: String?

  init(tagId: String?) {
    self.tagId = tagId
    let calendar = Calendar.current
    let now = Date()
    let end = calendar.date(bySetting: .second, value: 0, of: now)
      ?? calendar.date(from: calendar.dateComponents([.year, .month, .day, .hour, .minute], from: now))
      ?? now
    let start = end.addingTimeInterval(-60 * 60)
    _startAt = State(initialValue: start)
    _endAt = State(initialValue: end)
  }

  private var isValid: Bool {
    endAt > startAt
  }

  var body: some View {
    VStack(spacing: 6) {
      NavigationLink {
        LogTimePickerView(title: "Start", date: $startAt)
      } label: {
        timeInputRow(label: "Start", date: startAt)
      }
      .buttonStyle(.plain)

      NavigationLink {
        LogTimePickerView(title: "End", date: $endAt)
      } label: {
        timeInputRow(label: "End", date: endAt)
      }
      .buttonStyle(.plain)

      if let errorMessage {
        Text(errorMessage)
          .font(.system(size: 10))
          .foregroundStyle(.red)
      } else if !isValid {
        Text("End must be after start")
          .font(.system(size: 10))
          .foregroundStyle(.orange)
      }

      Button {
        guard let tagId else {
          errorMessage = "Select a tag first"
          return
        }
        guard isValid else {
          errorMessage = "End must be after start"
          return
        }
        errorMessage = nil
        phone.logSession(
          tagId: tagId,
          startedAtMs: startAt.timeIntervalSince1970 * 1000,
          endedAtMs: endAt.timeIntervalSince1970 * 1000
        )
        dismiss()
      } label: {
        Text("Log")
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(.black)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 7)
          .background(
            RoundedRectangle(cornerRadius: 7, style: .continuous)
              .fill(isValid && tagId != nil ? Color.orange : Color.orange.opacity(0.4))
          )
      }
      .buttonStyle(.plain)
      .disabled(!isValid || tagId == nil)
    }
    .padding(.horizontal, 2)
    .navigationTitle("Log session")
    .watchAtmosphere()
    .onChange(of: startAt) { _, newStart in
      if endAt <= newStart {
        endAt = newStart.addingTimeInterval(15 * 60)
      }
      errorMessage = nil
    }
  }

  private func timeInputRow(label: String, date: Date) -> some View {
    HStack(spacing: 6) {
      Text(label)
        .font(.system(size: 11, weight: .semibold))
        .foregroundStyle(.secondary)
      Spacer(minLength: 4)
      Text(Self.formatTime(date))
        .font(.system(size: 12, weight: .medium).monospacedDigit())
        .foregroundStyle(.white)
      Image(systemName: "chevron.right")
        .font(.system(size: 9, weight: .semibold))
        .foregroundStyle(.white.opacity(0.45))
    }
    .padding(.horizontal, 8)
    .padding(.vertical, 8)
    .background(
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(Color.white.opacity(0.14))
    )
  }

  private static func formatTime(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "MMM d · h:mm a"
    return formatter.string(from: date)
  }
}

private struct LogTimePickerView: View {
  enum Mode: Hashable {
    case time
    case date
  }

  let title: String
  @Binding var date: Date
  @Environment(\.dismiss) private var dismiss

  @State private var mode: Mode = .time
  @FocusState private var crownFocused: Bool
  @State private var crownValue: Double = 0

  var body: some View {
    VStack(spacing: 6) {
      HStack(spacing: 4) {
        modeChip("Time", .time)
        modeChip("Date", .date)
      }

      Text(mode == .time ? timeLabel : dateLabel)
        .font(.system(size: 20, weight: .medium).monospacedDigit())
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(Color.white.opacity(0.10))
        )
        .overlay(
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .stroke(crownFocused ? Color.white : Color.gray.opacity(0.55), lineWidth: 1.5)
        )
        .contentShape(Rectangle())
        .focusable(true)
        .focused($crownFocused)
        .digitalCrownRotation(
          $crownValue,
          from: mode == .time ? 0 : -365,
          through: mode == .time ? 24 * 60 - 1 : 365,
          by: 1,
          sensitivity: .medium,
          isContinuous: mode == .time,
          isHapticFeedbackEnabled: true
        )
        .onChange(of: crownValue) { _, newValue in
          applyCrown(newValue)
        }
        .onChange(of: mode) { _, newMode in
          crownValue = newMode == .time ? minuteOfDay(from: date) : dayOffset(from: date)
          crownFocused = true
        }
        .onAppear {
          crownValue = minuteOfDay(from: date)
          crownFocused = true
        }

      Text(mode == .time ? "Turn Digital Crown" : "Crown changes day")
        .font(.system(size: 9))
        .foregroundStyle(.secondary)

      Button {
        dismiss()
      } label: {
        Text("Done")
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(.black)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 7)
          .background(
            RoundedRectangle(cornerRadius: 7, style: .continuous)
              .fill(Color.orange)
          )
      }
      .buttonStyle(.plain)
    }
    .padding(.horizontal, 2)
    .navigationTitle(title)
    .watchAtmosphere()
  }

  private var timeLabel: String {
    let formatter = DateFormatter()
    formatter.dateFormat = "h:mm a"
    return formatter.string(from: date)
  }

  private var dateLabel: String {
    let formatter = DateFormatter()
    formatter.dateFormat = "EEE, MMM d"
    return formatter.string(from: date)
  }

  private func modeChip(_ title: String, _ value: Mode) -> some View {
    let selected = mode == value
    return Button {
      mode = value
    } label: {
      Text(title)
        .font(.system(size: 11, weight: .semibold))
        .foregroundStyle(selected ? .white : .secondary)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(
          RoundedRectangle(cornerRadius: 6, style: .continuous)
            .fill(Color.white.opacity(selected ? 0.14 : 0.06))
        )
        .overlay(
          RoundedRectangle(cornerRadius: 6, style: .continuous)
            .stroke(selected ? Color.white : Color.gray.opacity(0.55), lineWidth: 1.5)
        )
    }
    .buttonStyle(.plain)
  }

  private func minuteOfDay(from date: Date) -> Double {
    let comps = Calendar.current.dateComponents([.hour, .minute], from: date)
    return Double((comps.hour ?? 0) * 60 + (comps.minute ?? 0))
  }

  private func dayOffset(from date: Date) -> Double {
    let calendar = Calendar.current
    let from = calendar.startOfDay(for: Date())
    let to = calendar.startOfDay(for: date)
    return Double(calendar.dateComponents([.day], from: from, to: to).day ?? 0)
  }

  private func applyCrown(_ value: Double) {
    let calendar = Calendar.current
    if mode == .time {
      let total = Int(value.rounded())
      let normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
      let hour = normalized / 60
      let minute = normalized % 60
      var comps = calendar.dateComponents([.year, .month, .day], from: date)
      comps.hour = hour
      comps.minute = minute
      comps.second = 0
      if let next = calendar.date(from: comps) {
        date = next
      }
    } else {
      let dayDelta = Int(value.rounded())
      let base = calendar.startOfDay(for: Date())
      let timeComps = calendar.dateComponents([.hour, .minute], from: date)
      guard let day = calendar.date(byAdding: .day, value: dayDelta, to: base) else { return }
      var comps = calendar.dateComponents([.year, .month, .day], from: day)
      comps.hour = timeComps.hour
      comps.minute = timeComps.minute
      comps.second = 0
      if let next = calendar.date(from: comps) {
        date = next
      }
    }
  }
}

private struct AccountView: View {
  @EnvironmentObject private var phone: PhoneSession
  @State private var syncingCalendar = false

  private var account: WatchAccount { phone.snapshot.account }
  private var user: WatchUser { phone.snapshot.user }

  var body: some View {
    List {
      Section {
        HStack(alignment: .top, spacing: 8) {
          UserAvatarView(user: user, size: 36)

          VStack(alignment: .leading, spacing: 2) {
            Text(user.name)
              .font(.caption.weight(.semibold))
              .foregroundStyle(.white)
              .lineLimit(1)
            if !user.email.isEmpty {
              Text(user.email)
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
            if let memberSince = user.memberSince {
              Text("Member since \(memberSince)")
                .font(.system(size: 9))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
        }
        .listRowBackground(WatchCardBackground())
      }

      Section {
        NavigationLink(value: WatchRoute.history) {
          accountRow(
            icon: "clock.fill",
            color: Color(hex: "#5856D6"),
            title: "History"
          )
        }
        .listRowBackground(WatchCardBackground())

        Toggle(isOn: Binding(
          get: { account.autoTrackingOn },
          set: { phone.setAutoTracking(enabled: $0) }
        )) {
          accountRow(
            icon: "location.north.line.fill",
            color: Color(hex: "#34C759"),
            title: "Auto tracking",
            subtitle: account.autoTrackingSubtitle
          )
        }
        .disabled(!account.autoTrackingEnabled)
        .tint(.orange)
        .listRowBackground(WatchCardBackground())
      }

      if account.calendarConnected {
        Section {
          Button {
            syncingCalendar = true
            phone.syncCalendar()
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
              syncingCalendar = false
            }
          } label: {
            HStack {
              accountRow(
                icon: "calendar",
                color: Color(hex: "#FF9500"),
                title: "Sync to Calendar",
                subtitle: account.calendarSubtitle
              )
              if syncingCalendar {
                ProgressView()
                  .scaleEffect(0.7)
              }
            }
          }
          .buttonStyle(.plain)
          .listRowBackground(WatchCardBackground())
        }
      }

      Section {
        Button(role: .destructive) {
          phone.signOut()
        } label: {
          accountRow(
            icon: "rectangle.portrait.and.arrow.right",
            color: Color(hex: "#FF3B30"),
            title: "Sign out"
          )
        }
        .listRowBackground(WatchCardBackground())
      }
    }
    .navigationTitle("Account")
    .scenePadding(.horizontal)
    .watchAtmosphere()
    .onAppear {
      phone.refreshAccount()
    }
  }

  private func accountRow(
    icon: String,
    color: Color,
    title: String,
    subtitle: String? = nil
  ) -> some View {
    HStack(spacing: 8) {
      Image(systemName: icon)
        .font(.system(size: 12, weight: .semibold))
        .foregroundStyle(color)
        .frame(width: 18)

      VStack(alignment: .leading, spacing: 1) {
        Text(title)
          .font(.caption.weight(.medium))
          .foregroundStyle(.white)
        if let subtitle, !subtitle.isEmpty {
          Text(subtitle)
            .font(.system(size: 9))
            .foregroundStyle(.secondary)
            .lineLimit(2)
        }
      }
    }
  }
}

private struct HistoryView: View {
  @EnvironmentObject private var phone: PhoneSession

  var body: some View {
    Group {
      if phone.snapshot.history.isEmpty {
        VStack(spacing: 6) {
          Image(systemName: "clock")
            .foregroundStyle(.secondary)
          Text("No sessions today")
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        List {
          ForEach(phone.snapshot.history) { item in
            HStack(spacing: 6) {
              Circle()
                .fill(Color(hex: item.colorHex))
                .frame(width: 6, height: 6)
              Text(item.label)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
              Spacer(minLength: 2)
              Text(formatDuration(ms: item.durationMs))
                .font(.caption.monospacedDigit())
                .foregroundStyle(.secondary)
            }
            .listRowBackground(WatchCardBackground())
            .listRowInsets(EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8))
          }
        }
        .listStyle(.plain)
      }
    }
    .navigationTitle("History")
    .scenePadding(.horizontal)
    .watchAtmosphere()
  }
}

private struct SessionsView: View {
  @EnvironmentObject private var phone: PhoneSession

  var body: some View {
    Group {
      if phone.snapshot.sessions.isEmpty {
        VStack(spacing: 6) {
          Image(systemName: "moon.zzz.fill")
            .foregroundStyle(.secondary)
          Text("No active sessions")
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        List {
          ForEach(phone.snapshot.sessions, id: \.id) { session in
            HStack(spacing: 4) {
              Circle()
                .fill(Color(hex: session.colorHex))
                .frame(width: 5, height: 5)

              Text(session.label)
                .font(.system(size: 11, weight: .semibold))
                .lineLimit(1)

              Spacer(minLength: 2)

              Text(formatSessionElapsed(startedAt: session.startedAt))
                .font(.system(size: 10).monospacedDigit())
                .foregroundStyle(.secondary)

              Button {
                phone.stop(sessionId: session.id)
              } label: {
                Image(systemName: "stop.fill")
                  .font(.system(size: 8, weight: .bold))
                  .foregroundStyle(.white)
                  .frame(width: 18, height: 18)
                  .background(RoundedRectangle(cornerRadius: 4).fill(Color.red))
              }
              .buttonStyle(.plain)
              .accessibilityLabel("Stop \(session.label)")
            }
            .listRowBackground(WatchCardBackground())
            .listRowInsets(EdgeInsets(top: 2, leading: 4, bottom: 2, trailing: 4))
          }
        }
        .listStyle(.plain)
      }
    }
    .navigationTitle("Sessions")
    .scenePadding(.horizontal)
    .watchAtmosphere()
    .onAppear {
      phone.refresh()
    }
  }

  private func formatSessionElapsed(startedAt: TimeInterval) -> String {
    formatDuration(ms: max(0, Date().timeIntervalSince1970 - startedAt) * 1000)
  }
}

private struct TagPickerView: View {
  @EnvironmentObject private var phone: PhoneSession
  @Binding var selectedTagId: String?
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    List {
      ForEach(phone.snapshot.tags) { tag in
        Button {
          selectedTagId = tag.id
          dismiss()
        } label: {
          HStack(spacing: 5) {
            Circle()
              .fill(Color(hex: tag.colorHex))
              .frame(width: 5, height: 5)
            Text(tag.name)
              .font(.system(size: 11, weight: .medium))
              .foregroundStyle(.white)
              .lineLimit(1)
            Spacer(minLength: 2)
            if selectedTagId == tag.id {
              Image(systemName: "checkmark")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.orange)
            }
          }
        }
        .listRowBackground(WatchCardBackground())
        .listRowInsets(EdgeInsets(top: 2, leading: 4, bottom: 2, trailing: 4))
      }
    }
    .navigationTitle("Tag")
    .scenePadding(.horizontal)
    .watchAtmosphere()
  }
}

private struct UserAvatarView: View {
  let user: WatchUser
  let size: CGFloat

  var body: some View {
    ZStack {
      Circle()
        .fill(Color.white.opacity(0.12))

      if let data = Data(base64Encoded: user.photoBase64 ?? ""),
         let image = UIImage(data: data)
      {
        Image(uiImage: image)
          .resizable()
          .scaledToFill()
          .clipShape(Circle())
      } else {
        Text(user.initial)
          .font(.system(size: size * 0.42, weight: .bold))
          .foregroundStyle(.white)
      }
    }
    .frame(width: size, height: size)
  }
}

/// Soft card behind list rows (Account / Tags / Sessions / History).
private struct WatchCardBackground: View {
  var body: some View {
    RoundedRectangle(cornerRadius: 8, style: .continuous)
      .fill(Color.white.opacity(0.16))
      .padding(.vertical, 1)
  }
}

/// Matches phone atmosphere: photo still visible, ~50% soft blur.
private struct AppAtmosphereBackground: View {
  var body: some View {
    ZStack {
      Image("AppBackground")
        .resizable()
        .scaledToFill()
        .scaleEffect(1.08)
        .blur(radius: 8)
        .ignoresSafeArea()

      // Light wash only — keep the image readable, not blacked out.
      Color.black.opacity(0.28)
        .ignoresSafeArea()
    }
  }
}

private extension View {
  func watchAtmosphere() -> some View {
    self
      .scrollContentBackground(.hidden)
      .background {
        AppAtmosphereBackground()
      }
      .containerBackground(for: .navigation) {
        AppAtmosphereBackground()
      }
  }
}

private func formatDuration(ms: Double) -> String {
  let totalSeconds = max(0, Int(ms / 1000))
  let hours = totalSeconds / 3600
  let minutes = (totalSeconds % 3600) / 60
  let seconds = totalSeconds % 60
  if hours > 0 {
    return String(format: "%d:%02d:%02d", hours, minutes, seconds)
  }
  return String(format: "%d:%02d", minutes, seconds)
}

private extension Color {
  init(hex: String) {
    let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var value: UInt64 = 0
    Scanner(string: cleaned).scanHexInt64(&value)
    let r, g, b: Double
    if cleaned.count == 6 {
      r = Double((value >> 16) & 0xFF) / 255
      g = Double((value >> 8) & 0xFF) / 255
      b = Double(value & 0xFF) / 255
    } else {
      r = 1; g = 0.62; b = 0.04
    }
    self.init(red: r, green: g, blue: b)
  }
}

#Preview {
  ContentView()
    .environmentObject(PhoneSession.shared)
}
