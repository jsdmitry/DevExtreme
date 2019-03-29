import Class from "../../core/class";
import { noop } from "../../core/utils/common";

const MultilineStrategy = Class.inherit({
    _updateMenuVisibility: noop,
    render: noop,
    renderMenuItems: noop,
    handleToolbarVisibilityChange: noop,
    widgetOption: noop,
    toggleMenuVisibility: noop
});

module.exports = MultilineStrategy;

