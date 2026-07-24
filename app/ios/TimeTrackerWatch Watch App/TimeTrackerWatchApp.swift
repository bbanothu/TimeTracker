import SwiftUI

@main
struct TimeTrackerWatch_Watch_AppApp: App {
  @ObservedObject private var phone = PhoneSession.shared

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(phone)
        .onAppear {
          phone.activate()
        }
    }
  }
}
