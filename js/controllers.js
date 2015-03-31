'use strict';

angular.module('app.controllers',[])
	.controller('MyController', ['$scope','$rootScope','$state', '$stateParams','$http','Snippet','User','toaster','Feedback',
	function(scope, rootScope, state, stateParams,Http ,Snippet,User, Toaster, Feedback){

		scope.global = {};
		scope.global.state = state;

		var symbol_cmd = "⌘";

		// 
		// initial several variables
		scope.snippets = Snippet.query();
		scope.modify_button_title = "編集";
		scope.flag_editing = false;
		scope.errors = null;
		scope.snippet = initialSnippet();
		scope.user = User;
		scope.symbol_cmd = symbol_cmd;
		state.previous = null;
		scope.searching = false;
		
		// $scope.$watch(function(){
		// 	return $scope.kw;
		// }, function() {
		// 	console.log($scope.kw);
		// });
		scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			
			// if wrong pathing, correct the redirect. 
			if(state.is('snippets.single')){
				if(toParams.id.length <= 0) {
					state.go('snippets');
					return; 
				}
			}

			state.previous = fromState;

			if(toParams.id){
				scope.selected_snippet_id = toParams.id;

				if(scope.isEditorPage()){
					// 
					// state: editor page for modify snippet
					// ===========================================
					scope.errors = null;
					scope.modify_button_title = "更新 <small>"+symbol_cmd+"+S</small>";
					
				}else{
					scope.modify_button_title = "編集 <small>"+symbol_cmd+"+E</small>";
					
				}
				// 
				// state: snippets.single
				// =========================
				Snippet.get({snippetId: toParams.id}, function(data) {
					scope.snippet = filterServerSnippet( data );
				}, function() {
					// failed to retrieve snippet
					scope.snippet = null;
				});

			}else{

				// scope.snippet = null;

				if(scope.isEditorPage()) {
					// 
					// state: editor page for create new snippet
					// ===========================================
					scope.errors = null;
					
					scope.snippet = initialSnippet();
					scope.snippet.editable = true;
					scope.snippet.updated_at = "";

					console.log(scope.snippet);
				}
			}
		});

		var searchbox_input = document.getElementById("searchbox_input");
		var searchbox_flag = false;
		var _current_pre_ele = 0;
		searchbox_input.addEventListener('focus', function(e) {
			searchbox_flag = true;
		});
		searchbox_input.addEventListener('blur', function(e) {
			searchbox_flag = false;
		});
		window.addEventListener('keydown', function(e) {

			if(scope.dialogBox && scope.dialogBox.show) {
				//
				// When dialogBox is showing
				if( isKeyPressed(e, false, KeyEvent.KEY_ESC)){
					e.preventDefault();
					scope.dialogBox.show = false;
				}	
			}else if(!scope.isEditorPage()){
				// 
				// Handler several shortcut on snippet view page
				// such as /snippet or /snippet/:snippetId page
				// 
				// In this page, 

				if( isKeyPressed(e,false, KeyEvent.KEY_0_9) || 
					isKeyPressed(e,false, KeyEvent.KEY_A_Z) ){
					// focus to searchbox input
					searchbox_input.focus();
				}else if( isKeyPressed(e,false, KeyEvent.KEY_ESC)){
					// blur focus from searchbox input
					searchbox_input.blur();
				}else if( isKeyPressed(e,false, KeyEvent.KEY_UP)) {
					e.preventDefault();

					// move to most recent history item
					var _c = current_selected_history_keywords;
					if(_c >= 0) {
						scope.kw = historyKwsManager[_c];
						_c -- ;
						current_selected_history_keywords = _c;
					}

				}else if( isKeyPressed(e, false, KeyEvent.KEY_DOWN)) {
					e.preventDefault();

					// move to history item just read
					var _c = current_selected_history_keywords;
					if(_c < historyKwsManager.length - 1) {
						_c ++ ;
						scope.kw = historyKwsManager[_c];
						current_selected_history_keywords = _c;
					}

				}else if( isKeyPressed(e,true, KeyEvent.KEY_A) && !searchbox_flag ){
					e.preventDefault();
					// highlight code in snippet_detail (page in right hand side)
					var _body = document.querySelector(".snippet_detail .content");
					if(_body){
						var _elements = _body.getElementsByTagName("pre");
						if(_elements && _elements.length > 0){
								
							if(_current_pre_ele >= _elements.length){
								_current_pre_ele = 0;
							}
							highlightText(_elements[_current_pre_ele]);
							_current_pre_ele ++;
						
						}
					}
				}else if( isKeyPressed(e, true, KeyEvent.KEY_E)) {
					e.preventDefault();
					if(scope.snippet != null){
						state.go('snippets.single.editor',{id: scope.snippet.id});
					}
				}else if( isKeyPressed(e, true, KeyEvent.KEY_DEL)) {
					//
					// When user is able to modify the current snippet and able to delete it
					// allow user to using Cmd + DEL to delete current snippet 
					e.preventDefault();
					if(scope.snippet.editable) {
						scope.destroySnippetEvent(scope.snippet.id);	
					}
				}else if( isKeyPressed(e, true, KeyEvent.KEY_B)) {
					e.preventDefault();
					if( User.logined ) {
						state.go('snippets.new');
					}else{
						Toaster.pop({
							type: 'error',
							body: '新規作成はログインしてから作成です',
						})
					}
				}
			}else {
				// 
				// Handle several shortcut at editor page 
				if( isKeyPressed(e,true, KeyEvent.KEY_S) ) {
					e.preventDefault();
					// Cmd + S
					// saving
					if(state.is("snippets.new")) {
						scope.createSnippetEvent();
					}else{
						scope.modifySnippetEvent(scope.snippet.id);	
					}
					
				}else if( isKeyPressed(e, false, KeyEvent.KEY_ESC)) {
					// ESC
					// Quit editor mode
					e.preventDefault();
					state.go('snippets.single',{id: scope.snippet.id});
				}else if( isKeyPressed(e, true, KeyEvent.KEY_DEL)) {
					e.preventDefault();
					if(scope.snippet.editable) {
						scope.destroySnippetEvent(scope.snippet.id);	
					}
				}
			}
		});
		window.addEventListener('keyup', function(e) {
			if(!scope.isEditorPage()) {
				var keyPressed = e.keyCode;
				if(keyPressed == KeyEvent.KEY_ENTER) {
					enterKeyUpCallback();
				}
			}
			scope.$apply();
		});

		scope.loginedCallback = function(results) {
			if(results.error) {
				// show error message
			}else{
				location.reload();
			}
		};

		scope.loadTags = function(query){
			return Http.get('/json/tag/?q='+encodeURIComponent(query));
		};

		var searching_offset_timeout;
		scope.searchingEvent = function() {
			var kw = scope.kw;
			// when there is change in searchbox, 
			// reset the current index history keywords
			reset_current_index_history_keywords();
			if(kw && kw.length > 0){
				scope.searching = true;

				// 
				if(kw.match(/^[0-9]+$/)) {
					var _index = parseInt(kw)-1;
					if(_index < scope.snippets.length) {
						scope.selected_snippet_id = scope.snippets[_index].id;
					}
				}


				clearTimeout(searching_offset_timeout);
				searching_offset_timeout = setTimeout(function() {

					if(kw.match(/^[0-9]+$/)) {
						scope.searching = false;
						// if kw is number, do "selecting"
						var _index = parseInt(kw) - 1;
						if(_index < scope.snippets.length) {
							state.go('snippets.single',{id: scope.snippets[_index].id} );
						}
					}else{
						// if kw not is number, do "searching"
						Http.get('/json/search?kw='+encodeURIComponent(kw)).success(function(data) {
							scope.snippets = data;
							scope.searching = false;
							// $scope.last_searched_keywords = $scope.textbox.keywords;
						});
					}

					scope.$apply();
				}, 300);
			}
		};


		scope.createSnippetEvent = function() {
			// new snippet
			
			var _tags = [];
			for (var i = 0; i < scope.snippet.tags.length; i++) {
				_tags.push(scope.snippet.tags[i].text);
			};

			var _data = {
				title: scope.snippet.title,
				content: scope.snippet.content,
				tags: _tags,
			};

			Snippet.create({}, _data , function(results) {
				// new snippet is successfully created
				scope.snippets.push(results);
				state.go('snippets.single',{id: results.id});

			}, function(results) {

				scope.errors = [];
				for(var type in results.data.error) {
					scope.errors.push(results.data.error[type][0]);
				}
			});
		};

		scope.cancelSnippetEvent  = function(snippet_id) {
			if(typeof snippet_id === 'undefined') {
				state.go('snippets');
			}else{
				state.go('snippets.single',{id: snippet_id});
			}
		};

		scope.modifySnippetEvent = function(snippet_id) {
			if(scope.isEditorPage()) {
				// save

				var _tags = [];
				for (var i = 0; i < scope.snippet.tags.length; i++) {
					_tags.push(scope.snippet.tags[i].text);
				};

				var _data = {
					title: scope.snippet.title,
					content: scope.snippet.content,
					tags: _tags,
				};

				Toaster.pop({
					type: 'info',
	                body: '保存中 ...',
	                showCloseButton: true
				});
				

				Snippet.update({snippetId: snippet_id}, _data, function(results) {
				
					scope.errors = null;
					scope.snippet = filterServerSnippet(results);
					state.go('snippets.single',{id: snippet_id});	
					
					Toaster.pop({
						type: 'success',
		                body: '保存しました',
		                showCloseButton: true
					});
					
				}, function(results){
					// failed to update
					scope.errors = [];
					for(var type in results.data.error) {
						scope.errors.push(results.data.error[type][0]);
					}
				});

			}else{
				state.go('snippets.single.editor',{id: snippet_id});
			}
		};

		scope.newEvent = function() {
			// snippetを新規作成
			// "New Snippet" button is clicked and ready for new snippet
			state.go('snippets.new');
		};

		scope.logoutCallback = function() {
			// when logout event is successfully carried out
			// this event will be fired
			location.reload();
		};

		scope.logoutEvent = function() {
			User.logout(scope.logoutCallback);
		};

		scope.destroySnippetEvent = function(snippet_id) {

			scope.dialogBox = {
				show: true,
				type: 'delete',
				title: "<i class='fa fa-trash'></i> 削除",
				message: "<strong>\""+scope.snippet.title+"\"</strong> を削除しますか？この動作は戻せないのでご注意ください。",
				okButtonText: "削除 <small>"+symbol_cmd+"+DEL</small>",
				noButtonText: "キャンセル <small>ESC</small>",
				okButtonClickEvent: function() {
					Snippet.delete({snippetId: scope.snippet.id}, {} , function(){
						// success to delete snippet
						scope.snippets = Snippet.query();	

						scope.snippet = initialSnippet();
						scope.dialogBox.show = false;

						if(state.previous != null){
							state.go(state.previous);
						}else{
							state.go('snippets');
						}
						

					}, function(e){
						// failed to delete snippet
						scope.dialogBox.title = "<span class='error-message'><i class='fa fa-close error-message'></i>&nbsp;削除失敗</span>"
						scope.dialogBox.message = "\""+scope.snippet.title+"\"が削除できません。理由は"+e.data.error;

					});
				},
				noButtonClickEvent: function() {
					scope.dialogBox.show = false;
				},
			}
		
		};

		scope.feedbackEvent = function() {
			scope.dialogBox = {
				show: true,
				type: 'feedback',
				okButtonText: "送信",
				feedback: true,
				noButtonText: "キャンセル",
				title: '<i class="fa fa-user"></i> フィードバック',
				message: "テキストボックスに意見を記入して頂いて、送信ボタンを押してください。",
				error_message: null,
				feedback_message: '',
				okButtonClickEvent: function() {
					if(scope.dialogBox.feedback_message.length > 0){
						Feedback.send({message: scope.dialogBox.feedback_message});
						scope.dialogBox.show=false;
						Toaster.pop({
							type: 'success',
			                body: 'ご意見ありがとうございます！',
			                showCloseButton: true
						});
					}else{
						scope.dialogBox.error_message = 'テキストボックスにご記入ください。';
					}
				},
				noButtonClickEvent: function() {
					scope.dialogBox.show = false;
				},
			}
		}

		// enter key is pressed and following event will be fired when keyup
		// and if current keywords is not number(Which used as selecting snippet) and empty
		// the keywords will be stored to historyKwsManager. 
		// After that, scope.kw will be clear.
		var historyKwsManager = [];
		var current_selected_history_keywords = -1;
		var enterKeyUpCallback = function() {
			if(scope.kw.length > 0 && !scope.kw.match(/^[0-9]+$/g)){
				historyKwsManager.push(scope.kw);
				scope.searchingEvent();
			}
			scope.kw = "";
		};

		var reset_current_index_history_keywords = function() {
			current_selected_history_keywords = historyKwsManager.length - 1;
		};
		

		scope.loginEvent = loginEvent;

		scope.isEditorPage = function() {
			return state.is('snippets.single.editor') || state.is('snippets.new');
		};

		scope.minify = minifyContent;

	}])
	.controller('EditorController', ['$scope',function(scope){
		scope.fileUploadedCallback = function(success, msg, httpCode ) {
			console.log(msg);
			if(Array.isArray(msg)){
				scope.errors = [];
				for (var i = 0; i < msg.length; i++) {
					if(!msg[i].success){
						scope.errors.push(msg[i].errors);
					}
				};
			}else{
				if(!msg.success) {
					scope.errors = [msg.errors];
				}	
			}
			
		};
		
	}]);

