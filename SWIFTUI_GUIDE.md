# KrindBudget — SwiftUI Development Guide

This document captures what the web app does, how it maps to Swift/SwiftUI, and
the exact steps to get a working native project running on your M3 Mac.

---

## Prerequisites

| Tool | Where to get |
|------|-------------|
| Xcode 16+ | App Store |
| iOS Simulator 18+ | Included in Xcode |
| Swift 6 | Bundled with Xcode |
| (optional) Cursor / Xcode AI | For AI-assisted coding |

No Homebrew or Node.js needed for the native project.

---

## Create the Xcode project

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App**
3. Settings:
   - Product Name: `KrindBudget`
   - Interface: **SwiftUI**
   - Storage: **SwiftData** ← replaces localStorage
   - Include Tests: yes
4. Choose a location (anywhere outside this web repo)
5. Click **Create**

---

## Data model — direct mapping from the web types

Every TypeScript type in `src/types.ts` becomes a SwiftData `@Model` class.

```swift
// Transaction.swift
import SwiftData

@Model
final class Transaction {
    var id: String
    var date: Date
    var amount: Double
    var category: String
    var note: String          // was "description" — reserved word in Swift

    init(date: Date, amount: Double, category: String, note: String) {
        self.id = UUID().uuidString
        self.date = date
        self.amount = amount
        self.category = category
        self.note = note
    }
}

// RecurringItem.swift
@Model
final class RecurringItem {
    var id: String
    var startDate: Date
    var amount: Double
    var category: String
    var note: String
    var frequencyType: String   // "days" | "months" | "years"
    var frequencyValue: Int

    init(startDate: Date, amount: Double, category: String,
         note: String, frequencyType: String, frequencyValue: Int) {
        self.id = UUID().uuidString
        self.startDate = startDate
        self.amount = amount
        self.category = category
        self.note = note
        self.frequencyType = frequencyType
        self.frequencyValue = frequencyValue
    }
}

// CategoryConfig.swift
@Model
final class CategoryConfig {
    var id: String
    var name: String
    var colorHex: String        // store as "#f59e0b" — convert to Color on display

    init(name: String, colorHex: String) {
        self.id = UUID().uuidString
        self.name = name
        self.colorHex = colorHex
    }
}

// Budget.swift — replaces BudgetsByMonth (month key + category → amount)
@Model
final class Budget {
    var monthKey: String        // "2026-06"
    var category: String
    var amount: Double

    init(monthKey: String, category: String, amount: Double) {
        self.monthKey = monthKey
        self.category = category
        self.amount = amount
    }
}
```

SwiftData handles persistence to SQLite automatically — no localStorage or
JSON serialization to write.

---

## Recurring billing logic (port from BudgetContext.tsx)

The key math lives in `recurringOccurrencesForMonth` in the web app.
Port it as a pure Swift function:

```swift
// RecurringLogic.swift
import Foundation

func recurringOccurrences(item: RecurringItem, year: Int, month: Int) -> [Transaction] {
    var results: [Transaction] = []
    let cal = Calendar(identifier: .gregorian)
    guard let startDate = item.startDate as Date? else { return [] }

    if item.frequencyType == "days" {
        let daysInMonth = cal.range(of: .day, in: .month,
                                    for: DateComponents(calendar: cal, year: year, month: month).date!)!.count
        for d in 1...daysInMonth {
            let checkDate = DateComponents(calendar: cal, year: year, month: month, day: d).date!
            let diff = Int(checkDate.timeIntervalSince(startDate) / 86_400)
            if diff >= 0 && diff % item.frequencyValue == 0 {
                results.append(Transaction(date: checkDate, amount: item.amount,
                                           category: item.category, note: item.note))
            }
        }
    } else if item.frequencyType == "months" {
        let sc = cal.dateComponents([.year, .month, .day], from: startDate)
        let diff = (year - sc.year!) * 12 + (month - sc.month!)
        if diff >= 0 && diff % item.frequencyValue == 0 {
            let maxDay = cal.range(of: .day, in: .month,
                                   for: DateComponents(calendar: cal, year: year, month: month).date!)!.count
            let day = min(sc.day!, maxDay)
            let date = DateComponents(calendar: cal, year: year, month: month, day: day).date!
            results.append(Transaction(date: date, amount: item.amount,
                                       category: item.category, note: item.note))
        }
    }
    // years: similar to months, check year % frequencyValue == 0 and same month
    return results
}
```

---

## App structure (mirrors web routes)

| Web route | SwiftUI view |
|-----------|-------------|
| `/` (TransactionsPage) | `TransactionsView` — default tab |
| `/month/:month` | `MonthView(month:)` |
| `/year` | `YearOverviewView` |
| `/recurring` | `RecurringView` |
| `/settings` | `SettingsView` |

Navigation uses SwiftUI's `TabView` (bottom) + `NavigationStack` for month drill-down:

```swift
// ContentView.swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            TransactionsView()
                .tabItem { Label("Transactions", systemImage: "list.bullet.rectangle") }
            RecurringView()
                .tabItem { Label("Recurring", systemImage: "arrow.clockwise") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}
```

For the month tabs, use a `ScrollView(.horizontal)` + `HStack` of buttons —
the same slider pattern as the web TopBar.

---

## iCloud sync (free, no backend)

SwiftData + CloudKit gives you cross-device sync with one line:

```swift
// KrindBudgetApp.swift
import SwiftUI
import SwiftData

@main
struct KrindBudgetApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Transaction.self, RecurringItem.self,
                               CategoryConfig.self, Budget.self],
                        cloudKitContainerIdentifier: "iCloud.com.yourname.KrindBudget")
    }
}
```

Enable iCloud in Xcode → Signing & Capabilities → CloudKit.

---

## Siri / App Intents (the killer feature)

Define an intent for voice-driven entry:

```swift
// AddExpenseIntent.swift
import AppIntents
import SwiftData

struct AddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Add Expense"
    static var description = IntentDescription("Log an expense to KrindBudget")

    @Parameter(title: "Amount") var amount: Double
    @Parameter(title: "Category") var category: String
    @Parameter(title: "Description") var note: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Insert into SwiftData here
        let tx = Transaction(date: .now, amount: amount, category: category, note: note)
        // modelContext.insert(tx) — inject modelContext via @Dependency
        return .result(dialog: "Added $\(amount) to \(category)")
    }
}
```

Register it in the app target. Siri, Shortcuts, and Spotlight pick it up automatically.
With Apple Intelligence on iPhone 16 / M-series, the intent also surfaces in
on-screen awareness and action buttons.

---

## Run locally on M3 Mac

```bash
# 1. Open the Xcode project
open KrindBudget.xcodeproj

# 2. Choose a simulator target, e.g.:
#    Product → Destination → iPhone 16 Pro (iOS 18.x)

# 3. Run
Cmd + R

# 4. Or run on your physical iPhone (requires free Apple ID)
#    Connect iPhone → trust the Mac → select it as destination → Cmd+R
```

The web app (`npm run dev`) and the native Xcode project are completely
independent — run them side by side during the transition.

---

## Recommended build order

1. Models + seed data (SwiftData, no UI)
2. `TransactionsView` — list + add form (the home screen)
3. `MonthView` — budget table + transactions  
4. `RecurringView` — same recurring logic ported to Swift
5. Charts — use **Swift Charts** (built into iOS 16+, no package needed)
6. iCloud sync — one-line addition once models are stable
7. App Intents / Siri — add last; depends on stable model layer
