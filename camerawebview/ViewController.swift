//
//  ViewController.swift
//  camerawebview
//
//  Created by Pedro Jorquera on 22/10/14.
//  Copyright (c) 2014 Okode. All rights reserved.
//

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

