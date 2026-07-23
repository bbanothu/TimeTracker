import Foundation
import UIKit
import WatchConnectivity

public final class WatchConnectivityManager: NSObject, WCSessionDelegate {
  public static let shared = WatchConnectivityManager()

  private var onRequest: (([String: Any]) -> Void)?
  private var latestState: [String: Any] = [
    "ready": false,
    "sessions": [],
    "tags": [],
  ]
  private var started = false

  private override init() {
    super.init()
  }

  /// Safe to call multiple times; always hops to main (WCSession requirement).
  public func start(onRequest: (([String: Any]) -> Void)? = nil) {
    if let onRequest {
      self.onRequest = onRequest
    }

    let work = { [weak self] in
      guard let self else { return }
      guard WCSession.isSupported() else {
        NSLog("[WatchBridge] WCSession not supported on this device")
        return
      }

      let session = WCSession.default
      if session.delegate !== self {
        session.delegate = self
      }
      if session.activationState == .notActivated {
        NSLog("[WatchBridge] activating WCSession…")
        session.activate()
      } else {
        NSLog(
          "[WatchBridge] already active=\(session.activationState.rawValue) reachable=\(session.isReachable) watchInstalled=\(session.isWatchAppInstalled)"
        )
        self.pushLatestState()
      }
      self.started = true
    }

    if Thread.isMainThread {
      work()
    } else {
      DispatchQueue.main.async(execute: work)
    }
  }

  public func setState(_ state: [String: Any]) {
    var safe = Self.propertyListSafe(state) as? [String: Any] ?? [
      "ready": false,
      "sessions": [],
      "tags": [],
    ]
    safe = Self.compressUserPhoto(in: safe)
    latestState = safe
    let photoLen = ((safe["user"] as? [String: Any])?["photoBase64"] as? String)?.count ?? 0
    NSLog(
      "[WatchBridge] setState ready=\(safe["ready"] ?? "?") tags=\((safe["tags"] as? [Any])?.count ?? -1) sessions=\((safe["sessions"] as? [Any])?.count ?? -1) photoChars=\(photoLen)"
    )
    start()
    pushLatestState()
  }

  /// Downscale avatar so applicationContext stays under WC size limits.
  private static func compressUserPhoto(in state: [String: Any]) -> [String: Any] {
    guard var user = state["user"] as? [String: Any],
          let b64 = user["photoBase64"] as? String,
          !b64.isEmpty,
          let data = Data(base64Encoded: b64),
          let image = UIImage(data: data)
    else {
      return state
    }

    let maxSide: CGFloat = 72
    let scale = min(1, maxSide / max(image.size.width, image.size.height, 1))
    let size = CGSize(width: max(1, image.size.width * scale), height: max(1, image.size.height * scale))
    let renderer = UIGraphicsImageRenderer(size: size)
    let thumb = renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: size))
    }
    guard let jpeg = thumb.jpegData(compressionQuality: 0.55) else {
      return state
    }

    var next = state
    user["photoBase64"] = jpeg.base64EncodedString()
    next["user"] = user
    return next
  }

  private func pushLatestState() {
    let work = { [weak self] in
      guard let self else { return }
      guard WCSession.isSupported() else { return }
      let session = WCSession.default
      guard session.activationState == .activated else {
        NSLog("[WatchBridge] defer push — not activated yet")
        return
      }

      do {
        try session.updateApplicationContext(self.latestState)
        NSLog("[WatchBridge] applicationContext updated")
      } catch {
        NSLog("[WatchBridge] updateApplicationContext failed: \(error.localizedDescription)")
      }

      if session.isReachable {
        session.sendMessage(self.latestState, replyHandler: nil) { error in
          NSLog("[WatchBridge] sendMessage state failed: \(error.localizedDescription)")
        }
      } else {
        NSLog("[WatchBridge] watch not reachable — context only")
      }
    }

    if Thread.isMainThread {
      work()
    } else {
      DispatchQueue.main.async(execute: work)
    }
  }

  public func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    if let error {
      NSLog("[WatchBridge] activation error: \(error.localizedDescription)")
    }
    NSLog(
      "[WatchBridge] activation complete state=\(activationState.rawValue) reachable=\(session.isReachable) watchInstalled=\(session.isWatchAppInstalled)"
    )
    if activationState == .activated {
      pushLatestState()
    }
  }

  public func sessionDidBecomeInactive(_ session: WCSession) {}

  public func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  public func sessionReachabilityDidChange(_ session: WCSession) {
    NSLog("[WatchBridge] reachability → \(session.isReachable)")
    if session.isReachable {
      pushLatestState()
    }
  }

  public func sessionWatchStateDidChange(_ session: WCSession) {
    NSLog("[WatchBridge] watchInstalled=\(session.isWatchAppInstalled)")
    pushLatestState()
  }

  public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    handle(message: message, replyHandler: nil)
  }

  public func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any],
    replyHandler: @escaping ([String: Any]) -> Void
  ) {
    handle(message: message, replyHandler: replyHandler)
  }

  public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    handle(message: userInfo, replyHandler: nil)
  }

  private func handle(message: [String: Any], replyHandler: (([String: Any]) -> Void)?) {
    let action = message["action"] as? String ?? ""
    NSLog("[WatchBridge] received action=\(action)")

    if action == "getState" {
      replyHandler?(latestState)
      return
    }

    DispatchQueue.main.async { [weak self] in
      self?.onRequest?(message)
    }
    replyHandler?(["ok": true])
  }

  private static func propertyListSafe(_ value: Any) -> Any? {
    if value is NSNull { return nil }
    if let dict = value as? [String: Any] {
      var out: [String: Any] = [:]
      for (key, nested) in dict {
        if let safe = propertyListSafe(nested) {
          out[key] = safe
        }
      }
      return out
    }
    if let array = value as? [Any] {
      return array.compactMap { propertyListSafe($0) }
    }
    if value is String || value is NSNumber || value is Date || value is Data {
      return value
    }
    return nil
  }
}
