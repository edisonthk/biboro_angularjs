'use strict';

angular.module('app.controllers',[])
	.controller('LoaderController', ['$scope', function(scope) {
		scope.loaded = false;

		scope.onloadedEvent = function() {
			scope.loaded = true;
		};
	}])
	.controller('MyController', ['$scope','$rootScope','$state', '$stateParams','$http','Snippet','User','toaster','Feedback',
	function(scope, rootScope, state, stateParams,Http ,Snippet,User, Toaster, Feedback){

		scope.global = {};
		scope.global.state = state;
		scope.global.prefix_path = prefix_path;

		var symbol_cmd = "Ctrl";
		if(window.navigator.platform.indexOf("Mac") >= 0){
			symbol_cmd = "⌘";
		}

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
		scope.search = {
			searching : false,
			kw : "",
		};

        var listInitializedFlag = false;

		scope.snippetsRenderedCallback = function() {
			for (var i = 0; i < scope.snippets.length; i++) {
				if(scope.snippets[i].id == stateParams.id) {
					scrollInListItem(i);
                    listInitializedFlag = true;
					break;		
				}
			};
		}

		scope.loginedCallback = function(results) {
			
			if(results.error) {
				// failed to login due to 
				
					Toaster.pop({
						type: 'error',
		                body: 'ログイン失敗：'+results.error,
		                showCloseButton: true
					});
				scope.$apply();
				
			}else{
				location.reload();
			}
		};

		scope.loadTags = function(query){
			return Http.get('/json/tag/?q='+encodeURIComponent(query));
		};


		var searching_offset_timeout;
		var searchingEvent = function() {

			var kw = scope.search.kw;

			// when there is change in searchbox, 
			// reset the current index history keywords
			reset_current_index_history_keywords();
			if(kw && kw.length > 0){
				scope.search.searching = true;

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
						scope.search.searching = false;
						// if kw is number, do "selecting"
						var _index = parseInt(kw) - 1;
						if(_index < scope.snippets.length) {
							state.go('snippets.single',{id: scope.snippets[_index].id} );
						}
					}else{
						// if kw not is number, do "searching"
						Http.get('/json/search?kw='+encodeURIComponent(kw)).success(function(data) {

                            // clean data
                            var cleanData = [];
                            for (var i = 0; i < data.length; i++) {
                                var singleCleanData;

                                singleCleanData = data[i].snippet;
                                singleCleanData.score = data[i].score;
                                cleanData.push(singleCleanData);

                            };
							scope.snippets = cleanData;
							scope.search.searching = false;
							// $scope.last_searched_keywords = $scope.textbox.keywords;
						});
					}

					scope.$apply();
				}, 300);
			}
		};

		scope.$watch("search.kw",searchingEvent);

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
				scope.snippets.unshift(results);
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

				Snippet.update({snippetId: snippet_id}, _data, function(results) {
				
					scope.errors = null;
					scope.snippet = filterServerSnippet(results);
					state.go('snippets.single',{id: snippet_id});	
					
					Toaster.pop({
						type: 'success',
		                body: '保存しました',
					});
					
				}, function(results){
					// failed to update
					scope.errors = [];
					for(var type in results.data.error) {
						scope.errors.push(results.data.error[type][0]);
					}

					Toaster.pop({
						type: 'error',
		                body: '保存失敗',
					});
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

		scope.goToPreviousState = function() {
			if(state.previous != null){
				state.go(state.previous.name, state.previous.params);
				state.previous = null;
			}else{
				state.go('snippets');
			}
		}

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

						scope.goToPreviousState();

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
			
			scope.dialogBox.outsideClickedEvent = scope.dialogBox.noButtonClickEvent;
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
						});
					}else{
						scope.dialogBox.error_message = 'テキストボックスにご記入ください。';
					}
				},
				noButtonClickEvent: function() {
					scope.dialogBox.show = false;
				},
			}

			scope.dialogBox.outsideClickedEvent = scope.dialogBox.noButtonClickEvent;
		};

		scope.openMarkdownManual = function() {
			scope.dialogBox = {
				show: true,
				type: 'markdown_help',
				feedback: true,
				noButtonText: "閉じる",
				title: 'マークダウンの表記一覧表',
				noButtonClickEvent: function() {
					scope.dialogBox.show = false;
				},
			}

			scope.dialogBox.outsideClickedEvent = scope.dialogBox.noButtonClickEvent;
		};

		// enter key is pressed and following event will be fired when keyup
		// and if current keywords is not number(Which used as selecting snippet) and empty
		// the keywords will be stored to historyKwsManager. 
		// After that, scope.kw will be clear.
		var historyKwsManager = [];
		var current_selected_history_keywords = -1;
		var enterKeyUpCallback = function(e) {
			var kw = scope.search.kw;
			if(kw.length > 0 && !kw.match(/^[0-9]+$/g)){
				historyKwsManager.push(kw);
				searchingEvent();
			}
			scope.search.kw = "";
			e.target.blur();
		};

		var reset_current_index_history_keywords = function() {
			current_selected_history_keywords = historyKwsManager.length - 1;
		};

		scope.loginEvent = loginEvent;

		scope.isEditorPage = function(state_name) {
			if(typeof state_name === 'undefined') {
				return state.is('snippets.single.editor') || state.is('snippets.new');	
			}

			return state_name == 'snippets.single.editor' || state_name == 'snippets.new';
		};

		scope.minify = minifyContent;

		var interval_draft_event = function() {
            console.log("saving draft");
			if(stateParams.id) {
				saveDraft(stateParams.id);	
			}else{
				saveDraft();
			}
		}

		var saveDraft = function(snippet_id) {
			// only save draft when snippet is loaded
			if(loaded) {

				var _tags = [];
				if(Array.isArray(scope.snippet.tags)) {
					for (var i = 0; i < scope.snippet.tags.length; i++) {
						_tags.push(scope.snippet.tags[i].text);
					};	
				}
				

				var _data = {
					title: scope.snippet.title,
					content: scope.snippet.content,
					tags: _tags,
				};

				if(typeof snippet_id === 'undefined') {
					Snippet.draft({}, _data);
				}else{
					Snippet.draft({snippetId: snippet_id}, _data);
				}
			}
		};

		// $scope.$watch(function(){
		// 	return $scope.kw;
		// }, function() {
		// 	console.log($scope.kw);
		// });
		var draft_interval_id, 
			loaded = false;
		scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

			// if wrong pathing, correct the redirect. 
			if(state.is('snippets.single')){
				if(toParams.id.length <= 0) {
					state.go('snippets');
					return; 
				}
			}

			// cancel draft interval event
			clearInterval(draft_interval_id);
			

			if(fromState.name.length > 0){
				state.previous = {name: fromState.name, params: fromParams};
			}else{
				state.previous = null;
			}

			if(toParams.id){
				scope.selected_snippet_id = parseInt(toParams.id);

				if(scope.isEditorPage()) {
					// 
					// state: snippets.single.editor
					// 
					// Editor page for modify exists snippet
					// ===========================================
					scope.errors = null;
					scope.modify_button_title = "更新 <small>"+symbol_cmd+"+S</small>";

					Snippet.getEdit({snippetId: stateParams.id}, function(data) {
						console.log(data.snippet);
						scope.snippet = filterServerSnippet(data.snippet);

						loaded = true;
						draft_interval_id = setInterval(interval_draft_event, 60000);
					});
					
				}else{
					scope.modify_button_title = "編集 <small>"+symbol_cmd+"+E</small>";
					
					// 
					// state: snippets.single
					// =========================

					Snippet.get({snippetId: toParams.id}, function(data) {
                        if(listInitializedFlag) {
                            for (var i = 0; i < scope.snippets.length; i++) {
                                if(scope.snippets[i].id == toParams.id) {
                                    scrollInListItem(i);
                                    break;      
                                }
                            };

                        }
						
						
						scope.snippet = filterServerSnippet( data );
					}, function() {
						// failed to retrieve snippet
						scope.snippet = null;
					});

				}

			}else{

				// scope.snippet = null;

				if(scope.isEditorPage()) {
					// 
					// state: editor page for create new snippet
					// ===========================================
					scope.errors = null;

					Snippet.getCreate({}, function(data) {


						if(data.snippet == null){
							scope.snippet = initialSnippet();
						}else{
							scope.snippet = filterServerSnippet( data.snippet );	
						}

						scope.snippet.editable = true;
						scope.snippet.updated_at = "";
						loaded = true;
						draft_interval_id = setInterval(interval_draft_event, 60000);
					});
				}
			}
		});

		var searchbox_input;
		var searchbox_flag = false;
		var _current_pre_ele = 0;
		scope.searchingElementLoaded = function() {
			searchbox_input = document.getElementById("searchbox_input");
			searchbox_input.addEventListener('focus', function(e) {
				searchbox_flag = true;
			});
			searchbox_input.addEventListener('blur', function(e) {
				searchbox_flag = false;
			});
		};
		window.addEventListener('keydown', function(e) {

			if(scope.dialogBox && scope.dialogBox.show) {
				//
				// When dialogBox is showing
				if( isKeyPressed(e, false, KeyEvent.KEY_ESC)){
					e.preventDefault();
					scope.dialogBox.show = false;
				}else if( isKeyPressed(e, true, KeyEvent.KEY_DEL)) {
					// Cmd + DEL
					// When destroy confirmation dialogBox is showing
					if(scope.snippet != null && scope.snippet.editable) {
						// after confirm with user by showing delete confirmation dialog
						// allow user to destroy current selected snippet
						scope.dialogBox.okButtonClickEvent();
					}	
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
						scope.search.kw = historyKwsManager[_c];
						_c -- ;
						current_selected_history_keywords = _c;
					}

				}else if( isKeyPressed(e, false, KeyEvent.KEY_DOWN)) {
					e.preventDefault();

					// move to history item just read
					var _c = current_selected_history_keywords;
					if(_c < historyKwsManager.length - 1) {
						_c ++ ;
						scope.search.kw = historyKwsManager[_c];
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

					// Cmd + E
					//
					// Move to edit page
					// When user is able to modify current selected snippet, Cmd + E will allow user to
					// move to editor page to modify current selected snippet.					
					e.preventDefault();
					if(scope.snippet != null){
						if(!User.logined) {
							Toaster.pop({
								type: 'error',
								body: '編集するのにログインが必用です。',
							});
						}else if(scope.snippet.editable) {
							state.go('snippets.single.editor',{id: scope.snippet.id});
						}else{
							Toaster.pop({
								type: 'error',
								body: '編集権限はありません。',
							});
						}
					}
				}else if( isKeyPressed(e, true, KeyEvent.KEY_DEL)) {
					//
					// When user is able to modify the current snippet and able to delete it
					// allow user to using Cmd + DEL to delete current snippet 
					e.preventDefault();
					if(scope.snippet.editable) {
						if(scope.dialogBox && scope.dialogBox.show) {
							// user is confirm to destroy
							scope.dialogBox.okButtonClickEvent();
						}else{
							// ask user to confirm if user ready to destroy crrent snippet
							scope.destroySnippetEvent(scope.snippet.id);
						}
							
					}
				}else if( isKeyPressed(e, true, KeyEvent.KEY_B)) {
					e.preventDefault();
					if( User.logined ) {
						state.go('snippets.new');
					}else{
						Toaster.pop({
							type: 'error',
							body: '新規作成はログインしてから作成です',
						});
					}
				}else if( isKeyPressed(e, false, KeyEvent.KEY_DEL)) {
					searchbox_input.focus();
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
					// If current page is snippets.new page, go to previous state
					// else if current page is snippets.single.edit page, go to snippets.single page
					e.preventDefault();


					if(state.is('snippets.new')) {
						saveDraft();
						scope.goToPreviousState();
					}else{
						saveDraft(stateParams.id);
						state.go('snippets.single',{id: scope.snippet.id});
					}
					if(loaded) {
						Toaster.pop({
							type: 'info',
			                body: '下書き保存しました',
						});
					}
					loaded = false;
				}else if( isKeyPressed(e, true, KeyEvent.KEY_DEL)) {
					//
					// When user is able to modify the current snippet and able to delete it
					// allow user to using Cmd + DEL to delete current snippet 
					e.preventDefault();
					if(scope.snippet.editable) {
						
						// ask user to confirm if user ready to destroy crrent snippet
						scope.destroySnippetEvent(scope.snippet.id);
							
					}
				}
			}
		});
		window.addEventListener('keyup', function(e) {
			if(!scope.isEditorPage()) {
				var keyPressed = e.keyCode;
				if(keyPressed == KeyEvent.KEY_ENTER) {
					enterKeyUpCallback(e);
				}
			}
			scope.$apply();
		});

	}])
	.controller('EditorController', ['$scope',function(scope){

		var input_element = document.querySelector(".editor .input-group input");

		if(input_element != null) {
			input_element.focus();
		}

		scope.fileUploadedCallback = function(success, msg, httpCode ) {
			
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
				
				if(url.indexOf("error=") >= 0) {
					var error_message = "";
					url.replace(/\?error\=(.*?)&?$/, function(m) {
						error_message = m.replace(/\?error\=/g,"").replace(/#/g,"");
					});
					cb({error: error_message});
				}else{
					cb({});	
				}

				win.close();
				clearInterval(loginIntervalId);
			}
		}catch(err){
			console.error(err);
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

// scrolling
var scrollInListItem = function(_index) {
	
	var lists = document.querySelector("div.lists ul.snippets-list");
	var items = lists.children;
	
	// check if current item is visible in page or not
	// if it is not visible in page, do scrollTop event
	var selectedItemBottom = items[_index].getBoundingClientRect().bottom;
	if(selectedItemBottom < 0 || lists.parentNode.clientHeight < selectedItemBottom) {
		lists.scrollTop = items[_index].offsetTop;	
	}
	
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

