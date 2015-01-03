/**
 * Copyright 2014 Okode | www.okode.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import UIKit
import AVFoundation

class ViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()

        startCamera()
        
        var webview = UIWebView(frame: view.bounds)
        webview.opaque = false
        webview.backgroundColor = UIColor.clearColor()
        view.addSubview(webview)
        var url = NSBundle.mainBundle().URLForResource("form", withExtension: "html", subdirectory: "html")
        webview.loadRequest(NSURLRequest(URL: url!))
        
        webview = UIWebView(frame: view.bounds)
        webview.opaque = false
        webview.backgroundColor = UIColor.clearColor()
        webview.userInteractionEnabled = false
        view.addSubview(webview)
        url = NSBundle.mainBundle().URLForResource("animation", withExtension: "html", subdirectory: "html")
        webview.loadRequest(NSURLRequest(URL: url!))
    }
    
    override func prefersStatusBarHidden() -> Bool {
        return true
    }

    func startCamera() {
        let session = AVCaptureSession()
        session.sessionPreset = AVCaptureSessionPresetPhoto
        
        let captureVideoPreviewLayer = AVCaptureVideoPreviewLayer(session: session)
        captureVideoPreviewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill
        captureVideoPreviewLayer.frame = view.bounds;
        view.layer.addSublayer(captureVideoPreviewLayer)
        view.layer.masksToBounds = true
        
        for device: AVCaptureDevice in AVCaptureDevice.devices() as [AVCaptureDevice] {
            if device.hasMediaType(AVMediaTypeVideo) && device.position == AVCaptureDevicePosition.Front {
                var error: NSError?
                let input = AVCaptureDeviceInput(device: device, error: &error)
                session.addInput(input)
                session.startRunning()
            }
        }
    }

}

