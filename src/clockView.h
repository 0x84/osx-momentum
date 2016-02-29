//
//  clockView.h
//  clock
//
//  Created by Dylan on 2/26/16.
//  Copyright © 2016 Dylan. All rights reserved.
//

#import <ScreenSaver/ScreenSaver.h>
#import <WebKit/WebKit.h>
//#import <WebKit/WebPreferences.h>

@interface clockView : ScreenSaverView <NSAnimationDelegate>
{
    WebView *_webView;
    IBOutlet id configure;
    IBOutlet id configView;
}

- (NSWindow*)configureSheet;
- (IBAction)cancelOperation:(id)sender;
- (IBAction)resetOperation:(id)sender;
- (IBAction)hour12clock:(NSButton*)button;

@end

//@interface WebPreferences (WebPreferencesPrivate)
//- (void)_setLocalStorageDatabasePath:(NSString *)path;
//- (void) setLocalStorageEnabled: (BOOL) localStorageEnabled;
//@end
