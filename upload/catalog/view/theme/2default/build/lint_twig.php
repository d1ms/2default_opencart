<?php
// One-off syntax linter for 2default templates using the site's vendored
// Twig. Only checks parse/compile validity (undefined variables render as
// empty strings under Twig, so this can't catch wrong variable names) — not
// part of the shipped theme.

define('DIR_STORAGE', __DIR__ . '/../../../../../system/storage/');
require_once __DIR__ . '/../../../../../system/storage/vendor/autoload.php';

$theme_dir = realpath(__DIR__ . '/../template');
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($theme_dir));

$errors = 0;
$checked = 0;

foreach ($files as $file) {
    if ($file->getExtension() !== 'twig') {
        continue;
    }

    $checked++;
    $code = file_get_contents($file->getPathname());

    try {
        $loader = new \Twig\Loader\ArrayLoader(['x.twig' => $code]);
        $twig = new \Twig\Environment($loader, ['autoescape' => false, 'cache' => false]);
        $twig->parse($twig->tokenize(new \Twig\Source($code, 'x.twig')));
        echo "OK    " . $file->getPathname() . "\n";
    } catch (\Twig\Error\SyntaxError $e) {
        $errors++;
        echo "FAIL  " . $file->getPathname() . " -- " . $e->getMessage() . "\n";
    }
}

echo "\n$checked templates checked, $errors syntax errors.\n";
