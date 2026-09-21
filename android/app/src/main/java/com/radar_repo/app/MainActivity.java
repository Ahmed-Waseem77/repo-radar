package com.radar_repo.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // edge-to-edge: the WebView draws its own content behind the (transparent, see
        // styles.xml) status bar and navigation bar instead of the OS drawing separately-colored
        // opaque bars around it - this is what makes both bars always show whatever the web app's
        // own current theme (light/dark, user-toggled) actually is, with no native color to keep
        // in sync. viewport-fit=cover + env(safe-area-inset-*) (see index.html/App.tsx) is what
        // keeps app content itself from sitting underneath the status bar icons/gesture nav pill.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