// convert datatype stored in database to client AngularJS
var filterServerSnippet = function(_snippet) {
	var _tags = [];
	for (var i = 0; i < _snippet.tags.length; i++) {
		_tags.push({text: _snippet.tags[i].name});
	};
	_snippet.tags = _tags;

	return _snippet;
}

var minifyContent = function(content) {
	return content.substr(0, 200).replace(/```/g,'').replace(/    /g,'') + " ...";
};

var loginIntervalId;
var loginEvent = function(cb) {
	
	var win = window.open("/account/signin", "_blank", "width=300, height=400,modal=yes");
	loginIntervalId = setInterval(function() {
		try{
			var url = win.document.URL;
			console.log(url);
			if(url.indexOf("/account/oauth2callback") >= 0){

				var results = {};

				// oauth
				var _tmp = url.split("?");
				if(_tmp.length > 1){
					// have query parameters

					var query_string = _tmp[1].split("&");
					for (var i = 0; i < query_string.length; i++) {
						var __tmp = query_string[i].split("=");
						var key = __tmp[0];
						var val = __tmp[1];

						if(key === "error"){
							results.error = val;
							// console.log(val);
							cb(results);

							win.close();
							clearInterval(loginIntervalId);
						}
					};
				}
			}else if(url.indexOf("/account/success") >= 0){
				
				cb({});

				win.close();
				clearInterval(loginIntervalId);
			}
		}catch(err){
			console.log(err);
		}
	}, 2000);
};

var initialSnippet = function() {
	return {
		title: "",
		content: "",
		tags: []
	};
}

var highlightText = function(element) {			  
	var selection = window.getSelection();
	var range = document.createRange();
	range.selectNodeContents(element);
	selection.removeAllRanges();
	selection.addRange(range);
	var top = element.offsetTop - (window.innerHeight / 2 );
	window.scrollTo( 0, top );
}

var isKeyPressed = function(_event, meta_key, key) {
	var e = _event;
	var keyPressed = e.keyCode;

	// kp is flag to check if correct meta key is used or not
	// if meta_key is true, but ctrlKey or metaKey is not detect, kp will set to false
	// if meta_key is false, but ctrlKey or metaKey is detect, kp will also set to false
	var kp = false;
	if(meta_key) {
		if(e.ctrlKey || e.metaKey){
			kp = true;
		}
	}else{
		if(!(e.ctrlKey || e.metaKey)){
			kp = true;
		}
	}


	// if meta_key and userKey is matching, kp will be set as true
	// for more detail about kp, check it out above
	if(kp) {
		if(key === KeyEvent.KEY_0_9 && keyPressed >= KeyEvent.KEY_0 && keyPressed <= KeyEvent.KEY_9){
			// key => [0-9]
			return true;
		}else if(key === KeyEvent.KEY_A_Z && keyPressed >= KeyEvent.KEY_A && keyPressed <= KeyEvent.KEY_Z) {
			// key => [A-Z]    
			return true;
		}else if(key ==  keyPressed ) {
			// other
			return true;
		}

	}
	return false;
}

var KeyEvent = {
		KEY_0_9 : -10,
		KEY_A_Z : -9,
		KEY_0 : 48,
		KEY_9 : 57,
		KEY_A : 65,
		KEY_B : 66,
		KEY_C : 67,
		KEY_D : 68,
		KEY_E : 69,
		KEY_F : 70,
		KEY_G : 71,
		KEY_H : 72,
		KEY_I : 73,
		KEY_J : 74,
		KEY_K : 75,
		KEY_L : 76,
		KEY_M : 77,
		KEY_N : 78,
		KEY_O : 79,
		KEY_P : 80,
		KEY_Q : 81,
		KEY_R : 82,
		KEY_S : 83,
		KEY_T : 84,
		KEY_U : 85,
		KEY_V : 86,
		KEY_W : 87,
		KEY_X : 88,
		KEY_Y : 89,
		KEY_Z : 90,
		KEY_ESC : 27,
		KEY_ENTER : 13,
		KEY_UP: 38,
		KEY_DOWN: 40,
		KEY_DEL: 8,
	};

