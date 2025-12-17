import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANDROID_RES_PATH = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Vector Drawable XML for the background (a linear gradient from the SVG)
const BACKGROUND_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        android:type="linear"
        android:angle="45"
        android:startColor="#312e81"
        android:endColor="#1e293b" />
</shape>
`;

// Vector Drawable XML for the foreground (the capsule icon)
// The icon is centered in the 108dp viewport, respecting the safe area.
const FOREGROUND_XML = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:translateX="4"
        android:translateY="4">
        <group
            android:pivotX="50"
            android:pivotY="50"
            android:rotation="-30">
            <!-- The capsule body with gradient -->
            <path
                android:pathData="M 50,22 C 37.849,22 28,31.849 28,44 L 28,56 C 28,68.151 37.849,78 50,78 C 62.151,78 72,68.151 72,56 L 72,44 C 72,31.849 62.151,22 50,22 Z">
                <aapt:attr name="android:fillColor">
                    <gradient
                        android:endX="50"
                        android:endY="78"
                        android:startX="50"
                        android:startY="22"
                        android:type="linear">
                        <item android:color="#40FFFFFF" android:offset="0.0" />
                        <item android:color="#1AFFFFFF" android:offset="1.0" />
                    </gradient>
                </aapt:attr>
            </path>
            <!-- The orb with radial gradient -->
            <path
                android:pathData="M50,50m-12,0a12,12 0,1 1,24 0a12,12 0,1 1,-24 0">
                 <aapt:attr name="android:fillColor">
                    <gradient
                        android:centerX="50"
                        android:centerY="50"
                        android:gradientRadius="12"
                        android:type="radial">
                        <item android:color="#FFF472B6" android:offset="0.0" />
                        <item android:color="#00A855F7" android:offset="1.0" />
                    </gradient>
                </aapt:attr>
            </path>
        </group>
    </group>
</vector>
`;

// Adaptive icon XML that combines background and foreground
const ADAPTIVE_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`;

const main = async () => {
    console.log('✨ Generating Android adaptive icon...');

    try {
        const drawablePath = path.join(ANDROID_RES_PATH, 'drawable');
        const mipmapPath = path.join(ANDROID_RES_PATH, 'mipmap-anydpi-v26');

        console.log(`Creating directories if they don't exist...`);
        fs.mkdirSync(drawablePath, { recursive: true });
        fs.mkdirSync(mipmapPath, { recursive: true });

        console.log('Writing ic_launcher_background.xml...');
        fs.writeFileSync(path.join(drawablePath, 'ic_launcher_background.xml'), BACKGROUND_XML);
        
        console.log('Writing ic_launcher_foreground.xml...');
        fs.writeFileSync(path.join(drawablePath, 'ic_launcher_foreground.xml'), FOREGROUND_XML);
        
        console.log('Writing ic_launcher.xml...');
        fs.writeFileSync(path.join(mipmapPath, 'ic_launcher.xml'), ADAPTIVE_ICON_XML);

        console.log('✅ Android adaptive icon generated successfully!');
    } catch (error) {
        console.error('❌ Error generating Android icon:', error);
        process.exit(1);
    }
};

main();
