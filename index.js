/*
MIT License http://www.opensource.org/licenses/mit-license.php
Author Leonhard Zech
*/

const path = require('path');

/**
 * Builds the string to access a global variable and initializes namespaces if necessary
 * @param alias {string} The name of the global variable (namespaces are separated by periods)
 * @returns {string} The expression to access the global scoped variable
 */
function accesorString(alias) {
  const childProperties = alias.split('.'),
    len = childProperties.length;
  let propertyString = 'global',
    result = '';

  for (let idx = 0; idx < len; idx++) {
    if (idx > 0)
      result += 'if(!' + propertyString + ') ' + propertyString + ' = {};\n';
    propertyString += '[' + JSON.stringify(childProperties[idx]) + ']';
  }
  return result + propertyString;
}

/**
 *
 * @param queryValue {string} The query value containing the configuration for the loader
 * @param requestExpr {string} The expression for accessing the remaining module exports
 * @returns {string}
 */
function resultString(queryValue, requestExpr) {
  const exposeList = queryValue.split(','),
    exposeCnt = exposeList.length,
    exportsExposeList = [],
    memberExposeList = [],
    internalVarName = '__multi_expose_loader_exports';
  let resultExpr = '';
  for (let idx = 0; idx < exposeCnt; idx++) {
    const exposerSpec = exposeList[idx].split(':');
    let aliasExpr = exposerSpec[0].trim(),
      isExposingMember = aliasExpr.length && aliasExpr[0] === '#',
      memberExpr;
    if (isExposingMember) {
      aliasExpr = aliasExpr.substr(1).trim();
    }
    if (!aliasExpr.length) {
      throw new Error('missing value for the alias expression');
    }
    if (exposerSpec.length > 1) {
      isExposingMember = true;
      memberExpr = exposerSpec[1].trim();
      if (memberExpr.length && memberExpr[0] === '#') {
        memberExpr = memberExpr.substr(1);
      }
      if (!memberExpr.length) {
        throw new Error('missing value for the member expression');
      }
    } else if (isExposingMember) {
      memberExpr = aliasExpr;
    }
    if (isExposingMember) {
      let memberExposeSpec = {};
      memberExposeSpec[aliasExpr] = memberExpr;
      memberExposeList.push(memberExposeSpec);
    } else {
      exportsExposeList.push(aliasExpr);
    }
  }
  const memberExposeCnt = memberExposeList.length,
    exportsExposeCnt = exportsExposeList.length;
  if (memberExposeCnt) {
    resultExpr = 'var ' + internalVarName + requestExpr + '\n';
    for (let idx = 0; idx < memberExposeCnt; idx++) {
      const memberExposeSpec = memberExposeList[idx],
        aliasExpr = Object.keys(memberExposeSpec)[0],
        memberExpr = memberExposeSpec[aliasExpr];
      resultExpr +=
        accesorString(aliasExpr) +
        ' = ' +
        internalVarName +
        '.' +
        memberExpr +
        ';\n';
    }
    if (!exportsExposeCnt) {
      resultExpr += 'module.exports = ' + internalVarName + ';';
    }
  }
  if (exportsExposeCnt) {
    resultExpr += 'module.exports';
    for (let idx = 0; idx < exportsExposeCnt; idx++) {
      resultExpr += ' = ' + accesorString(exportsExposeList[idx]);
    }
    resultExpr += memberExposeCnt ? ' = ' + internalVarName + ';' : requestExpr;
  }
  return resultExpr;
}

/**
 * The exports pitch for the webpack loader
 */
module.exports = function () {};
module.exports.pitch = function (remainingRequest) {
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
