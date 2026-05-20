// scripts/build.js — Simple build pipeline: minify JS + CSS, output to dist/
var fs = require('fs');
var path = require('path');

var DIST = 'dist';

// Ensure terser and clean-css are available
try { require.resolve('terser'); } catch(e) {
  console.log('Installing build dependencies...');
  require('child_process').execSync('npm install', { stdio: 'inherit', cwd: __dirname + '/..' });
}

// Clean dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// Copy non-JS/CSS/non-build files
var copyFiles = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', '_headers', 'sw.js'];
copyFiles.forEach(function(f) {
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(DIST, f));
});

// Copy CSS (minified)
fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });
require('child_process').execSync(
  'npx cleancss css/style.css -o dist/css/style.css',
  { stdio: 'inherit' }
);

// Minify JS — order matters for IIFE dependencies
var jsOrder = [
  'state', 'i18n', 'storage', 'idb-storage',
  'highlight', 'bookmarks', 'annotations',
  'tts', 'edge-tts', 'ai-tts',
  'player', 'import', 'analytics',
  'ui', 'tutorial', 'app'
];
fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
var concatJs = jsOrder.map(function(f) { return 'js/' + f + '.js'; }).join(' ');
require('child_process').execSync(
  'npx terser ' + concatJs + ' -o dist/js/app.min.js -c -m --comments false',
  { stdio: 'inherit' }
);

// Update sw.js cache list to reference the single minified JS
var swContent = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf-8');
// Replace the ASSETS array with minimal entries
swContent = swContent.replace(
  /const ASSETS = \[[\s\S]*?\];/,
  "const ASSETS = [\n  './',\n  './index.html',\n  './manifest.json',\n  './icon-192.png',\n  './icon-512.png',\n  './css/style.css',\n  './js/app.min.js'\n];"
);
// Bump cache version
var cacheVersion = 'podcast-reader-v' + Date.now().toString(36);
swContent = swContent.replace(/podcast-reader-v\w+/, cacheVersion);
fs.writeFileSync(path.join(DIST, 'sw.js'), swContent);

// Update index.html to use minified bundle (keep CDN scripts)
var html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');
// Remove individual JS module <script> tags (keep CDN deps)
html = html.replace(/<script src="js\/state\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/i18n\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/storage\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/idb-storage\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/highlight\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/bookmarks\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/annotations\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/tts\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/edge-tts\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/ai-tts\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/player\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/import\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/analytics\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/ui\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/tutorial\.js"><\/script>\s*/g, '');
html = html.replace(/<script src="js\/app\.js"><\/script>\s*/g, '');
// Insert minified bundle after CDN scripts
html = html.replace(
  '<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>\n<script src="js/app.min.js"></script>'
);
fs.writeFileSync(path.join(DIST, 'index.html'), html);

console.log('✅ Build complete → ' + DIST + '/');
console.log('   JS:  ' + (fs.statSync(path.join(DIST, 'js/app.min.js')).size / 1024).toFixed(1) + ' KB (minified)');
console.log('   CSS: ' + (fs.statSync(path.join(DIST, 'css/style.css')).size / 1024).toFixed(1) + ' KB (minified)');
