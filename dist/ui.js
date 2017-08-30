var AndromedaUI = (function () {
    function AndromedaUI(a) {
        this.dropdown = new Dropdown();
        this.andromeda = a;
    }
    AndromedaUI.prototype.registerClickHandlers = function () {
        $('#loadFromPerseusButton').click(function () {
            andromeda.ext.perseus($('#loadFromPerseusButton'), $('#loadFromPerseusQuery'));
        });
        $('#loadFromPerseusQuery').keydown(function (e) {
            if (e.keyCode == 13) {
                andromeda.ext.perseus($('#loadFromPerseusButton'), $('#loadFromPerseusQuery'));
            }
        });
        $('#loadFromFileButton').change(function (event) {
            andromeda.file.load(event.target.files[0]);
        });
    };
    return AndromedaUI;
}());
