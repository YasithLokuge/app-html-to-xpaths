'use strict';
exports.htmlElementToXpaths = htmlElementToXpaths;
exports.htmlStringToXpaths = htmlStringToXpaths;

require('jsdom-global')();
var $ = require('jquery');

function traverseNodes(node, callback) {
    var child = node.childNodes[0];

    while (child) {
        if (child.childNodes.length) {
            traverseNodes(child, callback);
        }

        var nextNode = child.nextSibling;

        callback(child);
        child = nextNode;
    }

    return node;
}

function traverseReduce(node, callback, acc) {

    traverseNodes(node, function (child) {
        callback(acc, child);
    });

    return acc;
}

function getXPathForElement(node) {
    var comp, comps = [];
    var parent = null;
    var xpath = '';
    var getPos = function(node) {
        var position = 1, curNode;
        if (node.nodeType == Node.ATTRIBUTE_NODE) {
            return null;
        }
        for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
            if (curNode.nodeName == node.nodeName) {
                ++position;
            }
        }
        return position;
    }

    if (node instanceof Document) {
        return '/';
    }

    for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
        comp = comps[comps.length] = {};
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                comp.name = 'text()';
                break;
            case Node.ATTRIBUTE_NODE:
                comp.name = '@' + node.nodeName;
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                comp.name = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                comp.name = 'comment()';
                break;
            case Node.ELEMENT_NODE:
                comp.name = node.nodeName;
                break;
            default:
                comp.name = node.nodeName;
                break;
        }
        comp.position = getPos(node);
    }

    for (var i = comps.length - 1; i >= 0; i--) {
        comp = comps[i];
        xpath += '/' + comp.name.toLowerCase();
        if (comp.position != null) {
            xpath += '[' + comp.position + ']';
        }
    }

    return xpath;

}

function htmlStringToXpaths(html) {
    var htmlObject = $(html);
    return htmlElementToXpaths(htmlObject.get(0));
}

function htmlElementToXpaths(element) {
    return traverseReduce(element, function (tags, child) {
        if (child instanceof Element) {
            const xpath = getXPathForElement(child);
            tags.push(xpath);
        }
        return tags;
    }, [], true);
}