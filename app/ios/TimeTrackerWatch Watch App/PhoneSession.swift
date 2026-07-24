import Combine
import Foundation
import WatchConnectivity

struct WatchTag: Identifiable, Equatable {
  let id: String
  let name: String
  let colorHex: String
}

struct WatchSession: Equatable {
  let id: String
  let label: String
  let colorHex: String
  let startedAt: TimeInterval
  let alarmAt: TimeInterval?
}

struct WatchHistoryItem: Identifiable, Equatable {
  let id: String
  let label: String
  let colorHex: String
  let durationMs: Double
}

struct WatchUser: Equatable {
  var name: String
  var initial: String
  var email: String
  var memberSince: String?
  var photoBase64: String?

  static let placeholder = WatchUser(
    name: "You",
    initial: "?",
    email: "",
    memberSince: nil,
    photoBase64: nil
  )
}

struct WatchAccount: Equatable {
  var calendarConnected: Bool
  var calendarSubtitle: String
  var autoTrackingOn: Bool
  var autoTrackingEnabled: Bool
  var autoTrackingSubtitle: String

  static let empty = WatchAccount(
    calendarConnected: false,
    calendarSubtitle: "",
    autoTrackingOn: false,
    autoTrackingEnabled: false,
    autoTrackingSubtitle: "Only tracks while the app is open"
  )
}

struct WatchSnapshot: Equatable {
  var ready: Bool
  var sessions: [WatchSession]
  var tags: [WatchTag]
  var history: [WatchHistoryItem]
  var user: WatchUser
  var account: WatchAccount
  /// Phone Track hero total at `trackedAt` (ms).
  var totalTrackingMs: Double
  var trackedAt: TimeInterval

  static let empty = WatchSnapshot(
    ready: false,
    sessions: [],
    tags: [],
    history: [],
    user: .placeholder,
    account: .empty,
    totalTrackingMs: 0,
    trackedAt: 0
  )

  /// Live total: phone snapshot plus wall-clock while sessions are running.
  func liveTotalTrackingMs(now: Date = Date()) -> Double {
    guard !sessions.isEmpty, trackedAt > 0 else { return totalTrackingMs }
    let driftMs = max(0, now.timeIntervalSince1970 * 1000 - trackedAt)
    return totalTrackingMs + driftMs
  }
}

final class PhoneSession: NSObject, ObservableObject {
  static let shared = PhoneSession()

  @Published var snapshot = WatchSnapshot.empty
  @Published var phoneReachable = false
  @Published var statusMessage: String? = "Connecting…"

  private var tickTimer: Timer?

  private override init() {
    super.init()
  }

  func activate() {
    guard WCSession.isSupported() else {
      statusMessage = "WatchConnectivity unavailable"
      return
    }
    let session = WCSession.default
    session.delegate = self
    if session.activationState == .notActivated {
      session.activate()
    } else {
      ingestContextIfAvailable()
      refresh()
    }
    startTicker()
  }

  func refresh() {
    ingestContextIfAvailable()

    let session = WCSession.default
    guard session.activationState == .activated else {
      statusMessage = "Connecting…"
      return
    }

    if session.isReachable {
      session.sendMessage(["action": "getState"], replyHandler: { [weak self] reply in
        DispatchQueue.main.async {
          self?.apply(reply)
        }
      }, errorHandler: { [weak self] error in
        DispatchQueue.main.async {
          self?.ingestContextIfAvailable()
          if self?.snapshot.tags.isEmpty == true {
            self?.statusMessage = error.localizedDescription
          }
        }
      })
    } else if snapshot.tags.isEmpty && !snapshot.ready {
      statusMessage = "Open iPhone app, then reopen Watch"
    }
  }

  func start(tagId: String) {
    sendCommand(["action": "start", "tagId": tagId])
  }

  func startAlarm(tagId: String, durationMinutes: Int) {
    sendCommand([
      "action": "startAlarm",
      "tagId": tagId,
      "durationMinutes": durationMinutes,
    ])
  }

  func logSession(tagId: String, startedAtMs: Double, endedAtMs: Double) {
    sendCommand([
      "action": "logSession",
      "tagId": tagId,
      "startedAt": startedAtMs,
      "endedAt": endedAtMs,
    ])
  }

  func stop(sessionId: String) {
    sendCommand(["action": "stop", "sessionId": sessionId])
  }

  func syncCalendar() {
    sendCommand(["action": "syncCalendar"])
  }

  func setAutoTracking(enabled: Bool) {
    sendCommand(["action": "setAutoTracking", "enabled": enabled])
  }

  func signOut() {
    sendCommand(["action": "signOut"])
  }

  func refreshAccount() {
    sendCommand(["action": "refreshAccount"])
  }

