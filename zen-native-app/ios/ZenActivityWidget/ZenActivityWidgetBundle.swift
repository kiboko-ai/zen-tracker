//
//  ZenActivityWidgetBundle.swift
//  ZenActivityWidget
//
//  Created by michael on 9/2/25.
//  Modified on 1/3/25 - Live Activity only implementation
//

import WidgetKit
import SwiftUI

@main
struct ZenActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        // Live Activity만 남김 (홈 스크린 위젯과 Control 위젯 제거)
        // Home screen widget and Control widget removed for cleaner Live Activity implementation
        ZenActivityWidgetLiveActivity()
    }
}
