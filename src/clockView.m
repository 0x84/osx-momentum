//
//  clockView.m
//  clock
//
//  Created by Dylan on 2/26/16.
//  Copyright © 2016 Dylan. All rights reserved.
//

#import "clockView.h"

@implementation clockView

- (instancetype)initWithFrame:(NSRect)frame isPreview:(BOOL)isPreview
{
    self = [super initWithFrame:frame isPreview:isPreview];
    if (self) {
        _webView = [[WebView alloc] initWithFrame:[self bounds]];
//        WebPreferences* prefs = [WebPreferences standardPreferences];
//        [prefs setLocalStorageEnabled:YES];
//        [_webView setPreferences:prefs];
        [self setAutoresizingMask:NSViewWidthSizable|NSViewHeightSizable];
        [self setAutoresizesSubviews:YES];
    }
    return self;
}

- (void)startAnimation
{
    [super startAnimation];
    
    [_webView setMainFrameURL:[NSString stringWithFormat:@"file://%@/res/dashboard.html", [[NSBundle bundleForClass:[self class]] resourcePath]]];
    [_webView setFrameLoadDelegate: self];
    [_webView setShouldUpdateWhileOffscreen:YES];
    [_webView setDrawsBackground:NO];
    [_webView setAlphaValue:0.0];
    
    [self addSubview:_webView];
}

- (void)stopAnimation
{
    [super stopAnimation];
}

- (void)drawRect:(NSRect)rect
{
    [super drawRect:rect];
}

- (void)animateOneFrame
{
    return;
}

- (BOOL)hasConfigureSheet
{
    return YES;
}

- (NSWindow*)configureSheet
{
    if (configure == nil)
    {
        if (![NSBundle loadNibNamed:@"Options" owner:self]) {
            NSLog( @"Failed to load configure sheet." );
        }
        [configView setMainFrameURL:[NSString stringWithFormat:@"file://%@/res/dashboard.html#option", [[NSBundle bundleForClass:[self class]] resourcePath]]];
    }
    return configure;
}

- (void)webView:(WebView *)webView didFinishLoadForFrame:(WebFrame *)frame
{
    if (frame == [_webView mainFrame])
    {
        NSDictionary *attrs = [NSDictionary dictionaryWithObjectsAndKeys:
                               _webView, NSViewAnimationTargetKey,
                               NSViewAnimationFadeInEffect, NSViewAnimationEffectKey,
                               nil];
        
        NSViewAnimation *anim = [[NSViewAnimation alloc] initWithViewAnimations:[NSArray arrayWithObjects: attrs, nil]];
        
        [anim setDuration:0.5];
        [anim setAnimationCurve:NSAnimationEaseInOut];
        [anim setAnimationBlockingMode:NSAnimationBlocking];
        [anim setDelegate:self];
        [anim startAnimation];
    }
}

- (void)animationDidEnd:(NSAnimation *)animation
{
    [_webView setAlphaValue:1.0];
}

- (IBAction)cancelOperation:(id)sender
{
    [[NSApplication sharedApplication] endSheet:configure];
}

- (IBAction)resetOperation:(id)sender
{
    [[configView windowScriptObject] evaluateWebScript:@"localStorage.clear();window.location.reload();"];
}

@end
