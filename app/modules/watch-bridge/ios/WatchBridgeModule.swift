import ExpoModulesCore
import WatchConnectivity

public class WatchBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchBridge")

    Events("onWatchRequest")

    OnCreate {
      DispatchQueue.main.async {
        WatchConnectivityManager.shared.start { [weak self] request in
          self?.sendEvent("onWatchRequest", request)
        }
      }
    }

    Function("setState") { (state: [String: Any]) in
      WatchConnectivityManager.shared.setState(state)
    }

    Function("isSupported") { () -> Bool in
      WCSession.isSupported()
    }

    Function("isReachable") { () -> Bool in
      guard WCSession.isSupported() else { return false }
      return WCSession.default.isReachable
    }

    Function("isWatchAppInstalled") { () -> Bool in
      guard WCSession.isSupported() else { return false }
      return WCSession.default.isWatchAppInstalled
    }

    Function("activationState") { () -> Int in
      guard WCSession.isSupported() else { return -1 }
      return WCSession.default.activationState.rawValue
    }
  }
}
