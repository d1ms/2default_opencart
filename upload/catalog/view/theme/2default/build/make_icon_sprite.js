// One-off generator for the theme's icon sprite. Reads selected icons from
// lucide-static (ISC licensed) and bundles them as <symbol> elements so the
// theme references them via <svg><use href="...icons.svg#icon-NAME"></use></svg>
// with zero runtime JS dependency. Not part of the shipped theme.
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'node_modules', 'lucide-static', 'icons');
const OUT_FILE = path.join(__dirname, '..', 'js', 'icons.svg');

// symbol id -> lucide file name
const ICON_MAP = {
	'menu': 'menu',
	'x': 'x',
	'search': 'search',
	'user': 'user',
	'heart': 'heart',
	'shopping-bag': 'shopping-bag',
	'shopping-cart': 'shopping-cart',
	'chevron-down': 'chevron-down',
	'chevron-left': 'chevron-left',
	'chevron-right': 'chevron-right',
	'star': 'star',
	'minus': 'minus',
	'plus': 'plus',
	'trash': 'trash-2',
	'refresh': 'refresh-cw',
	'upload': 'upload',
	'calendar': 'calendar',
	'check-circle': 'check-circle',
	'alert-circle': 'circle-alert',
	'x-circle': 'circle-x',
	'info': 'info',
	'repeat': 'repeat',
	'arrow-right': 'arrow-right',
	'arrow-left': 'arrow-left',
	'ruler': 'ruler',
	'sliders-horizontal': 'sliders-horizontal',
	'sparkles': 'sparkles',
	'zap': 'zap',
	'droplets': 'droplets',
	'shield-check': 'shield-check',
	'more-horizontal': 'ellipsis',
	'triangle-alert': 'triangle-alert',
	'eye': 'eye',
	'message-square': 'message-square',
	'send': 'send',
	'map-pin': 'map-pin',
	'phone': 'phone',
	'clock': 'clock',
	'printer': 'printer',
	'mail': 'mail',
	'external-link': 'external-link',
	'folder': 'folder',
	'file-text': 'file-text',
	'download': 'download',
	'history': 'history',
	'pencil': 'square-pen',
};

let symbols = '';

for (const [id, file] of Object.entries(ICON_MAP)) {
	const filePath = path.join(ICONS_DIR, file + '.svg');
	const raw = fs.readFileSync(filePath, 'utf8');

	const inner = raw
		.replace(/<!--.*?-->/s, '')
		.replace(/^[\s\S]*?<svg[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '')
		.trim();

	// lucide's default appearance (thin outline stroke, no fill) lives on
	// the <svg> element itself in the source file; that element is
	// stripped above, so it has to be reapplied here on <symbol> or every
	// <use> renders solid black (SVG's initial fill is black).
	symbols += `  <symbol id="icon-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    ${inner}\n  </symbol>\n`;
}

const output = `<!-- Generated from lucide-static (ISC License) by build/make_icon_sprite.js. Do not hand-edit. -->\n<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}</svg>\n`;

fs.writeFileSync(OUT_FILE, output, 'utf8');
console.log(`Wrote ${Object.keys(ICON_MAP).length} icons to ${OUT_FILE}`);
