<?php
/**
 * Another SSL reroute
 */
$url = str_replace('/andromeda/search/index.php?q=', 'http://www.perseus.tufts.edu/hopper/searchresults?q=', $_SERVER['REQUEST_URI']);
echo file_get_contents($url);