  private func startTicker() {
    tickTimer?.invalidate()
    tickTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
      DispatchQueue.main.async {
        self?.objectWillChange.send()
      }
    }
  }

  private func ingestContextIfAvailable() {
    let context = WCSession.default.receivedApplicationContext
    if !context.isEmpty {
      apply(context)
    }
  }

  private func sendCommand(_ message: [String: Any]) {
    let session = WCSession.default
    guard session.activationState == .activated else {
      statusMessage = "Open iPhone app"
      return
    }

    phoneReachable = session.isReachable

    if session.isReachable {
      session.sendMessage(message, replyHandler: { [weak self] _ in
        DispatchQueue.main.async {
          self?.refresh()
        }
      }, errorHandler: { _ in
        session.transferUserInfo(message)
      })
    } else {
      session.transferUserInfo(message)
      statusMessage = nil
    }
  }

  private func apply(_ payload: [String: Any]) {
    if payload["ok"] as? Bool == true, payload["ready"] == nil, payload["tags"] == nil {
      return
    }

    let ready = payload["ready"] as? Bool ?? false

    var sessions: [WatchSession] = []
    if let rawSessions = payload["sessions"] as? [[String: Any]] {
      sessions = rawSessions.compactMap(Self.parseSession)
    } else if let raw = payload["session"] as? [String: Any],
              let session = Self.parseSession(raw)
    {
      sessions = [session]
    }

    var tags: [WatchTag] = []
    if let rawTags = payload["tags"] as? [[String: Any]] {
      tags = rawTags.compactMap { item in
        guard let id = item["id"] as? String,
              let name = item["name"] as? String
        else { return nil }
        return WatchTag(
          id: id,
          name: name,
          colorHex: item["color"] as? String ?? "#FF9F0A"
        )
      }
    }

    var history: [WatchHistoryItem] = []
    if let rawHistory = payload["history"] as? [[String: Any]] {
      history = rawHistory.compactMap { item in
        guard let id = item["id"] as? String,
              let label = item["label"] as? String
        else { return nil }
        return WatchHistoryItem(
          id: id,
          label: label,
          colorHex: item["color"] as? String ?? "#FF9F0A",
          durationMs: Self.number(item["durationMs"]) ?? 0
        )
      }
    }

    var user = WatchUser.placeholder
    if let rawUser = payload["user"] as? [String: Any] {
      let name = (rawUser["name"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      let initial = (rawUser["initial"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      let email = (rawUser["email"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      let memberSince = (rawUser["memberSince"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      user = WatchUser(
        name: (name?.isEmpty == false ? name! : "You"),
        initial: (initial?.isEmpty == false ? String(initial!.prefix(1)).uppercased() : "?"),
        email: email ?? "",
        memberSince: (memberSince?.isEmpty == false ? memberSince : nil),
        photoBase64: rawUser["photoBase64"] as? String
      )
    }

    var account = WatchAccount.empty
    if let rawAccount = payload["account"] as? [String: Any] {
      account = WatchAccount(
        calendarConnected: rawAccount["calendarConnected"] as? Bool ?? false,
        calendarSubtitle: rawAccount["calendarSubtitle"] as? String ?? "",
        autoTrackingOn: rawAccount["autoTrackingOn"] as? Bool ?? false,
        autoTrackingEnabled: rawAccount["autoTrackingEnabled"] as? Bool ?? false,
        autoTrackingSubtitle: rawAccount["autoTrackingSubtitle"] as? String
          ?? "Only tracks while the app is open"
      )
    }

    snapshot = WatchSnapshot(
      ready: ready,
      sessions: sessions,
      tags: tags,
      history: history,
      user: user,
      account: account,
      totalTrackingMs: Self.number(payload["totalTrackingMs"]) ?? 0,
      trackedAt: Self.number(payload["trackedAt"]) ?? 0
    )
    phoneReachable = WCSession.default.isReachable
    if ready || !tags.isEmpty {
      statusMessage = nil
    } else if WCSession.default.activationState != .activated {
      statusMessage = "Connecting…"
    } else {
      statusMessage = "Open iPhone app, then reopen Watch"
    }
  }

  private static func parseSession(_ raw: [String: Any]) -> WatchSession? {
    guard let id = raw["id"] as? String,
          let label = raw["label"] as? String,
          let startedAt = epochSeconds(raw["startedAt"])
    else { return nil }
    return WatchSession(
      id: id,
      label: label,
      colorHex: raw["color"] as? String ?? "#FF9F0A",
      startedAt: startedAt,
      alarmAt: epochSeconds(raw["alarmAt"])
    )
  }

  private static func number(_ value: Any?) -> Double? {
    if value == nil || value is NSNull { return nil }
    if let number = value as? NSNumber { return number.doubleValue }
    if let number = value as? Double { return number }
    if let number = value as? Int { return Double(number) }
    return nil
  }

  private static func epochSeconds(_ value: Any?) -> TimeInterval? {
    guard let raw = number(value) else { return nil }
    return raw / 1000
  }
}

extension PhoneSession: WCSessionDelegate {
  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: (any Error)?
  ) {
    DispatchQueue.main.async {
      self.phoneReachable = session.isReachable
      if let error {
        self.statusMessage = error.localizedDescription
        return
      }
      self.ingestContextIfAvailable()
      self.refresh()
    }
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    DispatchQueue.main.async {
      self.phoneReachable = session.isReachable
      self.refresh()
    }
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    DispatchQueue.main.async {
      self.apply(applicationContext)
    }
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    DispatchQueue.main.async {
      self.apply(message)
    }
  }
}
