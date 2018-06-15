<?php
/**
 * Shortcut for the morhp url 
 */
$url = str_replace('/andromeda/', 'http://www.perseus.tufts.edu/hopper/', $_SERVER['REQUEST_URI']);
$url = str_replace('morph/', 'morph', $url);
echo file_get_contents($url);