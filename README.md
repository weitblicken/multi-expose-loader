# Loader for exposing multiple exported members for webpack

## Motivation

While I was working on an upgrade project that had a lot of "plain-old JavaScript" files that using a lot of global JS 
variables, I noticed that not all JS files could be upgraded to ES6.

So I had to use the [Expose loader for webpack](https://github.com/webpack/expose-loader) to continue providing these 
global variables. Unfortunately, I was not able to port all code to ES6 modules using only ES6 default exports, which
the export loader could handle. Some modules export members, which has to be placed in the global scope too. So I 
searched for a webpack loader placing members in the global scope.
 
Found [Expose Members loader for webpack](https://github.com/davidpelayo/expose-members-loader), but this, somewhat 
older, contribution by @davidpelayo did not meet my requirements. So I decided to write a loader that can expose both 
the default export and member export to the global scope.

## Usage

### Usecase: Expose the default export to multiple globals

Requirement: Expose jquery to globals $ and jQuery
```javascript
module: {
    rules: [{ 
        "test": "jquery", 
        "use": [{ "loader": "multi-expose-loader", "options": "$,jQuery" }]
    }]
} 
```
Solution: Separate multiple exports with a comma.

### Usecase: Expose multiple members

Requirement: Expose exports member1 and member2 from module example.js to globals member1 and member2
```javascript
module: {
    rules: [{ 
        "test": "./example.js", 
        "use": [{ "loader": "multi-expose-loader", "options": "#member1,#member2" }]
    }]
} 
```
Solution: Indicate members with a leading #

### Usecase: Expose multiple members to alias names

Requirement: Expose exports member1 and member2 from module example.js to globals alias1 and alias2
```javascript
module: {
    rules: [{ 
        "test": "./example.js", 
        "use": [{ "loader": "multi-expose-loader", "options": "alias1:#member1,alias2:#member2" }]
    }]
} 
```
Solution: Seperate alias and member with a colon

### Usecase: Expose to namespaces in the global environment

Requirement: Expose to namespace
```javascript
module: {
    rules: [{ 
        "test": "./example.js", 
        "use": [{ "loader": "multi-expose-loader", "options": "namespace1.alias1:#member1,namespace2.alias2:#member2" }]
    }]
} 
```
Solution: Give the point separated path to the alias

### Alternative configurations

Of course, the configuration can also be made via import or require. Examples:

```javascript
import  'multi-expose-loader?$,jQuery!jquery'; 

require('multi-expose-loader?#namespace1.member1,alias2:#member2!./example.js');
```

### Code generation

Unlike the expose-loader, only one webpack module is generated. For example, it looks like this:
```javascript
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var __multi_expose_loader_exports = __webpack_require__(64);
global["alias1"] = __multi_expose_loader_exports.member1;
if (!global["namespace2"]) global["namespace2"] = {};
global["namespace2"]["alias2"] = __multi_expose_loader_exports.member2;
globalmodule.exports = global["global1"] = global["global2"] = __multi_expose_loader_exports;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }) 
```

### Peer dependencies

The peer dependencies are webpack 2 and 3. I think it also works in 4, but without testing I added this webpack version
not to the peers. 

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
