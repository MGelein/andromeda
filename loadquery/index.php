<?php
/**
 * More SSL circumventing
 * */
$url = str_replace('/andromeda/loadquery/index.php', 'http://www.perseus.tufts.edu/hopper/loadquery', $_SERVER['REQUEST_URI']);
$url = str_replace('morph/', 'morph', $url);
echo file_get_contents($url);