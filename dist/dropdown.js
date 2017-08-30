var Dropdown = (function () {
    function Dropdown() {
        this.showing = false;
    }
    ;
    Dropdown.prototype.hide = function () {
        var headerDropdown = $('#headerDropdown');
        $(window).unbind('resize');
        $(document).unbind('click');
        this.showing = false;
        headerDropdown.html('');
        headerDropdown.offset({ top: 0, left: 0 });
        headerDropdown.innerWidth(0);
        headerDropdown.hide();
    };
    return Dropdown;
}());
