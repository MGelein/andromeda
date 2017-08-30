var AndromedaUtil = (function () {
    function AndromedaUtil() {
    }
    ;
    AndromedaUtil.prototype.ucfirst = function (s) {
        var words = s.split(' ');
        var res = [];
        var temp;
        for (var i in words) {
            temp = words[i].toLowerCase();
            temp = temp.charAt(0).toUpperCase() + temp.substr(1);
            res.push(temp);
        }
        return res.join(' ');
    };
    AndromedaUtil.prototype.getSelection = function () {
        var t;
        if (window.getSelection) {
            t = window.getSelection();
        }
        else if (document.getSelection) {
            t = document.getSelection();
        }
        return t;
    };
    return AndromedaUtil;
}());
