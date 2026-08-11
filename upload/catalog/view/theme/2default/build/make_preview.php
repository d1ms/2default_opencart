<?php
// One-off generator for the theme preview thumbnail shown in
// Admin > Extensions > Themes. Not part of the shipped theme.

$w = 250;
$h = 324;
$im = imagecreatetruecolor($w, $h);
imagesavealpha($im, true);

$top    = imagecolorallocate($im, 0x13, 0x1b, 0x2e);
$mid    = imagecolorallocate($im, 0x1e, 0x29, 0x3b);
$bottom = imagecolorallocate($im, 0x0b, 0x1c, 0x30);

for ($y = 0; $y < $h; $y++) {
    $t = $y / $h;
    if ($t < 0.5) {
        $r = interpolate(0x13, 0x1e, $t / 0.5);
        $g = interpolate(0x1b, 0x29, $t / 0.5);
        $b = interpolate(0x2e, 0x3b, $t / 0.5);
    } else {
        $r = interpolate(0x1e, 0x0b, ($t - 0.5) / 0.5);
        $g = interpolate(0x29, 0x1c, ($t - 0.5) / 0.5);
        $b = interpolate(0x3b, 0x30, ($t - 0.5) / 0.5);
    }
    $c = imagecolorallocate($im, $r, $g, $b);
    imageline($im, 0, $y, $w, $y, $c);
}

function interpolate($a, $b, $t) {
    return (int) round($a + ($b - $a) * $t);
}

// Accent blue card
$accent = imagecolorallocate($im, 0x25, 0x63, 0xeb);
imagefilledrectangle($im, 24, 120, $w - 24, 204, $accent);

$white = imagecolorallocate($im, 0xff, 0xff, 0xff);
$font = 5;
$text = '2DEFAULT';
$tw = imagefontwidth($font) * strlen($text);
imagestring($im, $font, (int) (($w - $tw) / 2), 155, $text, $white);

$sub = 'OpenCart Theme';
$font2 = 3;
$tw2 = imagefontwidth($font2) * strlen($sub);
imagestring($im, $font2, (int) (($w - $tw2) / 2), 250, $sub, $white);

imagepng($im, __DIR__ . '/../image/2default.png');
imagedestroy($im);

echo "written\n";
