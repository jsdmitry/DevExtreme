import { isDefined } from "../../core/utils/type";
import $ from "../../core/renderer";

const FIELD_ITEM_REQUIRED_MARK_CLASS = "dx-field-item-required-mark";
const FIELD_ITEM_OPTIONAL_MARK_CLASS = "dx-field-item-optional-mark";
const FIELD_ITEM_LABEL_CLASS = "dx-field-item-label";
const FIELD_ITEM_LABEL_CONTENT_CLASS = "dx-field-item-label-content";
const FIELD_ITEM_LABEL_TEXT_CLASS = "dx-field-item-label-text";
const FIELD_ITEM_LABEL_LOCATION_CLASS = "dx-field-item-label-location-";

const createItemPathByIndex = (index, isTabs) => `${isTabs ? "tabs" : "items"}[${index}]`;

const concatPaths = (path1, path2) => {
    if(isDefined(path1) && isDefined(path2)) {
        return `${path1}.${path2}`;
    }
    return path1 || path2;
};

const getTextWithoutSpaces = text => text ? text.replace(/\s/g, '') : undefined;

const isExpectedItem = (item, fieldName) => item && (item.dataField === fieldName || item.name === fieldName ||
    getTextWithoutSpaces(item.title) === fieldName || (item.itemType === "group" && getTextWithoutSpaces(item.caption) === fieldName));

const getFullOptionName = (path, optionName) => `${path}.${optionName}`;

const getOptionNameFromFullName = fullName => {
    const parts = fullName.split(".");
    return parts[parts.length - 1].replace(/\[\d+]/, "");
};

const tryGetTabPath = fullPath => {
    const pathParts = fullPath.split(".");
    const resultPathParts = [...pathParts];

    for(let i = pathParts.length - 1; i >= 0; i--) {
        if(isFullPathContainsTabs(pathParts[i])) {
            return resultPathParts.join(".");
        }
        resultPathParts.splice(i, 1);
    }
    return "";
};

const isFullPathContainsTabs = fullPath => fullPath.indexOf("tabs") > -1;

const renderLabelMark = (isRequired, options) => {
    let $mark;
    const { showRequiredMark, showOptionalMark, requiredMark, optionalMark } = options;
    const isRequiredMark = showRequiredMark && isRequired;
    const isOptionalMark = showOptionalMark && !isRequired;

    if(isRequiredMark || isOptionalMark) {
        const markClass = isRequiredMark ? FIELD_ITEM_REQUIRED_MARK_CLASS : FIELD_ITEM_OPTIONAL_MARK_CLASS;
        const markText = isRequiredMark ? requiredMark : optionalMark;

        $mark = $("<span>")
            .addClass(markClass)
            .html("&nbsp" + markText);
    }

    return $mark;
};

const renderLabel = options => {
    const { text, id, location, alignment, isRequired, labelID = null } = options;

    if(isDefined(text) && text.length > 0) {
        const labelClasses = `${FIELD_ITEM_LABEL_CLASS} ${FIELD_ITEM_LABEL_LOCATION_CLASS + location}`;
        const $label = $("<label>")
            .addClass(labelClasses)
            .attr("for", id)
            .attr("id", labelID);

        const $labelContent = $("<span>")
            .addClass(FIELD_ITEM_LABEL_CONTENT_CLASS)
            .appendTo($label);

        $("<span>")
            .addClass(FIELD_ITEM_LABEL_TEXT_CLASS)
            .text(text)
            .appendTo($labelContent);

        if(alignment) {
            $label.css("textAlign", alignment);
        }

        $labelContent.append(renderLabelMark(isRequired, options));

        return $label;
    }
};

exports.renderLabel = renderLabel;
exports.getOptionNameFromFullName = getOptionNameFromFullName;
exports.getFullOptionName = getFullOptionName;
exports.getTextWithoutSpaces = getTextWithoutSpaces;
exports.isExpectedItem = isExpectedItem;
exports.createItemPathByIndex = createItemPathByIndex;
exports.concatPaths = concatPaths;
exports.tryGetTabPath = tryGetTabPath;
exports.isFullPathContainsTabs = isFullPathContainsTabs;
