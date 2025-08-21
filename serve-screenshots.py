#!/usr/bin/env python3
"""
Simple HTTP server for serving app store screenshots
This solves CORS issues with local file access
"""

import http.server
import socketserver
import os
from pathlib import Path

# Configuration
PORT = 8888
SCREENSHOT_DIR = "/Users/jason/Documents/Zen Screen Shots For Appstore"
HTML_DIR = "/Users/jason/zen"

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_GET(self):
        # Route requests to appropriate directories
        if self.path.endswith('.png'):
            # Serve screenshot images
            filename = os.path.basename(self.path)
            full_path = os.path.join(SCREENSHOT_DIR, filename)
            if os.path.exists(full_path):
                self.path = full_path
                with open(full_path, 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/png')
                    self.end_headers()
                    self.wfile.write(f.read())
                return
        
        # Default behavior for other files
        super().do_GET()

# Start server
os.chdir(HTML_DIR)
with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print(f"🚀 Server running at http://localhost:{PORT}")
    print(f"📁 Serving files from: {HTML_DIR}")
    print(f"🖼️  Screenshots from: {SCREENSHOT_DIR}")
    print("\nOpen these URLs in your browser:")
    print(f"  • Calm version: http://localhost:{PORT}/app-store-screenshots-calm.html")
    print(f"  • Modern version: http://localhost:{PORT}/app-store-screenshots.html")
    print("\nPress Ctrl+C to stop the server")
    httpd.serve_forever()