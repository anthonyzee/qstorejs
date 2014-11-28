qstorejs
========
A very lightweight (7kb minified) javascript object mapper for IndexedDB. 

What is Qstore.JS?
------------------
Qstore.JS is a very lightweight asynchronous javascript object mapper library that uses IndexedDB for storing data which can be synchronized to server side database such as MySQL or PostgresDB.  

Installation
------------
Just grab [qstore.min.js] and include them with a script tag. JQuery not required.

```html
<script src="qstore.min.js"></script>
<script>
  // use the api as described above 
</script>
```
More Information
------------------
* Todo Application example: [http://pictoboard.net/qstorejs/example/test.html](http://pictoboard.net/qstorejs/example/test.html)
* API documentation: [http://pictoboard.net/qstorejs/doc/qstore.html](http://pictoboard.net/qstorejs/doc/qstore.html)

Supported browsers
------------------
QstoreJS supports all popular modern web browser.

 - Tested in Firefox 4.0+
 - Tested in Chrome 11+
 - Tested in Safari 5 (need indexedDB shim from http://nparashuram.com/IndexedDBShim/)
 - Tested in IE10

Quality Tools
------------------
 - Unit Test using JsTestDriver
 - Code Quality using JsHint
 - Documentation using JsDoc
 
License
------------------
QstoreJS is covered by the MIT License. See LICENSE for more information.
