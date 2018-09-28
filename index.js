/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Leonhard Zech
*/

var path = require('path');

function accessorString(alias) {
  var childProperties = alias.split('.');
  var length = childProperties.length;
  var propertyString = 'global';
  var result = '';

  for (var i = 0; i < length; i++) {
    if (i > 0)
      result += 'if(!' + propertyString + ') ' + propertyString + ' = {};\n';
    propertyString += '[' + JSON.stringify(childProperties[i]) + ']';
  }
  return result + propertyString;
}

function resultString(value, requireString) {
  var exposers = value.split(','),
    exportAliases = [],
    memberSpecs = [],
    result = '';
  for (var i = 0; i < exposers.length; i++) {
    var expose = exposers[i].split(':'),
      alias = expose[0].trim(),
      isMember = alias.length && alias[0] === '#',
      member;
    if (isMember) {
      alias = alias.substr(1).trim();
    }
    if (!alias.length) {
      throw new Error('missing alias');
    }
    if (expose.length > 1) {
      isMember = true;
      member = expose[1].trim();
      if (!member.length) {
        throw new Error('missing member');
      }
    } else if (isMember) {
      member = alias;
    }
    if (isMember) {
      var memberSpec = {};
      memberSpec[alias] = member;
      memberSpecs.push(memberSpec);
    } else {
      exportAliases.push(alias);
    }
  }
  if (memberSpecs.length) {
    result = 'var __multi_expose_loader_exports' + requireString;
    for (var i = 0; i < memberSpecs.length; i++) {
      var memberSpec = memberSpecs[i],
        alias = Object.keys(memberSpec)[0],
        member = memberSpec[alias];
      result +=
        accessorString(alias) +
        ' = __multi_expose_loader_exports.' +
        member +
        ';';
    }
    if (!exportAliases.length) {
      result += 'module.exports = __multi_expose_loader_exports;';
    }
  }
  if (exportAliases.length) {
    result += 'module.exports';
    for (var i = 0; i < exportAliases.length; i++) {
      result += ' = ' + accessorString(exportAliases[i]);
    }
    if (memberSpecs.length) {
      result += ' = __multi_expose_loader_exports;';
    } else {
      result += requireString;
    }
  }
  return result;
}

module.exports = function() {};
module.exports.pitch = function(remainingRequest) {
  // Change the request from an /abolute/path.js to a relative ./path.js
  // This prevents [chunkhash] values from changing when running webpack
  // builds in different directories.
  const newRequestPath = remainingRequest.replace(
    this.resourcePath,
    '.' + path.sep + path.relative(this.context, this.resourcePath)
  );
  this.cacheable && this.cacheable();
  if (!this.query) throw new Error('query parameter is missing');
  return resultString(
    this.query.substr(1),
    ' = require(' + JSON.stringify('-!' + newRequestPath) + ');'
  );
};
