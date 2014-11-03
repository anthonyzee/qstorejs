var qstore = (function(){
	var webIdx;
	var webDatabase;
	var dbName;
	var webStore={};
	var webItem={};
	var webSync;
	var s4=function(){
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	};
	var guid=function(){
		var id="";
		var self=this;
		for (var i=0; i<8; i++){
			id+=s4();
		};
		return id;		
	};
	var getClassName=function(pObj){
		var funcNameRegex = /function (.{1,})\(/;
		var results = (funcNameRegex).exec(pObj.constructor.toString());
		var objName = (results && results.length > 1) ? results[1] : "";
		return objName;			
	};
	return {
		PropertyFilter: function(pName, pOp, pVal){
			return {
				"name": pName,
				"op": pOp,
				"val": pVal
			};
		},
		detect: function(){
			var self=this;
			
			if (window.indexedDB){
				webIdx=window.indexedDB;
			};
			
			return {
				done: function(pCback){
					pCback(webIdx);
					return this;
				},
				error: function(pCback){
					//pCback("error");
					return this;
				}
			};
		}, // end of detect
		init: function(pDb, pDbName){
			console.log("init");
			var self=this;
			var objName=pDb.toString();
			var objReq;
			var doneCback;
			var errCback;
			dbName=pDbName;
			if (!localStorage.dbVer){
				localStorage.dbVer=1;
			};
			if (objName=="[object Object]"){
				//possibly use shim
				objName="[object IDBFactory]";
			};			
			
			switch (objName){
				case "[object IDBFactory]": 
					if (webDatabase){
						localStorage.dbVer=parseInt(webDatabase.version)+1;
						webDatabase.close();
					};
					var dbVer=parseInt(localStorage.dbVer);
					objReq=pDb.open(pDbName, dbVer);	
					objReq.onerror=function(e){
						console.log(e);
						if (errCback){
							errCback(e.target.error.message);
						};
					};
					objReq.onblocked = function(event) {
						console.log("Please close all other tabs with this site open!");
					};
					objReq.onsuccess=function(e){
						console.log("onsuccess");
						webDatabase=e.target.result;
						doneCback(webIdx);
					};
					objReq.onupgradeneeded=function(e){
						console.log('onupgradeneeded');
						webDatabase=e.target.result;
						self.initSchema();
					};
					break;
				default: break;
			}; //end of switch
			return {
				done: function(pCback){
					doneCback=pCback;
					return this;
				},
				error: function(pCback){
					errCback=pCback;
					return this;
				}
			};
		}, // end of init
		define: function(pName, pSchema){
			webStore[pName]={};
			webStore[pName]._storeSchema=pSchema;
			function Entity(){
				this.id=guid();
				this._storeName=pName;				
				this._lastChange=(new Date()).getTime();
				this._storeVal={};
				this._storeUrl="";
				for (var key in pSchema){
					(function(pKey, pThis){						
						Object.defineProperty(pThis, pKey, {
							get: function(){
								return pThis._storeVal[pKey];
							},
							set: function(pVal){
								pThis._storeVal[pKey]=pVal;
							}
						}); // end of defineProperty
					})(key, this);
					switch (pSchema[key]){
						case "TEXT": 
							this._storeVal[key]=""; 
							break;
						case "INT": 
							this._storeVal[key]=0; 
							break;
						case "BOOL": 
							this._storeVal[key]=false;
							break;
						default: 
							this._storeVal[key]=""; 
					}; // end of switch
				}; // end of for							
			}; // end of entity constructor
			Entity.enableSync=function(pSyncUrl){
				self._storeUrl=pSyncUrl;
			};
			Entity.syncAll=function(pConflictCallback, pSuccessCallback, pErrorCallback){
				var self2=this;
				if (pSuccessCallback){
					(function(pStoreName, addCback){
						webSync.all().filter("entity", "=", pStoreName).list(function(items){
							if (items.length==0){
								var newSync=new webSync();
								newSync.entity=pStoreName;
								newSync.localDate=0;
								newSync.serverDate=0;
								newSync.serverPushDate=0;
								qstore.add(newSync);
								qstore.flush(function(){
									addCback(newSync);
								});
							}else{
								addCback(items[0]);
							}; // end of if
						}); // end of list
					})(pName, function(pSync){
						var xmlhttp=new XMLHttpRequest();
						xmlhttp.onreadystatechange=function(){
							if (xmlhttp.readyState==4){
							if (xmlhttp.status==200){
								if (xmlhttp.responseText){
									var json=JSON.parse(xmlhttp.responseText);
									self2.all().filter("_lastChange", ">", pSync.localDate).list(function(items){
										var postItems=[];
										for (var i=0; i<items.length; i++){											
											var postItem={id:items[i].id};
											for (var key in webStore[pName]._storeSchema){
												postItem[key]=items[i][key];
											};
											postItems.push(postItem);
										};
										var xmlhttpPost=new XMLHttpRequest();
										xmlhttpPost.onreadystatechange=function(){
											if (xmlhttpPost.readyState==4){
											if (xmlhttpPost.status==200){
												if (xmlhttpPost.responseText){
													var jsonPost=JSON.parse(xmlhttpPost.responseText);	
													if (jsonPost.status=="ok"){													
														(function(pJsonGet, updateCback){
															var count=0;
															if (pJsonGet.updates.length==0){
																updateCback();
																return;
															};
															for (var i=0; i<pJsonGet.updates.length; i++){
																(function(pJson, pLength){
																	self2.all().filter("id", "=", pJson.id).list(function(items){
																		if (items.length==1){
																			for (var key in webStore[pName]._storeSchema){
																				items[0][key]=pJson[key];
																			};						
																		}else{
																			var newItem=new self2();
																			newItem.id=pJson.id;
																			for (var key in webStore[pName]._storeSchema){
																				newItem[key]=pJson[key];
																			};																									
																			qstore.add(newItem);
																		}; // end of if
																		count++																		
																		if (count==pLength){
																			updateCback();
																		};
																	}); // end of list
																})(pJsonGet.updates[i], pJsonGet.updates.length);
															}; // end of for
														})(json, function(){															
															webSync.all().filter("entity", "=", pName).list(function(items){
																if (items.length==1){
																	items[0].localDate=(new Date()).getTime();
																	items[0].serverDate=json.now;
																	items[0].serverPushDate=jsonPost.now;
																	qstore.flush(function(){
																		pSuccessCallback();
																	});
																}; // end of if
															}); // end of list																
														}); // end of function
													}; // end of if
												};
											};
											};
										};
										xmlhttpPost.open("POST", self._storeUrl+"?since="+pSync.serverDate, true);
										xmlhttpPost.setRequestHeader("Content-type","application/json");
										xmlhttpPost.send(JSON.stringify(postItems));
										console.log("postItems");
										console.log(postItems);
									}); // end of list							
								};
							}; // end of if
							}; // end of if
						};
						xmlhttp.open("GET", self._storeUrl+"?since="+pSync.serverDate, true);
						xmlhttp.send();
					});
				};
			};
			Entity.remove=function(item){
				var txn=webIdx.transaction([pName], "readwrite");
				var store=txn.objectStore(pName);		
				var req=store.delete(item.id);
				req.onsuccess=function(e){};
			};
			Entity.destroyAll=function(){
				console.log('destroyAll');
				var txn=webDatabase.transaction([pName], "readwrite");
				var store=txn.objectStore(pName);		
				var storeCursor=store.openCursor();
				storeCursor.onerror=function(e){
					console.log(e);
				};
				storeCursor.onsuccess=function(e){
					var cursor=e.target.result;
					if (cursor){
						cursor.delete();
						cursor.continue();
					};
				};
			};
			Entity.all=function(){
				var self=this;
				var query={
					filterCollection: [],
					filterKey: null,
					filter: function(pName, pOp, pVal){
						query.filterCollection=[];
						if (pName=="id"){
							switch (pOp){
								case "=":
									query.filterKey=IDBKeyRange.only(pVal);
									break;
								default: break;
							};
						}else{
							var filterItem=new qstore.PropertyFilter(pName, pOp, pVal);
							query.filterCollection.push(filterItem);
						};
						return query;
					},
					and: function(pFilterItem){
						if (pFilterItem.name=="id"){
							switch (pFilterItem.op){
								case "=":
									query.filterKey=IDBKeyRange.only(pFilterItem.val);
									break;
								default: break;
							}; // end of switch
						}else{
							query.filterCollection.push(pFilterItem);
						}; // end of if
						return query;
					},
					list: function(listCback){
						var txn=webDatabase.transaction([pName], "readwrite");
						var store=txn.objectStore(pName);		
						var items=[];
						var storeCursor;
						
						if (query.filterKey){
							storeCursor=store.openCursor(query.filterKey);		
						}else{
							storeCursor=store.openCursor();		
						};
						
						storeCursor.onerror=function(e){
							console.log(e);
						};
						storeCursor.onsuccess=function(e){
							var cursor=e.target.result;
							if (cursor){
								var item=cursor.value;
								
								//this procedure determine filter record
								var bFilter=(function(pItem){
									for (var i=0; i<query.filterCollection.length; i++){
										var filterField=query.filterCollection[i].name;
										switch (query.filterCollection[i].op){
											case "=":
												if (pItem[filterField]!=query.filterCollection[i].val){
													return true;
												};
												break;
											case ">":							
															
												if (pItem[filterField]>query.filterCollection[i].val){
													return false;
												}else{
													return true;													
												};
												break;
											default: break;
										}; // end of switch
									}; // end of for
									return false;
								})(item);
								if (!bFilter){
									var newItem=new function(){
										var self=this;
										self.id=item.id;
										self._storeName=pName;										
										self._storeVal={};
										
										for (key in pSchema){
											(function(pKey, pThis){											
												Object.defineProperty(pThis, pKey, {
													get: function(){
														return pThis._storeVal[pKey];
													},
													set: function(pVal){
														pThis._storeVal[pKey]=pVal;
														qstore.update(pThis);
													}
												});			
											})(key, this);
											switch (pSchema[key]){
												case "TEXT": 
													self._storeVal[key]=item[key]; 
													break;
												case "INT": 
													self._storeVal[key]=item[key]; 
													break;
												case "BOOL": 
													self._storeVal[key]=item[key];
													break;
												default: 
													self._storeVal[key]=item[key]; 
											}; // end of switch
										}; // end of for										
									}; // end of newItem
									
									items.push(newItem);
								}; // end of !bfilter
								cursor.continue();
							}else{
								listCback(items);
							};
						};
					}
				}; // end of return
					
				return query;
			};
			return Entity;
		}, // end of define
		schemaSync: function(syncCback){
			console.log("schemaSync");
			webSync=qstore.define("_Sync", {
				"entity": "TEXT",
				"localDate": "INT",
				"serverDate": "INT",
				"serverPushDate": "INT"
			});
			var reInit=false;
			for (var key in webStore){
				if (!webDatabase.objectStoreNames.contains(key)){
					reInit=true;
					break;					
				}; // end of if
			}; // end of for
			if (reInit){
				qstore.init(webIdx, dbName).done(function(){
					if (syncCback){
						syncCback();
					};
				});
			}else{
				syncCback();
			};
		}, // end of schemaSync
		initSchema: function(){
			console.log("initSchema");
			for (var key in webStore){
				if (!webDatabase.objectStoreNames.contains(key)){					
					webDatabase.createObjectStore(key, {keyPath: "id"});
				}; // end of if
			}; // end of for
		}, // end of schemaSync		
		add: function(item){
			console.log('add');
			if (typeof webItem[item._storeName] == "undefined"){
				webItem[item._storeName]=[];
			};
			item._op="add";
			webItem[item._storeName].push(item);
		}, // end of add
		remove: function(item){
			if (typeof webItem[item._storeName] == "undefined"){
				webItem[item._storeName]=[];
			};
			item._op="delete";
			webItem[item._storeName].push(item);						
		}, // end of remove
		update: function(item){
			console.log('update');
			console.log(item);
			if (typeof webItem[item._storeName] == "undefined"){
				webItem[item._storeName]=[];
			};
			item._op="update";			
			for (var i=0; i<webItem[item._storeName].length; i++){
				if (webItem[item._storeName][i].id==item.id){
					item._lastChange=(new Date()).getTime();
					for (var key1 in webStore[webItem[item._storeName][i]._storeName]._storeSchema){
						item._storeVal[key1]=webItem[item._storeName][i][key1];
					};					
					return;
				};
			};
			webItem[item._storeName].push(item);						
		}, // end of update
		flush: function(flushCback){
			console.log("flush");
			console.log(JSON.stringify(webItem));
			var self=this;
			for (var key in webItem){
				if (webItem.hasOwnProperty(key)){
					var txn=webDatabase.transaction([key], "readwrite");
					var store=txn.objectStore(key);
					for (var i=0; i<webItem[key].length; i++){
						var flushItem={};
						var req;
						for (var key1 in webStore[webItem[key][i]._storeName]._storeSchema){
							flushItem[key1]=webItem[key][i][key1];
						};
						switch(webItem[key][i]._op){
						case "add": 						
							flushItem.id=webItem[key][i].id;
							flushItem._lastChange=webItem[key][i]._lastChange;
							console.log("flushItem");
							console.log(flushItem);
							req=store.add(flushItem);
							break;
						case "update": 
							flushItem.id=webItem[key][i].id;
							flushItem._lastChange=webItem[key][i]._lastChange;
							req=store.put(flushItem);
							break;
						case "delete":
							flushItem.id=webItem[key][i].id;
							flushItem._lastChange=webItem[key][i]._lastChange;
							req=store.delete(flushItem.id);
							break;
						default: break;
						}; // end of switch
						req.onsuccess=function(){
							console.log("success");
						};
						req.onerror=function(e){
							console.log(e.target);
							console.log("error");
						};						
					}; // end of for
				};
			}; // end of for webItem
			for (var key in webItem){
				delete webItem[key];
			};
			if (flushCback){
				flushCback();
			};
		} // end of flush
	};
})();
