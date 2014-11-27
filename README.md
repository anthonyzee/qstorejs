qstorejs
========
A very lightweight (7kb minified) javascript object mapper for IndexedDB

What is Qstore.JS?
------------------
Qstore.JS is a small asynchronous javascript object mapper library that uses IndexedDB for storing data queue that can be synchronized to server side database such as MySQL or PostgresDB. 

Installation
------------
Just grab [qstore.min.js] and include them with a script tag.

```html
<script src="qstore.min.js"></script>
<script>
  // use the api as described above 
</script>
```
APIs
------------------
```js
// Detect database availability
qstore.detect().done(function(db){
  // Init a database named "hello"
		qstore.init(db, "hello").done(function(pDb){	
		  // Define a store named "todo"
			todo=qstore.define("todo", {
				"task": "TEXT",
				"done": "BOOL"
			});
			// Set sync url
			todo.enableSync("/todoUpdates");
			
			// Synchronizes store definition with the database
			qstore.schemaSync(function(tx){
			  // API to clear store records
				todo.destroyAll();
				
				//API to create new store record
				var newItem=new todo();
				newItem.task="Learn to use Qstore";
				newItem.done=false;
				qstore.add(newItem);
				
				//API to flush store records
				qstore.flush(function(){
				  // API to sync record with backend database
					todo.syncAll(null, function(){
						console.log("sync successful");
					},null);
				});
				
				//API to query store records
				todo.all().filter("done","=",false).and(new qstore.PropertyFilter("id","=","038c8f83f8e83d6b571f884543104ffd")).list(function(items){
					for (var i=0; i<items.length; i++){
					  //This procedure updates the records value
						items[i].done=true;
						items[i].task="ABC3";
					};
					
					//API to flush store records
					qstore.flush(function(){
					  // API to sync record with backend database
						todo.syncAll(null, function(){
							console.log('sync successful');
						}, null);
					}); // end of flush
				}); // end of list
			}); // end of schemaSync
		}).error(function(errCode){
			console.log(errCode);
		});	// end of init			
}).error(function(err){
}); // end of detect

```

Supported browsers
------------------
 - Tested in Firefox 4.0+
 - Tested in Chrome 11+
 - Tested in Safari 5 (need indexedDB shim from http://nparashuram.com/IndexedDBShim/)
 - Tested in IE10
