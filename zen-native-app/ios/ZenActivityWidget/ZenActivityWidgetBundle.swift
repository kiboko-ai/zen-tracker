//
//  ZenActivityWidgetBundle.swift
//  ZenActivityWidget
//
//  Created by michael on 9/2/25.
//

import WidgetKit
import SwiftUI

@main
struct ZenActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        ZenActivityWidget()
        ZenActivityWidgetControl()
        ZenActivityWidgetLiveActivity()
    }
}
